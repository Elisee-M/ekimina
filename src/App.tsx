import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Contributions from "./pages/Contributions";
import Loans from "./pages/Loans";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import History from "./pages/History";
import Announcements from "./pages/Announcements";
import SuperAdminOverview from "./pages/super-admin/SuperAdminOverview";
import SuperAdminGroups from "./pages/super-admin/SuperAdminGroups";
import SuperAdminGroupDetail from "./pages/super-admin/SuperAdminGroupDetail";
import SuperAdminAdmins from "./pages/super-admin/SuperAdminAdmins";
import SuperAdminSettings from "./pages/super-admin/SuperAdminSettings";
import MemberDashboard from "./pages/MemberDashboard";
import MemberHistory from "./pages/MemberHistory";
import MemberContributions from "./pages/MemberContributions";
import MemberLoans from "./pages/MemberLoans";
import MemberAnnouncements from "./pages/MemberAnnouncements";
import MemberSettings from "./pages/MemberSettings";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Onboarding Route - signed-in users without a group */}
            <Route path="/onboarding" element={
              <ProtectedRoute allowNoGroup>
                <Onboarding />
              </ProtectedRoute>
            } />
            
            {/* Protected Admin Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute requireGroupAdmin>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/members" element={
              <ProtectedRoute requireGroupAdmin>
                <Members />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/contributions" element={
              <ProtectedRoute requireGroupAdmin>
                <Contributions />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/loans" element={
              <ProtectedRoute requireGroupAdmin>
                <Loans />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/history" element={
              <ProtectedRoute requireGroupAdmin>
                <History />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/reports" element={
              <ProtectedRoute requireGroupAdmin>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/settings" element={
              <ProtectedRoute requireGroupAdmin>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/announcements" element={
              <ProtectedRoute requireGroupAdmin>
                <Announcements />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/*" element={
              <ProtectedRoute requireGroupAdmin>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            {/* Protected Member Routes */}
            <Route path="/member" element={
              <ProtectedRoute>
                <MemberDashboard />
              </ProtectedRoute>
            } />
            <Route path="/member/contributions" element={
              <ProtectedRoute>
                <MemberContributions />
              </ProtectedRoute>
            } />
            <Route path="/member/loans" element={
              <ProtectedRoute>
                <MemberLoans />
              </ProtectedRoute>
            } />
            <Route path="/member/history" element={
              <ProtectedRoute>
                <MemberHistory />
              </ProtectedRoute>
            } />
            <Route path="/member/announcements" element={
              <ProtectedRoute>
                <MemberAnnouncements />
              </ProtectedRoute>
            } />
            <Route path="/member/settings" element={
              <ProtectedRoute>
                <MemberSettings />
              </ProtectedRoute>
            } />
            <Route path="/member/*" element={
              <ProtectedRoute>
                <MemberDashboard />
              </ProtectedRoute>
            } />
            
            {/* Protected Super Admin Routes */}
            <Route path="/super-admin" element={
              <ProtectedRoute requiredRole="super_admin">
                <SuperAdminOverview />
              </ProtectedRoute>
            } />
            <Route path="/super-admin/groups" element={
              <ProtectedRoute requiredRole="super_admin">
                <SuperAdminGroups />
              </ProtectedRoute>
            } />
            <Route path="/super-admin/groups/:groupId" element={
              <ProtectedRoute requiredRole="super_admin">
                <SuperAdminGroupDetail />
              </ProtectedRoute>
            } />
            <Route path="/super-admin/admins" element={
              <ProtectedRoute requiredRole="super_admin">
                <SuperAdminAdmins />
              </ProtectedRoute>
            } />
            <Route path="/super-admin/settings" element={
              <ProtectedRoute requiredRole="super_admin">
                <SuperAdminSettings />
              </ProtectedRoute>
            } />
            <Route path="/super-admin/*" element={
              <ProtectedRoute requiredRole="super_admin">
                <SuperAdminOverview />
              </ProtectedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
