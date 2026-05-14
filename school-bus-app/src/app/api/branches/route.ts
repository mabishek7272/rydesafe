import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromHeaders, assertRole } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = getUserFromHeaders(req)
  const roleError = assertRole(user, 'ORG_ADMIN')
  if (roleError) return roleError

  // Enforce tenant isolation
  const organisationId = user!.org
  if (!organisationId) {
    return NextResponse.json({ error: 'User not associated with an organisation' }, { status: 403 })
  }

  try {
    const branches = await prisma.branch.findMany({
      where: { organisationId },
      include: {
        _count: {
          select: {
            users: true,
            students: true,
            trips: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(branches)
  } catch (error) {
    console.error('Failed to fetch branches:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = getUserFromHeaders(req)
  const roleError = assertRole(user, 'ORG_ADMIN')
  if (roleError) return roleError

  const organisationId = user!.org
  if (!organisationId) {
    return NextResponse.json({ error: 'User not associated with an organisation' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { name, code, address, contactEmail, contactPhone, type } = body

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and Code are required' }, { status: 400 })
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        code,
        address,
        contactEmail,
        contactPhone,
        type: type || 'SCHOOL',
        organisationId
      }
    })

    return NextResponse.json(branch)
  } catch (error) {
    console.error('Failed to create branch:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
