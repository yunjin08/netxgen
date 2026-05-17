-- ============================================================
-- update_updated_at() — generic trigger to refresh updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_branches_updated_at
  BEFORE UPDATE ON branches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- generate_booking_number() — BK-YYYY-NNN per organization
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS booking_number_seq;

CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_year   text;
  v_count  bigint;
  v_number text;
BEGIN
  v_year  := to_char(now(), 'YYYY');
  v_count := nextval('booking_number_seq');
  v_number := 'BK-' || v_year || '-' || lpad(v_count::text, 3, '0');
  NEW.booking_number := v_number;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_booking_number
  BEFORE INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.booking_number IS NULL)
  EXECUTE FUNCTION generate_booking_number();

-- ============================================================
-- sync_equipment_stock() — adjust stock on booking status change
-- ============================================================

CREATE OR REPLACE FUNCTION sync_equipment_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status_old booking_status;
  v_status_new booking_status;
BEGIN
  v_status_old := OLD.status;
  v_status_new := NEW.status;

  -- Reserved statuses: confirmed, active
  -- These hold stock; draft, completed, cancelled, overdue release it

  -- Transition from non-reserved → reserved: decrement available stock
  IF v_status_old NOT IN ('confirmed', 'active')
     AND v_status_new IN ('confirmed', 'active') THEN
    UPDATE equipment e
    SET stock_available = e.stock_available - bi.quantity
    FROM booking_items bi
    WHERE bi.booking_id = NEW.id
      AND bi.equipment_id = e.id;

  -- Transition from reserved → non-reserved: restore available stock
  ELSIF v_status_old IN ('confirmed', 'active')
        AND v_status_new NOT IN ('confirmed', 'active') THEN
    UPDATE equipment e
    SET stock_available = LEAST(e.stock_total, e.stock_available + bi.quantity)
    FROM booking_items bi
    WHERE bi.booking_id = NEW.id
      AND bi.equipment_id = e.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_booking_stock_sync
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION sync_equipment_stock();

-- ============================================================
-- update_customer_stats() — update aggregate stats on booking completion
-- ============================================================

CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Recalculate from scratch to stay accurate
  UPDATE customers c
  SET
    total_bookings = (
      SELECT COUNT(*) FROM bookings b
      WHERE b.customer_id = c.id AND b.status = 'completed'
    ),
    total_spent = (
      SELECT COALESCE(SUM(b.amount_paid), 0) FROM bookings b
      WHERE b.customer_id = c.id AND b.status = 'completed'
    )
  WHERE c.id = NEW.customer_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_customer_stats
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_customer_stats();

-- ============================================================
-- Auto-set equipment status based on stock_available
-- ============================================================

CREATE OR REPLACE FUNCTION sync_equipment_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only update status if it's in a stock-managed state
  IF NEW.status IN ('available', 'rented') THEN
    IF NEW.stock_available = 0 THEN
      NEW.status := 'rented';
    ELSE
      NEW.status := 'available';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_equipment_status_sync
  BEFORE UPDATE OF stock_available ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION sync_equipment_status();
