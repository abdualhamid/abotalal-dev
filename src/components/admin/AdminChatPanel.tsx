import { uploadToBucket } from '@/lib/uploadFile';
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, ArrowRight, Paperclip, FileText, Download, Search, Plus, RefreshCw, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useAdminChat } from '@/hooks/useAdminChat';
import { useAuth } from '@/contexts/AuthContext';
import { type ChatMessage } from '@/lib/chat';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

const AdminChatPanel: React.FC = () => {
  const { user } = useAuth();
  const { chatUsers, messages, selectedUserId, setSelectedUserId, sendMessage, isLoading, isMessagesLoading, error, refetch } = useAdminChat();
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const [showUsers, setShowUsers] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewMedia, setPreviewMedia] = useState<string | null>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages]);
  const openConversation = (id: string | null) => { setSelectedUserId(id); setNewMessage(''); };
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedUserId || isSending || isUploading) return;
    setIsSending(true);
    try {
      const { error: sendError } = await sendMessage(selectedUserId, newMessage.trim());
      if (sendError) toast({ title: 'تعذر إرسال الرسالة', description: 'لم تُرسل رسالتك. أعد المحاولة.', variant: 'destructive' });
      else setNewMessage('');
    } finally { setIsSending(false); }
  };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !selectedUserId || isUploading) return;
    const receiverId = selectedUserId;
    setIsUploading(true);
    try {
      const { url, error: uploadError } = await uploadToBucket('chat-media', file, user.id);
      if (uploadError || !url) { toast({ title: 'تعذر رفع الملف', description: uploadError || 'أعد المحاولة', variant: 'destructive' }); return; }
      const media_type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'file';
      const { error: sendError } = await sendMessage(receiverId, file.name, { media_url: url, media_type, file_name: file.name });
      if (sendError) toast({ title: 'تعذر إرسال الملف', description: 'أعد اختيار الملف والمحاولة.', variant: 'destructive' });
    } finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };
  const renderMedia = (msg: ChatMessage) => {
    if (!msg.media_url) return null;
    if (msg.media_type === 'image') return <img src={msg.media_url} alt={msg.file_name || 'صورة مرفقة'} className="max-w-full w-52 rounded-lg mt-1 cursor-pointer" onClick={() => setPreviewMedia(msg.media_url || null)} />;
    if (msg.media_type === 'video') return <video src={msg.media_url} controls className="max-w-full w-60 rounded-lg mt-1" />;
    if (msg.media_type === 'audio') return <audio src={msg.media_url} controls className="mt-1 w-60 max-w-full" />;
    return <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-1 p-2 bg-background/30 rounded-lg"><FileText className="w-4 h-4 shrink-0" /><span className="text-xs break-all">{msg.file_name}</span><Download className="w-3 h-3 shrink-0" /></a>;
  };
  const selectedUser = chatUsers.find(u => u.user_id === selectedUserId);
  const filteredUsers = chatUsers.filter(u => (showUsers || u.lastMessageAt) && `${u.name} ${u.email || ''}`.toLowerCase().includes(search.toLowerCase()));
  const unread = chatUsers.reduce((total, u) => total + u.unreadCount, 0);

  return <section className="space-y-4" dir="rtl" aria-label="محادثات العملاء">
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <h2 className="text-lg font-bold flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" />المراسلات{unread > 0 && <Badge variant="destructive">{unread}</Badge>}</h2>
      <div className="flex gap-2"><Button variant="outline" size="icon" aria-label="تحديث المحادثات" title="تحديث المحادثات" onClick={() => { void refetch(); }}><RefreshCw className="w-4 h-4" /></Button><Button onClick={() => { openConversation(null); setShowUsers(true); }}><Plus className="w-4 h-4 ml-2" />رسالة جديدة</Button></div>
    </div>
    {error && <div role="alert" className="text-sm text-destructive">{error}</div>}
    {!selectedUserId ? <>
      <div className="flex gap-2 flex-wrap"><Button variant={!showUsers ? 'default' : 'outline'} onClick={() => setShowUsers(false)}>المحادثات</Button><Button variant={showUsers ? 'default' : 'outline'} onClick={() => setShowUsers(true)}>جميع المستخدمين</Button></div>
      <div className="relative"><Search className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" /><Input aria-label="البحث عن مستخدم" value={search} onChange={e => setSearch(e.target.value)} placeholder="البحث بالاسم أو البريد الإلكتروني" className="pr-9" /></div>
      {isLoading ? <p className="text-muted-foreground text-center py-12">جاري تحميل المحادثات...</p> : filteredUsers.length === 0 ? <div className="py-12 text-center text-muted-foreground"><MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>{showUsers ? 'لا توجد نتائج' : 'لا توجد محادثات حالياً'}</p></div> : <div className="divide-y divide-border">{filteredUsers.map(chatUser => <Button key={chatUser.user_id} variant="ghost" onClick={() => openConversation(chatUser.user_id)} className="w-full h-auto justify-start gap-3 p-4 rounded-lg text-right">
        <Avatar className="w-10 h-10 shrink-0"><AvatarImage src={chatUser.avatar_url || undefined} /><AvatarFallback>{chatUser.name.charAt(0)}</AvatarFallback></Avatar>
        <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="font-semibold truncate">{chatUser.name}</span>{chatUser.unreadCount > 0 && <Badge variant="destructive">{chatUser.unreadCount}</Badge>}</div><p className="text-sm text-muted-foreground truncate font-normal">{chatUser.lastMessage || chatUser.email || 'بدء محادثة'}</p></div>
      </Button>)}</div>}
    </> : <>
      <div className="flex items-center gap-3 border-b border-border pb-3"><Button variant="ghost" size="icon" aria-label="العودة للمحادثات" disabled={isSending || isUploading} onClick={() => openConversation(null)}><ArrowRight className="w-4 h-4" /></Button><Avatar className="w-9 h-9 shrink-0"><AvatarImage src={selectedUser?.avatar_url || undefined} /><AvatarFallback>{selectedUser?.name.charAt(0) || 'م'}</AvatarFallback></Avatar><div className="min-w-0"><h3 className="font-semibold truncate">{selectedUser?.name || 'مستخدم'}</h3><p className="text-xs text-muted-foreground truncate">{selectedUser?.email}</p></div></div>
      <div className="h-[400px] overflow-y-auto space-y-3 p-3 border border-border rounded-lg bg-card" aria-live="polite">
        {isMessagesLoading ? <p className="text-center text-muted-foreground py-10">جاري تحميل الرسائل...</p> : messages.length === 0 ? <p className="text-center text-muted-foreground py-10">لا توجد رسائل في هذه المحادثة</p> : messages.map(msg => <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] min-w-0 rounded-lg px-4 py-2 ${msg.sender_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
          {!msg.media_url && <p className="text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{msg.content}</p>}{renderMedia(msg)}<div className="flex gap-2 items-center text-[10px] opacity-70 mt-1"><span>{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ar })}</span>{msg.sender_id === user?.id && (msg.is_read ? <CheckCheck className="w-3 h-3" aria-label="مقروءة" /> : <Check className="w-3 h-3" aria-label="مرسلة" />)}</div>
        </div></div>)}<div ref={messagesEndRef} />
      </div>
      <form className="flex gap-2" onSubmit={e => { e.preventDefault(); void handleSend(); }}><Button type="button" variant="ghost" size="icon" aria-label="إرفاق ملف" title="إرفاق ملف" onClick={() => fileInputRef.current?.click()} disabled={isUploading || isSending}><Paperclip className="w-4 h-4" /></Button><input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip" onChange={handleFileUpload} /><Input aria-label="نص الرسالة" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder={isUploading ? 'جاري رفع الملف...' : 'اكتب رسالتك...'} className="flex-1 min-w-0" disabled={isUploading || isSending} /><Button type="submit" size="icon" aria-label="إرسال الرسالة" title="إرسال الرسالة" disabled={!newMessage.trim() || isUploading || isSending}><Send className="w-4 h-4" /></Button></form>
    </>}
    <Dialog open={Boolean(previewMedia)} onOpenChange={open => { if (!open) setPreviewMedia(null); }}><DialogContent><DialogTitle>الصورة المرفقة</DialogTitle>{previewMedia && <img src={previewMedia} alt="الصورة المرفقة" className="w-full max-h-[70vh] object-contain" />}</DialogContent></Dialog>
  </section>;
};
export default AdminChatPanel;
