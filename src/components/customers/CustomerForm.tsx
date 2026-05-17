import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import type { Customer } from '@/types'

const customerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(11, 'Enter valid Philippine mobile number').max(13),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  id_type: z.string().optional(),
  id_number: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof customerSchema>

interface CustomerFormProps {
  defaultValues?: Partial<Customer>
  onSubmit: (data: FormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function CustomerForm({ defaultValues, onSubmit, onCancel, isLoading }: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      full_name: defaultValues?.full_name ?? '',
      phone: defaultValues?.phone ?? '',
      email: defaultValues?.email ?? '',
      address: defaultValues?.address ?? '',
      id_type: defaultValues?.id_type ?? '',
      id_number: defaultValues?.id_number ?? '',
      notes: defaultValues?.notes ?? '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        label="Full Name"
        placeholder="Juan dela Cruz"
        error={errors.full_name?.message}
        required
        {...register('full_name')}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Phone Number"
          placeholder="09XXXXXXXXX"
          error={errors.phone?.message}
          required
          {...register('phone')}
        />
        <Input
          label="Email"
          type="email"
          placeholder="juan@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
      </div>
      <Input
        label="Address"
        placeholder="123 Rizal St, Manila"
        {...register('address')}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="ID Type"
          placeholder="Driver's License"
          {...register('id_type')}
        />
        <Input
          label="ID Number"
          placeholder="ID number"
          {...register('id_number')}
        />
      </div>
      <Textarea
        label="Notes"
        placeholder="Any special notes about this customer..."
        {...register('notes')}
      />
      <div className="flex gap-3 justify-end pt-2 border-t border-grey-60">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" isLoading={isLoading}>
          {defaultValues?.full_name ? 'Save Changes' : 'Add Customer'}
        </Button>
      </div>
    </form>
  )
}
