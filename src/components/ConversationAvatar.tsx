import { UsersIcon } from 'lucide-react';
import { Avatar } from './Avatar';
import type { Conversation } from '../chatData';

/** Groups get an icon tile; people get their avatar. */
export function ConversationAvatar({
  conversation,
  size



}: {conversation: Conversation;size: 32 | 40;}) {
  if (conversation.kind === 'group') {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-full bg-primary/[0.14]"
        style={{ width: size, height: size }}>

        <UsersIcon size={size === 40 ? 20 : 16} className="text-primary" />
      </span>);

  }
  return <Avatar name={conversation.name} seed={conversation.seed} size={size} />;
}
