import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ORG_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'DISPATCHER'
  | 'OPS_MANAGER'
  | 'DRIVER'
  | 'PARENT'

export interface JwtPayload {
  sub: string         // userId
  org: string | null  // organisationId
  branch: string | null
  role: UserRole
  name: string
  email: string
  iat?: number
  exp?: number
}

// ─── Role Hierarchy ───────────────────────────────────────────────────────────

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 100,
  ORG_ADMIN: 80,
  SCHOOL_ADMIN: 60,
  OPS_MANAGER: 50,
  DISPATCHER: 40,
  DRIVER: 20,
  PARENT: 10,
}

export function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole]
}

// ─── JWT Secret ───────────────────────────────────────────────────────────────

function getJwtSecretKey() {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters')
  }
  return new TextEncoder().encode(secret)
}

// ─── Token Operations ─────────────────────────────────────────────────────────

export async function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getJwtSecretKey())
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey())
    return payload as unknown as JwtPayload
  } catch {
    return null
  }
}

// ─── Session Helpers ──────────────────────────────────────────────────────────

export async function getUserFromSession(): Promise<JwtPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null
  return verifyToken(token)
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('token')
}

export function setSessionCookie(token: string, response: { cookies: { set: Function } }) {
  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  })
}

// ─── RBAC Guards (use in API routes) ─────────────────────────────────────────

/**
 * Returns the current user payload from headers injected by middleware.
 * Usage in API routes: const user = getUserFromHeaders(request)
 */
export function getUserFromHeaders(request: Request): JwtPayload | null {
  const headers = request instanceof Request ? request.headers : new Headers()
  const userId = headers.get('x-user-id')
  const userRole = headers.get('x-user-role') as UserRole | null
  const orgId = headers.get('x-org-id')
  const branchId = headers.get('x-branch-id')
  const name = headers.get('x-user-name') ?? ''
  const email = headers.get('x-user-email') ?? ''

  if (!userId || !userRole) return null

  return {
    sub: userId,
    org: orgId ?? null,
    branch: branchId ?? null,
    role: userRole,
    name,
    email,
  }
}

/**
 * Asserts the user has at least the minimum required role.
 * Returns an error Response if unauthorized, or null if OK.
 */
export function assertRole(
  user: JwtPayload | null,
  minRole: UserRole
): Response | null {
  if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (!hasMinRole(user.role, minRole)) {
    return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return null
}

/**
 * Asserts the user belongs to the given organisation.
 * Super admins bypass this check.
 */
export function assertOrg(
  user: JwtPayload | null,
  organisationId: string
): Response | null {
  if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (user.role === 'SUPER_ADMIN') return null // bypass
  if (user.org !== organisationId) {
    return new Response(JSON.stringify({ error: 'Access denied to this organisation' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return null
}
