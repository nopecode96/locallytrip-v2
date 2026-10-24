'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  X,
  Send,
  MessageCircle,
  Users,
  Loader2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { getMeetupMessages, sendMeetupMessage } from '@/actions/community/meetups';
import { realtimeEmitter, ChatMessagePayload } from '@/lib/realtime';

export interface MeetupChatMessage {
  id: number;
  meetupId: number;
  userId: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    username: string | null;
    avatarUrl: string | null;
    isVerified: boolean;
  };
}

interface MeetupGroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetupId: number;
  meetupTitle: string;
  currentUserId: number;
  currentUserName: string;
  currentUserAvatar?: string | null;
  locale?: string;
}

export function MeetupGroupChatModal({
  isOpen,
  onClose,
  meetupId,
  meetupTitle,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  locale = 'id',
}: MeetupGroupChatModalProps) {
  const isId = locale === 'id';
  const [messages, setMessages] = useState<MeetupChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Muat pesan dari database saat modal dibuka
  useEffect(() => {
    if (!isOpen || !meetupId) return;

    let isMounted = true;
    setIsLoading(true);

    getMeetupMessages(meetupId)
      .then((res) => {
        if (isMounted && res.success && res.messages) {
          setMessages(res.messages as MeetupChatMessage[]);
          setTimeout(scrollToBottom, 100);
        }
      })
      .catch((err) => console.error('Failed to fetch messages:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, meetupId]);

  // Langganan Event WebSocket / Real-time Message Bus
  useEffect(() => {
    if (!isOpen || !meetupId) return;

    const unsubscribe = realtimeEmitter.subscribe(
      'chat:new_message',
      (payload: ChatMessagePayload) => {
        if (payload.meetupId === meetupId) {
          setMessages((prev) => {
            // Hindari duplikasi pesan jika sudah ada
            if (prev.some((m) => m.id === payload.messageId)) return prev;
            return [
              ...prev,
              {
                id: payload.messageId,
                meetupId: payload.meetupId,
                userId: payload.senderId,
                content: payload.content,
                createdAt: payload.createdAt,
                user: {
                  id: payload.senderId,
                  name: payload.senderName,
                  username: null,
                  avatarUrl: payload.senderAvatar,
                  isVerified: false,
                },
              },
            ];
          });
          setTimeout(scrollToBottom, 50);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isOpen, meetupId]);

  if (!isOpen) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const contentToSend = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      const res = await sendMeetupMessage(meetupId, contentToSend);
      if (res.success && res.message) {
        const msg = res.message as MeetupChatMessage;
        setMessages((prev) => [...prev, msg]);
        setTimeout(scrollToBottom, 50);

        // Pancarkan event real-time ke semua tab/window
        realtimeEmitter.emit('chat:new_message', {
          meetupId,
          messageId: msg.id,
          senderId: msg.userId,
          senderName: msg.user.name,
          senderAvatar: msg.user.avatarUrl,
          content: msg.content,
          createdAt: msg.createdAt,
        });
      } else if (res.error) {
        alert(res.error);
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      alert(err?.message || (isId ? 'Gagal mengirim pesan.' : 'Failed to send message.'));
    } finally {
      setIsSending(false);
    }
  };

  const getAvatar = (url: string | null) => {
    if (!url) return '/images/default.jpg';
    if (url.startsWith('http') || url.startsWith('/')) return url;
    return `/images/users/avatars/${url}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full h-[85vh] max-h-[640px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden relative">
        {/* Header Modal Chat */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <MessageCircle className="w-5 h-5 text-purple-700" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                  {isId ? 'Obrolan Meja' : 'Table Chat'}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Real-Time
                </span>
              </div>
              <h3 className="font-serif font-bold text-sm sm:text-base text-slate-900 truncate mt-0.5">
                {meetupTitle}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Area Percakapan */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/40">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
              <span>{isId ? 'Memuat pesan obrolan meja...' : 'Loading messages...'}</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-xs text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-purple-100/60 flex items-center justify-center text-purple-700 text-xl">
                💬
              </div>
              <p className="font-semibold text-slate-700">
                {isId ? 'Belum ada obrolan di meja ini' : 'No messages at this table yet'}
              </p>
              <p className="text-[11px] max-w-xs text-slate-500">
                {isId
                  ? 'Sapa sesama traveler yang sudah bergabung ke meja temu ini!'
                  : 'Say hello to fellow explorers who joined this table!'}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.userId === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2.5 ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMine && (
                    <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 border border-slate-200">
                      <Image
                        src={getAvatar(msg.user.avatarUrl)}
                        alt={msg.user.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}

                  <div className={`max-w-[78%] space-y-1 ${isMine ? 'items-end' : 'items-start'}`}>
                    {!isMine && (
                      <span className="text-[10px] font-bold text-slate-500 block px-1">
                        {msg.user.name}
                      </span>
                    )}
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isMine
                          ? 'bg-purple-900 text-white rounded-br-xs shadow-xs'
                          : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs shadow-2xs'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>
                    <span
                      className={`text-[9px] text-slate-400 block px-1 ${
                        isMine ? 'text-right' : 'text-left'
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Kirim Pesan */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isId ? 'Tulis pesan untuk anggota meja...' : 'Write a message to table members...'
            }
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-2.5 rounded-xl bg-purple-900 hover:bg-purple-950 disabled:bg-slate-200 text-white disabled:text-slate-400 transition cursor-pointer shrink-0"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
