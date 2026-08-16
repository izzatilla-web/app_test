/**
 * Communication centre data.
 *
 * The student never picks who to talk to from a global directory — the set of
 * conversations is derived from their enrolment: their group, their teacher,
 * support and the administrator responsible for them.
 *
 * NOTE — mock data, like the rest of the app. There is no backend, no socket
 * and no real-time layer here, so nothing pretends to be live: no typing
 * indicators, no fake incoming messages. Sending appends locally. A real
 * implementation must enforce conversation membership on the server; the
 * roster below is a UI stand-in, not access control.
 */

export type ConversationKind = 'group' | 'teacher' | 'support' | 'admin';

export interface ChatMessage {
  id: number;
  /** Null when the student themselves wrote it. */
  senderName: string | null;
  /** Avatar seed of the sender; null for own messages and system lines. */
  senderSeed: number | null;
  text: string;
  /** Wall-clock label, e.g. "14:32". */
  time: string;
  /** Day bucket the message belongs to. */
  day: 'today' | 'yesterday' | 'earlier';
  /** Only meaningful on own messages. */
  status?: 'sent' | 'delivered' | 'read';
  /** Centred, non-bubble line for enrolment/lesson events. */
  system?: boolean;
}

export interface Conversation {
  id: number;
  kind: ConversationKind;
  name: string;
  /** Avatar seed; group conversations render an icon instead. */
  seed: number;
  /** Second line in the thread header, e.g. participant count. */
  subtitle: string;
  unread: number;
  lastTime: string;
  /** Only set where the platform genuinely tracks presence. */
  online?: boolean;
  messages: ChatMessage[];
}

/** Support opens with these instead of a blank composer. */
export const SUPPORT_TOPICS = ['payment', 'technical', 'account', 'course'] as const;
export type SupportTopic = typeof SUPPORT_TOPICS[number];

export const conversations: Conversation[] = [
{
  id: 1,
  kind: 'group',
  name: 'A2-ertalab',
  seed: 21,
  subtitle: '18 o‘quvchi · 1 o‘qituvchi',
  unread: 7,
  lastTime: '15:44',
  messages: [
  {
    id: 101,
    senderName: null,
    senderSeed: null,
    text: 'Siz A2-ertalab guruhiga qo‘shildingiz',
    time: '09:00',
    day: 'earlier',
    system: true
  },
  {
    id: 102,
    senderName: 'Nodira Karimova',
    senderSeed: 31,
    text: 'Assalomu alaykum. Bugungi darsda 1.2 — kasrlarni qo‘shishni yakunlaymiz.',
    time: '09:12',
    day: 'yesterday'
  },
  {
    id: 103,
    senderName: 'Malika Rasulova',
    senderSeed: 4,
    text: 'Ustoz, maxrajni tenglash qismini yana bir marta tushuntirasizmi?',
    time: '09:20',
    day: 'yesterday'
  },
  {
    id: 104,
    senderName: 'Nodira Karimova',
    senderSeed: 31,
    text: 'Albatta, darsning boshida takrorlaymiz.',
    time: '09:24',
    day: 'yesterday'
  },
  {
    id: 105,
    senderName: null,
    senderSeed: null,
    text: 'Men ham shu joyda qiynalyapman, rahmat.',
    time: '09:31',
    day: 'yesterday',
    status: 'read'
  },
  {
    id: 106,
    senderName: null,
    senderSeed: null,
    text: 'Yangi uy vazifasi berildi — 1.2',
    time: '15:30',
    day: 'today',
    system: true
  },
  {
    id: 107,
    senderName: 'Malika Rasulova',
    senderSeed: 4,
    text: '1.2 uy vazifasi qaysi sahifada?',
    time: '15:44',
    day: 'today'
  }]

},
{
  id: 2,
  kind: 'teacher',
  name: 'Nodira Karimova',
  seed: 31,
  subtitle: 'O‘qituvchi · A2-ertalab',
  unread: 0,
  lastTime: '11:05',
  online: true,
  messages: [
  {
    id: 201,
    senderName: 'Nodira Karimova',
    senderSeed: 31,
    text: 'Ali, oxirgi imtihonda maxrajni tenglashda xato qilding. Qo‘shimcha dars olsang yaxshi bo‘lardi.',
    time: '10:48',
    day: 'today'
  },
  {
    id: 202,
    senderName: null,
    senderSeed: null,
    text: 'Xo‘p ustoz, bu hafta yozilaman.',
    time: '11:02',
    day: 'today',
    status: 'read'
  },
  {
    id: 203,
    senderName: 'Nodira Karimova',
    senderSeed: 31,
    text: 'Juda yaxshi. Payshanba kuni 16:00 da bo‘sh joy bor.',
    time: '11:05',
    day: 'today'
  }]

},
{
  id: 3,
  kind: 'support',
  name: 'Qo‘llab-quvvatlash',
  seed: 41,
  subtitle: 'Phoenix Math School',
  unread: 1,
  lastTime: '15:44',
  online: true,
  messages: [
  {
    id: 301,
    senderName: 'Diana',
    senderSeed: 41,
    text: 'Assalomu alaykum! Sizga qanday yordam bera olamiz?',
    time: '15:44',
    day: 'today'
  }]

},
{
  id: 4,
  kind: 'admin',
  name: 'Sabina Yo‘ldosheva',
  seed: 42,
  subtitle: 'Administrator',
  unread: 0,
  lastTime: '09:00',
  messages: [
  {
    id: 401,
    senderName: 'Sabina Yo‘ldosheva',
    senderSeed: 42,
    text: 'Avgust oyi to‘lovida 150 000 so‘m qoldiq bor. Eslatib qo‘yaman.',
    time: '08:52',
    day: 'today'
  },
  {
    id: 402,
    senderName: null,
    senderSeed: null,
    text: 'Rahmat, shu hafta yopamiz.',
    time: '09:00',
    day: 'today',
    status: 'delivered'
  }]

}];


export function totalUnread(): number {
  return conversations.reduce((sum, conversation) => sum + conversation.unread, 0);
}

/* ── Read state ────────────────────────────────────────────────
   A tiny subscription so the header badge follows the list without
   threading chat state through the whole app. */

const listeners = new Set<() => void>();

export function subscribeChat(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function markConversationRead(id: number): void {
  const conversation = conversations.find((item) => item.id === id);
  if (!conversation || conversation.unread === 0) return;
  conversation.unread = 0;
  listeners.forEach((listener) => listener());
}

/** Appends a message the student just sent. Local echo — there is no server. */
export function appendMessage(conversationId: number, text: string): void {
  const conversation = conversations.find((item) => item.id === conversationId);
  if (!conversation) return;
  const now = new Date();
  conversation.messages.push({
    id: Date.now(),
    senderName: null,
    senderSeed: null,
    text,
    time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    day: 'today',
    status: 'sent'
  });
  conversation.lastTime = conversation.messages[conversation.messages.length - 1].time;
  listeners.forEach((listener) => listener());
}
