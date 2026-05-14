import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// ─── Rate Limiter (Redis-backed in production, in-memory for dev) ─────────────

const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 120

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = rateLimitStore.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 }
  }

  record.count++
  if (record.count > RATE_LIMIT_MAX) return { allowed: false, remaining: 0 }
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count }
}

setInterval(() => {
  const now = Date.now()
  for (const [key, val] of rateLimitStore) {
    if (now > val.resetTime) rateLimitStore.delete(key)
  }
}, 60_000)

// ─── JWT Secret ───────────────────────────────────────────────────────────────

function getJwtSecretKey() {
  const secret = process.env.JWT_SECRET || 'super-secret-key-change-in-production-32chars'
  return new TextEncoder().encode(secret)
}

// ─── Public Paths ─────────────────────────────────────────────────────────────

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/invitation/accept',
  '/api/health',
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p))
}

function isNonApiPath(pathname: string): boolean {
  return (
    !pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  )
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip non-API routes
  if (isNonApiPath(pathname)) return NextResponse.next()

  // Rate limiting
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'

  const { allowed, remaining } = checkRateLimit(ip)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  // Public path bypass
  if (isPublicPath(pathname)) {
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    return response
  }

  // JWT Authentication
  const token = request.cookies.get('token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey())

    // Inject tenant-aware user context into request headers
    const response = NextResponse.next()
    response.headers.set('x-user-id', (payload.sub as string) ?? '')
    response.headers.set('x-user-role', (payload.role as string) ?? '')
    response.headers.set('x-org-id', (payload.org as string) ?? '')
    response.headers.set('x-branch-id', (payload.branch as string) ?? '')
    response.headers.set('x-user-name', (payload.name as string) ?? '')
    response.headers.set('x-user-email', (payload.email as string) ?? '')
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    return response
  } catch {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
  }
}

export const config = {
  matcher: ['/api/:path*'],
}
