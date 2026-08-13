-- 1. Wallet address helper accepting EVM (0x…) and Cardano (addr1…/addr_test1…) formats
CREATE OR REPLACE FUNCTION public.is_wallet_address(_addr text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT _addr ~ '^0x[0-9a-fA-F]{40}$'
      OR _addr ~ '^addr1[0-9a-z]{20,110}$'
      OR _addr ~ '^addr_test1[0-9a-z]{20,110}$'
$$;

-- 2. Council config: chain family + Cardano fields
ALTER TABLE public.councils
  ADD COLUMN IF NOT EXISTS chain_family text NOT NULL DEFAULT 'evm',
  ADD COLUMN IF NOT EXISTS policy_id text,
  ADD COLUMN IF NOT EXISTS message_tag text;

ALTER TABLE public.councils
  ADD CONSTRAINT councils_chain_family_check CHECK (chain_family IN ('evm', 'cardano'));

ALTER TABLE public.councils ALTER COLUMN token_address DROP NOT NULL;

-- 3. Self-claim membership records
CREATE TABLE public.council_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  council_id uuid NOT NULL REFERENCES public.councils(id) ON DELETE CASCADE,
  wallet text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  tx_hash text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT council_claims_status_check CHECK (status IN ('pending', 'confirmed', 'failed')),
  CONSTRAINT council_claims_unique UNIQUE (council_id, wallet)
);

GRANT SELECT, INSERT ON public.council_claims TO anon;
GRANT SELECT, INSERT ON public.council_claims TO authenticated;
GRANT ALL ON public.council_claims TO service_role;

ALTER TABLE public.council_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Claims are publicly readable"
  ON public.council_claims FOR SELECT USING (true);

CREATE POLICY "Claiming requires a wallet address"
  ON public.council_claims FOR INSERT
  WITH CHECK (public.is_wallet_address(wallet) AND status = 'pending');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_council_claims_updated_at
  BEFORE UPDATE ON public.council_claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Relax wallet-format policies to accept Cardano addresses
DROP POLICY IF EXISTS "Voting requires a wallet address" ON public.votes;
CREATE POLICY "Voting requires a wallet address" ON public.votes FOR INSERT
  WITH CHECK (public.is_wallet_address(voter_wallet));

DROP POLICY IF EXISTS "Filing requires a wallet address" ON public.docket_items;
CREATE POLICY "Filing requires a wallet address" ON public.docket_items FOR INSERT
  WITH CHECK (public.is_wallet_address(created_by_wallet) AND status = 'open');

DROP POLICY IF EXISTS "Commenting requires a wallet address" ON public.docket_comments;
CREATE POLICY "Commenting requires a wallet address" ON public.docket_comments FOR INSERT
  WITH CHECK (public.is_wallet_address(author_wallet)
    AND char_length(body) BETWEEN 1 AND 500 AND flagged = false);

DROP POLICY IF EXISTS "Posting requires a wallet address" ON public.social_posts;
CREATE POLICY "Posting requires a wallet address" ON public.social_posts FOR INSERT
  WITH CHECK (public.is_wallet_address(author_wallet)
    AND char_length(content) BETWEEN 1 AND 500 AND flagged = false);

DROP POLICY IF EXISTS "Replying requires a wallet address" ON public.social_replies;
CREATE POLICY "Replying requires a wallet address" ON public.social_replies FOR INSERT
  WITH CHECK (public.is_wallet_address(author_wallet)
    AND char_length(content) BETWEEN 1 AND 500 AND flagged = false);

-- 5. Example Cardano council (chain_id 1815 = Cardano mainnet sentinel)
INSERT INTO public.councils (community_name, chain_id, chain_family, token_address, policy_id, message_tag, min_balance, token_symbol)
VALUES ('Mishkan Cardano Assembly', 1815, 'cardano', NULL,
        '8f9c2e1b4a6d7f0c3e5b8a1d2f4c6e9b0a3d5f7c8e1b2a4d6f9c0e3b', 'mishkan.vote.v1', 1, 'MSHK');
