import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  createSocialPost,
  createSocialReply,
  flagSocialPost,
  flagSocialReply,
  socialFeedQuery,
  socialRepliesQuery,
  type SocialPost,
} from "@/lib/db";
import { useWallet } from "@/lib/wallet";
import { useActiveCouncil } from "@/lib/active-council";

const LIMIT = 500;

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "Community Feed — Mishkan Protocol" },
      {
        name: "description",
        content:
          "Announcements, updates, and open community discussion across Mishkan Protocol councils.",
      },
      { property: "og:title", content: "Community Feed — Mishkan Protocol" },
      {
        property: "og:description",
        content:
          "Announcements, updates, and open community discussion across Mishkan Protocol councils.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FeedPage,
  errorComponent: () => (
    <div className="mx-auto max-w-4xl px-6 py-16 text-sm text-muted-foreground">
      The feed could not be loaded. Please try again.
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-4xl px-6 py-16 text-sm text-muted-foreground">
      Nothing here.
    </div>
  ),
});

function shortWallet(w: string) {
  return `${w.slice(0, 6)}…${w.slice(-4)}`;
}

function timestamp(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Composer({
  placeholder,
  pending,
  onSubmit,
  submitLabel,
}: {
  placeholder: string;
  pending: boolean;
  submitLabel: string;
  onSubmit: (value: string) => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!draft.trim()) return;
        onSubmit(draft.trim());
        setDraft("");
      }}
    >
      <textarea
        value={draft}
        maxLength={LIMIT}
        rows={3}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-y border border-input bg-card px-3 py-2 text-sm outline-none focus:border-foreground"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-[11px] text-muted-foreground">
          {draft.length}/{LIMIT}
        </span>
        <button
          type="submit"
          disabled={pending || draft.trim().length === 0}
          className="border border-foreground px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors hover:bg-foreground hover:text-background disabled:opacity-40"
        >
          {pending ? "Posting…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Replies({ postId }: { postId: string }) {
  const wallet = useWallet();
  const queryClient = useQueryClient();
  const { data: replies = [], isLoading } = useQuery(socialRepliesQuery(postId));

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["social-replies", postId] });
    void queryClient.invalidateQueries({ queryKey: ["social-feed"] });
  };

  const reply = useMutation({
    mutationFn: (content: string) =>
      createSocialReply({ postId, wallet: wallet.address!, content }),
    onSuccess: invalidate,
  });

  const flag = useMutation({
    mutationFn: (id: string) => flagSocialReply(id),
    onSuccess: invalidate,
  });

  return (
    <div className="mt-4 border-t border-rule pt-4">
      <ul className="space-y-4">
        {isLoading ? (
          <li className="font-mono text-[11px] text-muted-foreground">Loading replies…</li>
        ) : replies.length === 0 ? (
          <li className="font-mono text-[11px] text-muted-foreground">No replies yet.</li>
        ) : (
          replies.map((r) => (
            <li key={r.id} className="border-l-2 border-rule pl-3">
              <p className="font-mono text-[11px] text-muted-foreground">
                {shortWallet(r.author_wallet)} · {timestamp(r.created_at)}
              </p>
              <p
                className={`mt-1.5 text-sm leading-relaxed ${
                  r.flagged ? "italic text-muted-foreground" : "text-foreground"
                }`}
              >
                {r.flagged ? "This reply has been flagged for review." : r.content}
              </p>
              {r.flagged ? null : (
                <button
                  type="button"
                  onClick={() => flag.mutate(r.id)}
                  className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground underline-offset-4 hover:text-failed hover:underline"
                >
                  ⚑ Report
                </button>
              )}
            </li>
          ))
        )}
      </ul>

      {wallet.address ? (
        <div className="mt-4">
          <Composer
            placeholder="Reply. Text only."
            pending={reply.isPending}
            submitLabel="Post reply"
            onSubmit={(v) => reply.mutate(v)}
          />
        </div>
      ) : (
        <p className="mt-4 font-mono text-[11px] text-muted-foreground">
          Connect a wallet to reply.
        </p>
      )}
    </div>
  );
}

function PostCard({ post }: { post: SocialPost }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const flag = useMutation({
    mutationFn: () => flagSocialPost(post.id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["social-feed"] }),
  });

  return (
    <article className="border-b border-rule py-6">
      <p className="font-mono text-[11px] text-muted-foreground">
        {shortWallet(post.author_wallet)} · {timestamp(post.created_at)}
      </p>
      <p
        className={`mt-2 text-base leading-relaxed ${
          post.flagged ? "italic text-muted-foreground" : "text-foreground"
        }`}
      >
        {post.flagged ? "This post has been flagged for review." : post.content}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {post.reply_count} {post.reply_count === 1 ? "reply" : "replies"}
          {open ? " · hide" : ""}
        </button>
        {post.flagged ? null : (
          <button
            type="button"
            onClick={() => flag.mutate()}
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground underline-offset-4 hover:text-failed hover:underline"
          >
            ⚑ Report
          </button>
        )}
      </div>
      {open ? <Replies postId={post.id} /> : null}
    </article>
  );
}

function FeedPage() {
  const wallet = useWallet();
  const { council } = useActiveCouncil();
  const queryClient = useQueryClient();
  const [sort, setSort] = useState<"newest" | "replies">("newest");

  const { data: posts = [], isLoading } = useQuery(socialFeedQuery(council?.id ?? null));

  const create = useMutation({
    mutationFn: (content: string) =>
      createSocialPost({ councilId: council!.id, wallet: wallet.address!, content }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["social-feed"] }),
  });

  const ordered =
    sort === "replies"
      ? [...posts].sort(
          (a, b) =>
            b.reply_count - a.reply_count ||
            +new Date(b.created_at) - +new Date(a.created_at),
        )
      : posts;

  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <header className="border-b border-rule pb-6">
        <p className="label-caps text-muted-foreground">General discussion</p>
        <h1 className="mt-4 text-4xl md:text-5xl">Community Feed</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Announcements, updates, and open discussion that is not tied to a specific docket
          item. Anyone can read the feed; posting and replying require a connected wallet.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule py-4">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {(
            [
              ["newest", "Newest first"],
              ["replies", "Most replies"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSort(key)}
              className={`border-b py-0.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                sort === key
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {council ? (
          <p className="font-mono text-[11px] text-muted-foreground">{council.community_name}</p>
        ) : null}
      </div>

      <p className="border-b border-rule py-4 text-xs leading-relaxed text-muted-foreground">
        Community discussion is not moderated in real time and does not represent official
        Mishkan Protocol positions. Report inappropriate content using the flag button.
      </p>

      {wallet.address && council ? (
        <div className="border-b border-rule py-6">
          <Composer
            placeholder="Post to the community feed. Text only."
            pending={create.isPending}
            submitLabel="Post"
            onSubmit={(v) => create.mutate(v)}
          />
        </div>
      ) : (
        <p className="border-b border-rule py-6 font-mono text-[11px] text-muted-foreground">
          {wallet.address
            ? "Select a community in the header to post."
            : "Not connected — connect a wallet to post or reply."}
        </p>
      )}

      <div>
        {isLoading ? (
          <p className="py-12 font-mono text-[11px] text-muted-foreground">Loading feed…</p>
        ) : ordered.length === 0 ? (
          <p className="py-12 text-sm text-muted-foreground">
            Nothing has been posted to the feed yet.
          </p>
        ) : (
          ordered.map((p) => <PostCard key={p.id} post={p} />)
        )}
      </div>
    </div>
  );
}
