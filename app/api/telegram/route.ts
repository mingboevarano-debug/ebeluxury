import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramNotification, ExpenseNotificationData } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const data: ExpenseNotificationData = await request.json();
    
    const success = await sendTelegramNotification(data);
    
    if (success) {
      return NextResponse.json({ success: true, message: 'Notification sent' });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to send notification' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Telegram notification API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send notification' },
      { status: 500 }
    );
  }
}
