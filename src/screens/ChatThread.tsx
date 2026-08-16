import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  CheckIcon,
  ChevronLeftIcon,
  MessageCircleIcon,
  PaperclipIcon,
  SendIcon } from
'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { ConversationAvatar } from '../components/ConversationAvatar';
import { t } from '../strings';
import { haptic } from '../tokens';
import { appendMessage, conversations, SUPPORT_TOPICS } from '../chatData';
import type { ChatMessage, Conversation } from '../chatData';
import { useChatVersion } from '../useChatUnread';
import { useUI } from '../ui';

const DAY_LABEL: Record<ChatMessage['day'], () => string> = {
  today: () => t.chatDayToday,
  yesterday: () => t.chatDayYesterday,
  earlier: () => t.chatDayEarlier
};

const TOPIC_LABEL: Record<(typeof SUPPORT_TOPICS)[number], () => string> = {
  payment: () => t.chatTopicPayment,
  technical: () => t.chatTopicTechnical,
  account: () => t.chatTopicAccount,
  course: () => t.chatTopicCourse
};

export function ChatThread({ conversationId }: {conversationId: number;}) {
  const ui = useUI();
  const version = useChatVersion();
  const [draft, setDraft] = useState('');
  const scroller = useRef<HTMLDivElement>(null);

  const conversation = conversations.find((item) => item.id === conversationId);

  // Pin to the newest message on open and after every send. Measured
  // synchronously — a rAF here would never fire on a backgrounded page.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [version, conversationId]);

  useEffect(() => {
    if (!conversation) ui.pop();
  }, [conversation, ui]);

  if (!conversation) return null;

  // Presence only where the platform genuinely tracks it — never invented.
  const presence = conversation.online ? t.chatOnline : null;
  const ready = draft.trim().length > 0;

  function send(text: string) {
    const value = text.trim();
    if (!value) return;
    haptic('light');
    appendMessage(conversationId, value);
    setDraft('');
  }

  // Support opens with topic chips rather than a blank composer.
  const showTopics =
  conversation.kind === 'support' &&
  conversation.messages.every((message) => message.senderName !== null);

  return (
    <div className="relative flex h-full w-full flex-col bg-background">
      <header className="absolute inset-x-0 top-0 z-30 h-[88px] border-b border-hairline bg-background/80 backdrop-blur-xl">
        <div className="flex h-[44px] items-center gap-2 px-2 pt-[44px]">
          <button
            type="button"
            onClick={ui.pop}
            aria-label={t.back}
            className="flex h-[44px] w-[36px] shrink-0 items-center text-primary transition-[transform,opacity] duration-100 ease-out active:scale-[0.97] active:opacity-80">

            <ChevronLeftIcon size={24} strokeWidth={2.4} />
          </button>
          <ConversationAvatar conversation={conversation} size={32} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-sans text-[16px] font-semibold leading-[19px] text-foreground">
              {conversation.name}
            </p>
            <p className="truncate font-sans text-caption leading-[14px] text-mutedfg">
              {presence ?
              <span className="flex items-center gap-[5px]">
                  <span className="h-[6px] w-[6px] rounded-full bg-good" />
                  {presence}
                </span> :

              conversation.subtitle
              }
            </p>
          </div>
        </div>
      </header>

      <div
        ref={scroller}
        className="no-scrollbar flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-[100px]">

        {conversation.messages.length === 0 ?
        <EmptyState
          icon={MessageCircleIcon}
          title={t.chatThreadEmptyTitle}
          body={t.chatThreadEmptyBody} /> :


        <MessageStream conversation={conversation} />
        }
      </div>

      {showTopics &&
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
          <span className="shrink-0 self-center font-sans text-caption text-mutedfg">
            {t.chatSupportQuick}
          </span>
          {SUPPORT_TOPICS.map((topic) =>
        <button
          key={topic}
          type="button"
          onClick={() => send(TOPIC_LABEL[topic]())}
          className="shrink-0 rounded-full bg-primary/[0.12] px-3 py-[7px] font-sans text-footnote font-medium text-primary transition-[transform,opacity] duration-100 ease-out active:scale-[0.97] active:opacity-80">

              {TOPIC_LABEL[topic]()}
            </button>
        )}
        </div>
      }

      <div
        className="flex items-end gap-2 border-t border-hairline bg-background px-3 pt-2"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>

        <button
          type="button"
          aria-label={t.chatAttachLabel}
          onClick={() => ui.toast(t.chatAttachSoon, 'info')}
          className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full text-mutedfg transition-[transform,opacity] duration-100 ease-out active:scale-[0.97] active:opacity-70">

          <PaperclipIcon size={20} />
        </button>
        <textarea
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send(draft);
            }
          }}
          placeholder={t.chatComposer}
          className="no-scrollbar max-h-[104px] min-h-[40px] flex-1 resize-none rounded-[20px] bg-secondary px-4 py-[10px] font-sans text-subhead text-foreground outline-none placeholder:text-mutedfg" />

        <button
          type="button"
          aria-label={t.chatSendLabel}
          disabled={!ready}
          onClick={() => send(draft)}
          className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-primary text-primaryfg transition-[transform,opacity] duration-150 ease-out active:scale-[0.94] disabled:bg-secondary disabled:text-mutedfg">

          <SendIcon size={18} />
        </button>
      </div>
    </div>);

}

function MessageStream({ conversation }: {conversation: Conversation;}) {
  let lastDay: ChatMessage['day'] | null = null;

  return (
    <div className="space-y-2">
      {conversation.messages.map((message, i) => {
        const showDay = message.day !== lastDay;
        lastDay = message.day;
        const own = message.senderName === null && !message.system;
        const previous = conversation.messages[i - 1];
        // Consecutive messages from the same person lose the repeated name.
        const showSender =
        conversation.kind === 'group' &&
        !own &&
        !message.system &&
        previous?.senderName !== message.senderName;

        return (
          <div key={message.id}>
            {showDay &&
            <p className="py-3 text-center font-sans text-caption font-medium text-mutedfg">
                {DAY_LABEL[message.day]()}
              </p>
            }
            {message.system ?
            <p className="py-1 text-center font-sans text-caption text-mutedfg">{message.text}</p> :

            <div className={['flex', own ? 'justify-end' : 'justify-start'].join(' ')}>
                <div
                className="max-w-[78%] rounded-[18px] px-[13px] py-[9px]"
                style={
                own ?
                {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-fg))',
                  borderBottomRightRadius: 6
                } :
                {
                  backgroundColor: 'hsl(var(--secondary))',
                  color: 'hsl(var(--foreground))',
                  borderBottomLeftRadius: 6
                }
                }>

                  {showSender && message.senderName &&
                <p className="mb-[2px] font-sans text-caption font-semibold text-primary">
                      {message.senderName}
                    </p>
                }
                  <p className="whitespace-pre-wrap break-words font-sans text-subhead">
                    {message.text}
                  </p>
                  <p
                  className={[
                  'mt-[2px] flex items-center justify-end gap-[3px] font-sans text-[11px] tabular-nums',
                  own ? 'opacity-70' : 'text-mutedfg'].
                  join(' ')}>

                    {message.time}
                    {own && message.status &&
                  <CheckIcon size={12} strokeWidth={2.6} />
                  }
                  </p>
                </div>
              </div>
            }
          </div>);

      })}
    </div>);

}
