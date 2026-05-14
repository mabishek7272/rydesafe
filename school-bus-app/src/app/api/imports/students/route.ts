import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromHeaders, assertRole } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req);
    assertRole(user, ["SUPER_ADMIN", "ORG_ADMIN"]);

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet) as any[];

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Fetch branches once to map by name
    const branches = await prisma.branch.findMany({
      where: { organisationId: user.orgId! }
    });

    for (const row of rows) {
      try {
        const branch = branches.find(b => b.name.toLowerCase() === (row["Branch Name"] || "").toString().toLowerCase());
        
        await prisma.passenger.create({
          data: {
            name: row["Name"]?.toString(),
            dob: row["DOB"] ? new Date(row["DOB"]) : null,
            pickupAddress: row["Pickup Address"]?.toString(),
            dropoffAddress: row["Dropoff Address"]?.toString(),
            organisationId: user.orgId!,
            branchId: branch?.id || null,
            guardians: {
              create: {
                name: row["Guardian Name"]?.toString() || "Unknown",
                phonePrimary: row["Guardian Phone"]?.toString(),
                email: row["Guardian Email"]?.toString(),
                relationship: row["Relationship"]?.toString() || "PARENT",
                isPrimary: true
              }
            }
          }
        });
        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(`Row ${results.success + results.failed}: ${err.message}`);
      }
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        organisationId: user.orgId!,
        actorId: user.userId,
        actorRole: user.role,
        action: 'IMPORT',
        entityType: 'Passenger',
        entityId: `BULK_${Date.now()}`,
        severity: results.failed > 0 ? 'WARNING' : 'INFO',
        newValueJson: { 
          total: rows.length, 
          success: results.success, 
          failed: results.failed 
        } as any,
      }
    });

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("POST /api/imports/students error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
