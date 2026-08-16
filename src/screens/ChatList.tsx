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

/**
 * Communication centre. The student does not search a global directory — the
 * conversations here come from their enrolment: group, teacher, support, admin.
 */
export function ChatList({ backTitle }: {backTitle: string;}) {
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
    markConversationRead(conversation.id);
    ui.push({
      key: `chat-${conversation.id}`,
      backTitle: t.chatTitle,
      node: <ChatThread conversationId={conversation.id} />
    });
  }

  const groups: {header: string;items: Conversation[];}[] = [
  { header: t.chatSectionLearning, items: matches.filter((c) => c.kind === 'group' || c.kind === 'teacher') },
  { header: t.chatSectionSupport, items: matches.filter((c) => c.kind === 'support') },
  { header: t.chatSectionAdmin, items: matches.filter((c) => c.kind === 'admin') }].
  filter((group) => group.items.length > 0);

  return (
    <PushScreen title={t.chatTitle} backTitle={backTitle} onBack={ui.pop}>
      <div className="px-4 pb-2 pt-1">
        <label className="flex h-[36px] items-center gap-2 rounded-input bg-secondary px-3">
          <SearchIcon size={16} className="shrink-0 text-mutedfg" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.chatSearch}
            className="h-full w-full bg-transparent font-sans text-subhead text-foreground outline-none placeholder:text-mutedfg" />

        </label>
      </div>

      {conversations.length === 0 ?
      <EmptyState icon={MessagesSquareIcon} title={t.chatEmptyTitle} body={t.chatEmptyBody} /> :
      groups.length === 0 ?
      <EmptyState icon={SearchIcon} title={t.chatSearchEmpty} compact /> :

      <div className="space-y-6 pt-2">
          {groups.map((group) =>
        <section key={group.header} className="px-4">
              <h2 className="mb-2 px-1 font-sans text-section font-semibold uppercase text-mutedfg">
                {group.header}
              </h2>
              <div className="overflow-hidden rounded-card border border-cardborder bg-card">
                {group.items.map((conversation, i) =>
            <ConversationRow
              key={conversation.id}
              conversation={conversation}
              last={i === group.items.length - 1}
              onOpen={() => open(conversation)} />

            )}
              </div>
            </section>
        )}
        </div>
      }
    </PushScreen>);

}

function ConversationRow({
  conversation,
  last,
  onOpen




}: {conversation: Conversation;last: boolean;onOpen: () => void;}) {
  const last_ = conversation.messages[conversation.messages.length - 1];
  const preview =
  last_ === undefined ?
  '' :
  last_.system ?
  last_.text :
  last_.senderName === null ?
  `${t.chatYou}: ${last_.text}` :
  conversation.kind === 'group' ?
  `${last_.senderName.split(' ')[0]}: ${last_.text}` :
  last_.text;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 pl-4 text-left transition-[transform,opacity] duration-100 ease-out active:scale-[0.99] active:opacity-80">

      <span className="relative shrink-0">
        <ConversationAvatar conversation={conversation} size={40} />
        {conversation.online &&
        <span className="absolute bottom-0 right-0 h-[11px] w-[11px] rounded-full border-2 border-card bg-good" />
        }
      </span>
      <span
        className={[
        'flex min-h-[64px] flex-1 items-center gap-3 py-3 pr-4',
        last ? '' : 'border-b border-hairline'].
        join(' ')}>

        <span className="min-w-0 flex-1">
          <span className="block truncate font-sans text-headline font-semibold text-foreground">
            {conversation.name}
          </span>
          <span
            className={[
            'mt-[2px] block truncate font-sans text-subhead',
            conversation.unread > 0 ? 'text-foreground/80' : 'text-mutedfg'].
            join(' ')}>

            {preview}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-[6px]">
          <span className="font-sans text-caption tabular-nums text-mutedfg">
            {conversation.lastTime}
          </span>
          {conversation.unread > 0 &&
          <span className="flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-primary px-[6px] font-sans text-caption font-semibold tabular-nums text-primaryfg">
              {conversation.unread}
            </span>
          }
        </span>
      </span>
    </button>);

}

