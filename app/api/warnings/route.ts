import { NextRequest, NextResponse } from 'next/server';
import { createWarning, getWarnings } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'director')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const warnings = await getWarnings();
    return NextResponse.json(warnings);
  } catch (error: any) {
    console.error('Get warnings error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get warnings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, message } = body;

    const warningId = await createWarning({
      projectId,
      foremanId: user.id,
      foremanName: user.name,
      message,
      status: 'pending',
    });

    return NextResponse.json({ id: warningId });
  } catch (error: any) {
    console.error('Create warning error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create warning' },
      { status: 500 }
    );
  }
}
