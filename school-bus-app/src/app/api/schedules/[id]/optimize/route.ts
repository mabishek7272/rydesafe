import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromHeaders } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromHeaders();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const scheduleId = params.id;

    // 1. Fetch current schedule and passengers with locations
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        passengers: {
          include: {
            passenger: true,
            pickupStop: true
          }
        }
      }
    });

    if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });

    // 2. Optimization Logic (Simple Nearest Neighbor for now)
    // In production, we would use Google Maps Distance Matrix or OSRM
    const items = schedule.passengers.filter(p => p.pickupStop?.latitude && p.pickupStop?.longitude);
    
    if (items.length < 2) {
      return NextResponse.json({ message: 'Not enough points to optimize' });
    }

    // Sort by a simple distance heuristic (simulated)
    // We'll sort by latitude as a placeholder for a real TSP solver
    const optimizedSequence = [...items].sort((a, b) => {
      const latA = a.pickupStop!.latitude!;
      const latB = b.pickupStop!.latitude!;
      return latA - latB;
    });

    // 3. Update sequences in DB
    const updates = optimizedSequence.map((item, index) => {
      return prisma.schedulePassenger.update({
        where: { id: item.id },
        data: { sequence: index + 1 }
      });
    });

    await prisma.$transaction(updates);

    return NextResponse.json({ 
      success: true, 
      message: `Optimized ${items.length} stops`,
      sequence: optimizedSequence.map(i => i.passenger.name)
    });
  } catch (error: any) {
    console.error('Optimization error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
