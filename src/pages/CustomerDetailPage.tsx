import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Phone, Mail, MapPin, BookOpen } from 'lucide-react'
import { useCustomer, useUpdateCustomer } from '@/hooks/useCustomers'
import { useBookings } from '@/hooks/useBookings'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { BookingStatusBadge } from '@/components/ui/StatusBadge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/Dialog'
import { CustomerForm } from '@/components/customers/CustomerForm'
import { formatPeso } from '@/utils/currency'
import { formatPHDate, dateRangeLabel } from '@/utils/dates'

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: customer, isLoading } = useCustomer(id!)
  const updateCustomer = useUpdateCustomer()
  const [showEdit, setShowEdit] = useState(false)

  if (isLoading) {
    return <div className="skeleton h-64 rounded-lg" />
  }

  if (!customer) return null

  const handleEdit = async (data: any) => {
    await updateCustomer.mutateAsync({ id: customer.id, ...data })
    setShowEdit(false)
  }

  return (
    <div>
      <PageHeader
        title={customer.full_name}
        breadcrumb={[{ label: 'Customers', href: '/customers' }, { label: customer.full_name }]}
        actions={
          <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Contact info */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Info</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-grey-40 shrink-0" />
              <span className="text-sm text-white">{customer.phone}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-grey-40 shrink-0" />
                <span className="text-sm text-white">{customer.email}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-grey-40 shrink-0" />
                <span className="text-sm text-grey-20">{customer.address}</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-grey-60 flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-xs text-grey-40">Total Bookings</span>
              <span className="text-sm font-medium text-white">{customer.total_bookings}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-grey-40">Total Spent</span>
              <span className="text-sm font-bold text-gold">{formatPeso(customer.total_spent)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-grey-40">Customer Since</span>
              <span className="text-sm text-grey-20">{formatPHDate(customer.created_at)}</span>
            </div>
          </div>

          {customer.notes && (
            <div className="mt-4 pt-4 border-t border-grey-60">
              <p className="text-xs text-grey-40 mb-1">Notes</p>
              <p className="text-sm text-grey-20">{customer.notes}</p>
            </div>
          )}
        </Card>

        {/* ID Info */}
        {(customer.id_type || customer.id_number || customer.id_image_url) && (
          <Card>
            <CardHeader>
              <CardTitle>Verification</CardTitle>
            </CardHeader>
            <div className="flex flex-col gap-2">
              {customer.id_type && (
                <div>
                  <p className="text-xs text-grey-40">ID Type</p>
                  <p className="text-sm text-white">{customer.id_type}</p>
                </div>
              )}
              {customer.id_number && (
                <div>
                  <p className="text-xs text-grey-40">ID Number</p>
                  <p className="text-sm text-white">{customer.id_number}</p>
                </div>
              )}
              {customer.id_image_url && (
                <img
                  src={customer.id_image_url}
                  alt="Customer ID"
                  className="w-full rounded-lg object-cover mt-2 border border-grey-60"
                />
              )}
            </div>
          </Card>
        )}

        {/* Quick action */}
        <div className="flex flex-col gap-3">
          <Button
            className="w-full"
            onClick={() => navigate('/bookings', { state: { customer_id: customer.id } })}
          >
            <BookOpen className="h-4 w-4" />
            New Booking for This Customer
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <CustomerForm
              defaultValues={customer}
              onSubmit={handleEdit}
              onCancel={() => setShowEdit(false)}
              isLoading={updateCustomer.isPending}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  )
}
