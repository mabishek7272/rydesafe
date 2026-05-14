import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromHeaders } from '@/lib/auth';
import { comms } from '@/lib/comms';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function POST(
  request: Request,
  { params }: { params: { id: string; passengerId: string } }
) {
  try {
    const user = await getUserFromHeaders();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { status, latitude, longitude } = await request.json(); // PICKED_UP, ABSENT, etc.
    const { id: tripId, passengerId } = params;

    // 1. Create TripEvent in Database
    const event = await prisma.tripEvent.create({
      data: {
        tripId,
        passengerId,
        action: status,
        latitude,
        longitude,
        recordedById: user.userId,
        timestamp: new Date()
      },
      include: {
        passenger: {
          include: {
            guardians: { where: { isPrimary: true } }
          }
        }
      }
    });

    // 2. Publish to Live Dispatch Feed (Redis)
    await redis.publish('trip_updates', JSON.stringify({
      type: 'PASSENGER_EVENT',
      tripId,
      passengerName: event.passenger?.name,
      action: status,
      timestamp: new Date()
    }));

    // 3. Trigger Comms
    if (event.passenger) {
      const primaryGuardian = event.passenger.guardians[0];
      await comms.notifyTripEvent(status, {
        studentName: event.passenger.name,
        parentEmail: primaryGuardian?.email,
        parentPhone: primaryGuardian?.phonePrimary,
        time: new Date().toLocaleTimeString(),
        location: 'Bus Stop'
      });
    }

    return NextResponse.json({ success: true, eventId: event.id });
  } catch (error: any) {
    console.error('Trip event error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
