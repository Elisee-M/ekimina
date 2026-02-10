import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the eKimina AI Assistant — a friendly, helpful chatbot for the eKimina platform.

eKimina is a modern digital platform built for Rwandan savings groups (Ikimina). Here's what you know:

**What eKimina Does:**
- Helps Ikimina groups track member contributions (weekly/monthly)
- Manages loans with configurable interest rates and automatic profit calculation
- Provides dashboards with real-time analytics for admins and members
- Sends smart notifications and reminders for payments
- Generates exportable reports (PDF/CSV)
- Offers bank-level security with role-based access (Super Admin, Group Admin, Member)

**Pricing:**
- Starter (Free): Up to 15 members, basic tracking
- Growth (25,000 RWF/month): Up to 50 members, advanced analytics, SMS notifications
- Enterprise (Custom): Unlimited members, API access, dedicated support

**How to Get Started:**
1. Create an account at the website
2. Set up your Ikimina group
3. Invite members
4. Start tracking contributions and loans

**Contact:**
- Email: mugiranezaelisee0@gmail.com
- Phone: +250 798 809 812 (also accepts Mobile Money)

**Payment for Plans:**
- Send via Mobile Money to +250 798 809 812
- Contact with transaction ID to activate

Keep answers concise, friendly, and in the same language the user writes in (English or Kinyarwanda). If you don't know something specific, direct them to contact support.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
