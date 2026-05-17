-- Booking items (line items per booking)
CREATE TABLE booking_items (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id      uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  equipment_id    uuid NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
  pricing_tier_id uuid REFERENCES pricing_tiers(id) ON DELETE SET NULL,
  quantity        integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  unit            pricing_unit NOT NULL,
  unit_price      numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  units_count     integer NOT NULL DEFAULT 1 CHECK (units_count >= 1),
  subtotal        numeric(12,2) NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_items_booking   ON booking_items(booking_id);
CREATE INDEX idx_booking_items_equipment ON booking_items(equipment_id);
