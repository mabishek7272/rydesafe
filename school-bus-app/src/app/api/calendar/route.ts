import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromSession } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getUserFromSession()
    
    // Parents only see public events, Admins see all
    const isAdmin = user && ['ADMIN', 'SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(user.role)
    
    const events = await prisma.academicEvent.findMany({
      where: isAdmin ? {} : { isPublic: true },
      orderBy: { startDate: 'asc' }
    })
    
    return NextResponse.json({ events })
  } catch (error) {
    console.error('Academic Calendar GET Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user || !['ADMIN', 'SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, startDate, endDate, type, isPublic, color } = body

    if (!title || !startDate) {
      return NextResponse.json({ error: 'Title and Start Date are required' }, { status: 400 })
    }

    const event = await prisma.academicEvent.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        type: type || 'EVENT',
        isPublic: isPublic !== undefined ? isPublic : true,
        color: color || '#1E3A8A'
      }
    })

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Academic Calendar POST Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
