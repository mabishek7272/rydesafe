import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromHeaders, assertRole } from '@/lib/auth'
import { z } from 'zod'

// GET /api/organisations — list all orgs (SUPER_ADMIN only)
export async function GET(request: NextRequest) {
  const user = getUserFromHeaders(request)
  const guard = assertRole(user, 'SUPER_ADMIN')
  if (guard) return guard

  const orgs = await prisma.organisation.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { users: true, passengers: true, branches: true } },
    },
  })

  return NextResponse.json({ organisations: orgs })
}

const createOrgSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['SCHOOL', 'CORPORATE', 'FACTORY', 'CHARTER']).default('SCHOOL'),
  primaryColor: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
})

// POST /api/organisations — create org (SUPER_ADMIN only)
export async function POST(request: NextRequest) {
  const user = getUserFromHeaders(request)
  const guard = assertRole(user, 'SUPER_ADMIN')
  if (guard) return guard

  const body = await request.json()
  const parsed = createOrgSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const org = await prisma.organisation.create({
    data: parsed.data,
  })

  return NextResponse.json({ organisation: org }, { status: 201 })
}
