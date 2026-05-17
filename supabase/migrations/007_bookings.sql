-- Booking status enum
CREATE TYPE booking_status AS ENUM (
  'draft', 'confirmed', 'active', 'completed', 'overdue', 'cancelled'
);

-- Booking source enum
CREATE TYPE booking_source AS ENUM ('admin', 'public', 'walk_in');

-- Delivery type enum
CREATE TYPE delivery_type AS ENUM ('pickup', 'delivery');

-- Bookings table
CREATE TABLE bookings (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id       uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  customer_id     uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  booking_number  text UNIQUE,
  status          booking_status NOT NULL DEFAULT 'draft',
  source          booking_source NOT NULL DEFAULT 'admin',
  delivery_type   delivery_type NOT NULL DEFAULT 'pickup',
  delivery_address text,
  start_date      timestamptz NOT NULL,
  end_date        timestamptz NOT NULL,
  actual_return   timestamptz,
  subtotal        numeric(12,2) NOT NULL DEFAULT 0,
  dp_amount       numeric(12,2) NOT NULL DEFAULT 0,
  amount_paid     numeric(12,2) NOT NULL DEFAULT 0,
  late_fee        numeric(12,2) NOT NULL DEFAULT 0,
  total_amount    numeric(12,2) NOT NULL DEFAULT 0,
  notes           text,
  public_token    text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  confirmed_at    timestamptz,
  cancelled_at    timestamptz,
  cancel_reason   text,
  created_by      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

CREATE INDEX idx_bookings_org      ON bookings(organization_id);
CREATE INDEX idx_bookings_branch   ON bookings(branch_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_status   ON bookings(status);
CREATE INDEX idx_bookings_dates    ON bookings(start_date, end_date);
CREATE INDEX idx_bookings_token    ON bookings(public_token);
CREATE INDEX idx_bookings_number   ON bookings(booking_number);
