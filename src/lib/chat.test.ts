import { test, expect } from 'bun:test';
import { buildChatUsers, type ChatMessage } from './chat';
const profiles = [
  { user_id: 'admin', name: 'إدارة', email: null, avatar_url: null },
  { user_id: 'client', name: 'عميل', email: null, avatar_url: null },
  { user_id: 'new', name: 'جديد', email: null, avatar_url: null },
];
const message = (id: string, sender_id: string, receiver_id: string, is_read = false): ChatMessage => ({ id, sender_id, receiver_id, is_read, subject: 'رسالة', content: id, created_at: '2026-11-20T11:37:00Z' });
test('admin can start a conversation with a registered user who has no messages', () => {
  expect(buildChatUsers('admin', profiles, []).map(p => p.user_id)).toEqual(['new', 'client']);
});
test('incoming unread client messages are counted, sent and read messages are not', () => {
  const rows = buildChatUsers('admin', profiles, [message('incoming', 'client', 'admin'), message('sent', 'admin', 'client'), message('read', 'client', 'admin', true)]);
  expect(rows.find(p => p.user_id === 'client')?.unreadCount).toBe(1);
});
test('other conversations do not appear in the admin client thread', () => {
  const rows = buildChatUsers('admin', profiles, [message('private', 'client', 'new')]);
  expect(rows.find(p => p.user_id === 'client')?.lastMessage).toBeUndefined();
});
