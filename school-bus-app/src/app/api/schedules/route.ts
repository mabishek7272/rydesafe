import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromHeaders, assertRole } from "@/lib/auth";

/**
 * GET /api/schedules
 * List all schedules for the current organisation
 */
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req);
    if (!user || !user.orgId) {
      return NextResponse.json({ error: "Unauthorized or no organisation context" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const type = searchParams.get("type"); // PICKUP, DROPOFF, SPECIAL

    const schedules = await prisma.schedule.findMany({
      where: {
        organisationId: user.orgId,
        ...(branchId ? { branchId } : {}),
        ...(type ? { type: type as any } : {}),
      },
      include: {
        branch: { select: { name: true } },
        vehicle: { select: { plateNumber: true, model: true } },
        driver: { select: { name: true } },
        _count: {
          select: { passengers: true }
        }
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json(schedules);
  } catch (error: any) {
    console.error("GET /api/schedules error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/schedules
 * Create a new recurring or one-time schedule
 */
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req);
    assertRole(user, ["SUPER_ADMIN", "ORG_ADMIN"]);

    const body = await req.json();
    const { 
      name, 
      type, 
      branchId, 
      vehicleId, 
      driverUserId, 
      daysOfWeek, 
      startTime, 
      endTime,
      isRecurring 
    } = body;

    if (!name || !type || !branchId) {
      return NextResponse.json({ error: "Name, type, and branch are required" }, { status: 400 });
    }

    const schedule = await prisma.schedule.create({
      data: {
        name,
        type,
        organisationId: user.orgId!,
        branchId,
        vehicleId,
        driverUserId,
        daysOfWeek: daysOfWeek || [],
        startTime,
        endTime,
        status: "ACTIVE",
      },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/schedules error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
