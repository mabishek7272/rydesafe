import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { clearSession, getUserFromSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/auth/me — returns current session user
export async function GET(_req: NextRequest) {
  const user = await getUserFromSession()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  return NextResponse.json({ user })
}

// POST /api/auth/me — logout (clear cookie)
export async function POST(_req: NextRequest) {
  const cookieStore = await cookies()
  cookieStore.delete('token')
  return NextResponse.json({ success: true })
}
