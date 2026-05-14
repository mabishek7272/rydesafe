import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromHeaders } from '@/lib/auth';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv(); // Assuming Upstash Redis for live tracking persistence

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromHeaders();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { latitude, longitude, speed, heading, timestamp } = await request.json();
    const { id: tripId } = params;

    // 1. Update live location in Redis for real-time visibility
    await redis.hset(`trip:${tripId}:location`, {
      latitude,
      longitude,
      speed,
      heading,
      timestamp,
      driverId: user.userId
    });

    // 2. Optionally store in PostgreSQL for historical tracking (every N seconds to avoid bloat)
    // For now, we'll stick to Redis for the "Live" part

    // 3. Publish to PubSub for WebSockets (Admin dashboard view)
    await redis.publish(`trip_updates`, JSON.stringify({
      tripId,
      latitude,
      longitude,
      type: 'LOCATION_UPDATE'
    }));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Location update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
