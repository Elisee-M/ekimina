import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getValidatedText(value: unknown, fieldName: string, min: number, max: number) {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} is required`);
  }

  const trimmed = value.trim();

  if (trimmed.length < min || trimmed.length > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max} characters`);
  }

  return trimmed;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();

    const name = getValidatedText(body?.name, "name", 2, 100);
    const email = getValidatedText(body?.email, "email", 5, 255).toLowerCase();
    const subject = getValidatedText(body?.subject, "subject", 3, 200);
    const message = getValidatedText(body?.message, "message", 10, 2000);

    if (!EMAIL_REGEX.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email address" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error } = await supabase.from("contact_messages").insert({
      name,
      email,
      subject,
      message,
    });

    if (error) {
      console.error("Failed to store contact message", error);

      return new Response(JSON.stringify({ error: "Unable to send message" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const status = error instanceof Error ? 400 : 500;

    if (error instanceof Error) {
      console.error("Invalid contact message submission", error.message);
    } else {
      console.error("Unexpected contact message submission error", error);
    }

    return new Response(JSON.stringify({ error: status === 400 ? "Invalid request" : "Unable to send message" }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});