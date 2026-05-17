-- Pricing unit enum
CREATE TYPE pricing_unit AS ENUM ('hour', 'day', 'week', 'month');

-- Pricing tiers per equipment
CREATE TABLE pricing_tiers (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  equipment_id    uuid NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  name            text NOT NULL,
  unit            pricing_unit NOT NULL,
  price           numeric(12,2) NOT NULL CHECK (price >= 0),
  min_units       integer NOT NULL DEFAULT 1 CHECK (min_units >= 1),
  is_default      boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pricing_equipment ON pricing_tiers(equipment_id);
CREATE INDEX idx_pricing_default ON pricing_tiers(equipment_id, is_default) WHERE is_default = true;
