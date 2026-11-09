import { describe, expect, it } from 'vitest'
import { hasRole, isSuperAdmin, ROLES } from './roles'

describe('roles', () => {
  it('has the ten roles from the spec', () => {
    expect(ROLES).toHaveLength(10)
  })
  it('matches any of the given roles', () => {
    expect(hasRole({ roles: ['teacher'] }, 'teacher', 'school_admin')).toBe(true)
    expect(hasRole({ roles: ['student'] }, 'teacher')).toBe(false)
  })
  it('is false for missing users or empty roles', () => {
    expect(hasRole(null, 'student')).toBe(false)
    expect(hasRole({ roles: [] }, 'student')).toBe(false)
    expect(isSuperAdmin(undefined)).toBe(false)
  })
})
