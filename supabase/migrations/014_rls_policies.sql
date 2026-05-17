-- ============================================================
-- SECURITY DEFINER helper functions (avoids policy recursion)
-- ============================================================

CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_my_branch_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT branch_id FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- Enable RLS on all tables
-- ============================================================

ALTER TABLE organizations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches         ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_tiers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE extensions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_records   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs       ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Organizations
-- ============================================================

CREATE POLICY "org_select" ON organizations
  FOR SELECT USING (id = get_my_org_id());

CREATE POLICY "org_update" ON organizations
  FOR UPDATE USING (id = get_my_org_id() AND get_my_role() = 'owner');

-- ============================================================
-- Branches
-- ============================================================

CREATE POLICY "branches_select" ON branches
  FOR SELECT USING (organization_id = get_my_org_id());

CREATE POLICY "branches_insert" ON branches
  FOR INSERT WITH CHECK (
    organization_id = get_my_org_id()
    AND get_my_role() = 'owner'
  );

CREATE POLICY "branches_update" ON branches
  FOR UPDATE USING (
    organization_id = get_my_org_id()
    AND get_my_role() IN ('owner', 'branch_manager')
    AND (get_my_role() = 'owner' OR id = get_my_branch_id())
  );

CREATE POLICY "branches_delete" ON branches
  FOR DELETE USING (
    organization_id = get_my_org_id()
    AND get_my_role() = 'owner'
  );

-- ============================================================
-- Profiles
-- ============================================================

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_select_org" ON profiles
  FOR SELECT USING (
    organization_id = get_my_org_id()
    AND get_my_role() IN ('owner', 'branch_manager')
  );

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_update_org" ON profiles
  FOR UPDATE USING (
    organization_id = get_my_org_id()
    AND get_my_role() = 'owner'
  );

-- ============================================================
-- Equipment
-- ============================================================

CREATE POLICY "equipment_select" ON equipment
  FOR SELECT USING (organization_id = get_my_org_id());

CREATE POLICY "equipment_insert" ON equipment
  FOR INSERT WITH CHECK (
    organization_id = get_my_org_id()
    AND get_my_role() IN ('owner', 'branch_manager')
  );

CREATE POLICY "equipment_update" ON equipment
  FOR UPDATE USING (
    organization_id = get_my_org_id()
    AND get_my_role() IN ('owner', 'branch_manager', 'logistics')
    AND (
      get_my_role() = 'owner'
      OR branch_id = get_my_branch_id()
    )
  );

CREATE POLICY "equipment_delete" ON equipment
  FOR DELETE USING (
    organization_id = get_my_org_id()
    AND get_my_role() = 'owner'
  );

-- ============================================================
-- Pricing tiers
-- ============================================================

CREATE POLICY "pricing_select" ON pricing_tiers
  FOR SELECT USING (organization_id = get_my_org_id());

CREATE POLICY "pricing_insert" ON pricing_tiers
  FOR INSERT WITH CHECK (
    organization_id = get_my_org_id()
    AND get_my_role() IN ('owner', 'branch_manager')
  );

CREATE POLICY "pricing_update" ON pricing_tiers
  FOR UPDATE USING (
    organization_id = get_my_org_id()
    AND get_my_role() IN ('owner', 'branch_manager')
  );

CREATE POLICY "pricing_delete" ON pricing_tiers
  FOR DELETE USING (
    organization_id = get_my_org_id()
    AND get_my_role() IN ('owner', 'branch_manager')
  );

-- ============================================================
-- Customers
-- ============================================================

CREATE POLICY "customers_select" ON customers
  FOR SELECT USING (organization_id = get_my_org_id());

CREATE POLICY "customers_insert" ON customers
  FOR INSERT WITH CHECK (
    organization_id = get_my_org_id()
    AND get_my_role() IN ('owner', 'branch_manager', 'staff')
  );

CREATE POLICY "customers_update" ON customers
  FOR UPDATE USING (
    organization_id = get_my_org_id()
    AND get_my_role() IN ('owner', 'branch_manager', 'staff')
  );

CREATE POLICY "customers_delete" ON customers
  FOR DELETE USING (
    organization_id = get_my_org_id()
    AND get_my_role() = 'owner'
  );

-- ============================================================
-- Bookings
-- ============================================================

