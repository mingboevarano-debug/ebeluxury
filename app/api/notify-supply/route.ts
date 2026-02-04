import { NextRequest, NextResponse } from 'next/server';
<<<<<<< HEAD
import { sendSupplyOrderToSupplier } from '@/lib/telegram';
=======
import { sendSupplyRequestNotification } from '@/lib/telegram';
>>>>>>> 7a02268ce9a8bf60494f090fc89dd9af45b86ed8

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
<<<<<<< HEAD
    const { projectName, projectLocation, foremanName, items, deadline, webAppUrl } = body;
    if (!projectName || !foremanName || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'Missing projectName, foremanName or items' },
        { status: 400 }
      );
    }
    const success = await sendSupplyOrderToSupplier({
=======
    const { requestId, projectName, projectLocation, foremanName, items, deadline } = body;
    if (!requestId || !projectName || !foremanName || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'Missing requestId, projectName, foremanName or items' },
        { status: 400 }
      );
    }
    const success = await sendSupplyRequestNotification({
      requestId,
>>>>>>> 7a02268ce9a8bf60494f090fc89dd9af45b86ed8
      projectName,
      projectLocation: projectLocation || undefined,
      foremanName,
      items,
      deadline: deadline ? new Date(deadline) : new Date(),
<<<<<<< HEAD
      webAppUrl: webAppUrl || undefined,
=======
>>>>>>> 7a02268ce9a8bf60494f090fc89dd9af45b86ed8
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
