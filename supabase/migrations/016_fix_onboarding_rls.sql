-- ============================================================
-- Fix: allow new users to create an org + branch during onboarding
-- During onboarding, profile.organization_id is NULL, so
-- get_my_org_id() returns NULL and the original policies block INSERT.
-- ============================================================

-- Organizations: any authenticated user can create one (they have no org yet)
DROP POLICY IF EXISTS "org_insert" ON organizations;
CREATE POLICY "org_insert" ON organizations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Branches: any authenticated user can create one during onboarding
DROP POLICY IF EXISTS "branch_insert" ON branches;
CREATE POLICY "branch_insert" ON branches
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Profiles: ensure users can always update their own row
-- (covers the final step where onboarding writes org_id + branch_id)
DROP POLICY IF EXISTS "profile_update_own" ON profiles;
CREATE POLICY "profile_update_own" ON profiles
  FOR UPDATE
  USING (id = auth.uid());
