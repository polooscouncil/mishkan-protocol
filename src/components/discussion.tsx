import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { commentsQuery, flagComment, postComment } from "@/lib/db";
import { useWallet } from "@/lib/wallet";

const LIMIT = 500;

function timestamp(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Discussion({ docketItemId }: { docketItemId: string }) {
  const wallet = useWallet();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { data: comments = [], isLoading } = useQuery(commentsQuery(docketItemId));

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ["comments", docketItemId] });

  const post = useMutation({
    mutationFn: () =>
      postComment({ docketItemId, wallet: wallet.address!, body: draft.trim() }),
    onSuccess: () => {
      setDraft("");
      setError(null);
      invalidate();
    },
    onError: (e: unknown) =>
      setError(e instanceof Error ? e.message : "Comment could not be posted."),
  });

  const flag = useMutation({
    mutationFn: (id: string) => flagComment(id),
    onSuccess: invalidate,
  });

  return (
    <section className="mt-6 border-t border-rule pt-5">
      <h3 className="label-caps text-muted-foreground">Community discussion</h3>

      <ul className="mt-4 space-y-4">
        {isLoading ? (
          <li className="font-mono text-[11px] text-muted-foreground">Loading thread…</li>
        ) : comments.length === 0 ? (
          <li className="font-mono text-[11px] text-muted-foreground">
            No comments yet on this item.
          </li>
        ) : (
          comments.map((c) => (
            <li key={c.id} className="border-l-2 border-rule pl-3">
              <p className="font-mono text-[11px] text-muted-foreground">
                {c.author_wallet.slice(0, 6)}…{c.author_wallet.slice(-4)} ·{" "}
                {timestamp(c.created_at)}
                {c.flagged ? " · flagged for review" : ""}
              </p>
              <p
                className={`mt-1.5 text-sm leading-relaxed ${
                  c.flagged ? "text-muted-foreground italic" : "text-foreground"
                }`}
              >
                {c.flagged ? "This comment has been flagged for review." : c.body}
              </p>
              {c.flagged ? null : (
                <button
                  type="button"
                  onClick={() => flag.mutate(c.id)}
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
        <form
          className="mt-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim().length === 0) return;
            post.mutate();
          }}
        >
          <textarea
            value={draft}
            maxLength={LIMIT}
            rows={3}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add to the discussion. Text only."
            className="w-full resize-y border border-input bg-card px-3 py-2 text-sm outline-none focus:border-foreground"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-[11px] text-muted-foreground">
              {draft.length}/{LIMIT}
            </span>
            <button
              type="submit"
              disabled={post.isPending || draft.trim().length === 0}
              className="border border-foreground px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors hover:bg-foreground hover:text-background disabled:opacity-40"
            >
              {post.isPending ? "Posting…" : "Post comment"}
            </button>
          </div>
          {error ? <p className="mt-2 font-mono text-[11px] text-failed">{error}</p> : null}
        </form>
      ) : (
        <p className="mt-5 font-mono text-[11px] text-muted-foreground">
          Connect a wallet to join the discussion.
        </p>
      )}
    </section>
  );
}
