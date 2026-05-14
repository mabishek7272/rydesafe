import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromHeaders, assertRole } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getUserFromHeaders();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    assertRole(user, ['DRIVER']);

    // Find schedules assigned to this driver for today
    // Note: In a real system, we would check the current day of week
    const today = new Date().getDay(); // 0-6
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const currentDay = days[today];

    const schedules = await prisma.schedule.findMany({
      where: {
        driverUserId: user.userId,
        daysOfWeek: {
          has: currentDay
        },
        status: 'ACTIVE'
      },
      include: {
        passengers: true,
        vehicle: true,
        branch: true
      }
    });

    // Map to a format suitable for the mobile app
    const trips = schedules.map(s => ({
      id: s.id,
      name: s.name,
      type: s.type,
      startTime: s.startTime,
      stopCount: s.passengers.length, // Each passenger is usually a stop in this model
      passengerCount: s.passengers.length,
      branchName: s.branch?.name,
      vehiclePlate: s.vehicle?.plateNumber
    }));

    return NextResponse.json(trips);
  } catch (error: any) {
    console.error('Driver trips error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
