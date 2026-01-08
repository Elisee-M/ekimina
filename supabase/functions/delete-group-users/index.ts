import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the caller's token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { groupId } = await req.json();

    if (!groupId) {
      return new Response(JSON.stringify({ error: "groupId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if caller is super_admin
    const { data: callerRoles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    const isSuperAdmin = callerRoles?.some((r) => r.role === "super_admin");

    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ error: "Unauthorized: requires super admin privileges" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all users in this group
    const { data: members, error: membersError } = await supabaseClient
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId);

    if (membersError) {
      console.error("Error fetching members:", membersError);
      return new Response(JSON.stringify({ error: membersError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get unique user IDs
    const userIds = [...new Set(members?.map((m) => m.user_id) || [])];

    // Check which users are ONLY in this group (not members of other groups)
    const usersToDelete: string[] = [];

    for (const userId of userIds) {
      // Don't delete the super admin caller
      if (userId === caller.id) continue;

      const { data: otherMemberships } = await supabaseClient
        .from("group_members")
        .select("id")
        .eq("user_id", userId)
        .neq("group_id", groupId);

      // If user has no other group memberships, they should be deleted
      if (!otherMemberships || otherMemberships.length === 0) {
        usersToDelete.push(userId);
      }
    }

    // Delete users who are only in this group
    const deleteResults = await Promise.allSettled(
      usersToDelete.map((userId) => supabaseClient.auth.admin.deleteUser(userId))
    );

    const deletedCount = deleteResults.filter((r) => r.status === "fulfilled").length;
    const failedCount = deleteResults.filter((r) => r.status === "rejected").length;

    // Now delete the group itself (cascades to group_members, contributions, loans, etc.)
    const { error: groupDeleteError } = await supabaseClient
      .from("ikimina_groups")
      .delete()
      .eq("id", groupId);

    if (groupDeleteError) {
      console.error("Error deleting group:", groupDeleteError);
      return new Response(JSON.stringify({ error: groupDeleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        deletedUsers: deletedCount,
        failedUsers: failedCount,
        skippedUsers: userIds.length - usersToDelete.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
