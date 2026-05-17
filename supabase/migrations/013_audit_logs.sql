-- Audit logs for tracking changes to critical records
CREATE TABLE audit_logs (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role      text,
  action          text NOT NULL,
  table_name      text NOT NULL,
  record_id       uuid,
  old_data        jsonb,
  new_data        jsonb,
  ip_address      inet,
  user_agent      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_org       ON audit_logs(organization_id);
CREATE INDEX idx_audit_actor     ON audit_logs(actor_id);
CREATE INDEX idx_audit_table     ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_created   ON audit_logs(created_at DESC);
