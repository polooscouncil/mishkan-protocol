CREATE TABLE public.budget_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  community_id uuid NOT NULL REFERENCES public.councils(id) ON DELETE CASCADE,
  total_budget_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  voting_start_date timestamptz NOT NULL DEFAULT now(),
  voting_end_date timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  status text NOT NULL DEFAULT 'draft',
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT budget_rounds_status_check CHECK (status IN ('draft','open','closed','funds_released'))
);

GRANT SELECT ON public.budget_rounds TO anon, authenticated;
GRANT UPDATE (status, updated_at) ON public.budget_rounds TO anon, authenticated;
GRANT ALL ON public.budget_rounds TO service_role;
ALTER TABLE public.budget_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Budget rounds are publicly readable" ON public.budget_rounds FOR SELECT USING (true);
CREATE POLICY "Round status can be toggled" ON public.budget_rounds FOR UPDATE USING (true) WITH CHECK (status IN ('draft','open','closed','funds_released'));

CREATE TRIGGER update_budget_rounds_updated_at BEFORE UPDATE ON public.budget_rounds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.budget_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_round_id uuid NOT NULL REFERENCES public.budget_rounds(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  requested_amount numeric NOT NULL DEFAULT 0,
  proposer_wallet_address text NOT NULL,
  vote_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT budget_proposals_status_check CHECK (status IN ('submitted','approved','rejected','funded'))
);

GRANT SELECT, INSERT ON public.budget_proposals TO anon, authenticated;
GRANT ALL ON public.budget_proposals TO service_role;
ALTER TABLE public.budget_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Budget proposals are publicly readable" ON public.budget_proposals FOR SELECT USING (true);
CREATE POLICY "Proposing requires a wallet address" ON public.budget_proposals FOR INSERT
  WITH CHECK (
    public.is_wallet_address(proposer_wallet_address)
    AND char_length(title) BETWEEN 1 AND 160
    AND char_length(description) <= 2000
    AND requested_amount >= 0
    AND vote_count = 0
    AND status = 'submitted'
  );

CREATE TABLE public.budget_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_round_id uuid NOT NULL REFERENCES public.budget_rounds(id) ON DELETE CASCADE,
  proposal_id uuid NOT NULL REFERENCES public.budget_proposals(id) ON DELETE CASCADE,
  voter_wallet_address text NOT NULL,
  weight integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT budget_votes_unique_per_round UNIQUE (budget_round_id, voter_wallet_address)
);

GRANT SELECT, INSERT ON public.budget_votes TO anon, authenticated;
GRANT ALL ON public.budget_votes TO service_role;
ALTER TABLE public.budget_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Budget votes are publicly readable" ON public.budget_votes FOR SELECT USING (true);
CREATE POLICY "Budget voting requires a wallet address" ON public.budget_votes FOR INSERT
  WITH CHECK (public.is_wallet_address(voter_wallet_address) AND weight >= 1);

CREATE OR REPLACE FUNCTION public.sync_budget_proposal_votes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.budget_proposals
      SET vote_count = vote_count + NEW.weight
      WHERE id = NEW.proposal_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.budget_proposals
      SET vote_count = GREATEST(0, vote_count - OLD.weight)
      WHERE id = OLD.proposal_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER budget_votes_sync_counts
AFTER INSERT OR DELETE ON public.budget_votes
FOR EACH ROW EXECUTE FUNCTION public.sync_budget_proposal_votes();

WITH c AS (SELECT id FROM public.councils ORDER BY created_at LIMIT 1),
r AS (
  INSERT INTO public.budget_rounds (title, description, community_id, total_budget_amount, currency, voting_start_date, voting_end_date, status, created_by)
  SELECT
    'Autumn Commons Budget Round',
    'The Council has set aside a discretionary pool for member-initiated works. Any member may submit a proposal; each wallet may endorse one proposal for the round. Allocations are recorded publicly and released by the treasury committee after the round closes.',
    c.id, 25000, 'USDC', now() - interval '3 days', now() + interval '11 days', 'open',
    '0x1111111111111111111111111111111111111111'
  FROM c RETURNING id
)
INSERT INTO public.budget_proposals (budget_round_id, title, description, requested_amount, proposer_wallet_address, status)
SELECT r.id, v.title, v.description, v.amount, v.wallet, 'submitted'
FROM r, (VALUES
  ('Public archive digitisation', 'Digitise and index the first three years of Council minutes so every resolution is searchable from the archive page.', 8000, '0x2222222222222222222222222222222222222222'),
  ('Member onboarding stipends', 'Fund small stipends for stewards who run onboarding sessions for new token holders across councils.', 6500, '0x3333333333333333333333333333333333333333'),
  ('Translation of governing documents', 'Commission professional translation of the charter, bylaws and petition guide into three additional languages.', 4200, '0x4444444444444444444444444444444444444444')
) AS v(title, description, amount, wallet);