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
    let totalContributionsCreated = 0;
    const today = new Date();
    const todayDayOfWeek = today.getUTCDay(); // 0=Sunday, 6=Saturday
    const todayDayOfMonth = today.getUTCDate();
    const todayStr = today.toISOString().split("T")[0];

    for (const rule of rules) {
      // Get group info to check frequency and contribution day
      const { data: group, error: groupError } = await supabase
        .from("ikimina_groups")
        .select("id, contribution_frequency, contribution_amount, contribution_day_of_week, contribution_day_of_month")
        .eq("id", rule.group_id)
        .single();

      if (groupError || !group) {
        console.error(`Error fetching group ${rule.group_id}:`, groupError);
        continue;
      }

      const freq = group.contribution_frequency;
      let isDueDay = false;

      if (freq === "weekly" || freq === "bi-weekly") {
        // Check if today is the configured contribution day of week
        if (group.contribution_day_of_week !== null && group.contribution_day_of_week !== undefined) {
          isDueDay = todayDayOfWeek === group.contribution_day_of_week;
        }
      } else if (freq === "monthly") {
        // Check if today is the configured contribution day of month
        if (group.contribution_day_of_month !== null && group.contribution_day_of_month !== undefined) {
          isDueDay = todayDayOfMonth === group.contribution_day_of_month;
        }
      }

      // If today is a due day, auto-create pending contributions for all active members who don't have one yet
      if (isDueDay) {
        const { data: members } = await supabase
          .from("group_members")
          .select("user_id")
          .eq("group_id", group.id)
          .eq("status", "active");

        if (members && members.length > 0) {
          for (const member of members) {
            // Check if contribution already exists for this member on this due date
            const { data: existing } = await supabase
              .from("contributions")
              .select("id")
              .eq("group_id", group.id)
              .eq("member_id", member.user_id)
              .eq("due_date", todayStr)
              .maybeSingle();

            if (!existing) {
              const { error: insertErr } = await supabase.from("contributions").insert({
                group_id: group.id,
                member_id: member.user_id,
                amount: group.contribution_amount,
                due_date: todayStr,
                status: "pending",
              });
              if (!insertErr) totalContributionsCreated++;
            }
          }
        }
      }

      // Now apply penalties for overdue contributions
      const graceDays = rule.grace_period_days ?? 7;
      const cutoffDate = new Date();
      // Grace period 0 means penalty applies at midnight after due day (next day's run)
      // So we subtract graceDays from today, and use strictly less than today for 0-day grace
      cutoffDate.setDate(cutoffDate.getDate() - graceDays);
      const cutoffStr = cutoffDate.toISOString().split("T")[0];

      let query = supabase
        .from("contributions")
        .select("id, member_id, amount, due_date, group_id")
        .eq("group_id", rule.group_id)
        .in("status", ["pending", "late"]);

      if (graceDays === 0) {
        // 0-day grace: penalize contributions with due_date strictly before today
        // (members have until end of due day / midnight)
        query = query.lt("due_date", todayStr);
      } else {
        query = query.lte("due_date", cutoffStr);
      }

      const { data: lateContributions, error: contribError } = await query;

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
      JSON.stringify({
        message: `Created ${totalContributionsCreated} contributions, applied ${totalPenalties} new penalties`,
        contributionsCreated: totalContributionsCreated,
        penaltiesApplied: totalPenalties,
      }),
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
