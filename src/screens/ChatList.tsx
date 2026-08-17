import { useMemo, useState } from 'react';
import { MessagesSquareIcon, SearchIcon } from 'lucide-react';
import { PushScreen } from '../components/ScrollScreen';
import { ConversationAvatar } from '../components/ConversationAvatar';
import { EmptyState } from '../components/EmptyState';
import { t } from '../strings';
import { conversations, markConversationRead } from '../chatData';
import type { Conversation } from '../chatData';
import { useChatUnread } from '../useChatUnread';
import { ChatThread } from './ChatThread';
import { useUI } from '../ui';
import { haptic } from '../tokens';

/**
 * Communication centre — Apple Messages minimalist chat list.
 */
export function ChatList({ backTitle }: { backTitle: string }) {
  const ui = useUI();
  const [query, setQuery] = useState('');
  // Subscribing keeps the unread badges correct after a thread is read.
  useChatUnread();

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter(
      (conversation) =>
        conversation.name.toLowerCase().includes(needle) ||
        conversation.subtitle.toLowerCase().includes(needle)
    );
  }, [query]);

  function open(conversation: Conversation) {
    haptic('light');
    markConversationRead(conversation.id);
    ui.push({
      key: `chat-${conversation.id}`,
      backTitle: t.chatTitle,
      node: <ChatThread conversationId={conversation.id} />
    });
  }

  const groups: { header: string; items: Conversation[] }[] = [
    { header: t.chatSectionLearning, items: matches.filter((c) => c.kind === 'group' || c.kind === 'teacher') },
    { header: t.chatSectionSupport, items: matches.filter((c) => c.kind === 'support') },
    { header: t.chatSectionAdmin, items: matches.filter((c) => c.kind === 'admin') }
  ].filter((group) => group.items.length > 0);

  return (
    <PushScreen title={t.chatTitle} backTitle={backTitle} onBack={ui.pop}>
      <div className="px-4 pb-2 pt-1">
        <label className="flex h-[38px] items-center gap-2.5 rounded-xl bg-slate-100 px-3.5 dark:bg-slate-800/80">
          <SearchIcon size={16} className="shrink-0 text-mutedfg" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.chatSearch}
            className="h-full w-full bg-transparent font-sans text-xs sm:text-sm text-foreground outline-none placeholder:text-mutedfg"
          />
        </label>
      </div>

      {conversations.length === 0 ? (
        <EmptyState icon={MessagesSquareIcon} title={t.chatEmptyTitle} body={t.chatEmptyBody} />
      ) : groups.length === 0 ? (
        <EmptyState icon={SearchIcon} title={t.chatSearchEmpty} compact />
      ) : (
        <div className="space-y-6 pt-1 pb-12">
          {groups.map((group) => (
            <section key={group.header} className="px-4">
              <h2 className="mb-2 px-1 font-sans text-xs font-bold uppercase tracking-wider text-mutedfg">
                {group.header}
              </h2>
              <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800/90 dark:bg-slate-900">
                {group.items.map((conversation, i) => (
                  <ConversationRow
                    key={conversation.id}
                    conversation={conversation}
                    last={i === group.items.length - 1}
                    onOpen={() => open(conversation)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </PushScreen>
  );
}

function ConversationRow({
  conversation,
  last,
  onOpen
}: {
  conversation: Conversation;
  last: boolean;
  onOpen: () => void;
}) {
  const lastMsg = conversation.messages[conversation.messages.length - 1];
  const preview =
    lastMsg === undefined
      ? ''
      : lastMsg.system
      ? lastMsg.text
      : lastMsg.senderName === null
      ? `${t.chatYou}: ${lastMsg.text}`
      : conversation.kind === 'group'
      ? `${lastMsg.senderName.split(' ')[0]}: ${lastMsg.text}`
      : lastMsg.text;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-3.5 px-4 text-left transition-colors duration-150 active:bg-slate-100/60 dark:active:bg-slate-800/60"
    >
      {/* Avatar with optional online presence badge */}
      <div className="relative shrink-0 py-3">
        <ConversationAvatar conversation={conversation} size={40} />
        {conversation.online && (
          <span className="absolute bottom-3 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 ring-1 ring-emerald-500/20 dark:border-slate-900" />
        )}
      </div>

      {/* Message Info Column */}
      <div
        className={[
          'flex min-h-[64px] min-w-0 flex-1 flex-col justify-center py-3 pr-1',
          last ? '' : 'border-b border-hairline'
        ].join(' ')}
      >
        {/* Top line: Name + Timestamp */}
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-sans text-sm font-semibold text-foreground">
            {conversation.name}
          </span>
          <span className="shrink-0 font-sans text-[11px] font-medium tabular-nums text-mutedfg">
            {conversation.lastTime}
          </span>
        </div>

        {/* Bottom line: Preview text with clean ellipsis + Unread counter */}
        <div className="mt-1 flex items-center justify-between gap-2">
          <span
            className={[
              'truncate font-sans text-xs',
              conversation.unread > 0
                ? 'font-medium text-foreground'
                : 'text-mutedfg'
            ].join(' ')}
          >
            {preview}
          </span>

          {conversation.unread > 0 && (
            <span className="flex h-4.5 min-w-[18px] shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 font-sans text-[10px] font-bold text-white shadow-xs">
              {conversation.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
