import type { UserRole } from '@/types'

export interface Permissions {
  canManageOrg: boolean
  canManageUsers: boolean
  canManageAllBranches: boolean
  canViewAllBranches: boolean
  canCreateBookings: boolean
  canProcessPayments: boolean
  canViewReports: boolean
  canManageEquipment: boolean
  canUpdateEquipmentStatus: boolean
  canProcessReturns: boolean
  canApproveExtensions: boolean
  canExportData: boolean
}

export function getPermissions(role: UserRole | null | undefined): Permissions {
  const isOwner = role === 'owner'
  const isBranchManager = role === 'branch_manager'
  const isStaff = role === 'staff'
  const isLogistics = role === 'logistics'
  const isOperational = isOwner || isBranchManager || isStaff

  return {
    canManageOrg: isOwner,
    canManageUsers: isOwner,
    canManageAllBranches: isOwner,
    canViewAllBranches: isOwner,
    canCreateBookings: isOperational,
    canProcessPayments: isOperational,
    canViewReports: isOwner || isBranchManager,
    canManageEquipment: isOwner || isBranchManager || isStaff,
    canUpdateEquipmentStatus: isOwner || isBranchManager || isStaff || isLogistics,
    canProcessReturns: isOperational,
    canApproveExtensions: isOwner || isBranchManager,
    canExportData: isOwner || isBranchManager,
  }
}
