const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8580488846:AAHkgDFr2ZFb6oEiFgY5SMhzPA_6jiI0xSo';
const TELEGRAM_ADMIN_ID = process.env.TELEGRAM_ADMIN_ID || '5310317109';

export interface ExpenseNotificationData {
  name: string;
  categoryName: string;
  amount: number;
  toWhom: string;
  createdByName: string;
  projectName?: string;
  paymentMethod: 'cash' | 'card';
  comment?: string;
  stage?: string;
}

export async function sendTelegramNotification(data: ExpenseNotificationData): Promise<boolean> {
  try {
    const amountFormatted = new Intl.NumberFormat('uz-UZ').format(data.amount);
    const paymentMethodText = data.paymentMethod === 'cash' ? 'Naqd' : 'Karta';
    
    let message = `💰 <b>Yangi Xarajat Qo'shildi</b>\n\n`;
    message += `📝 <b>Nomi:</b> ${escapeHtml(data.name)}\n`;
    message += `📂 <b>Kategoriya:</b> ${escapeHtml(data.categoryName)}\n`;
    message += `💵 <b>Miqdor:</b> ${amountFormatted} UZS\n`;
    message += `👤 <b>Kimga:</b> ${escapeHtml(data.toWhom)}\n`;
    message += `💳 <b>To'lov usuli:</b> ${paymentMethodText}\n`;
    message += `👨‍💼 <b>Qo'shgan:</b> ${escapeHtml(data.createdByName)}\n`;
    
    if (data.projectName) {
      message += `🏗️ <b>Loyiha:</b> ${escapeHtml(data.projectName)}\n`;
    }
    
    if (data.stage) {
      message += `🔨 <b>Bosqich:</b> ${escapeHtml(data.stage)}\n`;
    }
    
    if (data.comment) {
      message += `💬 <b>Izoh:</b> ${escapeHtml(data.comment)}\n`;
    }
    
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_ADMIN_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Telegram API error:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    return false;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
