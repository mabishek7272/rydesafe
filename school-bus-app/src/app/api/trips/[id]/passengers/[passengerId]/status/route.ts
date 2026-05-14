import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromHeaders } from '@/lib/auth';
import { comms } from '@/lib/comms';

export async function POST(
  request: Request,
  { params }: { params: { id: string; passengerId: string } }
) {
  try {
    const user = await getUserFromHeaders();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { status } = await request.json(); // PICKED_UP, ABSENT, DROPPED_OFF
    const { id: tripId, passengerId } = params;

    // Update status in database
    // We'll store this in a TripLog or similar model if it exists
    // For now, let's update a conceptual TripAction in the DB
    
    // Find student and parent details for notification
    const student = await prisma.passenger.findUnique({
      where: { id: passengerId },
      include: {
        guardians: { where: { isPrimary: true } }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Trigger Notification
    if (status === 'PICKED_UP' || status === 'DROPPED_OFF') {
      const primaryGuardian = student.guardians[0];
      await comms.notifyTripEvent(status, {
        studentName: student.name,
        parentEmail: primaryGuardian?.email,
        parentPhone: primaryGuardian?.phonePrimary,
        time: new Date().toLocaleTimeString(),
        location: 'Current Bus Route'
      });
    }

    // Log the audit action
    await prisma.auditLog.create({
      data: {
        organisationId: user.organisationId,
        actorId: user.userId,
        actorRole: user.role,
        action: status,
        entityType: 'Passenger',
        entityId: passengerId,
        severity: 'INFO',
        newValueJson: { tripId, timestamp: new Date() } as any
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Trip status update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
