import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, MapPin, Settings2, Zap, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { toast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'

// Step 1: Organization info
const orgSchema = z.object({
  name: z.string().min(2, 'Shop name must be at least 2 characters'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
})

// Step 2: First branch
const branchSchema = z.object({
  branch_name: z.string().min(2, 'Branch name required'),
  branch_address: z.string().optional(),
  branch_phone: z.string().optional(),
})

// Step 3: Settings
const settingsSchema = z.object({
  dp_percentage: z.coerce.number().min(0).max(100),
  late_fee_type: z.enum(['percentage', 'flat']),
  late_fee_value: z.coerce.number().min(0),
  grace_period_hours: z.coerce.number().min(0),
})

type OrgData = z.infer<typeof orgSchema>
type BranchData = z.infer<typeof branchSchema>
type SettingsData = z.infer<typeof settingsSchema>

const steps = [
  { id: 1, title: 'Your Shop', description: 'Basic info', icon: Building2 },
  { id: 2, title: 'First Branch', description: 'Location', icon: MapPin },
  { id: 3, title: 'Settings', description: 'Fees & policies', icon: Settings2 },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const refreshProfile = useAuthStore(s => s.refreshProfile)
  const [step, setStep] = useState(1)
  const [orgData, setOrgData] = useState<OrgData | null>(null)
  const [branchData, setBranchData] = useState<BranchData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const orgForm = useForm<OrgData>({ resolver: zodResolver(orgSchema) })
  const branchForm = useForm<BranchData>({ resolver: zodResolver(branchSchema) })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settingsForm = useForm<SettingsData>({
    resolver: zodResolver(settingsSchema) as any,
    defaultValues: { dp_percentage: 50, late_fee_type: 'percentage', late_fee_value: 10, grace_period_hours: 2 },
  })

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    orgForm.setValue('name', e.target.value)
    const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    orgForm.setValue('slug', slug)
  }

  const handleStep1 = orgForm.handleSubmit(data => {
    setOrgData(data)
    setStep(2)
  })

  const handleStep2 = branchForm.handleSubmit(data => {
    setBranchData(data)
    setStep(3)
  })

  const handleStep3 = settingsForm.handleSubmit(async (data) => {
    if (!orgData || !branchData) return
    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgData.name,
          slug: orgData.slug,
          phone: orgData.phone || null,
          email: orgData.email || null,
          address: orgData.address || null,
          settings: {
            currency: 'PHP',
            timezone: 'Asia/Manila',
            dp_percentage: data.dp_percentage,
            late_fee_type: data.late_fee_type,
            late_fee_value: data.late_fee_value,
            grace_period_hours: data.grace_period_hours,
            sms_enabled: true,
            email_enabled: true,
            public_booking_enabled: false,
          },
        })
        .select()
        .single()

      if (orgError) throw orgError

      // Create first branch
      const { data: branch, error: branchError } = await supabase
        .from('branches')
        .insert({
          organization_id: org.id,
          name: branchData.branch_name,
          address: branchData.branch_address || null,
          phone: branchData.branch_phone || null,
          is_default: true,
          is_active: true,
        })
        .select()
        .single()

      if (branchError) throw branchError

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          organization_id: org.id,
          branch_id: branch.id,
          role: 'owner',
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      await refreshProfile()
      toast.success('Setup complete!', 'Welcome to RentFlow.')
      navigate('/')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Setup failed'
      toast.error('Setup failed', msg)
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <div className="min-h-screen bg-grey-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex items-center justify-center w-10 h-10 bg-gold rounded-xl">
            <Zap className="h-6 w-6 text-grey-100" />
          </div>
          <span className="font-display text-2xl text-white">RentFlow</span>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0 transition-all',
                step > s.id
                  ? 'bg-green-500 border-green-500'
                  : step === s.id
                    ? 'border-gold bg-gold/10'
                    : 'border-grey-60 bg-transparent'
              )}>
                {step > s.id
                  ? <CheckCircle2 className="h-4 w-4 text-white" />
                  : <s.icon className={cn('h-4 w-4', step === s.id ? 'text-gold' : 'text-grey-40')} />
                }
              </div>
              {i < steps.length - 1 && (
                <div className={cn('h-px flex-1', step > s.id ? 'bg-green-500' : 'bg-grey-60')} />
              )}
            </div>
          ))}
        </div>

        <div className="card">
          <div className="mb-5">
            <h2 className="font-display text-lg text-white">{steps[step - 1].title}</h2>
            <p className="text-sm text-grey-40">Step {step} of 3</p>
          </div>

          {/* Step 1: Organization */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="flex flex-col gap-4">
              <Input
                label="Shop / Business Name"
                placeholder="Dela Cruz Equipment Rental"
                error={orgForm.formState.errors.name?.message}
                {...orgForm.register('name', { onChange: handleNameChange })}
                required
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-grey-20 font-body">
                  URL Slug <span className="text-red-400 ml-0.5">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-grey-60 bg-grey-60/60 text-grey-40 text-xs whitespace-nowrap select-none">
                    rentflow.ph/
                  </span>
                  <input
                    className="input-base rounded-l-none flex-1 min-w-0"
                    placeholder="dela-cruz-rentals"
                    {...orgForm.register('slug')}
                  />
                </div>
                {orgForm.formState.errors.slug?.message && (
                  <p className="text-xs text-red-400">{orgForm.formState.errors.slug.message}</p>
                )}
                <p className="text-xs text-grey-40">Used in your public booking link</p>
              </div>
              <Input
                label="Phone Number"
                placeholder="09XXXXXXXXX"
                {...orgForm.register('phone')}
              />
              <Input
                label="Business Email"
                type="email"
                placeholder="info@yourbusiness.com"
                {...orgForm.register('email')}
              />
              <div className="flex justify-end mt-2">
                <Button type="submit">Continue</Button>
              </div>
            </form>
          )}

          {/* Step 2: Branch */}
          {step === 2 && (
            <form onSubmit={handleStep2} className="flex flex-col gap-4">
              <Input
                label="Branch Name"
                placeholder="Main Branch"
                error={branchForm.formState.errors.branch_name?.message}
                {...branchForm.register('branch_name')}
                required
              />
              <Input
                label="Address"
                placeholder="123 Rizal Ave, Manila"
                {...branchForm.register('branch_address')}
              />
              <Input
                label="Branch Phone"
                placeholder="09XXXXXXXXX"
                {...branchForm.register('branch_phone')}
              />
              <div className="flex gap-3 justify-end mt-2">
                <Button variant="secondary" type="button" onClick={() => setStep(1)}>Back</Button>
                <Button type="submit">Continue</Button>
              </div>
            </form>
          )}

          {/* Step 3: Settings */}
          {step === 3 && (
            <form onSubmit={handleStep3} className="flex flex-col gap-4">
              <Input
                label="Down Payment Percentage"
                type="number"
                min="0"
                max="100"
                hint="Default deposit % of total rental fee"
                error={settingsForm.formState.errors.dp_percentage?.message}
                rightElement={<span className="text-sm">%</span>}
                {...settingsForm.register('dp_percentage')}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-grey-20">Late Fee Type</label>
                <Select
                  value={settingsForm.watch('late_fee_type')}
                  onValueChange={v => settingsForm.setValue('late_fee_type', v as 'percentage' | 'flat')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage of rental (per day)</SelectItem>
                    <SelectItem value="flat">Flat rate per day (₱)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                label="Late Fee Value"
                type="number"
                min="0"
                hint={settingsForm.watch('late_fee_type') === 'percentage'
                  ? 'e.g. 10 = 10% of rental per day late'
                  : 'e.g. 500 = ₱500 per day late'
                }
                {...settingsForm.register('late_fee_value')}
              />
              <Input
                label="Grace Period (hours)"
                type="number"
                min="0"
                hint="Hours allowed past return time before late fee applies"
                {...settingsForm.register('grace_period_hours')}
              />
              <div className="flex gap-3 justify-end mt-2">
                <Button variant="secondary" type="button" onClick={() => setStep(2)}>Back</Button>
                <Button type="submit" isLoading={isSubmitting}>Finish Setup</Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
