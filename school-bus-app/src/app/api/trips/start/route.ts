import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromHeaders } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getUserFromHeaders();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { scheduleId } = await request.json();

    // 1. Fetch schedule to copy configuration
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { route: true, vehicle: true }
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // 2. Create Trip instance
    const trip = await prisma.trip.create({
      data: {
        organisationId: user.organisationId!,
        scheduleId: schedule.id,
        routeId: schedule.routeId,
        vehicleId: schedule.vehicleId,
        driverUserId: user.userId,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        date: new Date(),
      }
    });

    // 3. Log Audit
    await prisma.auditLog.create({
      data: {
        organisationId: user.organisationId!,
        actorId: user.userId,
        actorRole: user.role,
        action: 'TRIP_STARTED',
        entityType: 'Trip',
        entityId: trip.id,
        severity: 'INFO',
        newValueJson: { scheduleId } as any
      }
    });

    return NextResponse.json(trip);
  } catch (error: any) {
    console.error('Trip start error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
