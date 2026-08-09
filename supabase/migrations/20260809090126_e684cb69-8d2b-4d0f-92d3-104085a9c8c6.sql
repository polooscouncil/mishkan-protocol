
insert into public.votes (docket_item_id, voter_wallet, choice, chain_id, created_at) values
 ('aaaaaaa1-0000-4000-8000-000000000001','0x8f2A11c9B4e6D3f0A5c7E1b2D9a4C6f8B0d1E2a3','for',97, now() - interval '2 days'),
 ('aaaaaaa1-0000-4000-8000-000000000001','0x3c7B92e5A1d8F4c0B6a2E9d7C5f1A3b8D0e4C6f2','for',97, now() - interval '1 day'),
 ('aaaaaaa1-0000-4000-8000-000000000001','0xD4a1B7c9E2f5A803C6b1D9e7F2a4C8b0E3d5A7c1','abstain',97, now() - interval '1 day'),
 ('aaaaaaa1-0000-4000-8000-000000000001','0x6E0f4B2a8C1d5E9b7A3f0C2d8B4e6A1c9F5b3D7e','against',97, now() - interval '20 hours'),
 ('aaaaaaa1-0000-4000-8000-000000000002','0x8f2A11c9B4e6D3f0A5c7E1b2D9a4C6f8B0d1E2a3','for',97, now() - interval '4 days'),
 ('aaaaaaa1-0000-4000-8000-000000000002','0x2b9C6d1E4a7F0b3C8e5D2a9B6f1C4e7A0d3B8c5F','for',97, now() - interval '3 days'),
 ('aaaaaaa1-0000-4000-8000-000000000002','0x6E0f4B2a8C1d5E9b7A3f0C2d8B4e6A1c9F5b3D7e','abstain',97, now() - interval '2 days'),
 ('aaaaaaa1-0000-4000-8000-000000000003','0xD4a1B7c9E2f5A803C6b1D9e7F2a4C8b0E3d5A7c1','for',11155111, now() - interval '20 hours'),
 ('aaaaaaa1-0000-4000-8000-000000000003','0x9A5c3E7b1D0f8C4a6B2e9D5c7F3a1B8e0C6d4A2b','against',11155111, now() - interval '12 hours'),
 ('aaaaaaa1-0000-4000-8000-000000000004','0x8f2A11c9B4e6D3f0A5c7E1b2D9a4C6f8B0d1E2a3','for',97, now() - interval '29 days'),
 ('aaaaaaa1-0000-4000-8000-000000000004','0x3c7B92e5A1d8F4c0B6a2E9d7C5f1A3b8D0e4C6f2','for',97, now() - interval '28 days'),
 ('aaaaaaa1-0000-4000-8000-000000000004','0x2b9C6d1E4a7F0b3C8e5D2a9B6f1C4e7A0d3B8c5F','for',97, now() - interval '27 days'),
 ('aaaaaaa1-0000-4000-8000-000000000004','0x6E0f4B2a8C1d5E9b7A3f0C2d8B4e6A1c9F5b3D7e','against',97, now() - interval '26 days'),
 ('aaaaaaa1-0000-4000-8000-000000000005','0x9A5c3E7b1D0f8C4a6B2e9D5c7F3a1B8e0C6d4A2b','for',11155111, now() - interval '44 days'),
 ('aaaaaaa1-0000-4000-8000-000000000005','0xD4a1B7c9E2f5A803C6b1D9e7F2a4C8b0E3d5A7c1','abstain',11155111, now() - interval '43 days');

insert into public.docket_comments (docket_item_id, author_wallet, body, created_at) values
 ('aaaaaaa1-0000-4000-8000-000000000001','0x3c7B92e5A1d8F4c0B6a2E9d7C5f1A3b8D0e4C6f2','Support, provided the review is published before allocation rather than after. Retrospective review is not review.', now() - interval '40 hours'),
 ('aaaaaaa1-0000-4000-8000-000000000001','0x6E0f4B2a8C1d5E9b7A3f0C2d8B4e6A1c9F5b3D7e','Quarterly feels slow for a treasury this active. Would a monthly summary with a quarterly deep review be workable?', now() - interval '18 hours'),
 ('aaaaaaa1-0000-4000-8000-000000000002','0x2b9C6d1E4a7F0b3C8e5D2a9B6f1C4e7A0d3B8c5F','Transcripts yes; recordings I am less sure about. Text is searchable and less chilling to speak against.', now() - interval '3 days'),
 ('aaaaaaa1-0000-4000-8000-000000000003','0x9A5c3E7b1D0f8C4a6B2e9D5c7F3a1B8e0C6d4A2b','The steward should enter the withholding rationale into the record before this is tallied.', now() - interval '10 hours');

insert into public.social_posts (id, council_id, author_wallet, content, created_at) values
 ('bbbbbbb1-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','0x8f2A11c9B4e6D3f0A5c7E1b2D9a4C6f8B0d1E2a3','Treasury review proposal is now open on the docket. Read it before voting — it changes when disclosure happens, not just whether it happens.', now() - interval '2 days'),
 ('bbbbbbb1-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','0x3c7B92e5A1d8F4c0B6a2E9d7C5f1A3b8D0e4C6f2','Reminder that one holder, one vote means whales do not decide this. Turnout does. Please vote.', now() - interval '30 hours'),
 ('bbbbbbb1-0000-4000-8000-000000000003','22222222-2222-4222-8222-222222222222','0xD4a1B7c9E2f5A803C6b1D9e7F2a4C8b0E3d5A7c1','Filed the milestone dispute this morning. Everything we submitted is linked in the statement — judge it on the record, not on the thread.', now() - interval '22 hours'),
 ('bbbbbbb1-0000-4000-8000-000000000004','11111111-1111-4111-8111-111111111111','0x6E0f4B2a8C1d5E9b7A3f0C2d8B4e6A1c9F5b3D7e','The two-week deliberation window has already improved things. Fewer rushed tallies, more written rationales.', now() - interval '16 hours'),
 ('bbbbbbb1-0000-4000-8000-000000000005','22222222-2222-4222-8222-222222222222','0x9A5c3E7b1D0f8C4a6B2e9D5c7F3a1B8e0C6d4A2b','Monthly assemblies won the poll. First one is being scheduled — agenda items go on the docket, not in this thread.', now() - interval '6 hours');

insert into public.social_replies (post_id, author_wallet, content, created_at) values
 ('bbbbbbb1-0000-4000-8000-000000000001','0x2b9C6d1E4a7F0b3C8e5D2a9B6f1C4e7A0d3B8c5F','Read it twice. The timing change is the whole proposal and it is the right one.', now() - interval '44 hours'),
 ('bbbbbbb1-0000-4000-8000-000000000001','0x6E0f4B2a8C1d5E9b7A3f0C2d8B4e6A1c9F5b3D7e','Still think quarterly is too slow, but I would rather have this than nothing.', now() - interval '20 hours'),
 ('bbbbbbb1-0000-4000-8000-000000000002','0x9A5c3E7b1D0f8C4a6B2e9D5c7F3a1B8e0C6d4A2b','Voted. Turnout on the last poll was embarrassing.', now() - interval '26 hours'),
 ('bbbbbbb1-0000-4000-8000-000000000003','0x8f2A11c9B4e6D3f0A5c7E1b2D9a4C6f8B0d1E2a3','Noted. Committee should answer on the record within the window.', now() - interval '14 hours'),
 ('bbbbbbb1-0000-4000-8000-000000000005','0x3c7B92e5A1d8F4c0B6a2E9d7C5f1A3b8D0e4C6f2','Good. Monthly keeps the record current.', now() - interval '3 hours');
