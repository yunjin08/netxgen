-- Equipment status enum
CREATE TYPE equipment_status AS ENUM (
  'available', 'rented', 'maintenance', 'retired', 'lost'
);

-- Equipment table
CREATE TABLE equipment (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id       uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  category        text,
  sku             text,
  serial_number   text,
  status          equipment_status NOT NULL DEFAULT 'available',
  stock_total     integer NOT NULL DEFAULT 1 CHECK (stock_total >= 0),
  stock_available integer NOT NULL DEFAULT 1 CHECK (stock_available >= 0),
  image_urls      text[] NOT NULL DEFAULT '{}',
  replacement_cost numeric(12,2),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_equipment_org    ON equipment(organization_id);
CREATE INDEX idx_equipment_branch ON equipment(branch_id);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_name   ON equipment USING gin(name gin_trgm_ops);
