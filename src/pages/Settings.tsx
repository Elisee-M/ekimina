import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Settings as SettingsIcon,
  User,
  Building2,
  Bell,
  Shield,
  Loader2,
  Save,
  Camera,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { user, profile, groupMembership } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Profile settings
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

  // Group settings
  const [groupForm, setGroupForm] = useState({
    name: "",
    description: "",
    contribution_amount: "",
    contribution_frequency: "monthly",
    interest_rate: "",
    constitution: "",
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    email_contributions: true,
    email_loans: true,
    email_announcements: true,
    sms_reminders: false,
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
      });
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  useEffect(() => {
    if (groupMembership?.group_id) {
      fetchGroupSettings();
    } else {
      setLoading(false);
    }
  }, [groupMembership]);

  const fetchGroupSettings = async () => {
    if (!groupMembership?.group_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ikimina_groups')
        .select('*')
        .eq('id', groupMembership.group_id)
        .single();

      if (error) throw error;

      if (data) {
        setGroupForm({
          name: data.name || "",
          description: data.description || "",
          contribution_amount: data.contribution_amount?.toString() || "",
          contribution_frequency: data.contribution_frequency || "monthly",
          interest_rate: data.interest_rate?.toString() || "",
          constitution: data.constitution || "",
        });
      }
    } catch (error) {
      console.error('Error fetching group settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 2MB", variant: "destructive" });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file type", description: "Please select an image file", variant: "destructive" });
      return;
    }

    try {
      setUploadingAvatar(true);

      // Create unique file path
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast({ title: "Profile photo updated successfully" });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({ title: "Failed to upload photo", description: error.message, variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileForm.full_name,
          phone: profileForm.phone,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({ title: "Profile updated successfully" });
    } catch (error: any) {
      toast({ title: "Failed to update profile", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGroupSettings = async () => {
    if (!groupMembership?.group_id) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('ikimina_groups')
        .update({
          name: groupForm.name,
          description: groupForm.description,
          contribution_amount: parseFloat(groupForm.contribution_amount) || 0,
          contribution_frequency: groupForm.contribution_frequency,
          interest_rate: parseFloat(groupForm.interest_rate) || 5,
          constitution: groupForm.constitution,
        })
        .eq('id', groupMembership.group_id);

      if (error) throw error;

      toast({ title: "Group settings updated successfully" });
    } catch (error: any) {
      toast({ title: "Failed to update group settings", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW').format(amount);
  };

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your profile and group settings</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
            <TabsTrigger value="profile" className="flex items-center gap-2 py-3">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="group" className="flex items-center gap-2 py-3">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Group</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 py-3">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2 py-3">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile Settings
                  </CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt="Profile" 
                          className="w-20 h-20 rounded-full object-cover border-2 border-border"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">
                            {profileForm.full_name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()}
                          </span>
                        </div>
                      )}
                      {uploadingAvatar && (
                        <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="avatar-upload" className="cursor-pointer">
                        <Button variant="outline" size="sm" asChild disabled={uploadingAvatar}>
                          <span>
                            <Camera className="w-4 h-4 mr-2" />
                            {uploadingAvatar ? "Uploading..." : "Change Photo"}
                          </span>
                        </Button>
                      </Label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                      />
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 2MB</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="+250 7XX XXX XXX"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Group Settings */}
          <TabsContent value="group">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Group Settings
                  </CardTitle>
                  <CardDescription>Manage your savings group configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="group_name">Group Name</Label>
                      <Input
                        id="group_name"
                        value={groupForm.name}
                        onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                        placeholder="Enter group name"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={groupForm.description}
                        onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                        placeholder="Brief description of your group"
                        rows={3}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Contribution Settings</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="contribution_amount">Contribution Amount (RWF)</Label>
                        <Input
                          id="contribution_amount"
                          type="number"
                          value={groupForm.contribution_amount}
                          onChange={(e) => setGroupForm({ ...groupForm, contribution_amount: e.target.value })}
                          placeholder="e.g., 10000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="frequency">Contribution Frequency</Label>
                        <Select
                          value={groupForm.contribution_frequency}
                          onValueChange={(value) => setGroupForm({ ...groupForm, contribution_frequency: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Loan Settings</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="interest_rate">Default Interest Rate (%)</Label>
                        <Input
                          id="interest_rate"
                          type="number"
                          value={groupForm.interest_rate}
                          onChange={(e) => setGroupForm({ ...groupForm, interest_rate: e.target.value })}
                          placeholder="e.g., 5"
                        />
                        <p className="text-xs text-muted-foreground">Annual interest rate for loans</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="constitution">Group Constitution</Label>
                    <Textarea
                      id="constitution"
                      value={groupForm.constitution}
                      onChange={(e) => setGroupForm({ ...groupForm, constitution: e.target.value })}
                      placeholder="Enter your group's rules and constitution..."
                      rows={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      Define the rules, penalties, and guidelines for your savings group
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveGroupSettings} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Group Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>Choose how you want to be notified</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Email Notifications</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Contribution Reminders</p>
                          <p className="text-sm text-muted-foreground">Get notified about upcoming contribution deadlines</p>
                        </div>
                        <Switch
                          checked={notifications.email_contributions}
                          onCheckedChange={(checked) => setNotifications({ ...notifications, email_contributions: checked })}
                        />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Loan Updates</p>
                          <p className="text-sm text-muted-foreground">Receive updates on loan requests and payments</p>
                        </div>
                        <Switch
                          checked={notifications.email_loans}
                          onCheckedChange={(checked) => setNotifications({ ...notifications, email_loans: checked })}
                        />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Announcements</p>
                          <p className="text-sm text-muted-foreground">Stay updated with group announcements</p>
                        </div>
                        <Switch
                          checked={notifications.email_announcements}
                          onCheckedChange={(checked) => setNotifications({ ...notifications, email_announcements: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-4">SMS Notifications</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">SMS Reminders</p>
                          <p className="text-sm text-muted-foreground">Receive SMS reminders for important events</p>
                        </div>
                        <Switch
                          checked={notifications.sms_reminders}
                          onCheckedChange={(checked) => setNotifications({ ...notifications, sms_reminders: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => toast({ title: "Notification preferences saved" })}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>Manage your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Password</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Change your password to keep your account secure
                    </p>
                    <Button variant="outline">Change Password</Button>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Sessions</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Manage your active sessions and sign out from other devices
                    </p>
                    <div className="p-4 bg-muted rounded-lg mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Current Session</p>
                          <p className="text-sm text-muted-foreground">This device • Active now</p>
                        </div>
                        <Badge variant="success">Active</Badge>
                      </div>
                    </div>
                    <Button variant="outline" className="text-destructive hover:text-destructive">
                      Sign Out All Other Devices
                    </Button>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold text-destructive mb-4">Danger Zone</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Permanently delete your account and all associated data
                    </p>
                    <Button variant="destructive">Delete Account</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
