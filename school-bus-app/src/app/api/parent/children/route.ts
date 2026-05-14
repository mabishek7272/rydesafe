import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromHeaders } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getUserFromHeaders();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch children for this parent
    const passengers = await prisma.passenger.findMany({
      where: {
        guardians: {
          some: {
            userId: user.userId
          }
        }
      },
      include: {
        schedules: {
          where: { status: 'ACTIVE' },
          include: {
            vehicle: true,
            trips: {
              where: { status: 'STARTED' },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    const data = passengers.map(p => {
      const activeSchedule = p.schedules[0];
      const activeTrip = activeSchedule?.trips[0];
      
      return {
        id: p.id,
        name: p.name,
        photoUrl: p.photoUrl,
        activeTrip: activeTrip ? {
          id: activeTrip.id,
          status: activeTrip.status,
          vehiclePlate: activeSchedule.vehicle?.plateNumber,
          vehicleName: activeSchedule.vehicle?.model
        } : null
      };
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Parent children error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
