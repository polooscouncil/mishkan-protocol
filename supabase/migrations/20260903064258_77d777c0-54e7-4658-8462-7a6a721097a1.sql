ALTER TABLE public.budget_rounds
  ADD COLUMN IF NOT EXISTS treasury_chain_id integer,
  ADD COLUMN IF NOT EXISTS treasury_address text,
  ADD COLUMN IF NOT EXISTS treasury_tx_hash text;

ALTER TABLE public.budget_proposals
  ADD COLUMN IF NOT EXISTS release_tx_hash text;

CREATE POLICY "Proposals can only be marked funded with an on-chain tx"
ON public.budget_proposals
FOR UPDATE
USING (true)
WITH CHECK (
  status = 'funded'
  AND release_tx_hash IS NOT NULL
  AND release_tx_hash ~ '^0x[0-9a-fA-F]{64}$'
);