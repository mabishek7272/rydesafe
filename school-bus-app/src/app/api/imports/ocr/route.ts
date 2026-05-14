import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { prisma } from '@/lib/prisma';
import { getUserFromHeaders, assertRole } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromHeaders();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    assertRole(user, ['ORG_ADMIN', 'SUPER_ADMIN']);

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 1. Save file temporarily
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(tempDir, fileName);
    fs.writeFileSync(filePath, buffer);

    // 2. Call Python OCR Script
    const scriptPath = path.join(process.cwd(), 'scripts', 'ocr_student_extractor.py');
    
    const runOCR = (): Promise<any> => {
      return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', [scriptPath, filePath]);
        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
          dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          errorString += data.toString();
        });

        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(errorString || `OCR Process exited with code ${code}`));
          } else {
            try {
              resolve(JSON.parse(dataString));
            } catch (e) {
              reject(new Error('Failed to parse OCR output'));
            }
          }
          // Cleanup
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
      });
    };

    const extractedData = await runOCR();

    // 3. Log the audit action
    await prisma.auditLog.create({
      data: {
        organisationId: user.organisationId,
        actorId: user.userId,
        actorRole: user.role,
        action: 'OCR_EXTRACTION',
        entityType: 'Import',
        entityId: fileName,
        severity: 'INFO',
        newValueJson: extractedData as any,
      }
    });

    return NextResponse.json({
      success: true,
      data: extractedData.students || [],
      source: fileName
    });

  } catch (error: any) {
    console.error('OCR Import Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
