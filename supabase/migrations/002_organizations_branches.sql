-- Organizations table
CREATE TABLE organizations (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            text NOT NULL,
  slug            text UNIQUE NOT NULL,
  logo_url        text,
  address         text,
  phone           text,
  email           text,
  settings        jsonb NOT NULL DEFAULT '{
    "currency": "PHP",
    "timezone": "Asia/Manila",
    "dp_percentage": 50,
    "late_fee_type": "percentage",
    "late_fee_value": 10,
    "grace_period_hours": 2,
    "sms_enabled": true,
    "email_enabled": true,
    "public_booking_enabled": false
  }'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Branches table
CREATE TABLE branches (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  address         text,
  phone           text,
  is_default      boolean NOT NULL DEFAULT false,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_branches_org ON branches(organization_id);
CREATE INDEX idx_branches_active ON branches(is_active) WHERE is_active = true;
