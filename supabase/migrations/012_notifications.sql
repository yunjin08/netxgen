-- Notification channel enum
CREATE TYPE notification_channel AS ENUM ('sms', 'email', 'push');

-- Notification status enum
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'delivered');

-- Notification event enum
CREATE TYPE notification_event AS ENUM (
  'booking_confirmed',
  'booking_cancelled',
  'payment_received',
  'reminder_24h',
  'reminder_return',
  'overdue_alert',
  'return_processed',
  'extension_approved',
  'extension_rejected'
);

-- Notifications table
CREATE TABLE notifications (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  booking_id      uuid REFERENCES bookings(id) ON DELETE SET NULL,
  customer_id     uuid REFERENCES customers(id) ON DELETE SET NULL,
  channel         notification_channel NOT NULL,
  status          notification_status NOT NULL DEFAULT 'pending',
  event           notification_event NOT NULL,
  recipient       text NOT NULL,
  subject         text,
  body            text NOT NULL,
  error_message   text,
  sent_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_org     ON notifications(organization_id);
CREATE INDEX idx_notifications_booking ON notifications(booking_id);
CREATE INDEX idx_notifications_status  ON notifications(status);
CREATE INDEX idx_notifications_channel ON notifications(channel);
