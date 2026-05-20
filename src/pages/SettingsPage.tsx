import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/ui/PageHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { toast } from '@/hooks/useToast'
import { useQueryClient } from '@tanstack/react-query'

const orgSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
})

const settingsSchema = z.object({
  dp_percentage: z.coerce.number().min(0).max(100),
  late_fee_type: z.enum(['percentage', 'flat']),
  late_fee_value: z.coerce.number().min(0),
  late_fee_period: z.enum(['hour', 'day']),
  grace_period_hours: z.coerce.number().min(0),
  sms_enabled: z.boolean(),
  email_enabled: z.boolean(),
})

export default function SettingsPage() {
  const { organization, profile, branches, refreshProfile } = useAuth()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('general')

  const orgForm = useForm({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: organization?.name ?? '',
      phone: organization?.phone ?? '',
      email: organization?.email ?? '',
      address: organization?.address ?? '',
    },
  })

  const settingsForm = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      dp_percentage: organization?.settings?.dp_percentage ?? 50,
      late_fee_type: organization?.settings?.late_fee_type ?? 'percentage',
      late_fee_value: organization?.settings?.late_fee_value ?? 10,
      late_fee_period: organization?.settings?.late_fee_period ?? 'day',
      grace_period_hours: organization?.settings?.grace_period_hours ?? 2,
      sms_enabled: organization?.settings?.sms_enabled ?? true,
      email_enabled: organization?.settings?.email_enabled ?? true,
    },
  })

  const handleOrgSave = orgForm.handleSubmit(async data => {
    if (!organization) return
    const { error } = await supabase
      .from('organizations')
      .update(data)
      .eq('id', organization.id)
    if (error) { toast.error('Failed to save', error.message); return }
    await refreshProfile()
    toast.success('Organization updated')
  })

  const handleSettingsSave = settingsForm.handleSubmit(async data => {
    if (!organization) return
    const { error } = await supabase
      .from('organizations')
      .update({ settings: { ...organization.settings, ...data } })
      .eq('id', organization.id)
    if (error) { toast.error('Failed to save', error.message); return }
    await refreshProfile()
    toast.success('Settings updated')
  })

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your organization and preferences"
        breadcrumb={[{ label: 'Settings' }]}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="fees">Fees & Policies</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Organization Info</CardTitle>
            </CardHeader>
            <form onSubmit={handleOrgSave} className="flex flex-col gap-4">
              <Input
                label="Business Name"
                {...orgForm.register('name')}
                error={orgForm.formState.errors.name?.message}
              />
              <Input
                label="Phone"
                {...orgForm.register('phone')}
              />
              <Input
                label="Email"
                type="email"
                {...orgForm.register('email')}
              />
              <Input
                label="Address"
                {...orgForm.register('address')}
              />
              <div className="pt-2">
                <Button type="submit" isLoading={orgForm.formState.isSubmitting}>
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="fees">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Fees & Policies</CardTitle>
            </CardHeader>
            <form onSubmit={handleSettingsSave} className="flex flex-col gap-4">
              <Input
                label="Down Payment Percentage"
                type="number"
                min="0"
                max="100"
                rightElement={<span className="text-sm text-grey-40">%</span>}
                {...settingsForm.register('dp_percentage')}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-grey-20">Late Fee Type</label>
                  <Select
                    value={settingsForm.watch('late_fee_type')}
                    onValueChange={v => settingsForm.setValue('late_fee_type', v as 'percentage' | 'flat')}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">% of rental</SelectItem>
                      <SelectItem value="flat">Flat rate (₱)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-grey-20">Charged Per</label>
                  <Select
                    value={settingsForm.watch('late_fee_period')}
                    onValueChange={v => settingsForm.setValue('late_fee_period', v as 'hour' | 'day')}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hour">Per Hour</SelectItem>
                      <SelectItem value="day">Per Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Input
                label={`Late Fee Value (${settingsForm.watch('late_fee_type') === 'percentage' ? '%' : '₱'} per ${settingsForm.watch('late_fee_period')})`}
                type="number"
                min="0"
                {...settingsForm.register('late_fee_value')}
              />
              <Input
                label="Grace Period (hours)"
                type="number"
                min="0"
                {...settingsForm.register('grace_period_hours')}
              />
              <div className="pt-2">
                <Button type="submit" isLoading={settingsForm.formState.isSubmitting}>
                  Save Settings
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="branches">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Branches ({branches.length})</CardTitle>
              <Button size="sm">Add Branch</Button>
            </CardHeader>
            <div className="flex flex-col gap-2">
              {branches.map(branch => (
                <div key={branch.id} className="flex items-center justify-between bg-grey-100 rounded-lg px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {branch.name}
                      {branch.is_default && (
                        <span className="ml-2 text-xs bg-gold/20 text-gold px-1.5 py-0.5 rounded-full">Default</span>
                      )}
                    </p>
                    {branch.address && <p className="text-xs text-grey-40">{branch.address}</p>}
                  </div>
                  <span className={`text-xs font-medium ${branch.is_active ? 'text-green-400' : 'text-grey-40'}`}>
                    {branch.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">SMS Notifications</p>
                  <p className="text-xs text-grey-40">Send SMS via Semaphore to customers</p>
                </div>
                <input
                  type="checkbox"
                  {...settingsForm.register('sms_enabled')}
                  className="h-4 w-4 accent-gold"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">Email Notifications</p>
                  <p className="text-xs text-grey-40">Send emails via Resend to customers</p>
                </div>
                <input
                  type="checkbox"
                  {...settingsForm.register('email_enabled')}
                  className="h-4 w-4 accent-gold"
                />
              </div>
              <Button onClick={handleSettingsSave} isLoading={settingsForm.formState.isSubmitting}>
                Save
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
