import { NextRequest, NextResponse } from 'next/server';
import { sendSupplyOrderToSupplier } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectName, projectLocation, foremanName, items, deadline, webAppUrl } = body;
    if (!projectName || !foremanName || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'Missing projectName, foremanName or items' },
        { status: 400 }
      );
    }
    const success = await sendSupplyOrderToSupplier({
      projectName,
      projectLocation: projectLocation || undefined,
      foremanName,
      items,
      deadline: deadline ? new Date(deadline) : new Date(),
      webAppUrl: webAppUrl || undefined,
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
