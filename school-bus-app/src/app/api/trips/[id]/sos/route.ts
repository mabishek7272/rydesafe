import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromHeaders } from '@/lib/auth';
import { comms } from '@/lib/comms';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromHeaders();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { location, timestamp } = await request.json();
    const { id: tripId } = params;

    // 1. Fetch trip and branch info to find the dispatcher
    const trip = await prisma.schedule.findUnique({
      where: { id: tripId },
      include: {
        branch: {
          include: {
            users: { where: { role: 'DISPATCHER' } }
          }
        }
      }
    });

    const dispatchers = trip?.branch?.users || [];

    // 2. Log high-severity audit log
    await prisma.auditLog.create({
      data: {
        organisationId: user.organisationId,
        actorId: user.userId,
        actorRole: user.role,
        action: 'SOS_TRIGGERED',
        entityType: 'Trip',
        entityId: tripId,
        severity: 'CRITICAL',
        newValueJson: { location, timestamp } as any,
      }
    });

    // 3. Notify Dispatchers via Email/WhatsApp
    const alertMsg = `CRITICAL: Driver ${user.name} has triggered an SOS alert on Trip ${tripId}. Last known location: ${location.latitude}, ${location.longitude}.`;
    
    for (const d of dispatchers) {
      if (d.email) {
        await comms.sendEmail({
          to: d.email,
          subject: 'EMERGENCY: SOS ALERT TRIGGERED',
          text: alertMsg
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('SOS API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
