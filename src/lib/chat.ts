export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  media_url?: string | null;
  media_type?: string | null;
  file_name?: string | null;
}

interface ChatProfile {
  user_id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
}

export function buildChatUsers(adminId: string, profiles: ChatProfile[], messages: ChatMessage[]) {
  const ownMessages = messages.filter(m => m.sender_id === adminId || m.receiver_id === adminId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const people = new Map(profiles.filter(p => p.user_id !== adminId).map(p => [p.user_id, p]));
  for (const m of ownMessages) {
    const id = m.sender_id === adminId ? m.receiver_id : m.sender_id;
    if (id !== adminId && !people.has(id)) people.set(id, { user_id: id, name: 'مستخدم', email: null, avatar_url: null });
  }
  return [...people.values()].map(p => {
    const conversation = ownMessages.filter(m => m.sender_id === p.user_id || m.receiver_id === p.user_id);
    return {
      ...p,
      lastMessage: conversation[0]?.file_name || conversation[0]?.content,
      lastMessageAt: conversation[0]?.created_at,
      unreadCount: conversation.filter(m => m.receiver_id === adminId && !m.is_read).length,
    };
  }).sort((a, b) => (b.lastMessageAt || '').localeCompare(a.lastMessageAt || '') || a.name.localeCompare(b.name, 'ar'));
}
