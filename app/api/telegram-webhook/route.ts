import { NextRequest, NextResponse } from 'next/server';
import { updateExpense, getExpenses } from '@/lib/db';
import {
  getTelegramBotToken,
  parseExpenseCallbackData,
  answerCallbackQuery,
  editMessageText,
  isTelegramAdmin,
  sendMessageToChat,
  setBotCommands,
} from '@/lib/telegram';

/** Telegram Update payload (minimal shape we need). */
interface TelegramUpdate {
  update_id?: number;
  message?: {
    message_id: number;
    chat: { id: number };
    text?: string;
    from?: { id: number };
  };
  callback_query?: {
    id: string;
    from?: { id: number; username?: string };
    message?: {
      message_id: number;
      chat: { id: number };
      text?: string;
    };
    data?: string;
  };
}

/** Format pending expenses for Telegram (HTML). */
function formatPendingExpensesList(expenses: { id: string; name?: string; categoryName?: string; amount?: number; toWhom?: string; createdByName?: string; createdAt?: Date }[]): string {
  if (expenses.length === 0) {
    return '📋 <b>Navbatdagi xarajatlar</b>\n\nHozircha tasdiqlash kutilayotgan xarajatlar yo\'q.';
  }
  const formatter = new Intl.NumberFormat('uz-UZ');
  let text = `📋 <b>Navbatdagi xarajatlar</b> (${expenses.length} ta)\n\n`;
  expenses.forEach((e, i) => {
    const amount = e.amount != null ? formatter.format(e.amount) + ' UZS' : '-';
    const date = e.createdAt ? new Date(e.createdAt).toLocaleDateString('uz-UZ') : '-';
    text += `${i + 1}. <b>${escapeTg(e.name || '-')}</b>\n`;
    text += `   📂 ${escapeTg(e.categoryName || '-')} | 💵 ${amount}\n`;
    text += `   👤 ${escapeTg(e.toWhom || '-')} | ${date} | ${escapeTg(e.createdByName || '-')}\n\n`;
  });
  return text.trim();
}

function escapeTg(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TelegramUpdate;

    // Handle text commands (e.g. /queue, /start) – show pending expenses
    if (body.message?.text) {
      const chatId = body.message.chat?.id;
      const text = body.message.text.trim().toLowerCase();
      const isQueueCmd = text === '/queue' || text === '/pending' || text === '/navbat' || text === '/start' || text === '/q';

      if (isQueueCmd && chatId != null && isTelegramAdmin(chatId)) {
        try {
          const all = await getExpenses();
          const pending = all.filter(e => e.approvalStatus === 'pending');
          const msg = formatPendingExpensesList(pending);
          await sendMessageToChat(chatId, msg);
        } catch (err) {
          console.error('Telegram webhook: getExpenses failed', err);
          await sendMessageToChat(chatId, 'Navbatdagi xarajatlarni yuklab bo\'lmadi.');
        }
        return NextResponse.json({ ok: true });
      }
      if (body.message.chat?.id && !body.callback_query) {
        return NextResponse.json({ ok: true });
      }
    }

    if (!body.callback_query?.data) {
      return NextResponse.json({ ok: true });
    }

    const callbackId = body.callback_query.id;
    const parsed = parseExpenseCallbackData(body.callback_query.data);
    if (!parsed) {
      await answerCallbackQuery(callbackId, { text: 'Noto‘g‘ri tugma', showAlert: true });
      return NextResponse.json({ ok: true });
    }

    const { action, expenseId } = parsed;
    const resultText =
      action === 'approve' ? '✅ Tasdiqlandi' : '🚫 Rad etildi';

    // Answer callback first so the button stops loading
    await answerCallbackQuery(callbackId, { text: resultText, showAlert: false });

    try {
      const status = action === 'approve' ? 'approved' : 'rejected';
      const approvedBy =
        body.callback_query.from?.id != null
          ? `telegram:${body.callback_query.from.id}`
          : 'telegram';

      await updateExpense(expenseId, {
        approvalStatus: status,
        approvedBy,
        approvedAt: new Date(),
      });
    } catch (dbError) {
      console.error('Telegram webhook: updateExpense failed', expenseId, dbError);
      await answerCallbackQuery(callbackId, {
        text: 'Xarajat yangilanmadi (xatolik)',
        showAlert: true,
      });
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const message = body.callback_query.message;
    const chatId = message?.chat?.id;
    const messageId = message?.message_id;
    const currentText = message?.text ?? '';
    if (chatId != null && messageId != null) {
      const newText = `${currentText}\n\n${resultText}`;
      try {
        await editMessageText(chatId, messageId, newText, { removeReplyMarkup: true });
      } catch (editErr) {
        console.error('Telegram webhook: editMessageText failed', editErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

/** GET: ?set=1 registers webhook, no query returns current webhook info (for debugging). */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = getTelegramBotToken();

  if (searchParams.get('set') === '1') {
    const baseUrl =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_APP_URL
          ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
          : null;

    if (!baseUrl) {
      return NextResponse.json(
        { ok: false, error: 'Set VERCEL_URL or NEXT_PUBLIC_APP_URL so webhook URL can be built' },
        { status: 500 }
      );
    }

    const webhookUrl = `${baseUrl}/api/telegram-webhook`;
    const url = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json({ ok: false, telegram: data }, { status: 500 });
    }
    await setBotCommands();
    return NextResponse.json({ ok: true, webhookUrl, telegram: data, menu: 'Bot commands (queue, start) set.' });
  }

  // Return current webhook info (getWebhookInfo) so user can verify
  const infoUrl = `https://api.telegram.org/bot${token}/getWebhookInfo`;
  const res = await fetch(infoUrl);
  const data = await res.json();
  return NextResponse.json({
    ok: data.ok,
    webhookSet: !!data.result?.url,
    webhookUrl: data.result?.url ?? null,
    hint: data.result?.url ? 'Webhook is set. Button clicks should work.' : 'Visit this URL with ?set=1 to register the webhook (e.g. /api/telegram-webhook?set=1).',
  });
}
