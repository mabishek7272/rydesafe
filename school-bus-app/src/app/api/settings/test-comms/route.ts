import { NextResponse } from 'next/server';
import { comms } from '@/lib/comms';
import { getUserFromHeaders, assertRole } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getUserFromHeaders();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    assertRole(user, ['ORG_ADMIN', 'SUPER_ADMIN']);

    const { type } = await request.json();

    if (type === 'email') {
      const result = await comms.sendEmail({
        to: user.email,
        subject: 'TrackBuddy Connectivity Test',
        text: 'This is a test email to verify your Resend integration is working correctly.'
      });

      if (result.error) {
        return NextResponse.json({ success: false, error: result.error });
      }
      return NextResponse.json({ success: true });
    }

    if (type === 'whatsapp') {
      // Mock result for template mode
      return NextResponse.json({ success: true, mode: 'SANDBOX' });
    }

    return NextResponse.json({ error: 'Invalid test type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
