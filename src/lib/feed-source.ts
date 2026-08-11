import { createClient } from "@supabase/supabase-js";
import { KIND_LABEL, PETITIONS, type ItemKind } from "@/lib/mishkan-data";

export const BASE_URL = "https://mishkanprotocol2.lovable.app";

export type FeedEntry = {
  id: string;
  title: string;
  link: string;
  summary: string;
  category: string;
  updated: string;
};

export function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function trim(text: string, max = 400) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export async function collectFeedEntries(): Promise<FeedEntry[]> {
  const entries: FeedEntry[] = [];

  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];

  if (url && key) {
    const supabase = createClient(url, key, {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { data } = await supabase
      .from("docket_items")
      .select("id, type, title, body, created_at, councils(community_name)")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(30);

    for (const row of data ?? []) {
      const council = (row as { councils?: { community_name?: string } | null }).councils;
      const kind = KIND_LABEL[row.type as ItemKind] ?? "Docket item";
      entries.push({
        id: `${BASE_URL}/#item-${row.id}`,
        title: row.title as string,
        link: `${BASE_URL}/`,
        summary: trim(
          `${kind}${council?.community_name ? ` · ${council.community_name}` : ""} — ${row.body ?? ""}`,
        ),
        category: kind,
        updated: new Date(row.created_at as string).toISOString(),
      });
    }
  }

  for (const p of PETITIONS) {
    entries.push({
      id: `${BASE_URL}/petitions/${p.id}`,
      title: `${p.ref} — ${p.title}`,
      link: `${BASE_URL}/petitions/${p.id}`,
      summary: trim(
        `Petition · ${p.community} · ${p.signatures.toLocaleString("en-GB")} of ${p.threshold.toLocaleString("en-GB")} signatures · ${p.resolution} — ${p.body[0] ?? p.note}`,
      ),
      category: "Petition",
      updated: new Date(`${p.filed}T00:00:00Z`).toISOString(),
    });
  }

  return entries.sort((a, b) => b.updated.localeCompare(a.updated));
}
