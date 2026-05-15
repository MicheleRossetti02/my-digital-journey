import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ContactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  subject: z.string().max(300).optional().default(""),
  message: z.string().min(1).max(5000),
});

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((input) => ContactSchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      subject: data.subject ?? "",
      message: data.message,
    });
    if (error) {
      console.error("contact insert error", error);
      return { ok: false as const, error: "Could not send message. Please try again." };
    }
    return { ok: true as const };
  });
