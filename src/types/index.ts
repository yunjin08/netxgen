// ─── Roles ────────────────────────────────────────────────────────────────────

export type UserRole = 'owner' | 'branch_manager' | 'staff' | 'logistics'

// ─── Organization ──────────────────────────────────────────────────────────────

export interface OrgSettings {
  currency: string
  timezone: string
  late_fee_type: 'percentage' | 'flat'
  late_fee_value: number
  late_fee_period: 'hour' | 'day'
  grace_period_hours: number
  dp_percentage: number
  sms_enabled: boolean
  email_enabled: boolean
  public_booking_enabled: boolean
  sms_templates?: SmsTemplates
}

export interface SmsTemplates {
  booking_confirmed?: string
  payment_received?: string
  reminder_start?: string
  reminder_return?: string
  overdue?: string
  return_processed?: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  address: string | null
  phone: string | null
  email: string | null
  settings: OrgSettings
  created_at: string
  updated_at: string
}

// ─── Branch ────────────────────────────────────────────────────────────────────

export interface Branch {
  id: string
  organization_id: string
  name: string
  address: string | null
  phone: string | null
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── Profile ───────────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  organization_id: string | null
  branch_id: string | null
  full_name: string
  avatar_url: string | null
  phone: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── Equipment ─────────────────────────────────────────────────────────────────

export type EquipmentStatus = 'available' | 'rented' | 'maintenance' | 'retired' | 'lost'

export interface Equipment {
  id: string
  organization_id: string
  branch_id: string
  name: string
  description: string | null
  category: string | null
  sku: string | null
  serial_number: string | null
  status: EquipmentStatus
  stock_total: number
  stock_available: number
  image_urls: string[]
  replacement_cost: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type PricingUnit = 'hour' | 'day' | 'week' | 'month'

export interface PricingTier {
  id: string
  organization_id: string
  equipment_id: string
  name: string
  unit: PricingUnit
  price: number
  min_units: number
  is_default: boolean
  created_at: string
}

export interface EquipmentWithPricing extends Equipment {
  pricing_tiers: PricingTier[]
}

// ─── Customer ──────────────────────────────────────────────────────────────────

export interface Customer {
  id: string
  organization_id: string
  full_name: string
  email: string | null
  phone: string
  address: string | null
  id_type: string | null
  id_number: string | null
  id_image_url: string | null
  notes: string | null
  is_blacklisted: boolean
  total_bookings: number
  total_spent: number
  created_at: string
  updated_at: string
}

// ─── Booking ───────────────────────────────────────────────────────────────────

export type BookingStatus =
  | 'draft'
  | 'confirmed'
  | 'active'
  | 'overdue'
  | 'completed'
  | 'cancelled'

export type DeliveryType = 'pickup' | 'delivery'

export interface Booking {
  id: string
  booking_number: string
  organization_id: string
  branch_id: string
  customer_id: string
  created_by: string | null
  status: BookingStatus
  delivery_type: DeliveryType
  delivery_address: string | null
  start_date: string
  end_date: string
  actual_return: string | null
  subtotal: number
  dp_amount: number
  late_fee: number
  total_amount: number
  amount_paid: number
  notes: string | null
  public_token: string | null
  source: 'admin' | 'public' | 'walk_in'
  created_at: string
  updated_at: string
}

export interface BookingItem {
  id: string
  booking_id: string
  equipment_id: string
  pricing_tier_id: string | null
  quantity: number
  unit_price: number
  duration_units: number
  subtotal: number
  returned_qty: number
  condition_notes: string | null
  created_at: string
}

export interface BookingWithDetails extends Booking {
  customer: Customer
  booking_items: (BookingItem & { equipment: Equipment })[]
  payments: Payment[]
}

// ─── Payment ───────────────────────────────────────────────────────────────────

export type PaymentMethod =
  | 'cash'
  | 'gcash'
  | 'bank_transfer'
  | 'paymongo'
  | 'other'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export type PaymentType =
  | 'deposit'
  | 'full'
  | 'partial'
  | 'late_fee'
  | 'refund'

export interface Payment {
  id: string
  booking_id: string
  organization_id: string
  received_by: string | null
  method: PaymentMethod
  type: PaymentType
  status: PaymentStatus
  amount: number
  reference_number: string | null
  paymongo_payment_id: string | null
  paymongo_link_id: string | null
  checkout_url: string | null
  notes: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

// ─── Extension ─────────────────────────────────────────────────────────────────

export interface Extension {
  id: string
  booking_id: string
  requested_by: string | null
  original_end: string
  new_end_date: string
  additional_cost: number
  is_paid: boolean
  reason: string | null
  created_at: string
}

// ─── Return Record ─────────────────────────────────────────────────────────────

export type ReturnCondition = 'good' | 'damaged' | 'missing'

export interface ReturnRecord {
  id: string
  booking_id: string
  processed_by: string | null
  returned_at: string
  overall_condition: ReturnCondition
  damage_notes: string | null
  damage_photos: string[]
  late_fee_applied: number
  deposit_withheld: number
  deposit_refunded: number
  notes: string | null
  created_at: string
}

// ─── Notification ──────────────────────────────────────────────────────────────

export type NotificationChannel = 'sms' | 'email' | 'push'
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'skipped'

export interface Notification {
  id: string
  organization_id: string
  booking_id: string | null
  customer_id: string | null
  channel: NotificationChannel
  status: NotificationStatus
  recipient: string
  subject: string | null
  body: string
  template_key: string | null
  provider_id: string | null
  error_message: string | null
  sent_at: string | null
  created_at: string
}

// ─── Report Types ──────────────────────────────────────────────────────────────

export interface BranchReport {
  branch_id: string
  branch_name: string
  total_bookings: number
  active_bookings: number
  completed_bookings: number
  cancelled_bookings: number
  overdue_bookings: number
  total_revenue: number
  avg_booking_value: number
  utilization_rate: number
  completion_rate: number
  cancellation_rate: number
  top_equipment: TopEquipmentItem[]
}

export interface TopEquipmentItem {
  equipment_id: string
  equipment_name: string
  total_bookings: number
  total_revenue: number
  utilization_rate: number
}

export interface RevenueDataPoint {
  date: string
  revenue: number
  bookings: number
}

// ─── Form Types ────────────────────────────────────────────────────────────────

export interface BookingFormData {
  customer_id: string
  items: BookingItemFormData[]
  start_date: Date
  end_date: Date
  delivery_type: DeliveryType
  delivery_address?: string
  deposit_amount: number
  notes?: string
}

export interface BookingItemFormData {
  equipment_id: string
  pricing_tier_id: string
  quantity: number
  unit_price: number
  duration_units: number
}

export interface PaymentFormData {
  booking_id: string
  method: PaymentMethod
  type: PaymentType
  amount: number
  reference_number?: string
  notes?: string
}

// ─── API Response ──────────────────────────────────────────────────────────────

export interface ApiError {
  message: string
  code?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
}
