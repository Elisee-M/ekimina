import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all enabled penalty rules
    const { data: rules, error: rulesError } = await supabase
      .from("penalty_rules")
      .select("*")
      .eq("enabled", true);

    if (rulesError) throw rulesError;
    if (!rules || rules.length === 0) {
      return new Response(JSON.stringify({ message: "No active penalty rules" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalPenalties = 0;

    for (const rule of rules) {
      const graceDays = rule.grace_period_days || 7;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - graceDays);
      const cutoffStr = cutoffDate.toISOString().split("T")[0];

      // Find contributions that are pending/late and past the grace period
      const { data: lateContributions, error: contribError } = await supabase
        .from("contributions")
        .select("id, member_id, amount, due_date, group_id")
        .eq("group_id", rule.group_id)
        .in("status", ["pending", "late"])
        .lte("due_date", cutoffStr);

      if (contribError) {
        console.error(`Error fetching contributions for group ${rule.group_id}:`, contribError);
        continue;
      }

      if (!lateContributions || lateContributions.length === 0) continue;

      for (const contribution of lateContributions) {
        // Check if a penalty already exists for this contribution
        const { data: existingPenalty } = await supabase
          .from("penalties")
          .select("id")
          .eq("contribution_id", contribution.id)
          .eq("group_id", rule.group_id)
          .maybeSingle();

        if (existingPenalty) continue; // Already penalized

        // Calculate penalty amount
        let penaltyAmount: number;
        if (rule.penalty_type === "percentage") {
          penaltyAmount = (Number(contribution.amount) * Number(rule.penalty_value)) / 100;
        } else {
          penaltyAmount = Number(rule.penalty_value);
        }

        // Insert penalty
        const { error: insertError } = await supabase.from("penalties").insert({
          group_id: rule.group_id,
          member_id: contribution.member_id,
          contribution_id: contribution.id,
          amount: penaltyAmount,
          reason: "late_contribution",
          status: "pending",
        });

        if (insertError) {
          console.error(`Error inserting penalty:`, insertError);
          continue;
        }

        // Update contribution status to 'late'
        await supabase
          .from("contributions")
          .update({ status: "late" })
          .eq("id", contribution.id);

        totalPenalties++;
      }
    }

    return new Response(
      JSON.stringify({ message: `Applied ${totalPenalties} new penalties` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in apply-penalties:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
