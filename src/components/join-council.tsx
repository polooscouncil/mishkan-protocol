import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveCouncil } from "@/lib/active-council";
import { useWallet } from "@/lib/wallet";
import { useEligibility } from "@/lib/eligibility";
import { claimQuery, isCardanoCouncil, recordClaim } from "@/lib/membership";
import { signCardanoClaim } from "@/lib/chains/cardano";
import { CARDANO_CHAIN_ID } from "@/lib/chains";
import { STATUS_BADGE } from "@/lib/mishkan-data";

/**
 * Cardano-only onboarding. A member claims their CIP-0113 governance token
 * with their own wallet-signed, self-paid transaction — there is no admin or
 * team-funded distribution path anywhere in the protocol.
 */
export function JoinCouncil({ className = "" }: { className?: string }) {
  const { council } = useActiveCouncil();
  const wallet = useWallet();
  const eligibility = useEligibility(council);
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const address = wallet.address ?? null;
  const { data: claim } = useQuery(claimQuery(council?.id ?? null, address));

  if (!isCardanoCouncil(council) || !council) return null;

  const onWrongNetwork = wallet.chainId !== CARDANO_CHAIN_ID;
  const isMember = eligibility.state === "eligible";
  const pending = !isMember && claim?.status === "pending";

  const state: { tone: keyof typeof STATUS_BADGE; label: string; body: string } = isMember
    ? {
        tone: "resolved",
        label: "Member",
        body: "Your wallet holds the council's governance token. You are eligible to vote on every open item.",
      }
    : pending
      ? {
          tone: "pending",
          label: "Claim pending",
          body: "Your claim is signed and awaiting settlement. Membership turns active as soon as the token appears in your wallet.",
        }
      : {
          tone: "returned",
          label: "Not a member",
          body: "Join the Council to claim your governance token. The claim is signed and paid for by your own wallet — the protocol never distributes tokens on your behalf.",
        };

  async function join() {
    if (!council) return;
    setBusy(true);
    setError(null);
    try {
      if (!address) await wallet.connect("cardano");
      else if (onWrongNetwork) await wallet.switchChain(CARDANO_CHAIN_ID);
      const signed = await signCardanoClaim({
        councilId: council.id,
        policyId: council.policy_id ?? "",
        messageTag: council.message_tag ?? "mishkan.vote.v1",
      });
      await recordClaim({ councilId: council.id, wallet: signed.address });
      await queryClient.invalidateQueries({ queryKey: ["council-claim"] });
      await queryClient.invalidateQueries({ queryKey: ["eligibility"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "The claim was not completed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`border border-rule bg-card p-6 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="label-caps text-muted-foreground">Council membership · Cardano</p>
        <span
          className={`label-caps rounded-full border px-2 py-0.5 ${STATUS_BADGE[state.tone]}`}
        >
          {state.label}
        </span>
      </div>

      <h2 className="mt-4 text-2xl leading-snug">{council.community_name}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{state.body}</p>

      <dl className="mt-5 grid gap-x-8 gap-y-2 border-t border-rule pt-4 font-mono text-[11px] text-muted-foreground sm:grid-cols-2">
        <div className="flex justify-between gap-4">
          <dt>Policy ID</dt>
          <dd className="truncate">{council.policy_id ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Message tag</dt>
          <dd>{council.message_tag ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Minimum balance</dt>
          <dd>
            {council.min_balance} {council.token_symbol ?? ""}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Claim funding</dt>
          <dd>Self-paid by claimant</dd>
        </div>
      </dl>

      {!isMember ? (
        <button
          type="button"
          onClick={() => void join()}
          disabled={busy}
          className="mt-6 border border-foreground bg-foreground px-5 py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-background transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {busy
            ? "Awaiting wallet…"
            : !address
              ? "Connect Cardano wallet"
              : pending
                ? "Re-sign claim"
                : "Join Council"}
        </button>
      ) : null}

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      {!wallet.available && wallet.family === "cardano" ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No Cardano wallet detected. Install Eternl or Lace to claim membership.
        </p>
      ) : null}
    </section>
  );
}
