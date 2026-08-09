import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CHAINS, type ItemKind } from "@/lib/mishkan-data";
import { flagContent } from "@/lib/moderation.functions";

export type Council = {
  id: string;
  community_name: string;
  chain_id: number;
  token_address: string;
  min_balance: number;
  token_symbol: string | null;
};

export type Choice = "for" | "against" | "abstain";

export type Vote = {
  id: string;
  docket_item_id: string;
  voter_wallet: string;
  choice: Choice;
  chain_id: number | null;
  created_at: string;
};

export type DocketItem = {
  id: string;
  council_id: string;
  type: ItemKind;
  title: string;
  body: string;
  status: "open" | "resolved";
  resolution: string | null;
  created_by_wallet: string;
  created_at: string;
  council: Council | null;
  tally: { for: number; against: number; abstain: number };
  voters: string[];
};

export function chainNameById(chainId: number | null | undefined) {
  if (chainId == null) return "Unknown network";
  return CHAINS.find((c) => c.chainId === chainId)?.name ?? `Chain ${chainId}`;
}

export function shortRef(id: string) {
  return `MP-${id.slice(0, 4).toUpperCase()}`;
}

async function loadItems(status: "open" | "resolved"): Promise<DocketItem[]> {
  const { data, error } = await supabase
    .from("docket_items")
    .select(
      "id, council_id, type, title, body, status, resolution, created_by_wallet, created_at, councils(id, community_name, chain_id, token_address, min_balance, token_symbol), votes(id, docket_item_id, voter_wallet, choice, chain_id, created_at)",
    )
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const votes = ((row as { votes?: Vote[] }).votes ?? []) as Vote[];
    const tally = { for: 0, against: 0, abstain: 0 };
    for (const v of votes) tally[v.choice] += 1;
    return {
      ...(row as unknown as Omit<DocketItem, "council" | "tally" | "voters">),
      council: ((row as { councils?: Council | null }).councils ?? null) as Council | null,
      tally,
      voters: votes.map((v) => v.voter_wallet.toLowerCase()),
    };
  });
}

export const docketQuery = queryOptions({
  queryKey: ["docket", "open"],
  queryFn: () => loadItems("open"),
});

export const archiveQuery = queryOptions({
  queryKey: ["docket", "resolved"],
  queryFn: () => loadItems("resolved"),
});

export const councilsQuery = queryOptions({
  queryKey: ["councils"],
  queryFn: async (): Promise<Council[]> => {
    const { data, error } = await supabase
      .from("councils")
      .select("id, community_name, chain_id, token_address, min_balance, token_symbol")
      .order("community_name");
    if (error) throw error;
    return (data ?? []) as Council[];
  },
});

export async function castVote(input: {
  docketItemId: string;
  wallet: string;
  choice: Choice;
  chainId: number | null;
  signature?: string | null;
}) {
  const { error } = await supabase.from("votes").insert({
    docket_item_id: input.docketItemId,
    voter_wallet: input.wallet.toLowerCase(),
    choice: input.choice,
    chain_id: input.chainId,
    signature: input.signature ?? null,
  });
  if (error) throw error;
}

export async function fileDocketItem(input: {
  councilId: string;
  type: ItemKind;
  title: string;
  body: string;
  wallet: string;
}) {
  const { data, error } = await supabase
    .from("docket_items")
    .insert({
      council_id: input.councilId,
      type: input.type,
      title: input.title,
      body: input.body,
      status: "open",
      created_by_wallet: input.wallet.toLowerCase(),
    })
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type ProtocolStats = {
  members: number;
  votes: number;
  resolved: number;
  petitions: number;
};

export const statsQuery = queryOptions({
  queryKey: ["protocol-stats"],
  queryFn: async (): Promise<ProtocolStats> => {
    const [voteRows, resolved, petitions] = await Promise.all([
      supabase.from("votes").select("voter_wallet"),
      supabase.from("docket_items").select("id", { count: "exact", head: true }).eq("status", "resolved"),
      supabase.from("petitions").select("id", { count: "exact", head: true }),
    ]);
    if (voteRows.error) throw voteRows.error;
    const wallets = new Set(
      (voteRows.data ?? []).map((v) => (v.voter_wallet ?? "").toLowerCase()),
    );
    return {
      members: wallets.size,
      votes: voteRows.data?.length ?? 0,
      resolved: resolved.count ?? 0,
      petitions: petitions.count ?? 0,
    };
  },
});

export type Comment = {
  id: string;
  docket_item_id: string;
  author_wallet: string;
  body: string;
  flagged: boolean;
  created_at: string;
};

export function commentsQuery(docketItemId: string) {
  return queryOptions({
    queryKey: ["comments", docketItemId],
    queryFn: async (): Promise<Comment[]> => {
      const { data, error } = await supabase
        .from("docket_comments")
        .select("id, docket_item_id, author_wallet, body, flagged, created_at")
        .eq("docket_item_id", docketItemId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Comment[];
    },
  });
}

export async function postComment(input: {
  docketItemId: string;
  wallet: string;
  body: string;
}) {
  const { error } = await supabase.from("docket_comments").insert({
    docket_item_id: input.docketItemId,
    author_wallet: input.wallet.toLowerCase(),
    body: input.body.slice(0, 500),
  });
  if (error) throw error;
}

export async function flagComment(id: string) {
  await flagContent({ data: { table: "docket_comments", id } });
}

export type SocialPost = {
  id: string;
  council_id: string;
  author_wallet: string;
  content: string;
  flagged: boolean;
  created_at: string;
  reply_count: number;
};

export type SocialReply = {
  id: string;
  post_id: string;
  author_wallet: string;
  content: string;
  flagged: boolean;
  created_at: string;
};

export function socialFeedQuery(councilId: string | null) {
  return queryOptions({
    queryKey: ["social-feed", councilId ?? "all"],
    queryFn: async (): Promise<SocialPost[]> => {
      let q = supabase
        .from("social_posts")
        .select(
          "id, council_id, author_wallet, content, flagged, created_at, social_replies(id)",
        )
        .order("created_at", { ascending: false });
      if (councilId) q = q.eq("council_id", councilId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((row) => {
        const { social_replies, ...rest } = row as typeof row & {
          social_replies?: { id: string }[];
        };
        return {
          ...(rest as Omit<SocialPost, "reply_count">),
          reply_count: social_replies?.length ?? 0,
        };
      });
    },
  });
}

export function socialRepliesQuery(postId: string) {
  return queryOptions({
    queryKey: ["social-replies", postId],
    queryFn: async (): Promise<SocialReply[]> => {
      const { data, error } = await supabase
        .from("social_replies")
        .select("id, post_id, author_wallet, content, flagged, created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SocialReply[];
    },
  });
}

export async function createSocialPost(input: {
  councilId: string;
  wallet: string;
  content: string;
}) {
  const { error } = await supabase.from("social_posts").insert({
    council_id: input.councilId,
    author_wallet: input.wallet.toLowerCase(),
    content: input.content.slice(0, 500),
  });
  if (error) throw error;
}

export async function createSocialReply(input: {
  postId: string;
  wallet: string;
  content: string;
}) {
  const { error } = await supabase.from("social_replies").insert({
    post_id: input.postId,
    author_wallet: input.wallet.toLowerCase(),
    content: input.content.slice(0, 500),
  });
  if (error) throw error;
}

export async function flagSocialPost(id: string) {
  await flagContent({ data: { table: "social_posts", id } });
}

export async function flagSocialReply(id: string) {
  await flagContent({ data: { table: "social_replies", id } });
}
