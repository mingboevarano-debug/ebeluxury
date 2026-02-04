const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8580488846:AAHkgDFr2ZFb6oEiFgY5SMhzPA_6jiI0xSo';

export function getTelegramBotToken(): string {
  return TELEGRAM_BOT_TOKEN;
}

/** Parse callback_data from expense inline buttons. Returns { action, expenseId } or null. */
export function parseExpenseCallbackData(data: string): { action: 'approve' | 'reject'; expenseId: string } | null {
  const match = data.match(/^EXPENSE_(APPROVE|REJECT):(.+)$/);
  if (!match) return null;
  const action = match[1] === 'APPROVE' ? 'approve' : 'reject';
  const expenseId = match[2].trim();
  return expenseId && expenseId !== 'unknown' ? { action, expenseId } : null;
}

/** Answer a callback query (stops loading state on the button). */
export async function answerCallbackQuery(
  callbackQueryId: string,
  options?: { text?: string; showAlert?: boolean }
): Promise<boolean> {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      ...(options?.text && { text: options.text }),
      ...(options?.showAlert !== undefined && { show_alert: options.showAlert }),
    }),
  });
  return res.ok;
}

/** Edit message text and optionally remove inline keyboard. */
export async function editMessageText(
  chatId: string | number,
  messageId: number,
  text: string,
  options?: { removeReplyMarkup?: boolean }
): Promise<boolean> {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`;
  const body: Record<string, unknown> = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
  };
  if (options?.removeReplyMarkup) {
    body.reply_markup = { inline_keyboard: [] };
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.ok;
}

// Director receives expense queue with Accept/Refuse buttons (primary admin + additional directors)
const primaryAdminId = process.env.TELEGRAM_ADMIN_ID || '5310317109';
const additionalAdminIds = (process.env.TELEGRAM_ADDITIONAL_ADMIN_IDS ?? '')
  .split(',')
  .map(id => id.trim())
  .filter(Boolean);
const additionalDirectorIds = (process.env.TELEGRAM_ADDITIONAL_DIRECTOR_IDS ?? '1119588540')
  .split(',')
  .map(id => id.trim())
  .filter(Boolean);
const TELEGRAM_DIRECTOR_IDS = Array.from(new Set([primaryAdminId, ...additionalDirectorIds])).filter(Boolean);
const TELEGRAM_ADMIN_IDS = Array.from(new Set([primaryAdminId, ...additionalAdminIds, ...TELEGRAM_DIRECTOR_IDS])).filter(Boolean);

export function isTelegramAdmin(chatId: string | number): boolean {
  const id = String(chatId);
  return TELEGRAM_ADMIN_IDS.includes(id);
}

/** Send a text message to a chat (e.g. reply for /queue command). */
export async function sendMessageToChat(
  chatId: string | number,
  text: string,
  options?: { parseMode?: 'HTML' | 'Markdown' }
): Promise<boolean> {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: options?.parseMode ?? 'HTML',
    }),
  });
  return res.ok;
}

/** Set bot commands for the menu (e.g. "Navbatdagi xarajatlar"). */
export async function setBotCommands(): Promise<boolean> {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setMyCommands`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      commands: [
        { command: 'queue', description: 'Navbatdagi xarajatlar' },
        { command: 'start', description: 'Boshlash' },
      ],
    }),
  });
  return res.ok;
}

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
  pendingApproval?: boolean;
  expenseId?: string;
  showActionButtons?: boolean;
}

