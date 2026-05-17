-- Customers table
CREATE TABLE customers (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name       text NOT NULL,
  phone           text,
  email           text,
  address         text,
  id_type         text,
  id_number       text,
  id_photo_url    text,
  signature_url   text,
  is_blacklisted  boolean NOT NULL DEFAULT false,
  blacklist_reason text,
  notes           text,
  total_bookings  integer NOT NULL DEFAULT 0,
  total_spent     numeric(12,2) NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_org    ON customers(organization_id);
CREATE INDEX idx_customers_name   ON customers USING gin(full_name gin_trgm_ops);
CREATE INDEX idx_customers_phone  ON customers(phone);
CREATE INDEX idx_customers_email  ON customers(email);
