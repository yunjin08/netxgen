-- Payment method enum
CREATE TYPE payment_method AS ENUM ('cash', 'gcash', 'bank_transfer', 'paymongo', 'other');

-- Payment status enum
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- Payment type enum
CREATE TYPE payment_type AS ENUM ('deposit', 'partial', 'full', 'late_fee', 'refund');

-- Payments table
CREATE TABLE payments (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  booking_id        uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  method            payment_method NOT NULL DEFAULT 'cash',
  status            payment_status NOT NULL DEFAULT 'pending',
  type              payment_type NOT NULL DEFAULT 'partial',
  amount            numeric(12,2) NOT NULL CHECK (amount > 0),
  reference_number  text,
  paymongo_link_id  text,
  paymongo_payment_id text,
  checkout_url      text,
  notes             text,
  received_by       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  paid_at           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_org     ON payments(organization_id);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status  ON payments(status);
CREATE INDEX idx_payments_method  ON payments(method);
CREATE INDEX idx_payments_paymongo ON payments(paymongo_link_id) WHERE paymongo_link_id IS NOT NULL;
