import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromHeaders, assertRole } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = getUserFromHeaders(req)
  const roleError = assertRole(user, 'ORG_ADMIN')
  if (roleError) return roleError

  const organisationId = user!.org
  if (!organisationId) {
    return NextResponse.json({ error: 'Organisation context missing' }, { status: 403 })
  }

  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { organisationId },
      include: {
        vehicleAssignments: {
          include: {
            driver: {
              include: { user: { select: { name: true } } }
            }
          },
          where: { active: true }
        }
      },
      orderBy: { plateNumber: 'asc' }
    })
    return NextResponse.json(vehicles)
  } catch (error) {
    console.error('Failed to fetch vehicles:', error)
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
    const { plateNumber, make, model, year, capacity, vin, insuranceNumber } = body

    if (!plateNumber) {
      return NextResponse.json({ error: 'Plate number is required' }, { status: 400 })
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        plateNumber,
        make,
        model,
        year: year ? parseInt(year) : null,
        capacity: capacity ? parseInt(capacity) : 20,
        vin,
        insuranceNumber,
        organisationId
      }
    })

    return NextResponse.json(vehicle)
  } catch (error) {
    console.error('Failed to create vehicle:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
