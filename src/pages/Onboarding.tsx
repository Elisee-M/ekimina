import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, ArrowRight, Loader2, UserPlus, ArrowLeft, RotateCcw, Clock, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";

const createGroupSchema = z.object({
  groupName: z.string().trim().min(2, "Group name must be at least 2 characters").max(100),
  contributionFrequency: z.enum(["weekly", "monthly"]),
  contributionAmount: z.string().optional()
});

const joinGroupSchema = z.object({
  groupCode: z.string().trim().min(1, "Please enter a group code")
});

interface PreviousGroup {
  group_id: string;
  group_name: string;
  status: string;
  joined_at: string;
  is_admin: boolean;
}

type OnboardingStep = "choice" | "create" | "join" | "restore";

const Onboarding = () => {
  const [step, setStep] = useState<OnboardingStep>("choice");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createForm, setCreateForm] = useState({
    groupName: "",
    contributionFrequency: "monthly",
    contributionAmount: ""
  });
  const [joinForm, setJoinForm] = useState({ groupCode: "" });
  const [previousGroups, setPreviousGroups] = useState<PreviousGroup[]>([]);
  const [loadingPreviousGroups, setLoadingPreviousGroups] = useState(false);
  const [requestingRejoin, setRequestingRejoin] = useState<string | null>(null);

  const { user, loading, groupMembership } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
    // If user already has a group, redirect them
    if (!loading && groupMembership) {
      navigate(groupMembership.is_admin ? '/dashboard' : '/member');
    }
  }, [user, loading, groupMembership, navigate]);

  const fetchPreviousGroups = async () => {
    if (!user) return;
    
    setLoadingPreviousGroups(true);
    try {
      const { data, error } = await supabase
        .rpc('get_user_previous_groups', { _user_id: user.id });
      
      if (error) throw error;
      setPreviousGroups((data as PreviousGroup[]) || []);
    } catch (error: any) {
      console.error('Error fetching previous groups:', error);
      toast({
        title: "Couldn't load previous groups",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingPreviousGroups(false);
    }
  };

  const handleRestoreClick = () => {
    setStep("restore");
    fetchPreviousGroups();
  };

  const handleRequestRejoin = async (groupId: string, groupName: string) => {
    if (!user) return;
    
    setRequestingRejoin(groupId);
    try {
      const { data, error } = await supabase
        .rpc('request_rejoin_group', { _group_id: groupId });
      
      if (error) throw error;
      
      if (data) {
        toast({
          title: "Rejoin request sent!",
          description: `Your request to rejoin "${groupName}" has been sent to the group admin for approval.`,
        });
        // Refresh the list to show updated status
        fetchPreviousGroups();
      } else {
        toast({
          title: "Request failed",
          description: "Unable to request rejoin. You may already be active or no previous membership exists.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Request failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setRequestingRejoin(null);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = createGroupSchema.safeParse(createForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!user) return;

    setIsLoading(true);
    try {
      // Create the group
      const { data: groupData, error: groupError } = await supabase
        .from('ikimina_groups')
        .insert({
          name: createForm.groupName,
          contribution_frequency: createForm.contributionFrequency,
          contribution_amount: createForm.contributionAmount ? parseFloat(createForm.contributionAmount) : 0,
          created_by: user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add user as admin member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupData.id,
          user_id: user.id,
          is_admin: true,
          status: 'active'
        });

      if (memberError) throw memberError;

      // Add group_admin role
      await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'group_admin'
        });

      toast({
        title: "Group created successfully!",
        description: `Your Ikimina "${createForm.groupName}" is ready. Share code: ${groupData.id.slice(0, 8).toUpperCase()}`,
      });

      // Force refresh and navigate
      window.location.href = '/dashboard';
    } catch (error: any) {
      toast({
        title: "Failed to create group",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = joinGroupSchema.safeParse(joinForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!user) return;

    setIsLoading(true);
    try {
      // Use secure RPC function to look up group (bypasses RLS for lookup only)
      const { data: groupData, error: groupError } = await supabase
        .rpc('get_group_by_id', { _id: joinForm.groupCode.trim() });

      if (groupError) throw groupError;

      const group = groupData?.[0];
      if (!group) {
        setErrors({ groupCode: "Group not found. Please check the code and try again." });
        setIsLoading(false);
        return;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingMember) {
        setErrors({ groupCode: "You are already a member of this group." });
        setIsLoading(false);
        return;
      }

      // Add user as member (pending approval from admin)
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          is_admin: false,
          status: 'active'
        });

      if (memberError) throw memberError;

      toast({
        title: "Successfully joined!",
        description: `You are now a member of "${group.name}".`,
      });

      // Force refresh and navigate
      window.location.href = '/member';
    } catch (error: any) {
      toast({
        title: "Failed to join group",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle flex items-center justify-center p-4 py-8">
      <div className="absolute inset-0 opacity-30 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-48 sm:w-72 h-48 sm:h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 sm:w-96 h-64 sm:h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="text-center mb-6">
          <div className="flex items-center gap-2 justify-center mb-4">
            <div className="w-10 h-10 rounded-lg gradient-hero flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">e</span>
            </div>
            <span className="text-2xl font-bold text-foreground">Kimina</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Welcome to eKimina!</h1>
          <p className="text-muted-foreground mt-1">Let's get you started with your savings group</p>
        </div>

        <AnimatePresence mode="wait">
          {step === "choice" && (
            <motion.div
              key="choice"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <Card 
                variant="elevated" 
                className="cursor-pointer hover:border-primary/50 transition-all"
                onClick={() => setStep("create")}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl gradient-hero flex items-center justify-center flex-shrink-0">
                    <Plus className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-lg">Create a New Ikimina</h3>
                    <p className="text-sm text-muted-foreground">Start your own savings group and invite members</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>

              <Card 
                variant="elevated" 
                className="cursor-pointer hover:border-primary/50 transition-all"
                onClick={() => setStep("join")}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <UserPlus className="w-7 h-7 text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-lg">Join an Existing Ikimina</h3>
                    <p className="text-sm text-muted-foreground">Enter a group code to join your friends</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>

              <Card 
                variant="elevated" 
                className="cursor-pointer hover:border-primary/50 transition-all"
                onClick={handleRestoreClick}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <RotateCcw className="w-7 h-7 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-lg">Restore My Old Group</h3>
                    <p className="text-sm text-muted-foreground">Rejoin an Ikimina you were previously part of</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>

              <div className="text-center mt-6">
                <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </Link>
              </div>
            </motion.div>
          )}

          {step === "create" && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card variant="elevated">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg gradient-hero flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary-foreground" />
                    </div>
                    Create Your Ikimina
                  </CardTitle>
                  <CardDescription>Set up your savings group in seconds</CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <form onSubmit={handleCreateGroup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="groupName">Ikimina Name *</Label>
                      <Input
                        id="groupName"
                        placeholder="e.g., Ubumwe Savings Group"
                        value={createForm.groupName}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, groupName: e.target.value }))}
                        className="h-12"
                        disabled={isLoading}
                      />
                      {errors.groupName && (
                        <p className="text-sm text-destructive">{errors.groupName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contributionFrequency">Contribution Cycle *</Label>
                      <Select
                        value={createForm.contributionFrequency}
                        onValueChange={(value) => setCreateForm(prev => ({ ...prev, contributionFrequency: value }))}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contributionAmount">Default Contribution Amount (RWF)</Label>
                      <Input
                        id="contributionAmount"
                        type="number"
                        placeholder="e.g., 50000"
                        value={createForm.contributionAmount}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, contributionAmount: e.target.value }))}
                        className="h-12"
                        disabled={isLoading}
                      />
                      <p className="text-xs text-muted-foreground">Optional - can be set later</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-12"
                        onClick={() => setStep("choice")}
                        disabled={isLoading}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        variant="hero"
                        className="flex-1 h-12"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Group"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "join" && (
            <motion.div
              key="join"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card variant="elevated">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-secondary" />
                    </div>
                    Join an Ikimina
                  </CardTitle>
                  <CardDescription>Enter the group code shared by your admin</CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <form onSubmit={handleJoinGroup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="groupCode">Group Code *</Label>
                      <Input
                        id="groupCode"
                        placeholder="Paste the group code here"
                        value={joinForm.groupCode}
                        onChange={(e) => setJoinForm({ groupCode: e.target.value.trim() })}
                        className="h-12 font-mono text-sm"
                        disabled={isLoading}
                      />
                      {errors.groupCode && (
                        <p className="text-sm text-destructive">{errors.groupCode}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Ask your group admin to share the group code with you</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-12"
                        onClick={() => setStep("choice")}
                        disabled={isLoading}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        variant="hero"
                        className="flex-1 h-12"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Joining...
                          </>
                        ) : (
                          "Join Group"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "restore" && (
            <motion.div
              key="restore"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card variant="elevated">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <RotateCcw className="w-5 h-5 text-amber-600" />
                    </div>
                    Restore My Old Group
                  </CardTitle>
                  <CardDescription>Request to rejoin a group you were previously a member of</CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  {loadingPreviousGroups ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="ml-2 text-muted-foreground">Searching for your groups...</span>
                    </div>
                  ) : previousGroups.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium text-foreground mb-1">No previous groups found</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        We couldn't find any groups you were previously a member of.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setStep("choice")}
                      >
                        Go Back
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {previousGroups.map((group) => (
                        <div
                          key={group.group_id}
                          className="p-4 border rounded-lg bg-card hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-foreground truncate">{group.group_name}</h4>
                                {group.is_admin && (
                                  <Badge variant="secondary" className="text-xs">Admin</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Joined {new Date(group.joined_at).toLocaleDateString()}</span>
                                <span>•</span>
                                <Badge 
                                  variant={group.status === 'pending_rejoin' ? 'default' : 'outline'}
                                  className="text-xs capitalize"
                                >
                                  {group.status === 'pending_rejoin' ? 'Pending Approval' : group.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              {group.status === 'pending_rejoin' ? (
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                  <Clock className="w-4 h-4" />
                                  <span>Waiting</span>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRequestRejoin(group.group_id, group.group_name)}
                                  disabled={requestingRejoin === group.group_id}
                                >
                                  {requestingRejoin === group.group_id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <RotateCcw className="w-4 h-4 mr-1.5" />
                                      Request Rejoin
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="pt-4 border-t mt-4">
                        <p className="text-xs text-muted-foreground text-center mb-4">
                          Your rejoin request will be sent to the group admin for approval.
                        </p>
                        <Button
                          variant="outline"
                          className="w-full h-12"
                          onClick={() => setStep("choice")}
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back to Options
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Onboarding;