export async function sendTelegramNotification(data: ExpenseNotificationData): Promise<boolean> {
  try {
    const amountFormatted = new Intl.NumberFormat('uz-UZ').format(data.amount);
    const paymentMethodText = data.paymentMethod === 'cash' ? 'Naqd' : 'Karta';
    
    let message = data.pendingApproval
      ? `🔔 <b>Director: Yangi Xarajat Tasdiqlashni Kutmoqda</b>\n\n`
      : `💰 <b>Yangi Xarajat Qo'shildi</b>\n\n`;
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
    
    // Pending expenses: show Accept/Refuse so director can approve from Telegram
    const showButtons = data.pendingApproval && (data.showActionButtons !== false);
    const inlineKeyboard = showButtons && data.expenseId ? [
      [
        { text: '✅ Tasdiqlash', callback_data: `EXPENSE_APPROVE:${data.expenseId}` },
        { text: '🚫 Bekor qilish', callback_data: `EXPENSE_REJECT:${data.expenseId}` },
      ],
    ] : undefined;

    const simpleMessage = data.pendingApproval
      ? `📢 Yangi xarajat: ${escapeHtml(data.name)} (${amountFormatted} UZS).\nIltimos, saytga kirib tasdiqlang.`
      : `ℹ️ Yangi xarajat qo'shildi: ${escapeHtml(data.name)} (${amountFormatted} UZS).`;

    let delivered = false;

    for (const adminId of TELEGRAM_ADMIN_IDS) {
      try {
        const isDirector = TELEGRAM_DIRECTOR_IDS.includes(adminId);
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: adminId,
            text: isDirector ? message : simpleMessage,
            parse_mode: 'HTML',
            ...(isDirector && inlineKeyboard && {
              reply_markup: { inline_keyboard: inlineKeyboard },
            }),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Telegram API error for ${adminId}:`, errorData);
          continue;
        }
        delivered = true;
      } catch (sendError) {
        console.error(`Failed to send Telegram notification to ${adminId}:`, sendError);
      }
    }

    return delivered;
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

/** Callback data for supply request buttons: SUPPLY_ACCEPT:id or SUPPLY_REFUSE:id */
export function parseSupplyCallbackData(data: string): { action: 'accept' | 'refuse'; requestId: string } | null {
  const match = data.match(/^SUPPLY_(ACCEPT|REFUSE):(.+)$/);
  if (!match) return null;
  const action = match[1] === 'ACCEPT' ? 'accept' : 'refuse';
  const requestId = match[2].trim();
  return requestId && requestId !== 'unknown' ? { action, requestId } : null;
}

<<<<<<< HEAD
// Supplier receives "new order" notification with link to web app
const TELEGRAM_SUPPLIER_CHAT_ID = process.env.TELEGRAM_SUPPLIER_CHAT_ID || '8299164114';

=======
>>>>>>> 7a02268ce9a8bf60494f090fc89dd9af45b86ed8
export interface SupplyRequestNotificationData {
  requestId: string;
  projectName: string;
  projectLocation?: string;
  foremanName: string;
  items: string[];
  deadline: Date;
}

<<<<<<< HEAD
/** Send Telegram to supplier: new order from foreman, please open web app and accept. */
export async function sendSupplyOrderToSupplier(data: {
  projectName: string;
  projectLocation?: string;
  foremanName: string;
  items: string[];
  deadline: Date;
  webAppUrl?: string;
}): Promise<boolean> {
  try {
    const baseUrl = (data.webAppUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://www.ebe-luxury.uz').replace(/\/$/, '');
    const supplierLink = `${baseUrl}/dashboard/supplier`;
    const deadlineStr = new Date(data.deadline).toLocaleString('uz-UZ');
    const itemsPreview = data.items.length > 3
      ? data.items.slice(0, 3).join(', ') + ` +${data.items.length - 3}`
      : data.items.join(', ');
    let message = `📦 <b>Yangi buyurtma (boshliqdan)</b>\n\n`;
    message += `🏗️ <b>Loyiha:</b> ${escapeHtml(data.projectName)}\n`;
    if (data.projectLocation) message += `📍 ${escapeHtml(data.projectLocation)}\n`;
    message += `👤 <b>Boshliq:</b> ${escapeHtml(data.foremanName)}\n`;
    message += `📋 <b>Buyumlar:</b> ${escapeHtml(itemsPreview)}\n`;
    message += `⏰ <b>Muddat:</b> ${escapeHtml(deadlineStr)}\n\n`;
    message += `👉 Veb-ilovani oching va buyurtmani qabul qiling:\n${supplierLink}`;

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_SUPPLIER_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      console.error('Telegram supplier notify error:', err);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error sending supply order notification to supplier:', error);
    return false;
  }
}

/** Send Telegram notification for new supplier order; recipients get [Accept] [Refuse] buttons. */
export async function sendSupplyRequestNotification(data: SupplyRequestNotificationData): Promise<boolean> {
  try {
    const deadlineStr = new Date(data.deadline).toLocaleString('uz-UZ');
    const itemsPreview = data.items.length > 3
      ? data.items.slice(0, 3).join(', ') + ` +${data.items.length - 3}`
      : data.items.join(', ');
    let message = `📦 <b>Yangi ta'minot buyurtmasi</b>\n\n`;
    message += `🏗️ <b>Loyiha:</b> ${escapeHtml(data.projectName)}\n`;
    if (data.projectLocation) message += `📍 ${escapeHtml(data.projectLocation)}\n`;
    message += `👤 <b>Boshliq:</b> ${escapeHtml(data.foremanName)}\n`;
    message += `📋 <b>Buyumlar:</b> ${escapeHtml(itemsPreview)}\n`;
    message += `⏰ <b>Muddat:</b> ${escapeHtml(deadlineStr)}\n`;

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const inlineKeyboard = [
      [
        { text: '✅ Qabul qilish', callback_data: `SUPPLY_ACCEPT:${data.requestId}` },
        { text: '🚫 Rad etish', callback_data: `SUPPLY_REFUSE:${data.requestId}` },
      ],
    ];

    let delivered = false;
    for (const adminId of TELEGRAM_ADMIN_IDS) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: adminId,
            text: message,
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: inlineKeyboard },
          }),
        });
        if (res.ok) delivered = true;
        else {
          const err = await res.json();
          console.error(`Telegram supply notify error for ${adminId}:`, err);
        }
      } catch (e) {
        console.error(`Telegram supply notify failed for ${adminId}:`, e);
      }
    }
    return delivered;
  } catch (error) {
    console.error('Error sending supply request Telegram notification:', error);
    return false;
  }
}
