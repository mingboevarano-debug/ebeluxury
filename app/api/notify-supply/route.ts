import { NextRequest, NextResponse } from 'next/server';
import { sendSupplyRequestNotification } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, projectName, projectLocation, foremanName, items, deadline } = body;
    if (!requestId || !projectName || !foremanName || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'Missing requestId, projectName, foremanName or items' },
        { status: 400 }
      );
    }
    const success = await sendSupplyRequestNotification({
      requestId,
      projectName,
      projectLocation: projectLocation || undefined,
      foremanName,
      items,
      deadline: deadline ? new Date(deadline) : new Date(),
    });
    if (success) {
      return NextResponse.json({ success: true, message: 'Supply notification sent' });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to send notification' },
      { status: 500 }
    );
  } catch (error: unknown) {
    console.error('Notify supply API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to send' },
      { status: 500 }
    );
  }
}
