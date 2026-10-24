'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserAvatar } from '@/components/common/UserAvatar';
import {
  MessageSquare,
  Send,
  Loader2,
  ShieldCheck,
  Search,
  ArrowLeft,
  ArrowRight,
  Compass,
  Ticket,
} from 'lucide-react';
import {
  UserConversationSummary,
  ConversationDetail,
  sendDirectMessage,
  getConversationDetail,
} from '@/actions/messages/direct';

export interface ContextItem {
  type?: 'experience' | 'booking';
  title: string;
  slug: string;
  reference?: string | null;
  status?: string | null;
}

interface MessagesClientProps {
  locale: string;
  currentUserId: number;
  currentUserName: string;
  currentUserAvatar?: string | null;
  initialConversations: UserConversationSummary[];
  initialActiveConversationId: number | null;
  initialConversationDetail: ConversationDetail | null;
  returnUrl?: string | null;
  initialContextItem?: ContextItem | null;
}

export function MessagesClient({
  locale,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  initialConversations,
  initialActiveConversationId,
  initialConversationDetail,
  returnUrl,
  initialContextItem,
}: MessagesClientProps) {
  const isId = locale === 'id';
  const router = useRouter();
  const searchParams = useSearchParams();

  // Ambil returnUrl dari props atau searchParams
  const activeReturnUrl = returnUrl || searchParams.get('returnUrl');

  const [conversations, setConversations] = useState<UserConversationSummary[]>(initialConversations);
  const [activeId, setActiveId] = useState<number | null>(initialActiveConversationId);
  const [conversationDetail, setConversationDetail] = useState<ConversationDetail | null>(
    initialConversationDetail
  );
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contextItem, setContextItem] = useState<ContextItem | null>(initialContextItem || null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll hanya di dalam kontainer chat lokal tanpa menyeret window
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    } else if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [conversationDetail?.messages]);

  // Logika Navigasi Back Cerdas
  const handleBack = () => {
    if (activeReturnUrl) {
      router.push(activeReturnUrl);
    } else if (typeof window !== 'undefined' && window.history.length > 2) {
      router.back();
    } else {
      router.push(`/${locale}/dashboard`);
    }
  };

  // Saat berpindah percakapan (cegah window scroll jump)
  const handleSelectConversation = async (convId: number) => {
    if (convId === activeId && conversationDetail) return;
    setActiveId(convId);

    // Update URL tanpa memicu window scroll
    const currentParams = new URLSearchParams(searchParams ? searchParams.toString() : '');
    currentParams.set('c', convId.toString());
    router.push(`?${currentParams.toString()}`, { scroll: false });

    setIsLoadingDetail(true);

    try {
      const res = await getConversationDetail(convId);
      if (res.success && res.conversation) {
        setConversationDetail(res.conversation);
        // Tandai unreadCount jadi 0 pada state lokal
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
        );
      }
    } catch (e) {
      console.error('Failed to load conversation:', e);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Kirim pesan
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId || !inputText.trim() || isSending) return;

    const contentToSend = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      const res = await sendDirectMessage(activeId, contentToSend);
      if (res.success && res.message) {
        // Update pesan di percakapan aktif
        setConversationDetail((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, res.message!],
          };
        });

        // Update cuplikan pesan di sidebar daftar percakapan
        setConversations((prev) => {
          const target = prev.find((c) => c.id === activeId);
          if (!target) return prev;
          const updated = {
            ...target,
            lastMessage: {
              id: res.message!.id,
              content: contentToSend,
              createdAt: res.message!.createdAt,
              isRead: false,
              isSenderMe: true,
            },
            updatedAt: new Date().toISOString(),
          };
          return [updated, ...prev.filter((c) => c.id !== activeId)];
        });
      }
    } catch (e) {
      console.error('Failed to send message:', e);
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.participant.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAvatarUrl = (url: string | null | undefined) => {
    if (!url) return '/images/placeholders/avatar-default.png';
    if (url.startsWith('http') || url.startsWith('/')) return url;
    return `/images/users/avatars/${url}`;
  };

  const activeRecipient = conversationDetail?.participant;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* 1. Header Navigasi Atas & Back Button Kontekstual */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 tracking-tight">
            {isId ? 'Pesan & Obrolan' : 'Messages & Chat'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isId
              ? 'Komunikasi langsung dengan host dan sesama petualang'
              : 'Direct communication with hosts and fellow explorers'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-purple-700 bg-white px-4 py-2.5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-purple-200 hover:bg-purple-50/50 transition-all cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4 text-purple-700" />
          <span>
            {activeReturnUrl
              ? isId ? 'Kembali ke Halaman Sebelumnya' : 'Back to Previous Page'
              : isId ? 'Kembali' : 'Back'}
          </span>
        </button>
      </div>

      {/* 2. Main Chat Interface Kontainer Standar (Fixed Height Isolation) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-12 h-[calc(100vh-14rem)] min-h-[600px] max-h-[800px] overflow-hidden">
        {/* ======================================================== */}
        {/* PANEL KIRI: DAFTAR PERCAKAPAN (md:col-span-4 lg:col-span-4) */}
        {/* ======================================================== */}
        <aside
          className={`md:col-span-4 lg:col-span-4 border-r border-slate-100 flex flex-col h-full bg-slate-50/50 min-h-0 ${
            activeId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header Search */}
          <div className="p-4 border-b border-slate-100 bg-white shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isId ? 'Cari percakapan...' : 'Search conversations...'}
                className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-800 placeholder:text-slate-400 transition"
              />
            </div>
          </div>

          {/* DAFTAR KONTAK: wajib flex-1 min-h-0 overflow-y-auto overscroll-contain */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 overscroll-contain">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                {isId ? 'Belum ada percakapan.' : 'No conversations yet.'}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === activeId;
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`w-full p-4 text-left transition-colors flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50/70 border-l-4 border-purple-600'
                        : 'bg-transparent hover:bg-slate-100/60'
                    }`}
                  >
                    <UserAvatar
                      src={conv.participant.avatar_url}
                      name={conv.participant.name}
                      size={44}
                      className="ring-2 ring-white"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-slate-900 truncate flex items-center gap-1">
                          {conv.participant.name}
                          {conv.participant.is_verified && (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline shrink-0" />
                          )}
                        </span>
                        {conv.lastMessage && (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {conv.lastMessage
                          ? `${conv.lastMessage.isSenderMe ? (isId ? 'Anda: ' : 'You: ') : ''}${conv.lastMessage.content}`
                          : (isId ? 'Percakapan baru dimulai' : 'Conversation started')}
                      </p>

                      {conv.unreadCount > 0 && (
                        <div className="mt-1 flex justify-end">
                          <span className="px-2 py-0.5 rounded-full bg-purple-700 text-white font-bold text-[10px]">
                            {conv.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ======================================================== */}
        {/* PANEL KANAN: RUANG OBROLAN AKTIF (md:col-span-8 lg:col-span-8) */}
        {/* ======================================================== */}
        <main
          className={`md:col-span-8 lg:col-span-8 flex flex-col h-full bg-white min-h-0 ${
            !activeId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeId && activeRecipient ? (
            <>
              {/* 1. Header Lawan Bicara Lengkap: shrink-0 */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveId(null)}
                    className="p-1.5 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <UserAvatar
                    src={activeRecipient.avatar_url}
                    name={activeRecipient.name}
                    size={44}
                    className="border border-slate-100"
                  />

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {activeRecipient.name}
                      </h2>
                      {activeRecipient.role?.toLowerCase() === 'host' ? (
                        <span className="text-[10px] font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                          Local Host
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                          Traveler
                        </span>
                      )}
                      {activeRecipient.role?.toLowerCase() === 'host' && activeRecipient.is_verified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>KYC Verified</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      {isId ? 'Aktif sekarang' : 'Active now'}
                    </p>
                  </div>
                </div>

                {/* Profil Link */}
                <Link
                  href={`/${locale}/users/${activeRecipient.username || activeRecipient.id}`}
                  className="text-xs font-semibold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-3.5 py-2 rounded-xl border border-purple-100/60 transition-colors cursor-pointer"
                >
                  {isId ? 'Lihat Profil' : 'View Profile'}
                </Link>
              </div>

              {/* 2. Pinned Context Banner (Jika chat terkait Tur/Experience atau Booking): shrink-0 */}
              {contextItem && (
                <div className="px-6 py-2.5 bg-purple-50/70 border-b border-purple-100/80 flex items-center justify-between text-xs text-slate-700 shrink-0">
                  <div className="flex items-center gap-2 truncate">
                    {contextItem.type === 'booking' ? (
                      <>
                        <Ticket className="w-4 h-4 text-purple-600 shrink-0" />
                        <span className="font-bold text-purple-900 shrink-0">
                          {isId ? 'Pesanan #' : 'Booking #'}{contextItem.reference}
                        </span>
                        {contextItem.status && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                            contextItem.status === 'confirmed' || contextItem.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {contextItem.status}
                          </span>
                        )}
                        <span className="text-slate-400 hidden sm:inline">•</span>
                        <span className="truncate text-slate-800 font-medium hidden sm:inline">
                          {contextItem.title}
                        </span>
                      </>
                    ) : (
                      <>
                        <Compass className="w-4 h-4 text-purple-600 shrink-0" />
                        <span className="font-semibold text-purple-800 shrink-0">
                          {isId ? 'Pertanyaan seputar:' : 'Inquiry regarding:'}
                        </span>
                        <span className="truncate text-slate-800 font-medium">
                          {contextItem.title}
                        </span>
                      </>
                    )}
                  </div>
                  {contextItem.slug && (
                    <Link
                      href={`/${locale}/experiences/${contextItem.slug}`}
                      className="text-purple-700 font-semibold hover:underline shrink-0 ml-3 inline-flex items-center gap-1 text-xs"
                    >
                      <span>{isId ? 'Lihat Detail Tur' : 'View Tour Details'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              )}

              {/* 3. Area Pesan (Scrollable Chat Bubbles): flex-1 min-h-0 overflow-y-auto overscroll-contain */}
              <div
                ref={messagesContainerRef}
                className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4 bg-slate-50/30 overscroll-contain"
              >
                {isLoadingDetail ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 text-purple-700 animate-spin" />
                  </div>
                ) : conversationDetail.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-medium max-w-xs">
                      {isId
                        ? 'Belum ada pesan. Sampaikan sapaan hangat pertama Anda!'
                        : 'No messages yet. Send your first warm greeting!'}
                    </p>
                  </div>
                ) : (
                  conversationDetail.messages.map((msg) => {
                    const isMine = msg.senderId === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            isMine
                              ? 'bg-purple-600 text-white rounded-br-xs shadow-xs font-normal'
                              : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs shadow-2xs'
                          }`}
                        >
                          <p className="whitespace-pre-line">{msg.content}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* 4. Input Bar Pengiriman Pesan: shrink-0 */}
              <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                <form onSubmit={handleSend} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      isId
                        ? `Tulis pesan untuk ${activeRecipient.name}...`
                        : `Write a message to ${activeRecipient.name}...`
                    }
                    className="flex-1 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900 placeholder:text-slate-400 transition"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className="w-11 h-11 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 text-white disabled:text-slate-400 flex items-center justify-center shrink-0 shadow-sm transition-all cursor-pointer"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-8 space-y-2">
              <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center text-purple-700 mb-2">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-700 text-sm">
                {isId ? 'Pilih Percakapan' : 'Select a Conversation'}
              </h3>
              <p className="text-xs max-w-xs">
                {isId
                  ? 'Pilih salah satu kontak di sisi kiri untuk mulai membaca dan mengirim pesan personal.'
                  : 'Select a contact from the list on the left to start reading and sending messages.'}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
