import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const flagInput = z.object({
  table: z.enum(["docket_comments", "social_posts", "social_replies"]),
  id: z.string().uuid(),
});

/**
 * Moderation flagging runs server-side: clients may not write `flagged`
 * directly, so a visitor cannot silently moderate arbitrary rows via the
 * data API. Reporting stays open to every reader, as intended.
 */
export const flagContent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => flagInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from(data.table)
      .update({ flagged: true })
      .eq("id", data.id);
    if (error) throw new Error("The report could not be recorded.");
    return { ok: true };
  });
