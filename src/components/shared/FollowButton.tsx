'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Check, Loader2 } from 'lucide-react';
import { useProtectedAction } from '@/hooks/useProtectedAction';
import { toggleFollowUser } from '@/actions/users/follow';
import { ContextualAuthModal } from '@/components/marketplace/ContextualAuthModal';

export interface FollowButtonProps {
  targetUserId: number;
  initialIsFollowing: boolean;
  initialFollowersCount?: number;
  onFollowChange?: (isFollowing: boolean, count: number) => void;
  variant?: 'default' | 'compact' | 'pill' | 'secondary';
  className?: string;
  lang?: string;
  targetUserName?: string | null;
}

export function FollowButton({
  targetUserId,
  initialIsFollowing,
  initialFollowersCount,
  onFollowChange,
  variant = 'default',
  className = '',
  lang = 'id',
  targetUserName,
}: FollowButtonProps) {
  const router = useRouter();
  const isId = lang === 'id';

  const [isFollowing, setIsFollowing] = useState(Boolean(initialIsFollowing));
  const [followersCount, setFollowersCount] = useState<number>(initialFollowersCount ?? 0);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  React.useEffect(() => {
    setIsFollowing(Boolean(initialIsFollowing));
  }, [initialIsFollowing]);

  React.useEffect(() => {
    if (typeof initialFollowersCount === 'number') {
      setFollowersCount(initialFollowersCount);
    }
  }, [initialFollowersCount]);

  const { isAuthModalOpen, setIsAuthModalOpen, authMessage, executeProtected, session } =
    useProtectedAction();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  };

  const handleToggle = () => {
    executeProtected(
      async () => {
        // Cegah follow jika pengguna melihat akun sendiri
        const currentUserId = (session?.user as any)?.id;
        if (currentUserId && Number(currentUserId) === targetUserId) {
          showToast(
            isId
              ? 'Anda tidak dapat mengikuti akun Anda sendiri.'
              : 'You cannot follow yourself.'
          );
          return;
        }

        // Optimistic Update
        const prevFollowing = isFollowing;
        const prevCount = followersCount;
        const nextFollowing = !prevFollowing;
        const nextCount = nextFollowing ? prevCount + 1 : Math.max(0, prevCount - 1);

        setIsFollowing(nextFollowing);
        setFollowersCount(nextCount);
        if (onFollowChange) {
          onFollowChange(nextFollowing, nextCount);
        }
        setIsLoading(true);

        try {
          const res = await toggleFollowUser(targetUserId);
          if (res.success) {
            const finalFollowing = Boolean(res.isFollowing);
            const finalCount =
              typeof res.followersCount === 'number' ? res.followersCount : nextCount;
            setIsFollowing(finalFollowing);
            setFollowersCount(finalCount);
            if (onFollowChange) {
              onFollowChange(finalFollowing, finalCount);
            }
            if (res.message) {
              showToast(res.message);
            }
            router.refresh();
          } else {
            // Revert state
            setIsFollowing(prevFollowing);
            setFollowersCount(prevCount);
            if (onFollowChange) {
              onFollowChange(prevFollowing, prevCount);
            }
            showToast(
              res.error ||
                (isId ? 'Gagal memperbarui status ikuti.' : 'Failed to update follow status.')
            );
          }
        } catch {
          // Revert state on exception
          setIsFollowing(prevFollowing);
          setFollowersCount(prevCount);
          if (onFollowChange) {
            onFollowChange(prevFollowing, prevCount);
          }
          showToast(
            isId ? 'Gagal memperbarui status ikuti.' : 'Failed to update follow status.'
          );
        } finally {
          setIsLoading(false);
        }
      },
      targetUserName
        ? isId
          ? `Masuk untuk mengikuti ${targetUserName} dan memantau rute perjalanannya!`
          : `Sign in to follow ${targetUserName} and track their journeys!`
        : isId
        ? 'Masuk untuk mengikuti pengguna ini.'
        : 'Sign in to follow this user.'
    );
  };

  // Varian Tampilan Tombol
  let variantClasses = '';
  switch (variant) {
    case 'compact':
      variantClasses = isFollowing
        ? 'px-3 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs'
        : 'px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-900 hover:bg-purple-950 text-white shadow-2xs';
      break;
    case 'pill':
      variantClasses = isFollowing
        ? 'px-4 py-2 text-xs font-bold rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs'
        : 'px-4 py-2 text-xs font-bold rounded-full bg-purple-900 hover:bg-purple-950 text-white shadow-sm';
      break;
    case 'secondary':
      variantClasses = isFollowing
        ? 'px-4 py-2 text-xs sm:text-sm font-semibold rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
        : 'px-4 py-2 text-xs sm:text-sm font-semibold rounded-2xl bg-white hover:bg-slate-50 text-purple-900 border border-purple-200 shadow-2xs';
      break;
    case 'default':
    default:
      variantClasses = isFollowing
        ? 'px-5 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm shadow-2xs transition-all bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
        : 'px-5 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm shadow-md transition-all bg-purple-900 hover:bg-purple-800 text-white shadow-purple-950/20';
      break;
  }

  const label = isFollowing
    ? isId
      ? 'Mengikuti'
      : 'Following'
    : isId
    ? 'Ikuti'
    : 'Follow';

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isLoading}
        className={`inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-75 ${variantClasses} ${className}`}
        title={label}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isFollowing ? (
          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
        ) : (
          <UserPlus className="w-3.5 h-3.5" />
        )}
        <span>{label}</span>
      </button>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-bottom-5 text-xs font-semibold">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Contextual Auth Modal */}
      <ContextualAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        promptMessage={authMessage}
        locale={lang}
      />
    </>
  );
}
