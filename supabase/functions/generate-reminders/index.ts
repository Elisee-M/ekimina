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

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Calculate tomorrow and day-after-tomorrow for upcoming reminders
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    const dayAfterStr = dayAfter.toISOString().split("T")[0];

    let remindersCreated = 0;
    let penaltyWarnings = 0;

    // ---- 1. Upcoming contribution reminders (due tomorrow or day after) ----
    const { data: upcomingContribs } = await supabase
      .from("contributions")
      .select("id, member_id, amount, due_date, group_id")
      .in("status", ["pending"])
      .in("due_date", [tomorrowStr, dayAfterStr]);

    if (upcomingContribs && upcomingContribs.length > 0) {
      // Get group names
      const groupIds = [...new Set(upcomingContribs.map((c: any) => c.group_id))];
      const { data: groups } = await supabase
        .from("ikimina_groups")
        .select("id, name")
        .in("id", groupIds);
      const groupMap = new Map((groups || []).map((g: any) => [g.id, g.name]));

      for (const contrib of upcomingContribs) {
        // Check if reminder already sent for this contribution
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", contrib.member_id)
          .eq("type", "contribution_reminder")
          .like("message", `%${contrib.id}%`)
          .maybeSingle();

        if (existing) continue;

        const groupName = groupMap.get(contrib.group_id) || "your group";
        const dueDate = new Date(contrib.due_date);
        const isTomorrow = contrib.due_date === tomorrowStr;
        const formattedDate = dueDate.toLocaleDateString("en-US", {
          month: "short", day: "numeric", year: "numeric",
        });

        await supabase.from("notifications").insert({
          user_id: contrib.member_id,
          group_id: contrib.group_id,
          type: "contribution_reminder",
          title: isTomorrow ? "Contribution Due Tomorrow" : "Contribution Due Soon",
          message: `Your contribution of RWF ${Number(contrib.amount).toLocaleString()} to ${groupName} is due on ${formattedDate}. [ref:${contrib.id}]`,
        });
        remindersCreated++;
      }
    }

    // ---- 2. Penalty warnings for overdue contributions nearing grace period end ----
    const { data: rules } = await supabase
      .from("penalty_rules")
      .select("*")
      .eq("enabled", true);

    if (rules && rules.length > 0) {
      for (const rule of rules) {
        const graceDays = rule.grace_period_days ?? 7;
        // Warn 1 day before grace period ends
        const warnDaysAfterDue = Math.max(graceDays - 1, 0);
        const warnCutoff = new Date(today);
        warnCutoff.setDate(warnCutoff.getDate() - warnDaysAfterDue);
        const warnCutoffStr = warnCutoff.toISOString().split("T")[0];

        // Get overdue contributions that are exactly at warning threshold
        const { data: overdueContribs } = await supabase
          .from("contributions")
          .select("id, member_id, amount, due_date, group_id")
          .eq("group_id", rule.group_id)
          .in("status", ["pending", "late"])
          .eq("due_date", warnCutoffStr);

        if (!overdueContribs || overdueContribs.length === 0) continue;

        const { data: groupData } = await supabase
          .from("ikimina_groups")
          .select("name")
          .eq("id", rule.group_id)
          .single();
        const groupName = groupData?.name || "your group";

        for (const contrib of overdueContribs) {
          // Check if penalty warning already sent
          const { data: existing } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", contrib.member_id)
            .eq("type", "penalty_warning")
            .like("message", `%${contrib.id}%`)
            .maybeSingle();

          if (existing) continue;

          // Check if penalty already applied
          const { data: existingPenalty } = await supabase
            .from("penalties")
            .select("id")
            .eq("contribution_id", contrib.id)
            .maybeSingle();

          if (existingPenalty) continue;

          let penaltyAmount: number;
          if (rule.penalty_type === "percentage") {
            penaltyAmount = (Number(contrib.amount) * Number(rule.penalty_value)) / 100;
          } else {
            penaltyAmount = Number(rule.penalty_value);
          }

          const daysLeft = graceDays === 0 ? 0 : 1;

          await supabase.from("notifications").insert({
            user_id: contrib.member_id,
            group_id: rule.group_id,
            type: "penalty_warning",
            title: "Penalty Warning",
            message: `Your overdue contribution to ${groupName} will incur a penalty of RWF ${penaltyAmount.toLocaleString()}${daysLeft > 0 ? ` in ${daysLeft} day` : " today"} if unpaid. [ref:${contrib.id}]`,
          });
          penaltyWarnings++;
        }
      }
    }

    // ---- 3. Contribution due today reminders ----
    const { data: todayContribs } = await supabase
      .from("contributions")
      .select("id, member_id, amount, due_date, group_id")
      .eq("status", "pending")
      .eq("due_date", todayStr);

    if (todayContribs && todayContribs.length > 0) {
      const groupIds = [...new Set(todayContribs.map((c: any) => c.group_id))];
      const { data: groups } = await supabase
        .from("ikimina_groups")
        .select("id, name")
        .in("id", groupIds);
      const groupMap = new Map((groups || []).map((g: any) => [g.id, g.name]));

      for (const contrib of todayContribs) {
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", contrib.member_id)
          .eq("type", "contribution_due_today")
          .like("message", `%${contrib.id}%`)
          .maybeSingle();

        if (existing) continue;

        const groupName = groupMap.get(contrib.group_id) || "your group";

        await supabase.from("notifications").insert({
          user_id: contrib.member_id,
          group_id: contrib.group_id,
          type: "contribution_due_today",
          title: "Contribution Due Today",
          message: `Your contribution of RWF ${Number(contrib.amount).toLocaleString()} to ${groupName} is due today. Pay now to avoid penalties. [ref:${contrib.id}]`,
        });
        remindersCreated++;
      }
    }

    return new Response(
      JSON.stringify({
        message: `Created ${remindersCreated} reminders and ${penaltyWarnings} penalty warnings`,
        remindersCreated,
        penaltyWarnings,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-reminders:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
