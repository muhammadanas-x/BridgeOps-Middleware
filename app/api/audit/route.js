// app/api/auditLogs/route.ts
import { connectDB } from '@/lib/utils';
import AuditLog from '@/models/AuditLog';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectDB();
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load logs' }, { status: 500 });
  }
}


export async function POST(req) {
  try {
    const body = await req.json();
    await connectDB();

    console.log(body)
    await AuditLog.create(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Audit log error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
