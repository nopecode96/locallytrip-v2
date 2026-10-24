'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Send, Sparkles, Heart, Reply, ShieldCheck } from 'lucide-react';
import { UserPersonaLink } from '@/components/common/UserPersonaLink';
import { UserAvatar } from '@/components/common/UserAvatar';
import { postStoryComment } from '@/actions/stories';
import TranslatableContent from '@/components/common/TranslatableContent';

export interface StoryCommentUser {
  id: number;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_verified?: boolean | null;
  user_xp?: {
    total_xp?: number;
    current_level?: number;
  } | null;
}

export interface StoryCommentItem {
  id: number;
  story_id: number;
  user_id: number;
  parent_id?: number | null;
  content: string;
  created_at: string | Date;
  users?: StoryCommentUser | null;
}

interface StoryCommentsClientProps {
  storyId: number;
  initialComments: StoryCommentItem[];
  locale: string;
  currentUser: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string | null;
    isLoggedIn: boolean;
  } | null;
  rewardXP?: number;
}

export function StoryCommentsClient({
  storyId,
  initialComments = [],
  locale,
  currentUser,
  rewardXP = 5,
}: StoryCommentsClientProps) {
  const isId = locale === 'id';
  const [comments, setComments] = useState<StoryCommentItem[]>(initialComments);
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [likedComments, setLikedComments] = useState<Record<number, boolean>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSubmit = async (parentId?: number | null) => {
    const textToSubmit = parentId ? replyContent.trim() : content.trim();
    if (!textToSubmit) return;

    if (!currentUser?.isLoggedIn) {
      showToast(isId ? 'Silakan masuk untuk menulis komentar.' : 'Please sign in to leave a comment.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await postStoryComment({
        storyId,
        content: textToSubmit,
        parentId: parentId || null,
        path: `/${locale}/stories/${storyId}`,
      });

      if (res.success && res.comment) {
        setComments((prev) => [res.comment, ...prev]);
        if (parentId) {
          setReplyContent('');
          setReplyingTo(null);
        } else {
          setContent('');
        }
        showToast(
          isId
            ? `Tanggapan terkirim! Selamat, Anda mendapatkan +${rewardXP} XP Komunitas! ✨`
            : `Comment posted! You earned +${rewardXP} Community XP! ✨`
        );
      } else {
        showToast(res.error || (isId ? 'Gagal mengirim komentar.' : 'Failed to post comment.'));
      }
    } catch (err: any) {
      console.error('Error posting comment:', err);
      showToast(isId ? 'Terjadi kesalahan sistem.' : 'A system error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLikeComment = (commentId: number) => {
    setLikedComments((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  return (
    <section className="w-full mt-8 bg-white rounded-3xl p-6 sm:p-10 lg:p-12 border border-slate-200 shadow-sm space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-bottom-5 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Seksi Komentar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold font-serif text-slate-900 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-purple-600" />
          <span>
            {isId ? 'Komentar & Diskusi' : 'Comments & Discussion'} ({comments.length})
          </span>
        </h2>
        <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
          Vibes Komunitas
        </span>
      </div>

      {/* Banner Insentif Gamifikasi Komentar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/80 via-violet-50/60 to-amber-50/50 border border-purple-200/80 shadow-2xs flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-500/20">
          <Sparkles className="w-4 h-4 text-amber-300" />
        </div>
        <p className="text-xs sm:text-sm font-medium text-slate-800 leading-snug">
          {isId
            ? `Tinggalkan tanggapan atau tips tambahan berharga dan dapatkan +${rewardXP} XP reputasi komunitas!`
            : `Leave a helpful thought or insider tip to earn +${rewardXP} Community XP!`}
        </p>
      </div>

      {/* Formulir Input Komentar */}
      <div className="space-y-3 pt-1">
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              isId
                ? 'Tulis tanggapan atau pengalaman Anda tentang tempat ini...'
                : 'Share your thoughts or tips about this travel route...'
            }
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none transition leading-relaxed resize-none"
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            {currentUser?.isLoggedIn
              ? (isId ? `Masuk sebagai ${currentUser.name}` : `Signed in as ${currentUser.name}`)
              : (isId ? 'Perlu masuk untuk berdiskusi.' : 'Sign in to join discussion.')}
          </p>
          <button
            type="button"
            onClick={() => handleSubmit(null)}
            disabled={isSubmitting || !content.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 active:scale-95 text-white font-bold text-xs sm:text-sm transition shadow-sm shadow-purple-500/20 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? (isId ? 'Mengirim...' : 'Posting...') : (isId ? 'Kirim Komentar' : 'Post Comment')}</span>
          </button>
        </div>
      </div>

      {/* Daftar Komentar Pembaca */}
      {comments.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
          <p className="text-xs sm:text-sm font-semibold text-slate-600">
            {isId ? 'Belum ada komentar di cerita ini.' : 'No comments yet on this story.'}
          </p>
          <p className="text-xs text-slate-400">
            {isId
              ? 'Jadilah yang pertama membagikan sudut pandang atau tips lokal Anda!'
              : 'Be the first to share your perspective or insider tips!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          {comments.map((comment) => {
            const cUser = comment.users;
            const userLevel = cUser?.user_xp?.current_level || 1;
            const isLiked = Boolean(likedComments[comment.id]);
            const isReplying = replyingTo === comment.id;

            return (
              <div
                key={comment.id}
                className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-100 space-y-3 transition"
              >
                <div className="flex items-center justify-between">
                  {cUser ? (
                    <UserPersonaLink
                      user={{
                        id: cUser.id,
                        name: cUser.name,
                        username: cUser.username,
                        avatar_url: cUser.avatar_url,
                      }}
                      locale={locale}
                      variant="full"
                      size="sm"
                      subtitle={
                        <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold">
                            Lv.{userLevel}
                          </span>
                          {cUser.is_verified && (
                            <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Verified</span>
                            </span>
                          )}
                        </span>
                      }
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        src={null}
                        name="Traveler"
                        size={32}
                      />
                      <span className="text-xs font-bold text-slate-800">Traveler</span>
                    </div>
                  )}

                  <span className="text-[11px] text-slate-400">
                    {new Date(comment.created_at).toLocaleDateString(
                      isId ? 'id-ID' : 'en-US',
                      { day: 'numeric', month: 'short', year: 'numeric' }
                    )}
                  </span>
                </div>

                {/* Konten Komentar */}
                <div className="pl-10 text-xs sm:text-sm text-slate-800 leading-relaxed">
                  <TranslatableContent
                    content={comment.content}
                    targetLang={locale}
                    isMarkdown={false}
                    buttonPosition="bottom"
                    showStatusBadge={false}
                  />
                </div>

                {/* Bar Aksi: Like & Reply */}
                <div className="pl-10 flex items-center gap-4 text-xs font-semibold text-slate-500 pt-1">
                  <button
                    type="button"
                    onClick={() => toggleLikeComment(comment.id)}
                    className={`flex items-center gap-1 transition-colors cursor-pointer ${
                      isLiked ? 'text-rose-600' : 'hover:text-rose-600'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                    <span>{isLiked ? (isId ? 'Disukai' : 'Liked') : (isId ? 'Suka' : 'Like')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                    className="flex items-center gap-1 hover:text-purple-700 transition-colors cursor-pointer"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>{isId ? 'Balas' : 'Reply'}</span>
                  </button>
                </div>

                {/* Inline Reply Form */}
                {isReplying && (
                  <div className="pl-10 pt-2 space-y-2">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={isId ? 'Tulis balasan Anda...' : 'Write your reply...'}
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 resize-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setReplyingTo(null)}
                        className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                      >
                        {isId ? 'Batal' : 'Cancel'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSubmit(comment.id)}
                        disabled={isSubmitting || !replyContent.trim()}
                        className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer"
                      >
                        {isSubmitting ? (isId ? 'Mengirim...' : 'Sending...') : (isId ? 'Kirim Balasan' : 'Send Reply')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
