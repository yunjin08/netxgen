import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users } from 'lucide-react'
import { useCustomers, useCreateCustomer } from '@/hooks/useCustomers'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/Dialog'
import { CustomerForm } from '@/components/customers/CustomerForm'
import { formatPeso } from '@/utils/currency'
import { formatPHDate } from '@/utils/dates'

export default function CustomersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const { data: customers = [], isLoading } = useCustomers(search)
  const createCustomer = useCreateCustomer()

  const handleCreate = async (data: any) => {
    await createCustomer.mutateAsync(data)
    setShowCreate(false)
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage your customer database"
        breadcrumb={[{ label: 'Customers' }]}
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        }
      />

      <div className="mb-5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, phone, or email..."
          className="max-w-md"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-lg" />
          ))}
        </div>
      ) : !customers.length ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title={search ? 'No customers found' : 'No customers yet'}
          description={search ? 'Try a different search' : 'Add your first customer to get started'}
          action={!search ? { label: 'Add Customer', onClick: () => setShowCreate(true) } : undefined}
        />
      ) : (
        <div className="bg-grey-80 border border-grey-60 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-grey-60">
                <th className="text-left px-4 py-3 text-xs font-semibold text-grey-40 uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-grey-40 uppercase tracking-wider hidden md:table-cell">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-grey-40 uppercase tracking-wider hidden lg:table-cell">Bookings</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-grey-40 uppercase tracking-wider hidden lg:table-cell">Total Spent</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-grey-40 uppercase tracking-wider hidden md:table-cell">Since</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, i) => (
                <tr
                  key={customer.id}
                  className={`border-b border-grey-60/50 cursor-pointer hover:bg-gold/5 transition-colors ${i % 2 === 0 ? 'bg-grey-80' : 'bg-grey-100/50'}`}
                  onClick={() => navigate(`/customers/${customer.id}`)}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{customer.full_name}</p>
                      <p className="text-xs text-grey-40">{customer.email ?? ''}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm text-grey-20">{customer.phone}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-sm text-grey-20">{customer.total_bookings}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-sm font-medium text-gold">{formatPeso(customer.total_spent)}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm text-grey-40">{formatPHDate(customer.created_at)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <CustomerForm
              onSubmit={handleCreate}
              onCancel={() => setShowCreate(false)}
              isLoading={createCustomer.isPending}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  )
}
