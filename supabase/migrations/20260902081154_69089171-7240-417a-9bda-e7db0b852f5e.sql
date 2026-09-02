ALTER TABLE public.budget_rounds
  ADD COLUMN eligibility_mode text NOT NULL DEFAULT 'open'
  CHECK (eligibility_mode IN ('open','allowlist'));

CREATE TABLE public.budget_round_eligibility (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_round_id uuid NOT NULL REFERENCES public.budget_rounds(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,
  added_by text NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (budget_round_id, wallet_address)
);

GRANT SELECT, INSERT ON public.budget_round_eligibility TO anon, authenticated;
GRANT ALL ON public.budget_round_eligibility TO service_role;

ALTER TABLE public.budget_round_eligibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Eligibility lists are publicly readable"
  ON public.budget_round_eligibility FOR SELECT USING (true);

CREATE POLICY "Adding eligible voters requires wallet addresses"
  ON public.budget_round_eligibility FOR INSERT
  WITH CHECK (public.is_wallet_address(wallet_address) AND public.is_wallet_address(added_by));

CREATE POLICY "Creating a round requires a wallet address"
  ON public.budget_rounds FOR INSERT
  WITH CHECK (
    public.is_wallet_address(created_by)
    AND char_length(title) BETWEEN 1 AND 160
    AND char_length(description) <= 2000
    AND total_budget_amount >= 0
    AND status IN ('draft','open')
    AND eligibility_mode IN ('open','allowlist')
  );

CREATE OR REPLACE FUNCTION public.is_budget_voter_eligible(_round_id uuid, _wallet text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN (SELECT eligibility_mode FROM public.budget_rounds WHERE id = _round_id) = 'allowlist'
      THEN EXISTS (
        SELECT 1 FROM public.budget_round_eligibility
        WHERE budget_round_id = _round_id
          AND lower(wallet_address) = lower(_wallet)
      )
    ELSE true
  END
$$;

DROP POLICY IF EXISTS "Budget voting requires a wallet address" ON public.budget_votes;

CREATE POLICY "Budget voting requires a wallet address and eligibility"
  ON public.budget_votes FOR INSERT
  WITH CHECK (
    public.is_wallet_address(voter_wallet_address)
    AND weight >= 1
    AND public.is_budget_voter_eligible(budget_round_id, voter_wallet_address)
  );