
insert into public.councils (id, community_name, chain_id, token_address, min_balance, token_symbol) values
  ('11111111-1111-4111-8111-111111111111','Mishkan Commons', 97, '0x0000000000000000000000000000000000000000', 1, 'MSHK'),
  ('22222222-2222-4222-8222-222222222222','Ashlar Collective', 11155111, '0x0000000000000000000000000000000000000000', 10, 'ASH');

insert into public.docket_items (id, council_id, type, title, body, status, resolution, created_by_wallet, created_at) values
  ('aaaaaaa1-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','proposal','Establish a standing treasury review','A quarterly public review of all treasury outflows, published to the permanent record before any new allocation is approved.','open',null,'0x8f2A11c9B4e6D3f0A5c7E1b2D9a4C6f8B0d1E2a3', now() - interval '2 days'),
  ('aaaaaaa1-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','poll','Should Council sessions be recorded and published?','Advisory poll on whether deliberation transcripts should be entered into the public archive by default.','open',null,'0x3c7B92e5A1d8F4c0B6a2E9d7C5f1A3b8D0e4C6f2', now() - interval '5 days'),
  ('aaaaaaa1-0000-4000-8000-000000000003','22222222-2222-4222-8222-222222222222','dispute','Grant milestone disputed by contributor cohort','Claimants assert milestone two was delivered in full; the disbursing steward withheld payment pending review.','open',null,'0xD4a1B7c9E2f5A803C6b1D9e7F2a4C8b0E3d5A7c1', now() - interval '1 day'),
  ('aaaaaaa1-0000-4000-8000-000000000004','11111111-1111-4111-8111-111111111111','proposal','Adopt a two-week minimum deliberation window','All binding proposals remain open for at least fourteen days before tallying.','resolved','Passed — adopted with quorum met.','0x8f2A11c9B4e6D3f0A5c7E1b2D9a4C6f8B0d1E2a3', now() - interval '30 days'),
  ('aaaaaaa1-0000-4000-8000-000000000005','22222222-2222-4222-8222-222222222222','poll','Preferred cadence for community assemblies','Advisory poll on monthly versus quarterly assemblies.','resolved','Closed — monthly preferred.','0x3c7B92e5A1d8F4c0B6a2E9d7C5f1A3b8D0e4C6f2', now() - interval '45 days');

insert into public.petitions (docket_item_id, resolution_status, resolved_at) values
  ('aaaaaaa1-0000-4000-8000-000000000001','pending review', null),
  ('aaaaaaa1-0000-4000-8000-000000000004','resolved', now() - interval '21 days');