CREATE POLICY "bookings_select" ON bookings
  FOR SELECT USING (
    organization_id = get_my_org_id()
    AND (
      get_my_role() IN ('owner')
      OR branch_id = get_my_branch_id()
    )
  );

CREATE POLICY "bookings_insert" ON bookings
  FOR INSERT WITH CHECK (
    organization_id = get_my_org_id()
    AND get_my_role() IN ('owner', 'branch_manager', 'staff')
    AND (
      get_my_role() = 'owner'
      OR branch_id = get_my_branch_id()
    )
  );

CREATE POLICY "bookings_update" ON bookings
  FOR UPDATE USING (
    organization_id = get_my_org_id()
    AND get_my_role() IN ('owner', 'branch_manager', 'staff')
    AND (
      get_my_role() = 'owner'
      OR branch_id = get_my_branch_id()
    )
  );

CREATE POLICY "bookings_delete" ON bookings
  FOR DELETE USING (
    organization_id = get_my_org_id()
    AND get_my_role() = 'owner'
  );

-- ============================================================
-- Booking items
-- ============================================================

CREATE POLICY "booking_items_select" ON booking_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_items.booking_id
        AND b.organization_id = get_my_org_id()
        AND (get_my_role() = 'owner' OR b.branch_id = get_my_branch_id())
    )
  );

CREATE POLICY "booking_items_insert" ON booking_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_items.booking_id
        AND b.organization_id = get_my_org_id()
        AND get_my_role() IN ('owner', 'branch_manager', 'staff')
        AND (get_my_role() = 'owner' OR b.branch_id = get_my_branch_id())
    )
  );

CREATE POLICY "booking_items_update" ON booking_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_items.booking_id
        AND b.organization_id = get_my_org_id()
        AND get_my_role() IN ('owner', 'branch_manager', 'staff')
        AND (get_my_role() = 'owner' OR b.branch_id = get_my_branch_id())
    )
  );

CREATE POLICY "booking_items_delete" ON booking_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_items.booking_id
        AND b.organization_id = get_my_org_id()
        AND get_my_role() IN ('owner', 'branch_manager')
        AND (get_my_role() = 'owner' OR b.branch_id = get_my_branch_id())
    )
  );

-- ============================================================
-- Payments
-- ============================================================

CREATE POLICY "payments_select" ON payments
  FOR SELECT USING (organization_id = get_my_org_id());

CREATE POLICY "payments_insert" ON payments
  FOR INSERT WITH CHECK (
    organization_id = get_my_org_id()
    AND get_my_role() IN ('owner', 'branch_manager', 'staff')
  );

CREATE POLICY "payments_update" ON payments
  FOR UPDATE USING (
    organization_id = get_my_org_id()
    AND get_my_role() IN ('owner', 'branch_manager')
  );

-- ============================================================
-- Extensions
-- ============================================================

CREATE POLICY "extensions_select" ON extensions
  FOR SELECT USING (organization_id = get_my_org_id());

CREATE POLICY "extensions_insert" ON extensions
  FOR INSERT WITH CHECK (
    organization_id = get_my_org_id()
    AND get_my_role() IN ('owner', 'branch_manager', 'staff')
  );

CREATE POLICY "extensions_update" ON extensions
  FOR UPDATE USING (
    organization_id = get_my_org_id()
    AND get_my_role() IN ('owner', 'branch_manager')
  );

-- ============================================================
-- Return records
-- ============================================================

CREATE POLICY "returns_select" ON return_records
  FOR SELECT USING (organization_id = get_my_org_id());

CREATE POLICY "returns_insert" ON return_records
  FOR INSERT WITH CHECK (
    organization_id = get_my_org_id()
    AND get_my_role() IN ('owner', 'branch_manager', 'staff', 'logistics')
  );

CREATE POLICY "returns_update" ON return_records
  FOR UPDATE USING (
    organization_id = get_my_org_id()
    AND get_my_role() IN ('owner', 'branch_manager')
  );

-- ============================================================
-- Notifications
-- ============================================================

CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (
    organization_id = get_my_org_id()
    AND get_my_role() IN ('owner', 'branch_manager')
  );

-- ============================================================
-- Audit logs
-- ============================================================

CREATE POLICY "audit_select" ON audit_logs
  FOR SELECT USING (
    organization_id = get_my_org_id()
    AND get_my_role() = 'owner'
  );
