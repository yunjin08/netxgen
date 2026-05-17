-- Return condition enum
CREATE TYPE return_condition AS ENUM ('good', 'damaged', 'lost', 'incomplete');

-- Return records
CREATE TABLE return_records (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id      uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  returned_at     timestamptz NOT NULL DEFAULT now(),
  condition       return_condition NOT NULL DEFAULT 'good',
  damage_notes    text,
  damage_cost     numeric(12,2) NOT NULL DEFAULT 0,
  damage_photos   text[] NOT NULL DEFAULT '{}',
  late_fee        numeric(12,2) NOT NULL DEFAULT 0,
  processed_by    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  customer_signature_url text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_returns_booking ON return_records(booking_id);
CREATE INDEX idx_returns_org     ON return_records(organization_id);
