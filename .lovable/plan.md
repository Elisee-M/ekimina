
# Fix Login Redirect Loop: RLS Circular Dependency

## Problem Identified

After thorough investigation, I found a **critical circular dependency in RLS policies** that causes login to hang and eventually redirect back to `/login`:

1. **`user_roles` table RLS**: The policy "Super admins can view all roles" calls `public.has_role(auth.uid(), 'super_admin')` which queries `user_roles` itself - creating infinite recursion
2. **`group_members` table RLS**: The policy "Members can view members in their group" calls `public.is_group_member()` which also queries `group_members`

When `fetchUserData` runs after login:
- It queries `user_roles` → RLS checks `has_role()` → queries `user_roles` → **infinite recursion**
- Same pattern with `group_members` → `is_group_member()` → queries `group_members`

This causes the queries to timeout or fail silently, resulting in `rolesLoaded` and `groupMembershipLoaded` never being set correctly, which triggers the redirect back to login.

## Solution

Create new **security definer functions** that bypass RLS for self-referential checks, then update the RLS policies to use these safe functions.

### Step 1: Create Safe Security Definer Functions

```sql
-- Safe function to check if user has a specific role (no RLS recursion)
CREATE OR REPLACE FUNCTION public.get_my_roles()
RETURNS SETOF app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid()
$$;

-- Safe function to get user's own group membership
CREATE OR REPLACE FUNCTION public.get_my_group_membership()
RETURNS TABLE(group_id uuid, is_admin boolean, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT group_id, is_admin, status 
  FROM public.group_members 
  WHERE user_id = auth.uid()
$$;
```

### Step 2: Update RLS Policies

Replace the problematic policies with safe versions that don't cause recursion:

**For `user_roles`:**
- Keep "Users can view their own roles" (uses `auth.uid() = user_id` - safe)
- Update "Super admins can view all roles" to avoid recursion

**For `group_members`:**
- Update policies to use the safe function or direct `auth.uid()` checks

### Step 3: Update Frontend Queries

Modify `fetchUserData` in `useAuth.tsx` to use the new RPC functions that bypass RLS:
- Call `get_my_roles()` instead of querying `user_roles` directly
- Call `get_my_group_membership()` instead of querying `group_members` directly

---

## Technical Details

### Database Migration

```sql
-- 1. Create security definer function to get own roles
CREATE OR REPLACE FUNCTION public.get_my_roles()
RETURNS SETOF app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid()
$$;

-- 2. Create security definer function to get own group membership
CREATE OR REPLACE FUNCTION public.get_my_group_membership()
RETURNS TABLE(group_id uuid, is_admin boolean, status text, group_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gm.group_id, gm.is_admin, gm.status, ig.name
  FROM public.group_members gm
  JOIN public.ikimina_groups ig ON ig.id = gm.group_id
  WHERE gm.user_id = auth.uid() AND gm.status = 'active'
$$;
```

### Frontend Changes (`src/hooks/useAuth.tsx`)

Update `fetchUserData` to use RPC calls:

```typescript
// Instead of: supabase.from('user_roles').select('role').eq('user_id', userId)
const { data: rolesData } = await supabase.rpc('get_my_roles');

// Instead of: supabase.from('group_members').select(...)
const { data: membershipData } = await supabase.rpc('get_my_group_membership');
```

---

## Expected Outcome

After implementing these changes:
1. Login will complete successfully without hanging
2. Users will be redirected to the correct dashboard based on their role
3. No more circular RLS recursion causing timeouts
4. Super admins will go to `/super-admin`
5. Group admins will go to `/dashboard`
6. Regular members will go to `/member`
7. Users without a group will go to `/onboarding`
