import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromHeaders, assertRole } from "@/lib/auth";

/**
 * GET /api/organisation/users
 * List all users (staff, drivers, admins) belonging to the organisation
 */
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req);
    if (!user || !user.orgId) {
      return NextResponse.json({ error: "Unauthorized or no organisation context" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const branchId = searchParams.get("branchId");

    const users = await prisma.user.findMany({
      where: {
        organisationId: user.orgId,
        ...(role ? { role: role as any } : {}),
        ...(branchId ? { branchId } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phoneNumber: true,
        status: true,
        branch: {
          select: {
            name: true,
          }
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("GET /api/organisation/users error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/organisation/users (Invitation flow placeholder)
 * In a real app, this would trigger an email invitation.
 * For now, it creates a pending user.
 */
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req);
    assertRole(user, ["SUPER_ADMIN", "ORG_ADMIN"]);

    const body = await req.json();
    const { name, email, role, branchId, phoneNumber } = body;

    if (!email || !role || !branchId) {
      return NextResponse.json({ error: "Email, role, and branch are required" }, { status: 400 });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role,
        organisationId: user.orgId!,
        branchId,
        phoneNumber,
        status: "ACTIVE", // For demo purposes, we'll auto-activate
        // In production, password would be set via invite link
        password: "TEMPORARY_PASSWORD_CHANGE_ME", 
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/organisation/users error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
