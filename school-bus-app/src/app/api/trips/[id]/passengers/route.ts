import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromHeaders } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromHeaders();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: tripId } = params;

    // Fetch students assigned to this schedule/trip
    const schedule = await prisma.schedule.findUnique({
      where: { id: tripId },
      include: {
        passengers: {
          include: {
            guardians: { where: { isPrimary: true } }
          }
        }
      }
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const students = schedule.passengers.map(p => ({
      id: p.id,
      name: p.name,
      address: p.pickupAddress || p.dropoffAddress,
      phone: p.guardians[0]?.phonePrimary,
      status: 'PENDING', // Default status for fresh fetch
    }));

    return NextResponse.json(students);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
