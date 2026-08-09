import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeading } from "@/components/record";
import { councilsQuery, fileDocketItem } from "@/lib/db";
import { KIND_LABEL, type ItemKind } from "@/lib/mishkan-data";
import { chainNameById } from "@/lib/db";
import { eligibilityMessage, useEligibility } from "@/lib/eligibility";
import { useWallet } from "@/lib/wallet";

export const Route = createFileRoute("/submit")({
  head: () => ({
    meta: [
      { title: "Submit an item — Mishkan Protocol" },
      {
        name: "description",
        content:
          "Open a community poll, file a dispute case, or draft a governance proposal for your Council.",
      },
      { property: "og:title", content: "Submit an item — Mishkan Protocol" },
      {
        property: "og:description",
        content: "Open a poll, file a dispute, or draft a proposal for your Council.",
      },
    ],
  }),
  component: Submit,
});

const fieldClass =
  "w-full border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block border-b border-rule py-7">
      <span className="label-caps text-muted-foreground">{label}</span>
      {hint ? <span className="mt-2 block text-sm text-muted-foreground">{hint}</span> : null}
      <div className="mt-3">{children}</div>
    </label>
  );
}

function Submit() {
  const wallet = useWallet();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: councils = [] } = useQuery(councilsQuery);

  const [kind, setKind] = useState<ItemKind>("poll");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [councilId, setCouncilId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const effectiveCouncil = councilId || councils[0]?.id || "";
  const council = councils.find((c) => c.id === effectiveCouncil) ?? null;
  const eligibility = useEligibility(council);
  const gateNote = eligibilityMessage(eligibility, chainNameById);

  const file = useMutation({
    mutationFn: () =>
      fileDocketItem({
        councilId: effectiveCouncil,
        type: kind,
        title: title.trim(),
        body: body.trim(),
        wallet: wallet.address!,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["docket"] });
      void navigate({ to: "/" });
    },
    onError: (e: unknown) => {
      setError(e instanceof Error ? e.message : "The filing could not be recorded.");
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!wallet.address) {
      setError("Connect a wallet before filing to the docket.");
      return;
    }
    if (!title.trim()) {
      setError("A title is required.");
      return;
    }
    if (!effectiveCouncil) {
      setError("Select a community.");
      return;
    }
    if (eligibility.state !== "eligible") {
      setError(
        eligibility.state === "not-eligible"
          ? "Not eligible to file — the connected wallet does not hold enough of the configured token."
          : (gateNote ?? "Eligibility could not be confirmed."),
      );
      return;
    }
    file.mutate();
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <PageHeading
        eyebrow="New filing"
        title="Submit"
        lede="Filings enter the docket once the submitter meets the community's threshold. Drafts are not public until submitted."
      />

      <form className="mt-2 grid gap-x-16 gap-y-0 lg:grid-cols-[minmax(0,32rem)_1fr]" onSubmit={onSubmit}>
        <div>
          <Field label="Item type">
            <div className="grid gap-2">
              {(["poll", "dispute", "proposal"] as const).map((k) => (
                <label
                  key={k}
                  className="flex cursor-pointer items-center gap-3 border border-input bg-card px-3 py-2.5 text-sm has-[:checked]:border-foreground"
                >
                  <input
                    type="radio"
                    name="kind"
                    value={k}
                    checked={kind === k}
                    onChange={() => setKind(k)}
                    className="accent-foreground"
                  />
                  {KIND_LABEL[k]}
                </label>
              ))}
            </div>
          </Field>

          <Field label="Title" hint="One sentence. Neutral phrasing.">
            <input
              className={fieldClass}
              placeholder="e.g. Establish a standing treasury review"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>

          <Field label="Statement" hint="What is being asked, and on what grounds.">
            <textarea
              rows={7}
              className={fieldClass}
              placeholder="Full text of the filing…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </Field>

          <Field label="Community" hint="Each community carries its own chain and token gate.">
            <select
              className={fieldClass}
              value={effectiveCouncil}
              onChange={(e) => setCouncilId(e.target.value)}
            >
              {councils.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.community_name}
                  {c.token_symbol ? ` · ${c.token_symbol}` : ""}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex flex-wrap items-center gap-4 py-8">
            <button
              type="submit"
              disabled={file.isPending || eligibility.state !== "eligible"}
              className="border border-foreground bg-foreground px-5 py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-background transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {file.isPending ? "Filing…" : "File to docket"}
            </button>
            <span className="font-mono text-[11px] text-muted-foreground">
              {wallet.address
                ? `Filing as ${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`
                : "No wallet connected"}
            </span>
            {gateNote ? (
              <span
                className={`font-mono text-[11px] ${
                  eligibility.state === "not-eligible" ? "text-failed" : "text-muted-foreground"
                }`}
              >
                {gateNote}
              </span>
            ) : null}
          </div>

          {error ? <p className="pb-8 font-mono text-[11px] text-failed">{error}</p> : null}
        </div>

        <aside className="border-t border-rule pt-8 lg:border-l lg:border-t-0 lg:pl-16 lg:pt-7">
          <h2 className="text-xl">Before you file</h2>
          <ul className="mt-5 space-y-5 text-sm leading-relaxed text-muted-foreground">
            <li>
              <span className="text-foreground">Polls are advisory.</span> They record sentiment and
              carry no execution authority.
            </li>
            <li>
              <span className="text-foreground">Disputes are adversarial.</span> Name the claim, the
              respondent, and the remedy sought.
            </li>
            <li>
              <span className="text-foreground">Proposals are binding.</span> If they pass quorum,
              the Council is obliged to record and execute.
            </li>
            <li>
              Filings cannot be edited after submission. Corrections are entered as amendments on the
              public record.
            </li>
          </ul>
        </aside>
      </form>
    </div>
  );
}
