export type AdminAccessRole = 'owner' | 'ops' | 'packer' | 'merchandiser'

export type AdminDashboardSection =
  | 'dashboard'
  | 'products'
  | 'orders'
  | 'homepage'
  | 'categories'
  | 'customers'
  | 'founder'
  | 'coupons'
  | 'newsletter'
  | 'brands'
  | 'reviews'
  | 'roles'

const ADMIN_ACCESS_ALIASES = new Set([
  'admin',
  'owner',
  'ops',
  'operations',
  'packer',
  'merchandiser',
])

function normalizeRoleValues(role: unknown, roles: unknown) {
  const values: string[] = []

  if (typeof role === 'string' && role.trim()) {
    values.push(role.trim().toLowerCase())
  }

  if (Array.isArray(roles)) {
    for (const entry of roles) {
      if (typeof entry === 'string' && entry.trim()) {
        values.push(entry.trim().toLowerCase())
      }
    }
  }

  return values
}

export function hasAnyAdminAccessRole(role: unknown, roles: unknown) {
  return normalizeRoleValues(role, roles).some((value) => ADMIN_ACCESS_ALIASES.has(value))
}

export function resolveAdminAccessRole(role: unknown, roles: unknown): AdminAccessRole {
  const values = normalizeRoleValues(role, roles)

  if (values.includes('packer')) {
    return 'packer'
  }

  if (values.includes('merchandiser')) {
    return 'merchandiser'
  }

  if (values.includes('ops') || values.includes('operations')) {
    return 'ops'
  }

  return 'owner'
}

export const ADMIN_ACCESS_ROLE_OPTIONS: Array<{ value: AdminAccessRole; label: string }> = [
  { value: 'owner', label: 'Owner' },
  { value: 'ops', label: 'Operations' },
  { value: 'merchandiser', label: 'Merchandiser' },
  { value: 'packer', label: 'Packer' },
]

const SECTION_ACCESS: Record<AdminAccessRole, AdminDashboardSection[]> = {
  owner: [
    'dashboard',
    'products',
    'orders',
    'homepage',
    'categories',
    'customers',
    'founder',
    'coupons',
    'newsletter',
    'brands',
    'reviews',
    'roles',
  ],
  ops: ['dashboard', 'orders', 'customers', 'coupons', 'newsletter'],
  packer: ['orders'],
  merchandiser: ['products', 'homepage', 'categories', 'brands', 'reviews'],
}

export function canAccessAdminSection(accessRole: AdminAccessRole, section: AdminDashboardSection) {
  return SECTION_ACCESS[accessRole].includes(section)
}
