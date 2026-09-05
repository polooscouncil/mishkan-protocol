DO $$
DECLARE
  v_council uuid;
  v_round uuid;
  v_p1 uuid := gen_random_uuid();
  v_p2 uuid := gen_random_uuid();
  v_p3 uuid := gen_random_uuid();
BEGIN
  SELECT id INTO v_council FROM public.councils WHERE community_name = 'Mishkan Commons' LIMIT 1;
  IF v_council IS NULL THEN
    SELECT id INTO v_council FROM public.councils ORDER BY created_at LIMIT 1;
  END IF;
  IF v_council IS NULL THEN
    RAISE EXCEPTION 'No council exists to attach the demo round to';
  END IF;

  INSERT INTO public.budget_rounds (
    title, description, community_id, total_budget_amount, currency,
    voting_start_date, voting_end_date, status, eligibility_mode,
    treasury_chain_id, created_by
  ) VALUES (
    'Example Round — Neighborhood Micro-Grants (Demo)',
    'Demonstration round for reviewers and first-time visitors. Shows the full propose → endorse → release flow with sample data; no real funds are attached. Target network: BNB Chain testnet.',
    v_council, 10000, 'USDC',
    now() - interval '3 days', now() + interval '11 days', 'open', 'open',
    97, '0x0000000000000000000000000000000000000001'
  )
  RETURNING id INTO v_round;

  INSERT INTO public.budget_proposals (id, budget_round_id, title, description, requested_amount, proposer_wallet_address, status) VALUES
    (v_p1, v_round, 'Community tool library (demo)', 'Example proposal: shared toolshed with checkout registry for residents.', 4000, '0x00000000000000000000000000000000000000a1', 'submitted'),
    (v_p2, v_round, 'Pocket park planting day (demo)', 'Example proposal: native plants, soil, and refreshments for a volunteer planting day.', 2500, '0x00000000000000000000000000000000000000b2', 'submitted'),
    (v_p3, v_round, 'Open street mural (demo)', 'Example proposal: materials and local artist stipend for a community-designed mural.', 3500, '0x00000000000000000000000000000000000000c3', 'submitted');

  INSERT INTO public.budget_votes (budget_round_id, proposal_id, voter_wallet_address, weight) VALUES
    (v_round, v_p1, '0x00000000000000000000000000000000000000d4', 1),
    (v_round, v_p2, '0x00000000000000000000000000000000000000e5', 1),
    (v_round, v_p1, '0x00000000000000000000000000000000000000f6', 1),
    (v_round, v_p3, '0x00000000000000000000000000000000000000a7', 1);
END $$;