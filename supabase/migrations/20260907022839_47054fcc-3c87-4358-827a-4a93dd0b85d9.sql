UPDATE public.budget_rounds
SET treasury_chain_id = 97
WHERE treasury_chain_id IS NULL
  AND title ILIKE '%Autumn Commons%';