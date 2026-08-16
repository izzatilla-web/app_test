import { useEffect, useReducer, useState } from 'react';
import { subscribeChat, totalUnread } from './chatData';

/** Live unread count for the header badge and the conversation list. */
export function useChatUnread(): number {
  const [count, setCount] = useState(totalUnread);
  useEffect(() => subscribeChat(() => setCount(totalUnread())), []);
  return count;
}

/**
 * Re-renders on any chat mutation. Unread-count subscribers bail out when a
 * message is merely appended, so threads need this instead.
 */
export function useChatVersion(): number {
  const [version, bump] = useReducer((n: number) => n + 1, 0);
  useEffect(() => subscribeChat(bump), []);
  return version;
}
