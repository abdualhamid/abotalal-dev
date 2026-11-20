import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { buildChatUsers, type ChatMessage } from '@/lib/chat';

export const useAdminChat = () => {
  const { user } = useAuth();
  const [chatUsers, setChatUsers] = useState<ReturnType<typeof buildChatUsers>>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedUserId, selectUser] = useState<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChatUsers = useCallback(async () => {
    if (!user) { setIsLoading(false); return; }
    const [messageResult, profileResult] = await Promise.all([
      supabase.from('messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at', { ascending: false }),
      supabase.from('profiles').select('user_id,name,email,avatar_url').neq('user_id', user.id).order('name'),
    ]);
    if (messageResult.error || profileResult.error) {
      setError('تعذر تحميل المحادثات والمستخدمين. أعد المحاولة.');
    } else {
      setChatUsers(buildChatUsers(user.id, profileResult.data || [], messageResult.data || []));
      setError(null);
    }
    setIsLoading(false);
  }, [user?.id]);

  const fetchMessages = useCallback(async (otherUserId: string) => {
    if (!user) return;
    const { data, error: fetchError } = await supabase.from('messages').select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    if (selectedRef.current !== otherUserId) return;
    setIsMessagesLoading(false);
    if (fetchError) { setError('تعذر تحميل الرسائل. أعد المحاولة.'); return; }
    setMessages(data || []);
    const unreadIds = (data || []).filter(m => m.receiver_id === user.id && !m.is_read).map(m => m.id);
    if (unreadIds.length) {
      const { error: readError } = await supabase.from('messages').update({ is_read: true }).eq('receiver_id', user.id).in('id', unreadIds);
      if (!readError) setChatUsers(prev => prev.map(p => p.user_id === otherUserId ? { ...p, unreadCount: 0 } : p));
    }
  }, [user?.id]);

  const setSelectedUserId = (id: string | null) => {
    selectedRef.current = id;
    selectUser(id);
    setMessages([]);
    setIsMessagesLoading(Boolean(id));
    setError(null);
  };

  const sendMessage = async (receiverId: string, content: string, media?: { media_url: string; media_type: string; file_name: string }) => {
    if (!user) return { error: new Error('يرجى تسجيل الدخول') };
    const { error: sendError } = await supabase.from('messages').insert({
      sender_id: user.id, receiver_id: receiverId, subject: media ? 'ملف' : 'رسالة', content, ...media,
    });
    if (!sendError) {
      await Promise.all([fetchChatUsers(), selectedRef.current === receiverId ? fetchMessages(receiverId) : Promise.resolve()]);
    }
    return { error: sendError };
  };

  useEffect(() => {
    if (!user) return;
    void fetchChatUsers();
    const refresh = () => {
      void fetchChatUsers();
      if (selectedRef.current) void fetchMessages(selectedRef.current);
    };
    const channel = supabase.channel(`admin-chat-${user.id}-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `sender_id=eq.${user.id}` }, refresh)
      .subscribe();
    const timer = window.setInterval(refresh, 15000);
    return () => { window.clearInterval(timer); void supabase.removeChannel(channel); };
  }, [user?.id, fetchChatUsers, fetchMessages]);

  useEffect(() => { if (selectedUserId) void fetchMessages(selectedUserId); }, [selectedUserId, fetchMessages]);

  return { chatUsers, messages, selectedUserId, setSelectedUserId, sendMessage, isLoading, isMessagesLoading, error, refetch: fetchChatUsers };
};
