import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromHeaders, assertRole } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function GET(request: Request) {
  try {
    const user = await getUserFromHeaders();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    assertRole(user, ['ORG_ADMIN', 'SUPER_ADMIN', 'OPS_MANAGER']);

    const students = await prisma.passenger.findMany({
      where: { organisationId: user.organisationId },
      include: {
        branch: { select: { name: true } },
        guardians: { where: { isPrimary: true } }
      }
    });

    const data = students.map(s => ({
      'Student Name': s.name,
      'Branch': s.branch?.name || 'N/A',
      'Pickup Address': s.pickupAddress || 'N/A',
      'Dropoff Address': s.dropoffAddress || 'N/A',
      'Guardian Name': s.guardians[0]?.name || 'N/A',
      'Guardian Phone': s.guardians[0]?.phonePrimary || 'N/A',
      'Guardian Email': s.guardians[0]?.email || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="student_roster.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
