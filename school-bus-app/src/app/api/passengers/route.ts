import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromHeaders, assertRole } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = getUserFromHeaders(req)
  // Allow ORG_ADMIN or higher
  const roleError = assertRole(user, 'ORG_ADMIN')
  if (roleError) return roleError

  const organisationId = user!.org
  if (!organisationId) {
    return NextResponse.json({ error: 'Organisation context missing' }, { status: 403 })
  }

  try {
    const passengers = await prisma.passenger.findMany({
      where: { organisationId },
      include: {
        guardians: true,
        branch: { select: { name: true } },
        _count: {
          select: { tripEvents: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(passengers)
  } catch (error) {
    console.error('Failed to fetch passengers:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = getUserFromHeaders(req)
  const roleError = assertRole(user, 'ORG_ADMIN')
  if (roleError) return roleError

  const organisationId = user!.org
  if (!organisationId) {
    return NextResponse.json({ error: 'Organisation context missing' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { 
      name, 
      grade, 
      branchId, 
      pickupAddress, 
      dropoffAddress,
      dob,
      nationality,
      motherTongue,
      guardians // Array of { name, relationship, phonePrimary, email }
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const passenger = await prisma.passenger.create({
      data: {
        name,
        grade,
        organisationId,
        branchId,
        pickupAddress,
        dropoffAddress,
        dob: dob ? new Date(dob) : null,
        nationality,
        motherTongue,
        guardians: {
          create: (guardians || []).map((g: any) => ({
            name: g.name,
            relationship: g.relationship || 'PARENT',
            phonePrimary: g.phonePrimary,
            email: g.email,
            isPrimary: g.isPrimary || false
          }))
        }
      }
    })

    return NextResponse.json(passenger)
  } catch (error) {
    console.error('Failed to create passenger:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
