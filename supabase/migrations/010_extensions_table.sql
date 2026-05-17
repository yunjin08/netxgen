-- Extension status enum
CREATE TYPE extension_status AS ENUM ('pending', 'approved', 'rejected');

-- Booking extensions
CREATE TABLE extensions (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id      uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  original_end    timestamptz NOT NULL,
  new_end         timestamptz NOT NULL,
  additional_cost numeric(12,2) NOT NULL DEFAULT 0,
  reason          text,
  status          extension_status NOT NULL DEFAULT 'pending',
  approved_by     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_extension CHECK (new_end > original_end)
);

CREATE INDEX idx_extensions_booking ON extensions(booking_id);
CREATE INDEX idx_extensions_org     ON extensions(organization_id);
CREATE INDEX idx_extensions_status  ON extensions(status);
