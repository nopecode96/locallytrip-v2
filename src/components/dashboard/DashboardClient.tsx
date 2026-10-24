'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { UserAvatar } from '@/components/common/UserAvatar';
import { realtimeEmitter } from '@/lib/realtime';
import {
  Sparkles,
  ShieldCheck,
  Coins,
  MapPin,
  Calendar,
  PenSquare,
  Users,
  MessageSquare,
  ArrowRight,
  Clock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Wallet,
  FileText,
  ChevronRight,
  TrendingUp,
  Backpack,
  Download,
  Building,
  CreditCard,
  CheckCircle,
  X,
  Loader2,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Settings,
  Phone,
  Ticket,
  ExternalLink,
  Star,
  Printer,
  QrCode,
  ClipboardList,
  Search,
  Zap,
  Gift,
  Copy,
  Check,
  LogOut,
  Menu,
  Camera,
} from 'lucide-react';
import HostQrScannerModal from './HostQrScannerModal';
import { signOut } from 'next-auth/react';
import { logoutAction } from '@/actions/auth/logout';
import { useProtectedAction } from '@/hooks/useProtectedAction';
import { ContextualAuthModal } from '@/components/marketplace/ContextualAuthModal';
import { requestPayout } from '@/actions/finances';
import {
  FormattedTravellerBooking,
  FormattedHostBooking,
} from '@/actions/bookings';
import {
  updateBookingStatus,
  verifyBookingByReference,
} from '@/actions/bookings/update-status';
import { toggleExperienceStatus } from '@/actions/experiences/manage';
import { toggleStoryStatus } from '@/actions/stories/update';
import { toggleMeetupStatus } from '@/actions/meetups/update';
import { toggleForumThreadStatus } from '@/actions/forum/update';
import { simulatePaymentSuccess } from '@/actions/payments/simulate-payment';
import { resolveExperienceImageUrl } from '@/lib/utils/media';
import { replyReviewByHost } from '@/actions/reviews/reply-review';
import { getOrCreateHostConversation } from '@/actions/messages';

export interface DashboardForumThreadItem {
  id: number;
  title: string;
  slug: string;
  status: string | null;
  category_name?: string | null;
  city_name?: string | null;
  view_count: number;
  reply_count: number;
  like_count: number;
  created_at: string;
}

export interface DashboardHostExperienceItem {
  id: number;
  title: string;
  slug: string | null;
  status: string;
  package_price: number;
  currency: string;
  duration_hours: number;
  max_participants: number;
  rating_average: number;
  rating_count: number;
  category_name: string;
  category_icon?: string | null;
  city_name?: string | null;
  images?: string[] | string | null;
  cover_image?: string | null;
  created_at: string;
  reviews_count: number;
  bookings_count: number;
}

export interface DashboardStoryItem {
  id: number;
  title: string;
  slug: string;
  status: string | null;
  cover_image: string | null;
  created_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  city_name?: string | null;
}

export interface DashboardMeetupItem {
  id: number;
  title: string;
  slug: string;
  status: string | null;
  start_date: string;
  current_member_count: number;
  max_members: number | null;
  city_name?: string | null;
}

export interface DashboardBookingItem {
  id: number;
  booking_reference: string | null;
  status: string | null;
  selected_date: string | null;
  total_price: number;
  participant_count: number;
  experience_title: string;
  experience_slug: string | null;
  experience_image: string | null;
}

export interface LevelTierItem {
  level: number;
  min_xp: number;
  badge_icon: string;
  name_id: string;
  name_en: string;
}

export interface DashboardTransactionItem {
  id: string;
  amount: number;
  type: string;
  activity_type: string;
  created_at: string;
}

export interface DashboardDirectConversation {
  id: number;
  participant: {
    id: number;
    name: string;
    username: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    isSenderMe: boolean;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export interface DashboardMeetupChat {
  id: number;
  title: string;
  slug: string;
  bannerImage: string | null;
  cityName: string | null;
  membersCount: number;
  lastMessage: {
    userName: string;
    content: string;
    createdAt: string;
  } | null;
}

export interface UserBookingItem {
  id: number;
  booking_reference: string;
  status: string;
  selected_date: string | null;
  selected_time: string | null;
  participant_count: number;
  total_price: number;
  currency: string;
  created_at: string;
  experience: {
    id: number;
    slug: string | null;
    title: string;
    cover_image: string | null;
    duration_hours: number;
    meeting_point: string | null;
    city_name: string;
    host: {
      id: number;
      name: string;
      avatar_url: string | null;
      phone: string | null;
    };
  };
  payment: {
    id: number;
    amount: number;
    currency: string;
    status: string;
    payment_gateway: string;
    gateway_payment_method: string | null;
    created_at: string;
  } | null;
  reviews: Array<{
    id: number;
    rating: number;
  }>;
}

export interface HostBookingItem {
  id: number;
  booking_reference: string;
  status: string;
  selected_date: string | null;
  selected_time: string | null;
  participant_count: number;
  total_price: number;
  currency: string;
  special_requests: string | null;
  created_at: string;
  experience: {
    id: number;
    title: string;
    slug: string | null;
    cover_image: string | null;
    meeting_point: string | null;
    city_name: string;
  };
  guest: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
  payment: {
    id: number;
    amount: number;
    currency: string;
    status: string;
    payment_gateway: string;
    gateway_payment_method: string | null;
    created_at: string;
  } | null;
  review?: {
    id: number;
    rating: number;
    comment?: string | null;
    host_reply?: string | null;
    host_replied_at?: string | null;
    created_at: string;
  } | null;
}

import { resolveAvatarUrl } from '@/lib/avatar';
export { resolveAvatarUrl };

export interface DashboardUserProps {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  is_host?: boolean;
  avatar_url: string | null;
  image?: string | null;
  avatar?: string | null;
  is_verified: boolean;
  kyc_status?: string | null;
  city_name?: string | null;
  total_xp: number;
  current_level: number;
  ltp_balance: number;
  stories_count: number;
  meetups_count: number;
  bookings_count: number;
  forum_threads_count?: number;
  stories: DashboardStoryItem[];
  meetups: DashboardMeetupItem[];
  forumThreads?: DashboardForumThreadItem[];
  bookings: DashboardBookingItem[];
  userBookings?: UserBookingItem[];
  travellerBookings: FormattedTravellerBooking[];
  hostBookings: HostBookingItem[];
  hostExperiences?: DashboardHostExperienceItem[];
  levelTiers: LevelTierItem[];
  transactions: DashboardTransactionItem[];
  referral_code?: string | null;
  referral_usage_count?: number;
  directConversations?: DashboardDirectConversation[];
  meetupChats?: DashboardMeetupChat[];
}

interface DashboardClientProps {
  locale: string;
  user: DashboardUserProps;
}

export function DashboardClient({ locale, user }: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isId = locale === 'id';
  const isHostRole = user.role?.toUpperCase() === 'HOST' || Boolean(user.is_host);

  type DashboardTabKey =
    | 'overview'
    | 'hostBookings'
    | 'bookings'
    | 'experiences'
    | 'stories'
    | 'meetups'
    | 'forums'
    | 'wallet'
    | 'referral'
    | 'messages';

  // 1. Baca State Tab dari URL Query (?tab=...) dengan fallback 'overview'
  const rawTabParam = searchParams?.get('tab');
  const getNormalizedTab = (param: string | null | undefined): DashboardTabKey => {
    if (!param) return 'overview';
    const clean = param.toLowerCase().trim();
    if (clean === 'host-bookings' || clean === 'hostbookings') return 'hostBookings';
    if (clean === 'bookings' || clean === 'my-trips' || clean === 'trips') return 'bookings';
    if (clean === 'experiences' || clean === 'my-experiences') return 'experiences';
    if (clean === 'stories' || clean === 'my-stories') return 'stories';
    if (clean === 'meetups' || clean === 'my-meetups') return 'meetups';
    if (clean === 'forums' || clean === 'my-forums' || clean === 'threads') return 'forums';
    if (clean === 'wallet' || clean === 'rewards') return 'wallet';
    if (clean === 'referral') return 'referral';
    if (clean === 'messages' || clean === 'chat') return 'messages';
    return 'overview';
  };

  const activeTab = getNormalizedTab(rawTabParam);

  // 2. Fungsi Pembaruan URL State Tab (tanpa scroll ke atas)
  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    if (newTab === 'overview') {
      params.delete('tab');
    } else {
      const urlValue = newTab === 'hostBookings' ? 'host-bookings' : newTab;
      params.set('tab', urlValue);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [chatLoadingRef, setChatLoadingRef] = useState<string | null>(null);

  const handleStartChat = async ({
    hostId,
    experienceId,
    bookingReference,
  }: {
    hostId: number;
    experienceId?: number;
    bookingReference?: string;
  }) => {
    try {
      setChatLoadingRef(bookingReference || String(hostId));
      const res = await getOrCreateHostConversation({
        hostId,
        experienceId,
        bookingReference,
      });
      if (res.success && res.conversationId) {
        const query = bookingReference ? `?c=${res.conversationId}&ref=${bookingReference}` : `?c=${res.conversationId}`;
        router.push(`/${locale}/messages${query}`);
      } else if (res.error) {
        alert(res.error);
      }
    } catch (err) {
      console.error('Failed to initiate chat:', err);
      const query = bookingReference ? `?recipientId=${hostId}&ref=${bookingReference}` : `?recipientId=${hostId}`;
      router.push(`/${locale}/messages${query}`);
    } finally {
      setChatLoadingRef(null);
    }
  };

  // State Quick Logout Modal
  const [showDashboardLogoutModal, setShowDashboardLogoutModal] = useState(false);
  const [isDashboardLoggingOut, setIsDashboardLoggingOut] = useState(false);

  const handleDashboardLogout = async () => {
    setIsDashboardLoggingOut(true);
    try {
      await logoutAction();
      await signOut({ redirect: true, callbackUrl: `/${locale}` });
    } catch {
      window.location.href = `/${locale}`;
    } finally {
      setIsDashboardLoggingOut(false);
    }
  };

  // Host Experiences States
  const [hostExperiencesList, setHostExperiencesList] = useState<DashboardHostExperienceItem[]>(
    user.hostExperiences || []
  );
  const [togglingExperienceId, setTogglingExperienceId] = useState<number | null>(null);
  const [visibleHostExperiencesCount, setVisibleHostExperiencesCount] = useState(5);
  const STEP_EXPERIENCES = 5;

  // Stories, Meetups, & Forums States
  const [storiesList, setStoriesList] = useState<DashboardStoryItem[]>(user.stories || []);
  const [togglingStoryId, setTogglingStoryId] = useState<number | null>(null);

  const [meetupsList, setMeetupsList] = useState<DashboardMeetupItem[]>(user.meetups || []);
  const [togglingMeetupId, setTogglingMeetupId] = useState<number | null>(null);

  const [forumThreadsList, setForumThreadsList] = useState<DashboardForumThreadItem[]>(user.forumThreads || []);
  const [togglingForumThreadId, setTogglingForumThreadId] = useState<number | null>(null);
  const [visibleForumThreadsCount, setVisibleForumThreadsCount] = useState(5);
  const STEP_FORUM_THREADS = 5;

  // Payout Modal States
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<number>(3000);
  const [payoutMethod, setPayoutMethod] = useState<'BANK_TRANSFER' | 'PAYPAL'>('BANK_TRANSFER');
  const [bankName, setBankName] = useState('BCA');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState(user.name || '');
  const [paypalEmail, setPaypalEmail] = useState(user.email || '');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(user.ltp_balance);
  const [currentXp, setCurrentXp] = useState(user.total_xp);
  const [justEarnedReward, setJustEarnedReward] = useState<{ xp: number; ltp: number } | null>(null);

  // Referral Tab States
  const [copiedReferralCode, setCopiedReferralCode] = useState(false);
  const [copiedReferralLink, setCopiedReferralLink] = useState(false);

  // Subscribe ke pembaruan gamification real-time (XP & LTP)
  useEffect(() => {
    const unsub = realtimeEmitter.subscribe('user:gamification_update', (payload) => {
      if (payload) {
        if (payload.xpEarned) {
          setCurrentXp((prev) => prev + payload.xpEarned);
        }
        if (payload.ltpEarned) {
          setCurrentBalance((prev) => prev + payload.ltpEarned);
        }
        setJustEarnedReward({ xp: payload.xpEarned || 0, ltp: payload.ltpEarned || 0 });
        const timer = setTimeout(() => setJustEarnedReward(null), 5000);
        return () => clearTimeout(timer);
      }
    });
    return unsub;
  }, []);

  // Booking Tab & Host States
  const [bookingSubTab, setBookingSubTab] = useState<'traveller' | 'host'>(isHostRole ? 'host' : 'traveller');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [hostBookingStatusFilter, setHostBookingStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [userBookingsList, setUserBookingsList] = useState<UserBookingItem[]>(user.userBookings || []);
  const [travellerList, setTravellerList] = useState<FormattedTravellerBooking[]>(user.travellerBookings || []);
  const [hostList, setHostList] = useState<HostBookingItem[]>(user.hostBookings || []);
  const [updatingBookingId, setUpdatingBookingId] = useState<number | null>(null);
  const [selectedTicketBooking, setSelectedTicketBooking] = useState<UserBookingItem | null>(null);

  // Modal Verifikasi Tiket & Check-In QR Code
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyRefInput, setVerifyRefInput] = useState('');
  const [isSearchingTicket, setIsSearchingTicket] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifiedTicket, setVerifiedTicket] = useState<any | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [simulatingRef, setSimulatingRef] = useState<string | null>(null);
  const [simulationToast, setSimulationToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Mobile Web QR Code Scanner Modal
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [scannerInitialCode, setScannerInitialCode] = useState('');

  // Host Review Reply State
  const [replyingReviewId, setReplyingReviewId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const handleHostSubmitReply = async (reviewId: number) => {
    if (!replyText.trim()) return;
    setIsSubmittingReply(true);
    setReplyError(null);
    try {
      const res = await replyReviewByHost({ reviewId, replyText: replyText.trim() });
      if (res.success) {
        setHostList((prev) =>
          prev.map((b) => {
            if (b.review?.id === reviewId) {
              return {
                ...b,
                review: {
                  ...b.review,
                  host_reply: replyText.trim(),
                  host_replied_at: new Date().toISOString(),
                },
              };
            }
            return b;
          })
        );
        setReplyingReviewId(null);
        setReplyText('');
      } else {
        setReplyError(res.error || (isId ? 'Gagal menyimpan balasan.' : 'Failed to save response.'));
      }
    } catch (err: any) {
      setReplyError(err?.message || (isId ? 'Terjadi kesalahan sistem.' : 'System error occurred.'));
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleToggleExperienceStatus = async (experienceId: number, currentStatus: string) => {
    setTogglingExperienceId(experienceId);
    try {
      const res = await toggleExperienceStatus(experienceId, currentStatus);
      if (res.success && res.status) {
        setHostExperiencesList((prev) =>
          prev.map((exp) => (exp.id === experienceId ? { ...exp, status: res.status } : exp))
        );
      }
    } catch (err) {
      console.error('Failed to toggle experience status:', err);
    } finally {
      setTogglingExperienceId(null);
    }
  };

  const handleToggleStoryStatus = async (storyId: number, currentStatus: string | null) => {
    setTogglingStoryId(storyId);
    try {
      const res = await toggleStoryStatus(storyId, currentStatus || 'draft');
      if (res.success && res.status) {
        setStoriesList((prev) =>
          prev.map((s) => (s.id === storyId ? { ...s, status: res.status } : s))
        );
      }
    } catch (err) {
      console.error('Failed to toggle story status:', err);
    } finally {
      setTogglingStoryId(null);
    }
  };

  const handleToggleMeetupStatus = async (meetupId: number, currentStatus: string | null) => {
    setTogglingMeetupId(meetupId);
    try {
      const res = await toggleMeetupStatus(meetupId, currentStatus || 'draft');
      if (res.success && res.status) {
        setMeetupsList((prev) =>
          prev.map((m) => (m.id === meetupId ? { ...m, status: res.status } : m))
        );
      }
    } catch (err) {
      console.error('Failed to toggle meetup status:', err);
    } finally {
      setTogglingMeetupId(null);
    }
  };

  const handleToggleForumThreadStatus = async (threadId: number, currentStatus: string | null) => {
    setTogglingForumThreadId(threadId);
    try {
      const res = await toggleForumThreadStatus(threadId, currentStatus || 'draft');
      if (res.success && res.status) {
        setForumThreadsList((prev) =>
          prev.map((t) => (t.id === threadId ? { ...t, status: res.status } : t))
        );
      }
    } catch (err) {
      console.error('Failed to toggle forum thread status:', err);
    } finally {
      setTogglingForumThreadId(null);
    }
  };

  // State limit tampilan untuk masing-masing tab (Load More / Incremental Pagination)
  const [visibleStoriesCount, setVisibleStoriesCount] = useState(5);
  const [visibleMeetupsCount, setVisibleMeetupsCount] = useState(5);
  const [visibleBookingsCount, setVisibleBookingsCount] = useState(5);
  const [visibleHostBookingsCount, setVisibleHostBookingsCount] = useState(5);
  const [visibleTransactionsCount, setVisibleTransactionsCount] = useState(10);

  const STEP_STORIES = 5;
  const STEP_MEETUPS = 5;
  const STEP_BOOKINGS = 5;
  const STEP_TRANSACTIONS = 10;

  const handleUpdateBookingStatus = async (
    bookingId: number,
    newStatus: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  ) => {
    setUpdatingBookingId(bookingId);
    try {
      const res = await updateBookingStatus(bookingId, newStatus);
      if (res.success) {
        setHostList((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus.toLowerCase() } : b))
        );
        setUserBookingsList((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus.toLowerCase() } : b))
        );
        setTravellerList((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
        );
      }
    } catch (err) {
      console.error('Failed to update booking status:', err);
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const handleSearchTicket = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!verifyRefInput.trim()) {
      setVerifyError(isId ? 'Masukkan kode booking tiket.' : 'Please enter a booking code.');
      return;
    }
    setVerifyError(null);
    setVerifiedTicket(null);
    setCheckInSuccess(false);
    setIsSearchingTicket(true);

    try {
      const res = await verifyBookingByReference(verifyRefInput.trim());
      if (res.success && res.booking) {
        setVerifiedTicket(res.booking);
      } else {
        setVerifyError(res.error || (isId ? 'Tiket tidak ditemukan.' : 'Ticket not found.'));
      }
    } catch (err) {
      setVerifyError(isId ? 'Gagal memverifikasi tiket.' : 'Failed to verify ticket.');
    } finally {
      setIsSearchingTicket(false);
    }
  };

  const handleConfirmCheckIn = async (bookingId: number) => {
    setIsCheckingIn(true);
    setVerifyError(null);
    try {
      const res = await updateBookingStatus(bookingId, 'COMPLETED');
      if (res.success) {
        setCheckInSuccess(true);
        setVerifiedTicket((prev: any) => (prev ? { ...prev, status: 'completed' } : prev));
        setHostList((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: 'completed' } : b))
        );
        setUserBookingsList((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: 'completed' } : b))
        );
      } else {
        setVerifyError(res.error || (isId ? 'Gagal menyelesaikan check-in.' : 'Failed to check-in.'));
      }
    } catch (err) {
      setVerifyError(isId ? 'Terjadi kesalahan sistem.' : 'A system error occurred.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleSimulatePayment = async (bookingReference: string) => {
    setSimulatingRef(bookingReference);
    setSimulationToast(null);

    try {
      const res = await simulatePaymentSuccess(bookingReference);
      if (res.success) {
        setSimulationToast({
          type: 'success',
          message: isId
            ? `Pembayaran #${bookingReference} berhasil disimulasikan lunas! Status diperbarui menjadi Terkonfirmasi.`
            : `Payment #${bookingReference} successfully simulated! Status updated to Confirmed.`,
        });

        // Update local state for userBookingsList, hostList, travellerList
        setUserBookingsList((prev) =>
          prev.map((b) =>
            b.booking_reference === bookingReference
              ? {
                  ...b,
                  status: 'confirmed',
                  payment: b.payment
                    ? { ...b.payment, status: 'paid', gateway_payment_method: 'simulator_instant' }
                    : {
                        id: 0,
                        amount: b.total_price,
                        currency: b.currency,
                        status: 'paid',
                        payment_gateway: 'simulator',
                        gateway_payment_method: 'simulator_instant',
                        created_at: new Date().toISOString(),
                      },
                }
              : b
          )
        );

        setHostList((prev) =>
          prev.map((b) =>
            b.booking_reference === bookingReference
              ? {
                  ...b,
                  status: 'confirmed',
                  payment: b.payment
                    ? { ...b.payment, status: 'paid', gateway_payment_method: 'simulator_instant' }
                    : null,
                }
              : b
          )
        );

        setTravellerList((prev) =>
          prev.map((b) =>
            b.bookingRef === bookingReference
              ? { ...b, status: 'CONFIRMED' }
              : b
          )
        );
      } else {
        setSimulationToast({
          type: 'error',
          message: res.message || (isId ? 'Gagal memproses simulasi pembayaran.' : 'Failed to simulate payment.'),
        });
      }
    } catch (err: any) {
      setSimulationToast({
        type: 'error',
        message: err?.message || (isId ? 'Terjadi kesalahan sistem.' : 'A system error occurred.'),
      });
    } finally {
      setSimulatingRef(null);
    }
  };

  const { isAuthModalOpen, setIsAuthModalOpen, authMessage } = useProtectedAction();

  // Konversi nilai Rupiah (~Rp 17.897 / LTP)
  const ltpInIdr = Math.round(currentBalance * 17897);
  const ltpInUsd = (currentBalance / 100).toFixed(2);
  const ltpProgressPercent = Math.min(100, Math.round((currentBalance / 3000) * 100));
  const canPayout = currentBalance >= 3000;

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutError(null);

    if (payoutAmount < 3000) {
      setPayoutError(isId ? 'Penarikan minimum adalah 3.000 LTP ($30.00 USD).' : 'Minimum payout is 3,000 LTP ($30.00 USD).');
      return;
    }
    if (payoutAmount > currentBalance) {
      setPayoutError(isId ? 'Saldo LTP tidak mencukupi.' : 'Insufficient LTP balance.');
      return;
    }
    if (payoutMethod === 'BANK_TRANSFER' && (!bankName || !accountNumber || !accountHolder)) {
      setPayoutError(isId ? 'Mohon lengkapi seluruh rincian rekening bank.' : 'Please complete all bank account details.');
      return;
    }
    if (payoutMethod === 'PAYPAL' && (!paypalEmail || !paypalEmail.includes('@'))) {
      setPayoutError(isId ? 'Mohon masukkan email PayPal yang valid.' : 'Please enter a valid PayPal email.');
      return;
    }

    setIsSubmittingPayout(true);
    try {
      const res = await requestPayout({
        amountLtp: payoutAmount,
        payoutMethod,
        accountDetails: {
          bankName,
          accountNumber,
          accountHolder,
          paypalEmail,
        },
      });

      if (res.success) {
        setCurrentBalance((prev) => prev - payoutAmount);
        setPayoutSuccess(true);
      } else {
        setPayoutError(res.error || (isId ? 'Gagal mengajukan pencairan dana.' : 'Failed to submit payout request.'));
      }
    } catch {
      setPayoutError(isId ? 'Terjadi kesalahan sistem.' : 'A system error occurred.');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  // Kalkulasi Level Tier aktif & level berikutnya
  const currentTier =
    user.levelTiers.find((t) => t.level === user.current_level) ||
    user.levelTiers[0] || {
      level: 1,
      min_xp: 0,
      badge_icon: '🌱',
      name_id: 'New Explorer',
      name_en: 'New Explorer',
    };

  const nextTier = user.levelTiers.find((t) => t.level === user.current_level + 1);

  // Progres XP
  let xpProgressPercent = 100;
  let xpNeededForNext = 0;
  if (nextTier) {
    const xpRange = nextTier.min_xp - currentTier.min_xp;
    const userCurrentInRange = Math.max(0, currentXp - currentTier.min_xp);
    xpProgressPercent = Math.min(100, Math.round((userCurrentInRange / (xpRange || 1)) * 100));
    xpNeededForNext = Math.max(0, nextTier.min_xp - currentXp);
  }

  const avatarUrl = resolveAvatarUrl(user);

  // Item butuh respons (contoh: booking pending atau meetup mendatang)
  const pendingActions = [
    ...user.bookings
      .filter((b) => b.status === 'pending')
      .map((b) => ({
        id: `booking-${b.id}`,
        type: 'booking',
        title: isId
          ? `Pesanan Tur #${b.booking_reference || b.id} Menunggu Konfirmasi`
          : `Booking Tour #${b.booking_reference || b.id} Awaiting Confirmation`,
        detail: b.experience_title,
        status: isId ? 'Perlu Diproses' : 'Action Required',
        href: `/${locale}/dashboard#bookings`,
      })),
  ];

  const showHostBanner = !user.is_host && !isHostRole && hostExperiencesList.length === 0;

  return (
    <div className="space-y-6">
      {/* 0. BANNER CTA BECOME A TOUR GUIDE (URUTAN PALING ATAS) */}
      {showHostBanner && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50/70 border border-amber-200/90 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5 animate-in fade-in">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
              <Compass className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base sm:text-lg text-slate-950">
                  {isId ? 'Jadilah Pemandu Wisata & Dapatkan Penghasilan' : 'Become a Tour Guide & Earn Income'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900 shrink-0">
                  +100 XP
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
                {isId
                  ? 'Bagikan sudut tersembunyi kotamu kepada traveler dunia. Daftar menjadi Local Host sekarang dan dapatkan bonus +100 XP!'
                  : 'Share your city’s hidden gems with global travelers. Become a Local Host today and earn +100 XP bonus!'}
              </p>
            </div>
          </div>

          <Link
            href={`/${locale}/become-a-host`}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-amber-500/25 transition shrink-0 min-h-[44px]"
          >
            <span>{isId ? 'Daftar Jadi Host →' : 'Become a Host →'}</span>
          </Link>
        </div>
      )}

      {/* 1. HEADER DASHBOARD & IDENTITAS PENGGUNA */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200/90 shadow-sm relative overflow-hidden">
        {/* Ornamen latar halus */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Sisi Kiri: Avatar, Nama, Role & Level */}
          <div className="flex items-center gap-4 sm:gap-5">
            <UserAvatar
              src={user.avatar_url || user.image || user.avatar}
              name={user.name}
              size={88}
              className="border-2 border-purple-200 shadow-md"
              priority
            />

            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-tight truncate">
                  {user.name}
                </h1>
                {user.role === 'host' && (user.is_verified || user.kyc_status === 'approved') && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-2xs shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>✓ KYC Verified</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs shrink-0">
                  <span>{currentTier.badge_icon}</span>
                  <span>LV {currentTier.level} • {isId ? currentTier.name_id : currentTier.name_en}</span>
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                <span className="font-semibold text-purple-700">@{user.username}</span>
                <span className="text-slate-300">•</span>
                <span className="capitalize px-2 py-0.5 rounded-md bg-slate-100 font-medium text-slate-700 text-[10px]">
                  {user.role}
                </span>
                {user.city_name && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <MapPin className="w-3 h-3 text-purple-600" />
                      <span>{user.city_name}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Progres XP Menuju Level Selanjutnya */}
          <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100 max-w-sm w-full md:w-auto shrink-0 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <span>⚡</span>
                <span>{isId ? 'Progres Level' : 'Level Progress'}</span>
              </span>
              <span className="font-bold text-purple-700 flex items-center gap-1.5">
                {justEarnedReward && (
                  <span className="animate-bounce text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-extrabold">
                    +{justEarnedReward.xp} XP!
                  </span>
                )}
                <span>{currentXp.toLocaleString()} XP</span>
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${xpProgressPercent}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between">
              <span>LV {currentTier.level}</span>
              {nextTier ? (
                <span>
                  {isId
                    ? `${xpNeededForNext.toLocaleString()} XP lagi ke LV ${nextTier.level}`
                    : `${xpNeededForNext.toLocaleString()} XP to LV ${nextTier.level}`}
                </span>
              ) : (
                <span>Max Level 🌟</span>
              )}
            </div>
          </div>
        </div>

        {/* Tombol Aksi Cepat (Quick Actions) */}
        <div className="pt-6 mt-6 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
          <Link
            href={`/${locale}/stories/create`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-semibold text-xs shadow-sm transition active:scale-95"
          >
            <PenSquare className="w-3.5 h-3.5" />
            <span>{isId ? 'Tulis Cerita (+50 XP)' : 'Write Story (+50 XP)'}</span>
          </Link>

          {isHostRole && (
            <Link
              href={`/${locale}/experiences/create`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white font-bold text-xs shadow-sm shadow-brand-500/25 transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isId ? 'Buat Pengalaman Tur (+XP)' : 'Create Experience (+XP)'}</span>
            </Link>
          )}

          <Link
            href={`/${locale}/community/meetups/create`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-purple-50 hover:text-purple-900 text-slate-700 font-semibold text-xs border border-slate-200 transition active:scale-95"
          >
            <Users className="w-3.5 h-3.5 text-purple-600" />
            <span>{isId ? 'Buat Meetup (+40 XP & +10 LTP)' : 'Host Meetup (+40 XP & +10 LTP)'}</span>
          </Link>

          <Link
            href={`/${locale}/community/forums/create`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-purple-50 hover:text-purple-900 text-slate-700 font-semibold text-xs border border-slate-200 transition active:scale-95"
          >
            <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
            <span>{isId ? 'Mulai Diskusi (+25 XP)' : 'Start Discussion (+25 XP)'}</span>
          </Link>

          <Link
            href={`/${locale}/users/${user.username}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-slate-500 hover:text-slate-800 font-medium text-xs transition"
          >
            <span>{isId ? 'Lihat Profil Publik' : 'View Public Profile'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            href={`/${locale}/dashboard/settings`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition active:scale-95 ml-auto"
            title={isId ? 'Pengaturan Akun' : 'Account Settings'}
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>{isId ? 'Pengaturan' : 'Settings'}</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowDashboardLogoutModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200/80 transition active:scale-95 cursor-pointer"
            title={isId ? 'Keluar dari Akun' : 'Sign Out'}
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>{isId ? 'Keluar' : 'Sign Out'}</span>
          </button>
        </div>
      </div>

      {/* 2. RINGKASAN KARTU METRIK VERTIKAL (STAT CARDS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Saldo LTP */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-orange-50/20 border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-amber-900 font-semibold mb-1">
            <span>{isId ? 'Saldo LTP Koin' : 'LTP Balance'}</span>
            <span className="text-base">🪙</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
            {user.ltp_balance.toLocaleString()} LTP
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            ≈ Rp {ltpInIdr.toLocaleString('id-ID')}
          </div>
        </div>

        {/* Reputasi Komunitas */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-50/50 to-indigo-50/20 border border-purple-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-purple-900 font-semibold mb-1">
            <span>{isId ? 'Reputasi XP' : 'Community XP'}</span>
            <span className="text-base">⚡</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-serif text-purple-900">
            {user.total_xp.toLocaleString()} XP
          </div>
          <div className="text-[11px] text-purple-600 mt-1 font-medium">
            LV {currentTier.level} • {isId ? currentTier.name_id : currentTier.name_en}
          </div>
        </div>

        {/* Kontribusi Aktif */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
            <span>{isId ? 'Kontribusi Aktif' : 'Contributions'}</span>
            <span className="text-base">✍️</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
            {user.stories_count + user.meetups_count}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {user.stories_count} {isId ? 'Cerita' : 'Stories'} • {user.meetups_count} Meetup
          </div>
        </div>

        {/* Pesanan / Reservasi (Strict Role-Based: Host vs Traveller) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
            <span>
              {isHostRole
                ? (isId ? 'Pesanan Tamu' : 'Guest Bookings')
                : (isId ? 'Tiket Petualangan' : 'Adventure Tickets')}
            </span>
            <span className="text-base">{isHostRole ? '📋' : '🎒'}</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
            {isHostRole ? hostList.length : (userBookingsList.length || user.bookings_count)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isHostRole
              ? `${hostList.filter((b) => b.status?.toLowerCase() === 'confirmed' || b.status?.toLowerCase() === 'paid').length} ${isId ? 'Terkonfirmasi' : 'Confirmed'}`
              : `${(userBookingsList.length > 0 ? userBookingsList : user.bookings).filter((b) => b.status?.toLowerCase() === 'confirmed' || b.status?.toLowerCase() === 'paid').length} ${isId ? 'Siap Berangkat' : 'Confirmed'}`}
          </div>
        </div>
      </div>

      {/* 3. PERINGATAN TINDAKAN PERLU RESPON (ACTION REQUIRED) */}
      {pendingActions.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            <span>{isId ? 'Tindakan Memerlukan Respons' : 'Action Required'}</span>
          </div>
          <div className="space-y-2">
            {pendingActions.map((action) => (
              <div
                key={action.id}
                className="flex items-center justify-between gap-3 bg-white/80 p-3 rounded-xl border border-amber-200/60 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 block">{action.title}</span>
                  <span className="text-slate-500">{action.detail}</span>
                </div>
                <Link
                  href={action.href}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold shrink-0 transition"
                >
                  {isId ? 'Tinjau' : 'Review'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. NAVIGASI CEPAT TABS RESPONSIVE (DESKTOP TABS & MOBILE DRAWER) */}
      {(() => {
        const hostPendingCount = hostList.filter(
          (b) => b.status?.toLowerCase() === 'pending' || b.payment?.status?.toLowerCase() === 'unpaid'
        ).length;

        const tabs = [
          { id: 'overview', key: 'overview', label: isId ? 'Ringkasan' : 'Overview', icon: '📊', badge: null, count: undefined },
          ...(isHostRole
            ? [
                {
                  id: 'hostBookings',
                  key: 'hostBookings',
                  label: isId ? 'Pesanan Tamu Masuk' : 'Incoming Guest Bookings',
                  icon: '📋',
                  badge: hostPendingCount > 0 ? hostPendingCount : null,
                  count: hostPendingCount > 0 ? hostPendingCount : undefined,
                },
              ]
            : []),
          ...(!isHostRole
            ? [
                {
                  id: 'bookings',
                  key: 'bookings',
                  label: isId
                    ? `Tiket Petualangan Saya (${userBookingsList.length || user.bookings_count})`
                    : `My Bookings (${userBookingsList.length || user.bookings_count})`,
                  icon: '🎟️',
                  badge: null,
                  count: undefined,
                },
              ]
            : []),
          ...(isHostRole
            ? [
                {
                  id: 'experiences',
                  key: 'experiences',
                  label: isId
                    ? `Pengalaman Saya (${hostExperiencesList.length})`
                    : `My Experiences (${hostExperiencesList.length})`,
                  icon: '🧭',
                  badge: null,
                  count: undefined,
                },
              ]
            : []),
          { id: 'stories', key: 'stories', label: isId ? `Cerita Saya (${storiesList.length || user.stories_count})` : `My Stories (${storiesList.length || user.stories_count})`, icon: '📖', badge: null, count: undefined },
          { id: 'meetups', key: 'meetups', label: isId ? `Meetup Saya (${meetupsList.length || user.meetups_count})` : `My Meetups (${meetupsList.length || user.meetups_count})`, icon: '🗓️', badge: null, count: undefined },
          { id: 'forums', key: 'forums', label: isId ? `Forum Diskusi (${forumThreadsList.length || user.forum_threads_count || 0})` : `My Forums (${forumThreadsList.length || user.forum_threads_count || 0})`, icon: '💬', badge: null, count: undefined },
          {
            id: 'messages',
            key: 'messages',
            label: isId ? 'Pesan & Obrolan' : 'Messages & Chat',
            icon: '💬',
            badge: (user.directConversations?.reduce((acc, c) => acc + c.unreadCount, 0) || 0) > 0
              ? user.directConversations?.reduce((acc, c) => acc + c.unreadCount, 0)
              : null,
            count: (user.directConversations?.reduce((acc, c) => acc + c.unreadCount, 0) || 0) > 0
              ? user.directConversations?.reduce((acc, c) => acc + c.unreadCount, 0)
              : undefined,
          },
          { id: 'wallet', key: 'wallet', label: isId ? 'Dompet & Hadiah' : 'Wallet & Rewards', icon: '🪙', badge: null, count: undefined },
          { id: 'referral', key: 'referral', label: isId ? '🎁 Ajak Teman / Referral' : '🎁 Invite Friends / Referral', icon: '🎁', badge: user.referral_usage_count ? user.referral_usage_count : null, count: user.referral_usage_count ? user.referral_usage_count : undefined },
        ];

        const activeTabItem = tabs.find((t) => t.id === activeTab) || tabs[0];

        return (
          <>
            {/* Tampilan Desktop: Deretan Tab Menu Horizontal */}
            <div className="hidden md:flex border-b border-slate-200 overflow-x-auto no-scrollbar scrollbar-none py-1">
              <div className="flex items-center gap-2 min-w-max pb-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleTabChange(tab.key)}
                    className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer min-h-[44px] ${
                      activeTab === tab.key
                        ? 'bg-purple-900 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    {tab.badge !== null && tab.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                          activeTab === tab.key
                            ? 'bg-amber-400 text-purple-950 shadow-xs'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tampilan Mobile: Bar Ringkas dengan Indikator Tab Aktif & Tombol Trigger Drawer */}
            <div className="flex md:hidden items-center justify-between p-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm mb-4">
              {/* Indikator Tab yang Sedang Aktif */}
              <div className="flex items-center gap-2 px-2 min-w-0">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">Tab:</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-100 truncate">
                  <span>{activeTabItem?.icon}</span>
                  <span className="truncate">{activeTabItem?.label}</span>
                </span>
              </div>

              {/* Tombol Pemicu Drawer */}
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition border border-slate-200 shrink-0 cursor-pointer shadow-2xs"
                aria-label="Buka Menu Dasbor"
              >
                <Menu className="w-4 h-4 text-slate-600" />
                <span>Menu</span>
              </button>
            </div>

            {/* Backdrop Mobile Drawer */}
            {isMobileDrawerOpen && (
              <div
                className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs transition-opacity md:hidden"
                onClick={() => setIsMobileDrawerOpen(false)}
              />
            )}

            {/* Drawer Panel Slide-over dari Kanan */}
            <div
              className={`fixed top-0 right-0 bottom-0 z-50 w-72 max-w-[85vw] bg-white shadow-2xl p-5 flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
                isMobileDrawerOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              {/* Header Drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {isId ? 'Navigasi Dasbor' : 'Dashboard Menu'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isId ? 'Pilih menu untuk melihat konten' : 'Select menu to view content'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  aria-label="Tutup Menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Daftar Menu Vertikal */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        handleTabChange(tab.key);
                        setIsMobileDrawerOpen(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        isActive
                          ? 'bg-purple-600 text-white shadow-sm shadow-purple-200 font-bold'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-purple-700'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <span className="text-base">{tab.icon}</span>
                        <span className="truncate">{tab.label}</span>
                      </span>
                      {tab.badge !== null && tab.badge !== undefined && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        );
      })()}

      {/* 5. KONTEN TAB VERTICAL STACKED ISLAND CARDS (ANTI HORIZONTAL SCROLL) */}
      <div className="space-y-4">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* SEKSI UTAMA PALING ATAS: STRICT ROLE BASED (HOST: PESANAN TAMU MASUK vs TRAVELLER: JADWAL TUR MENDATANG) */}
            {isHostRole ? (
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
                      <ClipboardList className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900">
                        {isId ? 'Pesanan Tamu Masuk Terbaru' : 'Recent Incoming Guest Bookings'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {isId
                          ? 'Pantau pesanan masuk dari tamu, konfirmasi ketersediaan jadwal, atau verifikasi e-tiket.'
                          : 'Monitor incoming bookings from travelers, confirm schedules, or verify tickets.'}
                      </p>
                    </div>
                  </div>

                  {hostList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleTabChange('hostBookings')}
                      className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-900 transition cursor-pointer"
                    >
                      <span>{isId ? 'Lihat Semua' : 'View All'} ({hostList.length})</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {hostList.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 space-y-2.5">
                    <p>{isId ? 'Belum ada pesanan tamu masuk saat ini.' : 'No incoming guest bookings at the moment.'}</p>
                    <button
                      type="button"
                      onClick={() => handleTabChange('experiences')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold transition cursor-pointer"
                    >
                      <Compass className="w-4 h-4" />
                      <span>{isId ? 'Kelola Paket Pengalaman Tur' : 'Manage Experiences'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {hostList.slice(0, 3).map((booking) => {
                      const statusLower = booking.status?.toLowerCase();
                      const isConfirmed = statusLower === 'confirmed' || statusLower === 'paid';
                      const isPending = statusLower === 'pending' || statusLower === 'unpaid';
                      const isCompleted = statusLower === 'completed';
                      const isCancelled = statusLower === 'cancelled';

                      const isIdr = booking.currency?.toUpperCase() === 'IDR';
                      const formattedPrice = isIdr
                        ? `Rp ${Math.round(booking.total_price).toLocaleString('id-ID')}`
                        : `$${Number(booking.total_price).toFixed(2)} ${booking.currency || 'USD'}`;

                      return (
                        <div
                          key={booking.id}
                          className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 hover:bg-purple-50/30 border border-slate-200/90 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3.5 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0 border border-purple-200 text-sm">
                              {booking.guest?.name?.charAt(0).toUpperCase() || 'G'}
                            </div>

                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-mono font-bold text-purple-900 bg-purple-100/70 px-2 py-0.5 rounded-md">
                                  #{booking.booking_reference}
                                </span>
                                {isPending && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    <span>{isId ? 'Perlu Dikonfirmasi' : 'Needs Confirmation'}</span>
                                  </span>
                                )}
                                {isConfirmed && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>{isId ? 'Terkonfirmasi' : 'Confirmed'}</span>
                                  </span>
                                )}
                                {isCompleted && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                    <CheckCircle className="w-3 h-3 text-blue-600" />
                                    <span>{isId ? 'Selesai' : 'Completed'}</span>
                                  </span>
                                )}
                                {isCancelled && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700">
                                    <span>{isId ? 'Dibatalkan' : 'Cancelled'}</span>
                                  </span>
                                )}
                              </div>

                              <h4 className="font-serif font-bold text-sm sm:text-base text-slate-900 line-clamp-1">
                                {booking.experience?.title}
                              </h4>

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                <span className="flex items-center gap-1 font-semibold text-slate-700">
                                  <span>👤 {booking.guest?.name || 'Tamu'}</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3.5 h-3.5 text-purple-600" />
                                  <span>{booking.participant_count} {isId ? 'Tamu' : 'Guests'}</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-purple-600" />
                                  <span>
                                    {booking.selected_date
                                      ? new Date(booking.selected_date).toLocaleDateString(isId ? 'id-ID' : 'en-US', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                        })
                                      : '-'}
                                  </span>
                                </span>
                                <span className="font-bold text-slate-900">{formattedPrice}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-2.5 md:pt-0">
                            <button
                              type="button"
                              onClick={() => handleTabChange('hostBookings')}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                            >
                              <span>{isId ? 'Kelola Pesanan' : 'Manage Booking'}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-orange-100 text-orange-600">
                      <Ticket className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900">
                        {isId ? 'Jadwal Tur Mendatang / Pesanan Aktif' : 'Upcoming Tours / Active Bookings'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {isId
                          ? 'Pantau tiket reservasi, jadwal pelaksanaan, dan status pemesanan terkini Anda.'
                          : 'Track your reservation tickets, schedule, and live booking status.'}
                      </p>
                    </div>
                  </div>

                  {userBookingsList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleTabChange('bookings')}
                      className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-900 transition cursor-pointer"
                    >
                      <span>{isId ? 'Lihat Semua' : 'View All'} ({userBookingsList.length})</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {userBookingsList.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 space-y-2.5">
                    <p>{isId ? 'Belum ada pesanan tur aktif saat ini.' : 'No active tour bookings at the moment.'}</p>
                    <Link
                      href={`/${locale}/experiences`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold transition"
                    >
                      <Compass className="w-4 h-4" />
                      <span>{isId ? 'Jelajahi Pengalaman Menarik' : 'Explore Experiences'}</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {userBookingsList.slice(0, 2).map((booking) => {
                      const statusLower = booking.status.toLowerCase();
                      const isConfirmed = statusLower === 'confirmed' || statusLower === 'paid';
                      const isCompleted = statusLower === 'completed';
                      const isPending = statusLower === 'pending' || statusLower === 'unpaid';
                      const isCancelled = statusLower === 'cancelled';

                      const isIdr = booking.currency?.toUpperCase() === 'IDR';
                      const formattedPrice = isIdr
                        ? `Rp ${Math.round(booking.total_price).toLocaleString('id-ID')}`
                        : `$${Number(booking.total_price).toFixed(2)} ${booking.currency || 'USD'}`;

                      const rawImg = booking.experience?.cover_image || '';
                      const defaultImg = '/images/placeholder-experience.jpg';
                      const initialImg = rawImg
                        ? rawImg.startsWith('http') || rawImg.startsWith('/')
                          ? rawImg
                          : `/images/experiences/${rawImg}`
                        : defaultImg;

                      return (
                        <div
                          key={booking.id}
                          className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 hover:bg-purple-50/30 border border-slate-200/90 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3.5 min-w-0">
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                              <Image
                                src={initialImg}
                                alt={booking.experience.title}
                                fill
                                sizes="80px"
                                className="object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  if (target && target.src !== defaultImg) {
                                    target.src = defaultImg;
                                  }
                                }}
                              />
                            </div>

                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-mono font-bold text-purple-900 bg-purple-100/70 px-2 py-0.5 rounded-md">
                                  #{booking.booking_reference}
                                </span>
                                {isPending && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    <span>{isId ? 'Menunggu Pembayaran' : 'Pending Payment'}</span>
                                  </span>
                                )}
                                {isConfirmed && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>{isId ? 'Terkonfirmasi' : 'Confirmed'}</span>
                                  </span>
                                )}
                                {isCompleted && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                    <CheckCircle className="w-3 h-3 text-blue-600" />
                                    <span>{isId ? 'Selesai' : 'Completed'}</span>
                                  </span>
                                )}
                                {isCancelled && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700">
                                    <span>{isId ? 'Dibatalkan' : 'Cancelled'}</span>
                                  </span>
                                )}
                              </div>

                              <h4 className="font-serif font-bold text-sm sm:text-base text-slate-900 line-clamp-1">
                                {booking.experience.title}
                              </h4>

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-purple-600" />
                                  <span>{booking.experience.city_name}</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-purple-600" />
                                  <span>
                                    {booking.selected_date
                                      ? new Date(booking.selected_date).toLocaleDateString(isId ? 'id-ID' : 'en-US', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                        })
                                      : '-'}
                                  </span>
                                </span>
                                <span className="flex items-center gap-1 font-semibold text-slate-700">
                                  <span>{formattedPrice}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Aksi Cepat Ringkasan */}
                          <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-2.5 md:pt-0">
                            {isPending && booking.experience.slug && (
                              <Link
                                href={`/${locale}/experiences/${booking.experience.slug}/book/success?ref=${booking.booking_reference}`}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>{isId ? 'Bayar Sekarang' : 'Pay Now'}</span>
                              </Link>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedTicketBooking(booking)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                            >
                              <QrCode className="w-3.5 h-3.5 text-amber-300" />
                              <span>{isId ? 'E-Tiket & QR' : 'E-Ticket & QR'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Cerita Terbaru */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                  <span>📖</span>
                  <span>{isId ? 'Cerita Petualang Terbitan Anda' : 'Your Published Stories'}</span>
                </h3>
                <Link
                  href={`/${locale}/stories/create`}
                  className="text-xs font-bold text-purple-700 hover:text-purple-900 transition"
                >
                  + {isId ? 'Tulis Baru' : 'Write New'}
                </Link>
              </div>

              {user.stories.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 space-y-3">
                  <p>{isId ? 'Anda belum menerbitkan cerita perjalanan.' : 'You have not published any travel stories yet.'}</p>
                  <Link
                    href={`/${locale}/stories/create`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold"
                  >
                    <span>✍️</span>
                    <span>{isId ? 'Bagikan Cerita Sekarang (+50 XP)' : 'Share a Story Now (+50 XP)'}</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {user.stories.map((story) => (
                    <div
                      key={story.id}
                      className="p-4 rounded-2xl bg-slate-50 hover:bg-purple-50/40 border border-slate-200/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                            {story.status || 'Published'}
                          </span>
                          {story.city_name && (
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              📍 {story.city_name}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-2 hover:text-purple-700">
                          <Link href={`/${locale}/stories/${story.slug}`}>{story.title}</Link>
                        </h4>
                        <div className="flex items-center gap-4 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {story.view_count} {isId ? 'pembaca' : 'views'}
                          </span>
                          <span>•</span>
                          <span>{new Date(story.created_at).toLocaleDateString(isId ? 'id-ID' : 'en-US')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <Link
                          href={`/${locale}/stories/${story.slug}/edit`}
                          className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs transition inline-flex items-center gap-1"
                          title={isId ? 'Edit Cerita' : 'Edit Story'}
                        >
                          <span>✏️</span>
                          <span>{isId ? 'Edit' : 'Edit'}</span>
                        </Link>
                        <Link
                          href={`/${locale}/stories/${story.slug}`}
                          className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs transition"
                        >
                          {isId ? 'Buka Artikel' : 'Read'}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Meetup Terbaru */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                  <span>🗓️</span>
                  <span>{isId ? 'Agenda Meetup yang Dikelola' : 'Hosted Meetups'}</span>
                </h3>
                <Link
                  href={`/${locale}/community/meetups#create`}
                  className="text-xs font-bold text-purple-700 hover:text-purple-900 transition"
                >
                  + {isId ? 'Agenda Baru' : 'New Meetup'}
                </Link>
              </div>

              {user.meetups.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 space-y-3">
                  <p>{isId ? 'Anda belum membuat agenda meetup.' : 'No hosted meetups yet.'}</p>
                  <Link
                    href={`/${locale}/community/meetups#create`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold"
                  >
                    <span>🗓️</span>
                    <span>{isId ? 'Inisiasi Meetup Baru (+100 XP)' : 'Host a Meetup (+100 XP)'}</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {user.meetups.map((meetup) => (
                    <div
                      key={meetup.id}
                      className="p-4 rounded-2xl bg-slate-50 hover:bg-purple-50/40 border border-slate-200/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
                            {meetup.status || 'Active'}
                          </span>
                          {meetup.city_name && (
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              📍 {meetup.city_name}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-2">
                          <Link href={`/${locale}/community/meetups/${meetup.slug}`}>{meetup.title}</Link>
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span>
                            👥 {meetup.current_member_count}{meetup.max_members ? ` / ${meetup.max_members}` : ''} {isId ? 'peserta' : 'members'}
                          </span>
                          <span>•</span>
                          <span>{new Date(meetup.start_date).toLocaleDateString(isId ? 'id-ID' : 'en-US')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <Link
                          href={`/${locale}/community/meetups/${meetup.slug}/edit`}
                          className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs transition inline-flex items-center gap-1"
                          title={isId ? 'Edit Meetup' : 'Edit Meetup'}
                        >
                          <span>✏️</span>
                          <span>{isId ? 'Edit' : 'Edit'}</span>
                        </Link>
                        <Link
                          href={`/${locale}/community/meetups/${meetup.slug}`}
                          className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs transition"
                        >
                          {isId ? 'Kelola / Lihat' : 'Manage / View'}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB EXPERIENCES: PENGALAMAN SAYA (KHUSUS HOST) */}
        {activeTab === 'experiences' && isHostRole && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-serif font-bold text-lg sm:text-xl text-slate-900 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-brand-600" />
                  <span>{isId ? 'Paket Pengalaman Tur Anda' : 'Your Tour Experiences'}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {isId
                    ? 'Kelola paket tur, tarif flat per rombongan privat, dan ketersediaan publikasi.'
                    : 'Manage your tour packages, flat private group rates, and publishing status.'}
                </p>
              </div>

              <Link
                href={`/${locale}/experiences/create`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-brand-500/25 transition min-h-[44px] cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isId ? '+ Buat Tur Baru' : '+ Create New Tour'}</span>
              </Link>
            </div>

            {/* List atau Empty State */}
            {hostExperiencesList.length === 0 ? (
              <div className="p-8 sm:p-12 text-center rounded-3xl bg-slate-50/70 border border-dashed border-slate-200 space-y-4">
                <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto ring-8 ring-brand-50/50">
                  <Compass className="w-8 h-8" />
                </div>
                <div className="space-y-1.5 max-w-sm mx-auto">
                  <h4 className="font-serif font-bold text-base text-slate-900">
                    {isId ? 'Belum Ada Pengalaman Tur' : 'No Tour Experiences Yet'}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {isId
                      ? 'Rancang rute wisata lokal Anda dan mulai sambut wisatawan dengan menetapkan tarif flat per paket rombongan.'
                      : 'Design your local itinerary and start welcoming travelers with flat private package pricing.'}
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href={`/${locale}/experiences/create`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-sm transition min-h-[44px]"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isId ? '+ Buat Pengalaman Tur Pertama' : '+ Create First Tour Package'}</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {hostExperiencesList.slice(0, visibleHostExperiencesCount).map((exp) => {
                  const isPublished = exp.status === 'published' || exp.status === 'active';
                  const isToggling = togglingExperienceId === exp.id;

                  const rawImages: string[] = Array.isArray(exp.images)
                    ? (exp.images as string[])
                    : typeof exp.images === 'string'
                    ? (() => {
                        try {
                          const parsed = JSON.parse(exp.images || '[]');
                          return Array.isArray(parsed) ? parsed : [];
                        } catch {
                          return [];
                        }
                      })()
                    : [];
                  const primaryCover = rawImages.length > 0 ? rawImages[0] : exp.cover_image;
                  const imageUrl = resolveExperienceImageUrl(primaryCover);

                  return (
                    <div
                      key={exp.id}
                      className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Left: Thumbnail & Core Info */}
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="relative w-28 h-20 sm:w-32 sm:h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                          <Image
                            src={imageUrl}
                            alt={exp.title}
                            fill
                            sizes="(max-width: 640px) 112px, 128px"
                            className="object-cover"
                          />
                          <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-bold backdrop-blur-xs z-10">
                            {exp.category_name}
                          </span>
                        </div>

                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isPublished
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/60'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {isPublished
                                ? isId
                                  ? 'Aktif (Published)'
                                  : 'Active (Published)'
                                : isId
                                ? 'Draf / Nonaktif'
                                : 'Draft / Paused'}
                            </span>

                            {exp.city_name && (
                              <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{exp.city_name}</span>
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-sm sm:text-base text-slate-900 line-clamp-1">
                            {exp.title}
                          </h4>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-0.5">
                            <span className="font-extrabold text-amber-600">
                              ${exp.package_price} <span className="font-normal text-[11px] text-slate-500">/ paket</span>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{exp.duration_hours} jam</span>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span>Maks. {exp.max_participants} tamu</span>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1 font-bold text-amber-500">
                              <span>★</span>
                              <span className="text-slate-700">
                                {exp.rating_average > 0 ? exp.rating_average.toFixed(1) : '-'}
                              </span>
                              <span className="text-slate-400 font-normal">
                                ({exp.rating_count} {isId ? 'ulasan' : 'reviews'})
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions (Toggle Switch & Public Preview) */}
                      <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                        {/* Status Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleExperienceStatus(exp.id, exp.status)}
                          disabled={isToggling}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition min-h-[44px] cursor-pointer ${
                            isPublished
                              ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                          }`}
                        >
                          {isToggling ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <div
                              className={`w-2 h-2 rounded-full ${
                                isPublished ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                          )}
                          <span>
                            {isPublished
                              ? isId
                                ? 'Status: Aktif'
                                : 'Status: Active'
                              : isId
                              ? 'Status: Nonaktif'
                              : 'Status: Paused'}
                          </span>
                        </button>

                        {/* Edit Tour Experience */}
                        <Link
                          href={`/${locale}/experiences/${exp.slug || exp.id}/edit`}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition min-h-[44px]"
                          title={isId ? 'Edit Pengalaman Tur' : 'Edit Tour Experience'}
                        >
                          <span>✏️</span>
                          <span>{isId ? 'Edit' : 'Edit'}</span>
                        </Link>

                        {/* View Tour Link */}
                        <Link
                          href={`/${locale}/experiences/${exp.slug || exp.id}`}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs transition min-h-[44px]"
                        >
                          <span>{isId ? 'Pratinjau' : 'Preview'}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {/* Load More Pagination */}
                {hostExperiencesList.length > visibleHostExperiencesCount && (
                  <div className="pt-3 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleHostExperiencesCount((prev) => prev + STEP_EXPERIENCES)
                      }
                      className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition shadow-xs min-h-[44px] cursor-pointer"
                    >
                      {isId
                        ? `Muat Lebih Banyak Pengalaman (${
                            hostExperiencesList.length - visibleHostExperiencesCount
                          } tersisa)`
                        : `Load More Experiences (${
                            hostExperiencesList.length - visibleHostExperiencesCount
                          } remaining)`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CERITA SAYA */}
        {activeTab === 'stories' && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-slate-900">
                {isId ? 'Seluruh Cerita Perjalanan Saya' : 'All My Travel Stories'}
              </h3>
              <Link
                href={`/${locale}/stories/create`}
                className="px-4 py-2 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs transition"
              >
                + {isId ? 'Tulis Cerita' : 'Write Story'}
              </Link>
            </div>

            <div className="space-y-3">
              {storiesList.slice(0, visibleStoriesCount).map((story) => {
                const isStoryPublished = story.status === 'published';
                const isStoryToggling = togglingStoryId === story.id;

                return (
                  <div
                    key={story.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isStoryPublished
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {isStoryPublished
                            ? isId
                              ? 'Diterbitkan (Published)'
                              : 'Published'
                            : isId
                            ? 'Draf (Draft)'
                            : 'Draft'}
                        </span>
                        {story.city_name && (
                          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                            📍 {story.city_name}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 line-clamp-2">{story.title}</h4>
                      <p className="text-xs text-slate-500">
                        {story.view_count} {isId ? 'pembaca' : 'views'} • {story.like_count} {isId ? 'suka' : 'likes'} • {story.comment_count} {isId ? 'komentar' : 'comments'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      {/* Status Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleStoryStatus(story.id, story.status)}
                        disabled={isStoryToggling}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition min-h-[38px] cursor-pointer ${
                          isStoryPublished
                            ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                            : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                        }`}
                      >
                        {isStoryToggling ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <div
                            className={`w-2 h-2 rounded-full ${
                              isStoryPublished ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                        )}
                        <span>
                          {isStoryPublished
                            ? isId
                              ? 'Diterbitkan'
                              : 'Published'
                            : isId
                            ? 'Draf'
                            : 'Draft'}
                        </span>
                      </button>

                      {/* Edit Button */}
                      <Link
                        href={`/${locale}/stories/${story.slug}/edit`}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition min-h-[38px]"
                        title={isId ? 'Edit Cerita' : 'Edit Story'}
                      >
                        <span>✏️</span>
                        <span>{isId ? 'Edit' : 'Edit'}</span>
                      </Link>

                      {/* View Link */}
                      <Link
                        href={`/${locale}/stories/${story.slug}`}
                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold shrink-0 min-h-[38px] inline-flex items-center justify-center"
                      >
                        {isId ? 'Buka Cerita' : 'View Story'}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {storiesList.length > visibleStoriesCount && (
              <div className="pt-4 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleStoriesCount((prev) => prev + STEP_STORIES)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition shadow-xs min-h-[44px] cursor-pointer"
                >
                  {isId
                    ? `Muat Lebih Banyak Cerita (${storiesList.length - visibleStoriesCount} tersisa)`
                    : `Load More Stories (${storiesList.length - visibleStoriesCount} remaining)`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MEETUP SAYA */}
        {activeTab === 'meetups' && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-slate-900">
                {isId ? 'Agenda Meetup yang Anda Kelola' : 'Meetups You Host'}
              </h3>
              <Link
                href={`/${locale}/community/meetups/create`}
                className="px-4 py-2 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs transition"
              >
                + {isId ? 'Buat Meetup' : 'Host Meetup'}
              </Link>
            </div>

            <div className="space-y-3">
              {meetupsList.slice(0, visibleMeetupsCount).map((meetup) => {
                const isMeetupPublished = meetup.status?.toUpperCase() === 'OPEN' || meetup.status?.toUpperCase() === 'PUBLISHED' || meetup.status?.toLowerCase() === 'active';
                const isMeetupToggling = togglingMeetupId === meetup.id;

                return (
                  <div
                    key={meetup.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isMeetupPublished
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : 'bg-slate-200 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {isMeetupPublished
                            ? isId
                              ? 'Aktif (Published)'
                              : 'Active (Published)'
                            : isId
                            ? 'Draf (Draft)'
                            : 'Draft'}
                        </span>
                        {meetup.city_name && (
                          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                            📍 {meetup.city_name}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 line-clamp-2">{meetup.title}</h4>
                      <p className="text-xs text-slate-500">
                        👥 {meetup.current_member_count} {isId ? 'peserta terdaftar' : 'participants'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      {/* Status Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleMeetupStatus(meetup.id, meetup.status)}
                        disabled={isMeetupToggling}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition min-h-[38px] cursor-pointer ${
                          isMeetupPublished
                            ? 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-900'
                            : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                        }`}
                      >
                        {isMeetupToggling ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <div
                            className={`w-2 h-2 rounded-full ${
                              isMeetupPublished ? 'bg-purple-600' : 'bg-slate-400'
                            }`}
                          />
                        )}
                        <span>
                          {isMeetupPublished
                            ? isId
                              ? 'Diterbitkan'
                              : 'Published'
                            : isId
                            ? 'Draf'
                            : 'Draft'}
                        </span>
                      </button>

                      {/* Edit Button */}
                      <Link
                        href={`/${locale}/community/meetups/${meetup.slug}/edit`}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition min-h-[38px]"
                        title={isId ? 'Edit Meetup' : 'Edit Meetup'}
                      >
                        <span>✏️</span>
                        <span>{isId ? 'Edit' : 'Edit'}</span>
                      </Link>

                      {/* View Link */}
                      <Link
                        href={`/${locale}/community/meetups/${meetup.slug}`}
                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold shrink-0 min-h-[38px] inline-flex items-center justify-center"
                      >
                        {isId ? 'Detail Agenda' : 'Meetup Details'}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {meetupsList.length > visibleMeetupsCount && (
              <div className="pt-4 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleMeetupsCount((prev) => prev + STEP_MEETUPS)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition shadow-xs min-h-[44px] cursor-pointer"
                >
                  {isId
                    ? `Muat Lebih Banyak Meetup (${meetupsList.length - visibleMeetupsCount} tersisa)`
                    : `Load More Meetups (${meetupsList.length - visibleMeetupsCount} remaining)`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB FORUMS: FORUM DISKUSI SAYA */}
        {activeTab === 'forums' && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
                  <span>💬</span>
                  <span>{isId ? 'Topik Diskusi Forum Saya' : 'My Community Forum Threads'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isId
                    ? 'Kelola utas pertanyaan, tips perjalanan, dan status publikasi topik Anda.'
                    : 'Manage your question threads, travel tips, and publishing status.'}
                </p>
              </div>
              <Link
                href={`/${locale}/community/forums/create`}
                className="px-4 py-2 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs transition inline-flex items-center gap-1.5"
              >
                <span>+</span>
                <span>{isId ? 'Topik Baru' : 'New Thread'}</span>
              </Link>
            </div>

            {forumThreadsList.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 space-y-3">
                <p>{isId ? 'Anda belum membuat topik diskusi di forum.' : 'You have not created any forum threads yet.'}</p>
                <Link
                  href={`/${locale}/community/forums/create`}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-semibold"
                >
                  <span>💬</span>
                  <span>{isId ? 'Mulai Diskusi Baru (+25 XP)' : 'Start Discussion (+25 XP)'}</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {forumThreadsList.slice(0, visibleForumThreadsCount).map((thread) => {
                  const isThreadPublished = thread.status?.toUpperCase() === 'PUBLISHED' || thread.status?.toLowerCase() === 'active';
                  const isThreadToggling = togglingForumThreadId === thread.id;

                  return (
                    <div
                      key={thread.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isThreadPublished
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-200 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {isThreadPublished
                              ? isId
                                ? 'Diterbitkan (Published)'
                                : 'Published'
                              : isId
                              ? 'Draf (Draft)'
                              : 'Draft'}
                          </span>
                          {thread.category_name && (
                            <span className="text-[11px] text-purple-700 bg-purple-100/60 px-2 py-0.5 rounded-md font-semibold">
                              {thread.category_name}
                            </span>
                          )}
                          {thread.city_name && (
                            <span className="text-[11px] text-slate-500 font-medium">
                              📍 {thread.city_name}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-2">
                          {thread.title}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {thread.view_count} {isId ? 'dilihat' : 'views'} • {thread.reply_count} {isId ? 'balasan' : 'replies'} • {thread.like_count} {isId ? 'suka' : 'likes'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        {/* Status Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleForumThreadStatus(thread.id, thread.status)}
                          disabled={isThreadToggling}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition min-h-[38px] cursor-pointer ${
                            isThreadPublished
                              ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                              : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                          }`}
                        >
                          {isThreadToggling ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <div
                              className={`w-2 h-2 rounded-full ${
                                isThreadPublished ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                          )}
                          <span>
                            {isThreadPublished
                              ? isId
                                ? 'Diterbitkan'
                                : 'Published'
                              : isId
                              ? 'Draf'
                              : 'Draft'}
                          </span>
                        </button>

                        {/* Edit Button */}
                        <Link
                          href={`/${locale}/community/forums/${thread.slug}/edit`}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition min-h-[38px]"
                          title={isId ? 'Edit Topik Diskusi' : 'Edit Discussion Thread'}
                        >
                          <span>✏️</span>
                          <span>{isId ? 'Edit' : 'Edit'}</span>
                        </Link>

                        {/* Public Link */}
                        <Link
                          href={`/${locale}/community/forums/${thread.slug}`}
                          className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold shrink-0 min-h-[38px] inline-flex items-center justify-center"
                        >
                          {isId ? 'Buka Diskusi' : 'View Thread'}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {forumThreadsList.length > visibleForumThreadsCount && (
              <div className="pt-4 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleForumThreadsCount((prev) => prev + STEP_FORUM_THREADS)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition shadow-xs min-h-[44px] cursor-pointer"
                >
                  {isId
                    ? `Muat Lebih Banyak Diskusi (${forumThreadsList.length - visibleForumThreadsCount} tersisa)`
                    : `Load More Threads (${forumThreadsList.length - visibleForumThreadsCount} remaining)`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PESANAN & TUR (HANYA UNTUK TRAVELLER) */}
        {!isHostRole && activeTab === 'bookings' && (
          <div className="space-y-6">
            {/* Header & Sub-Tab Filter */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                    {isId ? 'MANAJEMEN PETUALANGAN & TUR' : 'EXPERIENCE & TOUR MANAGEMENT'}
                  </span>
                  <h3 className="font-serif font-bold text-xl sm:text-2xl text-slate-900 mt-1">
                    {isId ? 'Pesanan & Tiket Pengalaman' : 'Bookings & Experience Tickets'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    {isId
                      ? 'Kelola tiket reservasi petualangan Anda atau tanggapi pesanan tamu jika Anda adalah Host.'
                      : 'Manage your tour reservation tickets or respond to guest bookings as a Host.'}
                  </p>
                </div>

                <Link
                  href={`/${locale}/experiences`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold border border-purple-200/80 transition self-start sm:self-auto shrink-0"
                >
                  <Compass className="w-4 h-4 text-purple-600" />
                  <span>{isId ? 'Eksplor Pengalaman Baru' : 'Explore Experiences'}</span>
                </Link>
              </div>

              {/* Sub-Tabs (Petualangan Saya vs Pesanan Masuk Host) */}
              {isHostRole && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setBookingSubTab('traveller')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      bookingSubTab === 'traveller'
                        ? 'bg-purple-900 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <span>🎒</span>
                    <span>{isId ? 'Tiket Petualangan Saya' : 'My Adventure Tickets'}</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white">
                      {travellerList.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBookingSubTab('host')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      bookingSubTab === 'host'
                        ? 'bg-purple-900 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <span>🧭</span>
                    <span>{isId ? 'Pesanan Masuk (Host)' : 'Incoming Bookings (Host)'}</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white">
                      {hostList.length}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* KONTEN SUB-TAB 1: TIKET PETUALANGAN SAYA (PESANAN SAYA / MY BOOKINGS) */}
            {(!isHostRole || bookingSubTab === 'traveller') && (() => {
              const pendingCount = userBookingsList.filter(
                (b) => b.status?.toLowerCase() === 'pending' || b.payment?.status?.toLowerCase() === 'unpaid'
              ).length;
              const confirmedCount = userBookingsList.filter(
                (b) => b.status?.toLowerCase() === 'confirmed' || b.status?.toLowerCase() === 'paid'
              ).length;
              const completedCount = userBookingsList.filter(
                (b) => b.status?.toLowerCase() === 'completed'
              ).length;
              const cancelledCount = userBookingsList.filter(
                (b) => b.status?.toLowerCase() === 'cancelled'
              ).length;

              const filteredBookings = userBookingsList.filter((b) => {
                if (bookingStatusFilter === 'all') return true;
                const st = b.status?.toLowerCase();
                const paySt = b.payment?.status?.toLowerCase();
                if (bookingStatusFilter === 'pending') {
                  return st === 'pending' || paySt === 'unpaid';
                }
                if (bookingStatusFilter === 'confirmed') {
                  return st === 'confirmed' || st === 'paid';
                }
                if (bookingStatusFilter === 'completed') {
                  return st === 'completed';
                }
                if (bookingStatusFilter === 'cancelled') {
                  return st === 'cancelled';
                }
                return true;
              });

              return (
                <div className="space-y-4">
                  {/* Toast Alert Simulasi Pembayaran */}
                  {simulationToast && (
                    <div
                      className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
                        simulationToast.type === 'success'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {simulationToast.type === 'success' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                        )}
                        <span className="font-semibold">{simulationToast.message}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSimulationToast(null)}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Deretan Tombol Filter Kategori Status Pesanan (Pill Tabs) */}
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
                    <button
                      type="button"
                      onClick={() => setBookingStatusFilter('all')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[38px] ${
                        bookingStatusFilter === 'all'
                          ? 'bg-purple-900 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <span>{isId ? 'Semua' : 'All'}</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/80 text-slate-700">
                        {userBookingsList.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBookingStatusFilter('pending')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[38px] ${
                        bookingStatusFilter === 'pending'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white hover:bg-amber-50/60 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <span>{isId ? 'Menunggu Pembayaran' : 'Pending Payment'}</span>
                      {pendingCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-900 font-bold">
                          {pendingCount}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setBookingStatusFilter('confirmed')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[38px] ${
                        bookingStatusFilter === 'confirmed'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white hover:bg-emerald-50/60 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span>{isId ? 'Terkonfirmasi' : 'Confirmed'}</span>
                      {confirmedCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-900 font-bold">
                          {confirmedCount}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setBookingStatusFilter('completed')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[38px] ${
                        bookingStatusFilter === 'completed'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white hover:bg-blue-50/60 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span>{isId ? 'Selesai' : 'Completed'}</span>
                      {completedCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-900 font-bold">
                          {completedCount}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setBookingStatusFilter('cancelled')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[38px] ${
                        bookingStatusFilter === 'cancelled'
                          ? 'bg-slate-700 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <span>{isId ? 'Dibatalkan' : 'Cancelled'}</span>
                      {cancelledCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700">
                          {cancelledCount}
                        </span>
                      )}
                    </button>
                  </div>

                  {filteredBookings.length === 0 ? (
                    <div className="p-10 text-center rounded-3xl bg-white border border-dashed border-slate-200 text-slate-500 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
                        <Ticket className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        {bookingStatusFilter === 'all'
                          ? (isId ? 'Belum ada pesanan aktif.' : 'No active bookings yet.')
                          : (isId
                              ? `Tidak ada pesanan dengan status "${bookingStatusFilter}".`
                              : `No bookings found with status "${bookingStatusFilter}".`)}
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                        {isId
                          ? 'Temukan pemandu lokal terpercaya dan ikuti aktivitas eksplorasi menarik di berbagai kota Indonesia.'
                          : 'Discover trusted local guides and embark on exciting experiences across Indonesian cities.'}
                      </p>
                      <Link
                        href={`/${locale}/experiences`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm transition"
                      >
                        <Compass className="w-4 h-4" />
                        <span>{isId ? 'Jelajahi Pengalaman Tur' : 'Explore Experiences'}</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredBookings.slice(0, visibleBookingsCount).map((booking) => {
                        const statusLower = booking.status.toLowerCase();
                        const isConfirmed = statusLower === 'confirmed' || statusLower === 'paid';
                        const isCompleted = statusLower === 'completed';
                        const isPending = statusLower === 'pending' || statusLower === 'unpaid';
                        const isCancelled = statusLower === 'cancelled';

                        const hasReview = booking.reviews && booking.reviews.length > 0;
                        const userRating = hasReview ? booking.reviews[0].rating : null;

                        // Format mata uang tur
                        const isIdr = booking.currency?.toUpperCase() === 'IDR';
                        const formattedPrice = isIdr
                          ? `Rp ${Math.round(booking.total_price).toLocaleString('id-ID')}`
                          : `$${Number(booking.total_price).toFixed(2)} ${booking.currency || 'USD'}`;

                        return (
                          <div
                            key={booking.id}
                            className={`rounded-3xl p-5 sm:p-6 shadow-2xs space-y-5 transition ${
                              isPending
                                ? 'bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 border-2 border-amber-300/80 hover:border-amber-400'
                                : 'bg-white border border-slate-200/90 hover:border-purple-200'
                            }`}
                          >
                            {/* 1. Header Kartu: Kode Booking + Tanggal Pembuatan + Badge Status */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs sm:text-sm font-mono font-black text-purple-900 bg-purple-50 px-3 py-1 rounded-xl border border-purple-200/60">
                                  #{booking.booking_reference}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {isId ? 'Dipesan pada' : 'Booked on'}{' '}
                                  {new Date(booking.created_at).toLocaleDateString(isId ? 'id-ID' : 'en-US', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>

                              {/* Badge Status Pesanan */}
                              <div>
                                {isPending && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                    <span>{isId ? 'Menunggu Pembayaran' : 'Pending Payment'}</span>
                                  </span>
                                )}
                                {isConfirmed && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>{isId ? 'Jadwal Terkonfirmasi' : 'Confirmed'}</span>
                                  </span>
                                )}
                                {isCompleted && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                                    <span>{isId ? 'Tur Selesai' : 'Completed'}</span>
                                  </span>
                                )}
                                {isCancelled && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                    <X className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{isId ? 'Dibatalkan' : 'Cancelled'}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Banner Peringatan Pesanan Pending */}
                            {isPending && (
                              <div className="bg-amber-100/70 border border-amber-200/80 rounded-2xl p-3 sm:p-3.5 flex items-start gap-2.5 text-xs text-amber-950">
                                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                  <span className="font-bold block">
                                    {isId ? 'Menunggu Penyelesaian Pembayaran' : 'Awaiting Payment Completion'}
                                  </span>
                                  <p className="text-[11px] sm:text-xs text-amber-800 leading-relaxed">
                                    {isId
                                      ? 'Selesaikan pembayaran sebelum batas waktu berakhir untuk mengamankan slot privat Anda bersama Pemandu Lokal.'
                                      : 'Complete payment before time expires to secure your private tour slot with your Local Host.'}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* 2. Badan Kartu: 2 Kolom Responsif (Anti-Horizontal Scroll) */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                              {/* Sisi Kiri (md:col-span-7): Thumbnail, Judul Tur, Kota, Host */}
                              <div className="md:col-span-7 flex items-start gap-4 min-w-0">
                                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                                  {(() => {
                                    const rawImg = booking.experience?.cover_image || '';
                                    const defaultImg = '/images/placeholder-experience.jpg';
                                    const resolvedImg = rawImg
                                      ? rawImg.startsWith('http') || rawImg.startsWith('/')
                                        ? rawImg
                                        : `/images/experiences/${rawImg}`
                                      : defaultImg;

                                    return (
                                      <Image
                                        src={resolvedImg}
                                        alt={booking.experience.title}
                                        fill
                                        sizes="96px"
                                        className="object-cover"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          if (target && target.src !== defaultImg) {
                                            target.src = defaultImg;
                                          }
                                        }}
                                      />
                                    );
                                  })()}
                                </div>

                                <div className="space-y-1.5 min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 text-xs text-purple-700 font-semibold">
                                    <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                    <span>{booking.experience.city_name}</span>
                                  </div>

                                  <Link
                                    href={booking.experience.slug ? `/${locale}/experiences/${booking.experience.slug}` : `/${locale}/experiences`}
                                    className="font-serif font-bold text-base sm:text-lg text-slate-900 hover:text-purple-900 transition line-clamp-2 block"
                                  >
                                    {booking.experience.title}
                                  </Link>

                                  {/* Avatar & Nama Host */}
                                  <div className="flex items-center gap-2 pt-1">
                                    <UserAvatar
                                      src={booking.experience.host.avatar_url}
                                      name={booking.experience.host.name}
                                      size={20}
                                    />
                                    <span className="text-xs text-slate-600 font-medium">
                                      <span className="text-slate-400">Host:</span> {booking.experience.host.name}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Sisi Kanan (md:col-span-5): Informasi Jadwal & Total Tagihan */}
                              <div className="md:col-span-5 bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-2.5 text-xs text-slate-600">
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1.5 text-slate-500">
                                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                                    <span>{isId ? 'Tanggal Pelaksanaan' : 'Tour Date'}</span>
                                  </span>
                                  <span className="font-bold text-slate-800">
                                    {booking.selected_date
                                      ? new Date(booking.selected_date).toLocaleDateString(isId ? 'id-ID' : 'en-US', {
                                          weekday: 'short',
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                        })
                                      : '-'}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1.5 text-slate-500">
                                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                                    <span>{isId ? 'Waktu Mulai' : 'Start Time'}</span>
                                  </span>
                                  <span className="font-semibold text-slate-700">
                                    {booking.selected_time
                                      ? new Date(booking.selected_time).toLocaleTimeString(isId ? 'id-ID' : 'en-US', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })
                                      : isId
                                      ? '08:00 WIB (Pagi)'
                                      : '08:00 AM'}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1.5 text-slate-500">
                                    <Users className="w-3.5 h-3.5 text-purple-600" />
                                    <span>{isId ? 'Peserta' : 'Guests'}</span>
                                  </span>
                                  <span className="font-semibold text-slate-700">
                                    {booking.participant_count} {isId ? 'Tamu (Paket Privat)' : 'Guests (Private)'}
                                  </span>
                                </div>

                                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                                  <span className="text-slate-500 font-medium">
                                    {isId ? 'Total Tagihan' : 'Total Price'}
                                  </span>
                                  <span className="text-sm sm:text-base font-black text-slate-900">
                                    {formattedPrice}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* 3. Aksi Cepat Berdasarkan Status */}
                            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                              {/* Titik kumpul singkat dari Database */}
                              <div className="text-xs text-slate-500 min-w-0">
                                <span className="line-clamp-1">
                                  <strong className="text-slate-700 font-semibold">{isId ? 'Titik Kumpul:' : 'Meeting Point:'}</strong>{' '}
                                  {booking.experience.meeting_point ||
                                    (isId ? 'Akan dikonfirmasi oleh Host via WhatsApp' : 'Will be confirmed by Host via WhatsApp')}
                                </span>
                              </div>

                              {/* Tombol-tombol aksi */}
                              <div className="flex flex-wrap items-center gap-2">
                                {/* Status: PENDING (Tombol Aksi Utama Mencolok "Bayar Sekarang →") */}
                                {isPending && booking.experience.slug && (
                                  <>
                                    <Link
                                      href={`/${locale}/experiences/${booking.experience.slug}/book/success?ref=${booking.booking_reference}`}
                                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-orange-500/25 transition min-h-[44px] active:scale-95"
                                    >
                                      <CreditCard className="w-4 h-4" />
                                      <span>{isId ? 'Bayar Sekarang →' : 'Pay Now →'}</span>
                                    </Link>

                                    {/* Tombol Khusus Testing: Simulasikan Lunas (Dev) */}
                                    <button
                                      type="button"
                                      disabled={simulatingRef === booking.booking_reference}
                                      onClick={() => handleSimulatePayment(booking.booking_reference)}
                                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-dashed border-amber-400 bg-amber-50/80 hover:bg-amber-100/90 text-amber-900 font-bold text-xs transition shadow-2xs min-h-[44px] disabled:opacity-50 cursor-pointer"
                                      title={isId ? 'Simulasi otomatis pelunasan instan untuk pengujian' : 'Instant payment simulation for local testing'}
                                    >
                                      {simulatingRef === booking.booking_reference ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                                      ) : (
                                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                                      )}
                                      <span>{isId ? '⚡ Simulasikan Lunas (Dev)' : '⚡ Simulate Paid (Dev)'}</span>
                                    </button>
                                  </>
                                )}

                                {/* Tombol Lihat E-Tiket & QR Code */}
                                {!isPending && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedTicketBooking(booking)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs shadow-xs transition min-h-[44px] cursor-pointer"
                                  >
                                    <QrCode className="w-3.5 h-3.5 text-amber-300" />
                                    <span>{isId ? 'Lihat E-Tiket & QR Code' : 'View E-Ticket & QR'}</span>
                                  </button>
                                )}

                                {/* Status: CONFIRMED */}
                                {isConfirmed && booking.experience.host.phone && (
                                  <a
                                    href={`https://wa.me/${booking.experience.host.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                      `Halo ${booking.experience.host.name}, saya telah memesan tur "${booking.experience.title}" dengan kode booking #${booking.booking_reference}.`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition min-h-[44px]"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>{isId ? 'Hubungi Host via WhatsApp' : 'Chat Host via WhatsApp'}</span>
                                  </a>
                                )}

                                {booking.experience?.host?.id && (
                                  <button
                                    type="button"
                                    onClick={() => handleStartChat({
                                      hostId: booking.experience.host.id,
                                      experienceId: booking.experience.id,
                                      bookingReference: booking.booking_reference,
                                    })}
                                    disabled={chatLoadingRef === booking.booking_reference}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs shadow-2xs transition min-h-[44px] cursor-pointer"
                                  >
                                    {chatLoadingRef === booking.booking_reference ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                                    ) : (
                                      <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                                    )}
                                    <span>{isId ? '💬 Chat Host' : '💬 Chat Host'}</span>
                                  </button>
                                )}

                                {/* Status: COMPLETED */}
                                {isCompleted && (
                                  <>
                                    {!hasReview ? (
                                      booking.experience.slug && (
                                        <Link
                                          href={`/${locale}/experiences/${booking.experience.slug}/review?bookingId=${booking.id}`}
                                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition min-h-[44px] cursor-pointer"
                                        >
                                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                          <span>{isId ? '⭐ Beri Ulasan (+20 XP & +5 LTP)' : '⭐ Review Tour (+20 XP & +5 LTP)'}</span>
                                        </Link>
                                      )
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                                        <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                                        <span>{isId ? `Sudah Diulas (★ ${userRating})` : `Reviewed (★ ${userRating})`}</span>
                                      </span>
                                    )}
                                  </>
                                )}

                                {/* Tautan Detail Tur */}
                                {booking.experience.slug && (
                                  <Link
                                    href={`/${locale}/experiences/${booking.experience.slug}`}
                                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition min-h-[44px]"
                                  >
                                    <span>{isId ? 'Detail Tur' : 'Tour Page'}</span>
                                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Tombol Muat Lebih Banyak (Incremental Load More) */}
                      {filteredBookings.length > visibleBookingsCount && (
                        <div className="pt-4 text-center">
                          <button
                            type="button"
                            onClick={() => setVisibleBookingsCount((prev) => prev + STEP_BOOKINGS)}
                            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition shadow-xs min-h-[44px] cursor-pointer"
                          >
                            {isId
                              ? `Muat Lebih Banyak Pesanan (${filteredBookings.length - visibleBookingsCount} tersisa)`
                              : `Load More Bookings (${filteredBookings.length - visibleBookingsCount} remaining)`}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB KHUSUS HOST: PESANAN MASUK TAMU (HOST BOOKINGS MANAGER) */}
        {isHostRole && activeTab === 'hostBookings' && (() => {
          const pendingCount = hostList.filter((b) => b.status?.toLowerCase() === 'pending' || b.payment?.status?.toLowerCase() === 'unpaid').length;
          const confirmedCount = hostList.filter((b) => b.status?.toLowerCase() === 'confirmed' || b.status?.toLowerCase() === 'paid').length;
          const completedCount = hostList.filter((b) => b.status?.toLowerCase() === 'completed').length;
          const cancelledCount = hostList.filter((b) => b.status?.toLowerCase() === 'cancelled').length;

          const filteredHostBookings = hostList.filter((b) => {
            if (hostBookingStatusFilter === 'all') return true;
            const st = b.status?.toLowerCase();
            const paySt = b.payment?.status?.toLowerCase();
            if (hostBookingStatusFilter === 'pending') {
              return st === 'pending' || paySt === 'unpaid';
            }
            if (hostBookingStatusFilter === 'confirmed') {
              return st === 'confirmed' || st === 'paid';
            }
            if (hostBookingStatusFilter === 'completed') {
              return st === 'completed';
            }
            if (hostBookingStatusFilter === 'cancelled') {
              return st === 'cancelled';
            }
            return true;
          });

          return (
            <div className="space-y-6">
              {/* Header Tab Host Bookings */}
              <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200/60">
                      {isId ? 'MANAJEMEN PESANAN MASUK HOST' : 'HOST BOOKINGS MANAGER'}
                    </span>
                    <h3 className="font-serif font-bold text-xl sm:text-2xl text-slate-900 mt-1.5">
                      {isId ? 'Pesanan Masuk dari Tamu Wisatawan' : 'Guest Bookings for Your Tours'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      {isId
                        ? 'Konfirmasi jadwal rombongan tamu, verifikasi e-tiket saat tur dimulai, dan hubungi tamu via WhatsApp.'
                        : 'Confirm guest schedules, verify e-tickets upon arrival, and contact travelers via WhatsApp.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setScannerInitialCode('');
                        setIsQrScannerOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer min-h-[44px]"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{isId ? 'Scan QR E-Tiket Tamu' : 'Scan Guest QR E-Ticket'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVerifyRefInput('');
                        setVerifiedTicket(null);
                        setVerifyError(null);
                        setCheckInSuccess(false);
                        setIsVerifyModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold shadow-md shadow-purple-900/20 transition cursor-pointer min-h-[44px]"
                    >
                      <QrCode className="w-4 h-4 text-amber-300" />
                      <span>{isId ? 'Verifikasi E-Tiket Tamu' : 'Verify Guest E-Ticket'}</span>
                    </button>
                  </div>
                </div>

                {/* Filter Status (Pill Tabs) */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setHostBookingStatusFilter('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[38px] ${
                      hostBookingStatusFilter === 'all'
                        ? 'bg-purple-900 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{isId ? 'Semua' : 'All'}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
                      {hostList.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHostBookingStatusFilter('pending')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[38px] ${
                      hostBookingStatusFilter === 'pending'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>{isId ? 'Menunggu Konfirmasi' : 'Pending Confirmation'}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 font-mono">
                      {pendingCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHostBookingStatusFilter('confirmed')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[38px] ${
                      hostBookingStatusFilter === 'confirmed'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isId ? 'Terkonfirmasi' : 'Confirmed'}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 font-mono">
                      {confirmedCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHostBookingStatusFilter('completed')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[38px] ${
                      hostBookingStatusFilter === 'completed'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200/80'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{isId ? 'Selesai' : 'Completed'}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 font-mono">
                      {completedCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHostBookingStatusFilter('cancelled')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[38px] ${
                      hostBookingStatusFilter === 'cancelled'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{isId ? 'Dibatalkan' : 'Cancelled'}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 font-mono">
                      {cancelledCount}
                    </span>
                  </button>
                </div>
              </div>

              {/* Daftar Kartu Pesanan Tamu (Stacked Host Cards) */}
              {filteredHostBookings.length === 0 ? (
                <div className="p-10 text-center rounded-3xl bg-white border border-dashed border-slate-200 text-slate-500 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
                    <ClipboardList className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-base">
                    {isId ? 'Tidak Ada Pesanan pada Kategori Ini' : 'No Bookings in this Category'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    {isId
                      ? 'Pesanan tamu untuk tur Anda akan muncul di sini secara otomatis setelah dibuat.'
                      : 'Traveler bookings for your tour experiences will automatically appear here once ordered.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredHostBookings.slice(0, visibleHostBookingsCount).map((booking) => {
                    const st = (booking.status || 'pending').toLowerCase();
                    const isConfirmed = st === 'confirmed' || st === 'paid';
                    const isCompleted = st === 'completed';
                    const isPending = st === 'pending';
                    const isCancelled = st === 'cancelled';
                    const isUpdating = updatingBookingId === booking.id;

                    const guestPhone = booking.guest?.phone;
                    const waNumber = guestPhone ? guestPhone.replace(/[^0-9]/g, '') : null;
                    const guestAvatar = resolveAvatarUrl(booking.guest?.avatar_url);

                    const formattedDate = booking.selected_date
                      ? new Date(booking.selected_date).toLocaleDateString(isId ? 'id-ID' : 'en-US', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '-';

                    return (
                      <div
                        key={booking.id}
                        className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4 transition hover:border-purple-300"
                      >
                        {/* 1. Header Kartu: Kode Booking monospaced & Badge Status */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-mono font-black text-purple-900 bg-purple-50 px-3 py-1 rounded-xl border border-purple-200/60">
                              #{booking.booking_reference}
                            </span>
                            <span className="text-xs text-slate-400">
                              {isId ? 'Masuk pada' : 'Ordered on'}{' '}
                              {new Date(booking.created_at).toLocaleDateString(isId ? 'id-ID' : 'en-US', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>

                          <div>
                            {isPending && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                <span>{isId ? 'Menunggu Konfirmasi Host' : 'Action Required'}</span>
                              </span>
                            )}
                            {isConfirmed && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{isId ? 'Jadwal Terkonfirmasi' : 'Confirmed'}</span>
                              </span>
                            )}
                            {isCompleted && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                                <span>{isId ? 'Tur Selesai (Completed)' : 'Completed'}</span>
                              </span>
                            )}
                            {isCancelled && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                <X className="w-3.5 h-3.5 text-slate-400" />
                                <span>{isId ? 'Dibatalkan' : 'Cancelled'}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 2. Grid 3 Kolom Responsif: Tur, Profil Tamu, Rincian Tarif */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                          {/* Kolom Kiri (md:col-span-5): Judul Tur, Tanggal & Jam, Titik Kumpul */}
                          <div className="md:col-span-5 space-y-2 min-w-0">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                              {isId ? 'Rincian Tur' : 'Tour Details'}
                            </span>
                            <h4 className="font-serif font-bold text-base text-slate-900 line-clamp-2">
                              {booking.experience?.title}
                            </h4>
                            <div className="space-y-1 text-xs text-slate-600 pt-1">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                                <span className="font-semibold text-slate-800">{formattedDate}</span>
                                {booking.selected_time && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>{new Date(booking.selected_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-start gap-1.5 text-slate-500">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                <span className="line-clamp-2">
                                  {booking.experience?.meeting_point ||
                                    (isId ? 'Titik kumpul akan dikoordinasikan via chat/WhatsApp' : 'Meeting point via chat/WhatsApp')}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Kolom Tengah (md:col-span-4): Profil Tamu (Nama, Avatar, WA Link, Special Request) */}
                          <div className="md:col-span-4 space-y-2 border-t md:border-t-0 md:border-l border-slate-100 md:pl-5 pt-3 md:pt-0">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                              {isId ? 'Profil Tamu Pemesan' : 'Traveler Profile'}
                            </span>
                            <div className="flex items-center gap-3">
                              <UserAvatar
                                src={booking.guest?.avatar_url}
                                name={booking.guest?.name || 'Tamu'}
                                size={40}
                                className="border border-purple-200"
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-sm text-slate-900 truncate">
                                  {booking.guest?.name || 'Tamu'}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {booking.guest?.email || '-'}
                                </p>
                              </div>
                            </div>

                            {/* Tombol Hubungi WhatsApp Tamu & Pesan Internal */}
                            <div className="pt-1 flex items-center gap-2 flex-wrap">
                              {waNumber ? (
                                <a
                                  href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                                    `Halo ${booking.guest.name}, saya Host dari Locallytrip untuk tur "${booking.experience.title}" (Kode: #${booking.booking_reference}).`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition"
                                >
                                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{isId ? 'WhatsApp Tamu' : 'WhatsApp Guest'}</span>
                                </a>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  {isId ? 'Nomor WA tidak dicantumkan' : 'WhatsApp number not provided'}
                                </span>
                              )}

                              {booking.guest?.id && (
                                <button
                                  type="button"
                                  onClick={() => handleStartChat({
                                    hostId: booking.guest.id,
                                    experienceId: booking.experience.id,
                                    bookingReference: booking.booking_reference,
                                  })}
                                  disabled={chatLoadingRef === booking.booking_reference}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 transition cursor-pointer"
                                >
                                  {chatLoadingRef === booking.booking_reference ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                                  ) : (
                                    <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                                  )}
                                  <span>{isId ? 'Kirim Pesan Internal' : 'Internal Chat'}</span>
                                </button>
                              )}
                            </div>

                            {booking.special_requests && (
                              <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 italic line-clamp-2">
                                "{booking.special_requests}"
                              </p>
                            )}
                          </div>

                          {/* Kolom Kanan (md:col-span-3): Detail Tarif Paket & Rombongan */}
                          <div className="md:col-span-3 space-y-2 border-t md:border-t-0 md:border-l border-slate-100 md:pl-5 pt-3 md:pt-0 flex flex-col justify-between">
                            <div>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                                {isId ? 'Paket Rombongan' : 'Package Details'}
                              </span>
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 mt-1">
                                <Users className="w-3.5 h-3.5 text-orange-500" />
                                <span>{booking.participant_count} {isId ? 'Tamu (Paket Privat)' : 'Guests (Private)'}</span>
                              </div>
                              <div className="mt-2">
                                <span className="text-[11px] text-slate-400 block">
                                  {isId ? 'Total Tagihan' : 'Total Amount'}
                                </span>
                                <span className="text-base sm:text-lg font-black text-slate-900">
                                  {booking.currency === 'IDR'
                                    ? `Rp ${booking.total_price.toLocaleString('id-ID')}`
                                    : `$${booking.total_price}`}
                                </span>
                              </div>
                            </div>

                            {booking.payment && (
                              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                                <span>Gateway: {booking.payment.payment_gateway?.toUpperCase()}</span>
                                <span className={`ml-1.5 font-bold uppercase ${booking.payment.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  ({booking.payment.status})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Seksi Ulasan Tamu & Balasan Host */}
                        {booking.review && (
                          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3.5 h-3.5 ${
                                        i < booking.review!.rating
                                          ? 'fill-amber-400 text-amber-400'
                                          : 'fill-slate-200 text-slate-200'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs font-bold text-slate-900">
                                  {booking.review.rating} / 5
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  • {isId ? 'Ulasan Tamu' : 'Guest Review'}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {new Date(booking.review.created_at).toLocaleDateString(
                                  isId ? 'id-ID' : 'en-US',
                                  { day: 'numeric', month: 'short', year: 'numeric' }
                                )}
                              </span>
                            </div>

                            {booking.review.comment && (
                              <p className="text-xs text-slate-700 leading-relaxed italic bg-white/80 p-3 rounded-xl border border-amber-100">
                                "{booking.review.comment}"
                              </p>
                            )}

                            {/* Balasan Host yang Sudah Ada */}
                            {booking.review.host_reply && replyingReviewId !== booking.review.id && (
                              <div className="p-3.5 rounded-xl bg-purple-50/90 border border-purple-100 text-xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-900 font-bold text-[10px]">
                                    <CheckCircle2 className="w-3 h-3 text-purple-700" />
                                    <span>{isId ? 'Tanggapan Anda (Host)' : 'Your Response (Host)'}</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplyingReviewId(booking.review!.id);
                                      setReplyText(booking.review!.host_reply || '');
                                      setReplyError(null);
                                    }}
                                    className="text-[11px] font-bold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer"
                                  >
                                    {isId ? 'Edit Balasan' : 'Edit Response'}
                                  </button>
                                </div>
                                <p className="text-slate-700 italic">"{booking.review.host_reply}"</p>
                                {booking.review.host_replied_at && (
                                  <span className="text-[10px] text-slate-400 block">
                                    • {new Date(booking.review.host_replied_at).toLocaleDateString(isId ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Tombol Balas Ulasan jika belum membalas dan belum buka form */}
                            {!booking.review.host_reply && replyingReviewId !== booking.review.id && (
                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingReviewId(booking.review!.id);
                                    setReplyText('');
                                    setReplyError(null);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>{isId ? '💬 Balas Ulasan Tamu' : '💬 Reply to Guest Review'}</span>
                                </button>
                              </div>
                            )}

                            {/* Form Input Balasan Host */}
                            {replyingReviewId === booking.review.id && (
                              <div className="p-3.5 rounded-2xl bg-white border border-purple-200 space-y-2.5">
                                <label className="block text-xs font-bold text-purple-950">
                                  {isId ? 'Tulis Balasan / Tanggapan Resmi Anda:' : 'Write Your Official Response:'}
                                </label>
                                {replyError && (
                                  <p className="text-xs text-rose-600 font-semibold">{replyError}</p>
                                )}
                                <textarea
                                  rows={3}
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder={
                                    isId
                                      ? 'Contoh: Terima kasih banyak atas ulasan hangatnya! Senang sekali bisa memandu rombongan Anda...'
                                      : 'E.g., Thank you so much for your kind words! It was a pleasure hosting you...'
                                  }
                                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
                                />
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    disabled={isSubmittingReply}
                                    onClick={() => {
                                      setReplyingReviewId(null);
                                      setReplyText('');
                                      setReplyError(null);
                                    }}
                                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer"
                                  >
                                    {isId ? 'Batal' : 'Cancel'}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isSubmittingReply || !replyText.trim()}
                                    onClick={() => handleHostSubmitReply(booking.review!.id)}
                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
                                  >
                                    {isSubmittingReply ? (
                                      <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>{isId ? 'Menyimpan...' : 'Saving...'}</span>
                                      </>
                                    ) : (
                                      <span>{isId ? 'Simpan Balasan' : 'Save Response'}</span>
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 3. Baris Tombol Aksi Host */}
                        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                          <div className="text-xs text-slate-500 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{isId ? 'Dana aman di Rekening Bersama Locallytrip' : 'Escrow Protected'}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {/* Tombol Aksi Status PENDING */}
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'CONFIRMED')}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 min-h-[40px] cursor-pointer"
                                >
                                  {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                  <span>{isId ? 'Konfirmasi Jadwal' : 'Confirm Schedule'}</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'CANCELLED')}
                                  className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs transition disabled:opacity-50 min-h-[40px] cursor-pointer"
                                >
                                  {isId ? 'Tolak Pesanan' : 'Decline Booking'}
                                </button>
                              </>
                            )}

                            {/* Tombol Aksi Status CONFIRMED */}
                            {isConfirmed && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setScannerInitialCode(booking.booking_reference);
                                    setIsQrScannerOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition min-h-[40px] cursor-pointer"
                                >
                                  <Camera className="w-3.5 h-3.5" />
                                  <span>{isId ? 'Scan QR / Check-In' : 'Scan QR / Check-In'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setVerifyRefInput(booking.booking_reference);
                                    setVerifiedTicket({
                                      id: booking.id,
                                      booking_reference: booking.booking_reference,
                                      status: booking.status,
                                      selected_date: booking.selected_date,
                                      selected_time: booking.selected_time,
                                      participant_count: booking.participant_count,
                                      total_price: booking.total_price,
                                      experience: booking.experience,
                                      guest: booking.guest,
                                      payment: booking.payment,
                                    });
                                    setVerifyError(null);
                                    setCheckInSuccess(false);
                                    setIsVerifyModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-semibold text-xs border border-purple-200 transition min-h-[40px] cursor-pointer"
                                >
                                  <CheckCircle className="w-3.5 h-3.5 text-purple-700" />
                                  <span>{isId ? 'Detail Tiket' : 'Ticket Details'}</span>
                                </button>
                              </>
                            )}

                            {/* Tautan Detail Tur */}
                            {booking.experience?.slug && (
                              <Link
                                href={`/${locale}/experiences/${booking.experience.slug}`}
                                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition min-h-[40px]"
                              >
                                <span>{isId ? 'Detail Tur' : 'Tour Page'}</span>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredHostBookings.length > visibleHostBookingsCount && (
                    <div className="pt-4 text-center">
                      <button
                        type="button"
                        onClick={() => setVisibleHostBookingsCount((prev) => prev + STEP_BOOKINGS)}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition shadow-xs min-h-[44px] cursor-pointer"
                      >
                        {isId
                          ? `Muat Lebih Banyak Pesanan Masuk (${filteredHostBookings.length - visibleHostBookingsCount} tersisa)`
                          : `Load More Incoming Bookings (${filteredHostBookings.length - visibleHostBookingsCount} remaining)`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 5: DOMPET & HADIAH */}
        {activeTab === 'wallet' && (
          <div className="space-y-6">
            {/* Header Judul Tab */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                {isId ? 'FINANSIAL & REWARD KOMUNITAS' : 'COMMUNITY FINANCES & REWARDS'}
              </span>
              <h3 className="font-serif font-bold text-xl sm:text-2xl text-slate-900 mt-1">
                {isId ? 'Dompet LTP & Pusat Pencairan' : 'LTP Wallet & Payout Center'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {isId
                  ? 'Koin LTP Anda dapat ditukarkan untuk potongan harga pemesanan tur atau dicairkan langsung ke rekening bank / PayPal.'
                  : 'Your LTP Coins can be redeemed for booking discounts or cashed out to your bank account or PayPal.'}
              </p>
            </div>

            {/* Host Financial Hub (Khusus Pemandu Wisata) */}
            {isHostRole && (
              <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden border border-purple-700/50">
                <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-300/30 text-[10px] font-bold uppercase tracking-wider">
                        {isId ? '💼 PUSAT KEUANGAN HOST (IDR)' : '💼 HOST FINANCE HUB (IDR)'}
                      </span>
                      {user.kyc_status === 'approved' || user.is_verified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          KYC Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          KYC Pending
                        </span>
                      )}
                    </div>
                    <h4 className="text-xl sm:text-2xl font-black font-serif">
                      {isId ? 'Dompet Saldo & Pencairan Hasil Tur' : 'Host Earnings & Payout Manager'}
                    </h4>
                    <p className="text-xs sm:text-sm text-purple-200/90 max-w-2xl leading-relaxed">
                      {isId
                        ? 'Kelola akumulasi pendapatan kotor tur selesai, pantau saldo tertahan (escrow), kelola rekening bank penerima, dan ajukan transfer pencairan dana IDR.'
                        : 'Manage gross earnings from completed tours, monitor pending escrow balances, manage bank accounts, and request IDR disbursements.'}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Link
                      href={`/${locale}/dashboard/wallet`}
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition active:scale-95 inline-flex items-center gap-2"
                    >
                      <Wallet className="w-4 h-4" />
                      <span>{isId ? 'Buka Dompet Host & Tarik IDR →' : 'Open Host Wallet & Cash Out →'}</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Kartu Ringkasan Saldo (Hero Wallet Card) */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-purple-800/40">
              {/* Background Glow Accents */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
                      <span>🪙</span>
                      <span>{isId ? 'Total Saldo Dompet Aktif' : 'Active Wallet Balance'}</span>
                    </span>
                    <div className="text-3xl sm:text-4xl md:text-5xl font-black font-serif mt-2 tracking-tight">
                      {currentBalance.toLocaleString()} <span className="text-amber-400 text-2xl sm:text-3xl">LTP</span>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 self-start sm:self-auto space-y-0.5">
                    <div className="text-xs text-purple-200">
                      {isId ? 'Estimasi Konversi Nilai' : 'Estimated Value'}
                    </div>
                    <div className="text-sm font-black text-amber-300">
                      ≈ ${ltpInUsd} USD
                    </div>
                    <div className="text-xs text-slate-300 font-medium">
                      ≈ Rp {ltpInIdr.toLocaleString('id-ID')} IDR
                    </div>
                  </div>
                </div>

                {/* Bar Progres Penarikan ke 3.000 LTP */}
                <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-purple-200 font-semibold flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isId ? 'Progres Pencairan Dana ($30.00 USD Target)' : 'Cash Out Progress ($30.00 USD Target)'}</span>
                    </span>
                    <span className="font-bold text-amber-400">
                      {currentBalance.toLocaleString()} / 3,000 LTP ({ltpProgressPercent}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500 shadow-sm shadow-amber-500/50"
                      style={{ width: `${ltpProgressPercent}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-purple-200/80 leading-relaxed">
                    {canPayout ? (
                      <span className="text-emerald-300 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 inline" />
                        {isId
                          ? '🎉 Selamat! Saldo Anda telah memenuhi syarat penarikan minimum.'
                          : '🎉 Congratulations! Your balance meets the minimum payout threshold.'}
                      </span>
                    ) : (
                      <span>
                        {isId
                          ? `Kumpulkan minimal 3.000 LTP ($30.00 USD) untuk mencairkan saldo ke rekening bank atau PayPal. Kurang ${(3000 - currentBalance).toLocaleString()} LTP lagi.`
                          : `Accumulate at least 3,000 LTP ($30.00 USD) to withdraw funds to bank or PayPal. ${(3000 - currentBalance).toLocaleString()} LTP remaining.`}
                      </span>
                    )}
                  </p>
                </div>

                {/* Tombol Aksi Dompet */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPayoutAmount(Math.max(3000, Math.min(currentBalance, 3000)));
                      setPayoutSuccess(false);
                      setPayoutError(null);
                      setIsPayoutModalOpen(true);
                    }}
                    disabled={!canPayout}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-md ${
                      canPayout
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 active:scale-95 cursor-pointer shadow-amber-500/25'
                        : 'bg-white/10 text-white/50 cursor-not-allowed border border-white/5'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    <span>{isId ? 'Tarik Saldo / Cash Out' : 'Cash Out LTP'}</span>
                  </button>

                  <Link
                    href={`/${locale}/dashboard/wallet`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold border border-emerald-400/30 transition shadow-md shadow-emerald-600/20"
                  >
                    <Wallet className="w-4 h-4 text-emerald-200" />
                    <span>{isId ? 'Dompet Host & Tarik Dana IDR →' : 'Host Wallet & IDR Payout →'}</span>
                  </Link>

                  <Link
                    href={`/${locale}/community/rewards`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition backdrop-blur-sm"
                  >
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span>{isId ? 'Kalkulator Hadiah Komunitas' : 'Rewards Calculator'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-purple-300" />
                  </Link>

                  <Link
                    href={`/${locale}/experiences`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-900 text-purple-200 hover:text-white text-xs font-semibold border border-purple-700/50 transition"
                  >
                    <Compass className="w-4 h-4 text-purple-300" />
                    <span>{isId ? 'Gunakan untuk Diskon Tur' : 'Redeem on Tours'}</span>
                  </Link>
                </div>

                <p className="text-[11px] text-purple-200/90 pt-1">
                  * {isId
                    ? 'Earn LTP Credits to unlock free local experiences & discounts. (Pencairan ke USD secara eksklusif hanya berlaku bagi Host Terverifikasi yang memperoleh pendapatan dari tur terbitan).'
                    : 'Earn LTP Credits to unlock free local experiences & discounts. (Cash-out to USD is exclusively available for Verified Local Hosts earning from published experiences).'}
                </p>
              </div>
            </div>

            {/* Riwayat Mutasi Saldo (Mobile Card List / Stacked Island Cards) */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base sm:text-lg text-slate-900">
                    {isId ? 'Riwayat Mutasi Saldo LTP' : 'LTP Mutation History'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isId ? 'Catatan perolehan reward dan penarikan koin' : 'Log of rewards earned and payouts'}
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                  {user.transactions.length} {isId ? 'Transaksi' : 'Transactions'}
                </span>
              </div>

              {user.transactions.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                    <Coins className="w-5 h-5" />
                  </div>
                  <p className="font-medium text-slate-700">
                    {isId ? 'Belum ada catatan mutasi transaksi.' : 'No transactions recorded yet.'}
                  </p>
                  <p className="text-slate-400 max-w-sm mx-auto">
                    {isId
                      ? 'Tulis cerita perjalanan atau ikuti agenda meetup untuk mulai mengumpulkan saldo koin LTP.'
                      : 'Publish travel stories or join meetups to start accumulating LTP coins.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {user.transactions.slice(0, visibleTransactionsCount).map((tx) => {
                    const isCredit = tx.type === 'credit' || tx.amount > 0;
                    return (
                      <div
                        key={tx.id}
                        className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isCredit
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {isCredit ? (
                              <ArrowDownLeft className="w-5 h-5" />
                            ) : (
                              <ArrowUpRight className="w-5 h-5" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                {tx.activity_type === 'STORY_PUBLISH'
                                  ? isId ? 'Penerbitan Cerita Wisata' : 'Story Publication'
                                  : tx.activity_type === 'MEETUP_JOIN'
                                  ? isId ? 'Kehadiran Agenda Meetup' : 'Meetup Attendance'
                                  : tx.activity_type === 'PAYOUT_REQUEST'
                                  ? isId ? 'Permohonan Pencairan Dana' : 'Payout Request'
                                  : tx.activity_type === 'WELCOME_BONUS'
                                  ? isId ? 'Bonus Selamat Datang' : 'Welcome Bonus'
                                  : tx.activity_type}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {new Date(tx.created_at).toLocaleDateString(isId ? 'id-ID' : 'en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`text-sm sm:text-base font-black ${
                              isCredit ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isCredit ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()} LTP
                          </span>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            ≈ Rp {Math.round(Math.abs(tx.amount) * 178.97).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {user.transactions.length > visibleTransactionsCount && (
                    <div className="pt-4 text-center">
                      <button
                        type="button"
                        onClick={() => setVisibleTransactionsCount((prev) => prev + STEP_TRANSACTIONS)}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition shadow-xs min-h-[44px] cursor-pointer"
                      >
                        {isId
                          ? `Tampilkan Lebih Banyak Transaksi (${user.transactions.length - visibleTransactionsCount} tersisa)`
                          : `Load More Transactions (${user.transactions.length - visibleTransactionsCount} remaining)`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 8: PROGRAM REFERRAL / AJAK TEMAN */}
        {activeTab === 'referral' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Banner Utama Referral */}
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-300/30 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isId ? 'Program Ajak Teman (Referral Loop)' : 'Referral Reward Program'}</span>
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold font-serif">
                    {isId ? 'Bagikan Petualangan & Dapatkan Hadiah' : 'Share Adventure & Earn Rewards'}
                  </h3>
                  <p className="text-xs sm:text-sm text-purple-200/90 max-w-xl leading-relaxed">
                    {isId
                      ? 'Undang teman, rekan petualang, dan sesama host lokal. Teman Anda mendapat bonus selamat datang +50 XP saat mendaftar, dan Anda meraih +100 XP poin reputasi serta +10 LTP Koin Hadiah!'
                      : 'Invite friends, travelers, and fellow local hosts. Friends get a +50 XP welcome bonus, and you earn +100 XP reputation points and +10 LTP reward coins!'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-center min-w-[140px]">
                    <span className="text-[11px] text-purple-200 block font-medium">
                      {isId ? 'Teman Bergabung' : 'Friends Joined'}
                    </span>
                    <span className="text-2xl font-black text-amber-300 font-mono">
                      {user.referral_usage_count || 0}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange('wallet')}
                    className="w-full sm:w-auto px-4 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-xs shadow-md transition text-center cursor-pointer active:scale-95"
                  >
                    {isId ? 'Lihat Saldo Koin LTP & Hadiah →' : 'View LTP Coin Balance & Rewards →'}
                  </button>
                </div>
              </div>
            </div>

            {/* Grid 2-Kolom: Kartu Kode Referral (Kiri) + Penjelasan Keuntungan (Kanan) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Kolom Kiri: Kartu Interaktif Kode & Tautan */}
              <div className="md:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
                <div>
                  <h4 className="font-bold text-base text-slate-900 font-serif">
                    {isId ? 'Kode Referral Anda' : 'Your Referral Code'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isId
                      ? 'Salin kode unik di bawah ini atau bagikan tautan pendaftaran langsung kepada rekan Anda.'
                      : 'Copy your unique code or share the direct registration link.'}
                  </p>
                </div>

                {/* Box Kode Referral */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {isId ? 'Kode Kupon Unik' : 'Unique Coupon Code'}
                  </span>
                  <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="font-mono font-black text-lg text-purple-900 tracking-wider">
                      {user.referral_code || 'BELUM TERSEDIA'}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        if (user.referral_code) {
                          await navigator.clipboard.writeText(user.referral_code);
                          setCopiedReferralCode(true);
                          setTimeout(() => setCopiedReferralCode(false), 2000);
                        }
                      }}
                      className="px-3.5 py-2 rounded-lg bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      {copiedReferralCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>{isId ? 'Tersalin!' : 'Copied!'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{isId ? 'Salin Kode' : 'Copy Code'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Box Tautan Pendaftaran Langsung */}
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/60 space-y-2">
                  <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">
                    {isId ? 'Tautan Pendaftaran Langsung' : 'Direct Registration Link'}
                  </span>
                  <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-purple-200/80 shadow-2xs">
                    <span className="text-xs text-slate-600 truncate font-mono">
                      {`https://locallytrip.com/${locale}/register?ref=${user.referral_code || ''}`}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        const link = `https://locallytrip.com/${locale}/register?ref=${user.referral_code || ''}`;
                        await navigator.clipboard.writeText(link);
                        setCopiedReferralLink(true);
                        setTimeout(() => setCopiedReferralLink(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs shrink-0 transition cursor-pointer"
                    >
                      {copiedReferralLink ? (isId ? 'Tersalin!' : 'Copied!') : (isId ? 'Salin Tautan' : 'Copy Link')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Rincian Keuntungan Referral */}
              <div className="md:col-span-5 space-y-4">
                <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 font-serif">
                    {isId ? 'Keuntungan Program Referral' : 'Referral Benefits'}
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        🎁
                      </div>
                      <div>
                        <span className="font-bold text-emerald-950 block">
                          {isId ? '+50 XP untuk Teman Anda' : '+50 XP for Your Friend'}
                        </span>
                        <p className="text-emerald-800 text-[11px] mt-0.5">
                          {isId
                            ? 'Bonus aktivasi akun langsung saat teman mendaftar menggunakan kode referral Anda.'
                            : 'Instant account activation bonus when your friend registers with your code.'}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        🪙
                      </div>
                      <div>
                        <span className="font-bold text-amber-950 block">
                          {isId ? '+100 XP & Bonus Koin LTP' : '+100 XP & LTP Coin Bonus'}
                        </span>
                        <p className="text-amber-800 text-[11px] mt-0.5">
                          {isId
                            ? 'Koin hadiah dapat digunakan untuk potongan diskon tur di seluruh destinasi Locallytrip.'
                            : 'Reward coins can be redeemed for tour discounts across all Locallytrip destinations.'}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-purple-50 border border-purple-100 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-purple-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        ⭐
                      </div>
                      <div>
                        <span className="font-bold text-purple-950 block">
                          {isId ? 'Lencana Komunitas Khusus' : 'Special Community Badges'}
                        </span>
                        <p className="text-purple-800 text-[11px] mt-0.5">
                          {isId
                            ? 'Buka tier "Ambassador Komunitas" di profil publik Anda dan nikmati keistimewaan status kreator.'
                            : 'Unlock the "Community Ambassador" tier badge on your public profile.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: PESAN & OBROLAN (DIRECT MESSAGES & MEETUP GROUP CHATS) */}
        {activeTab === 'messages' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Header Tab Pesan */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md">
                  {isId ? 'Pusat Komunikasi' : 'Communication Hub'}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 mt-1">
                  {isId ? 'Pesan & Obrolan' : 'Messages & Chat'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {isId
                    ? 'Kelola obrolan personal dengan sesama petualang dan pantau diskusi meja kumpul aktif Anda.'
                    : 'Manage 1-on-1 direct conversations and keep track of your active meetup tables.'}
                </p>
              </div>

              <Link
                href={`/${locale}/messages`}
                className="px-4 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-semibold text-xs shadow-sm transition active:scale-95 self-start sm:self-auto flex items-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{isId ? 'Buka Kotak Masuk Lengkap →' : 'Open Full Inbox →'}</span>
              </Link>
            </div>

            {/* Grid 2 Kolom Bersih: Pesan Pribadi & Diskusi Meja Kumpul */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Kolom 1: Pesan Pribadi (Direct Messages) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-base">💬</span>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                      {isId ? 'Pesan Pribadi (Direct Messages)' : 'Direct Messages (1-on-1)'}
                    </h4>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    {user.directConversations?.length || 0} {isId ? 'Kontak' : 'Chats'}
                  </span>
                </div>

                {(!user.directConversations || user.directConversations.length === 0) ? (
                  <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                    <p>{isId ? 'Belum ada pesan pribadi yang masuk.' : 'No direct messages yet.'}</p>
                    <p className="text-[11px] text-slate-400">
                      {isId
                        ? 'Kunjungi profil teman atau inisiator meetup untuk memulai obrolan.'
                        : 'Visit a friend or host profile to start a chat.'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {user.directConversations.map((conv) => (
                      <div
                        key={conv.id}
                        className="py-3.5 flex items-center justify-between gap-3 group hover:bg-slate-50/50 p-2 rounded-2xl transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar
                            src={conv.participant.avatar_url}
                            name={conv.participant.name}
                            size={44}
                            className="ring-2 ring-white shrink-0"
                          />

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                {conv.participant.name}
                              </span>
                              {conv.participant.is_verified && (
                                <span className="inline-flex items-center text-emerald-600 font-bold text-[10px]" title="KYC Verified">
                                  ✓
                                </span>
                              )}
                              <span className="text-[11px] text-purple-700">
                                @{conv.participant.username}
                              </span>
                            </div>

                            <p className="text-xs text-slate-500 truncate mt-0.5 max-w-[200px] sm:max-w-xs">
                              {conv.lastMessage
                                ? `${conv.lastMessage.isSenderMe ? (isId ? 'Anda: ' : 'You: ') : ''}${conv.lastMessage.content}`
                                : (isId ? 'Belum ada riwayat pesan' : 'No messages yet')}
                            </p>

                            {conv.lastMessage && (
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {new Date(conv.lastMessage.createdAt).toLocaleDateString([], {
                                  day: 'numeric',
                                  month: 'short',
                                })} • {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {conv.unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-700 text-white font-bold text-[10px]">
                              {conv.unreadCount} baru
                            </span>
                          )}
                          <Link
                            href={`/${locale}/messages?c=${conv.id}`}
                            className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-semibold text-xs border border-purple-200 transition active:scale-95"
                          >
                            {isId ? 'Buka Chat' : 'Open Chat'}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Kolom 2: Diskusi Meja Kumpul Saya (Group Chat) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🗓️</span>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                      {isId ? 'Diskusi Meja Kumpul Saya' : 'My Meetup Tables (Group Chat)'}
                    </h4>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    {user.meetupChats?.length || 0} {isId ? 'Meja' : 'Tables'}
                  </span>
                </div>

                {(!user.meetupChats || user.meetupChats.length === 0) ? (
                  <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                    <Users className="w-8 h-8 text-slate-300 mx-auto" />
                    <p>{isId ? 'Anda belum mengikuti meja kumpul aktif.' : 'You have not joined any meetups yet.'}</p>
                    <Link
                      href={`/${locale}/community/meetups`}
                      className="inline-block mt-1 font-semibold text-purple-700 hover:text-purple-900"
                    >
                      {isId ? 'Jelajahi Meja Kumpul Komunitas ›' : 'Explore Community Meetups ›'}
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {user.meetupChats.map((meetup) => (
                      <div
                        key={meetup.id}
                        className="py-3.5 flex items-center justify-between gap-3 group hover:bg-slate-50/50 p-2 rounded-2xl transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-slate-100">
                            <Image
                              src={meetup.bannerImage || '/images/placeholders/meetup-default.jpg'}
                              alt={meetup.title}
                              fill
                              className="object-cover"
                            />
                          </div>

                          <div className="min-w-0">
                            <h5 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                              {meetup.title}
                            </h5>
                            <span className="text-[11px] text-purple-700 font-medium block">
                              📍 {meetup.cityName || 'Komunitas'} • {meetup.membersCount} {isId ? 'Peserta' : 'Members'}
                            </span>

                            {meetup.lastMessage ? (
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                <span className="font-semibold text-slate-700">{meetup.lastMessage.userName}: </span>
                                {meetup.lastMessage.content}
                              </p>
                            ) : (
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {isId ? 'Belum ada obrolan grup baru' : 'No recent group chats'}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0">
                          <Link
                            href={`/${locale}/community/meetups/${meetup.slug || meetup.id}`}
                            className="px-3 py-1.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-semibold text-xs shadow-sm transition active:scale-95 inline-flex items-center gap-1.5"
                          >
                            <span>{isId ? 'Masuk Ruang Meja' : 'Enter Table'}</span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Interaktif Formulir Pencairan (Payout Modal) */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8">
            {/* Tombol Tutup */}
            <button
              type="button"
              onClick={() => setIsPayoutModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            {payoutSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="font-serif font-bold text-xl text-slate-900">
                  {isId ? 'Permohonan Pencairan Berhasil!' : 'Payout Request Submitted!'}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                  {isId
                    ? `Permohonan penarikan ${payoutAmount.toLocaleString()} LTP (≈ $${(payoutAmount / 100).toFixed(2)} USD) Anda telah berhasil dikirimkan. Tim keuangan kami akan memverifikasi dan mentransfer dana dalam 1-3 hari kerja.`
                    : `Your withdrawal request of ${payoutAmount.toLocaleString()} LTP (≈ $${(payoutAmount / 100).toFixed(2)} USD) has been submitted. Our finance team will process it within 1-3 business days.`}
                </p>
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
                >
                  {isId ? 'Kembali ke Dashboard' : 'Back to Dashboard'}
                </button>
              </div>
            ) : (
              <form onSubmit={handlePayoutSubmit} className="space-y-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
                    <span>🪙</span>
                    <span>{isId ? 'Pencairan Saldo LTP' : 'Cash Out LTP'}</span>
                  </span>
                  <h3 className="font-serif font-bold text-xl sm:text-2xl text-slate-900 mt-1">
                    {isId ? 'Formulir Penarikan Dana' : 'Withdrawal Request Form'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {isId
                      ? 'Saldo Anda akan dipotong dan ditransfer dalam mata uang IDR atau USD.'
                      : 'Your balance will be deducted and transferred in IDR or USD equivalent.'}
                  </p>
                </div>

                {payoutError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{payoutError}</span>
                  </div>
                )}

                {/* Input Jumlah Penarikan */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700">
                      {isId ? 'Jumlah Penarikan (LTP)' : 'Withdrawal Amount (LTP)'}
                    </label>
                    <span className="text-slate-500 text-[11px]">
                      {isId ? 'Saldo Tersedia:' : 'Available:'}{' '}
                      <strong className="text-amber-700">{currentBalance.toLocaleString()} LTP</strong>
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min={3000}
                      max={currentBalance}
                      step={100}
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm font-bold text-slate-900 pr-24"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setPayoutAmount(currentBalance)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 text-[11px] font-bold transition"
                    >
                      {isId ? 'Tarik Semua' : 'Max'}
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-500 flex justify-between">
                    <span>≈ ${(payoutAmount / 100).toFixed(2)} USD</span>
                    <span>≈ Rp {(payoutAmount * 178.97).toLocaleString('id-ID')} IDR</span>
                  </div>
                </div>

                {/* Pilihan Metode Pencairan */}
                <div className="space-y-2">
                  <label className="font-bold text-xs text-slate-700 block">
                    {isId ? 'Metode Pencairan' : 'Payout Method'}
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPayoutMethod('BANK_TRANSFER')}
                      className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                        payoutMethod === 'BANK_TRANSFER'
                          ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-600/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <Building className={`w-4 h-4 ${payoutMethod === 'BANK_TRANSFER' ? 'text-purple-700' : 'text-slate-400'}`} />
                      <div>
                        <div className="font-bold text-xs text-slate-900">Transfer Bank</div>
                        <div className="text-[10px] text-slate-500">BCA, Mandiri, BRI, BNI</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayoutMethod('PAYPAL')}
                      className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                        payoutMethod === 'PAYPAL'
                          ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-600/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className={`w-4 h-4 ${payoutMethod === 'PAYPAL' ? 'text-purple-700' : 'text-slate-400'}`} />
                      <div>
                        <div className="font-bold text-xs text-slate-900">PayPal</div>
                        <div className="text-[10px] text-slate-500">Mata Uang USD</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Form Rekening Bank */}
                {payoutMethod === 'BANK_TRANSFER' ? (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        {isId ? 'Nama Bank' : 'Bank Name'}
                      </label>
                      <select
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600"
                      >
                        <option value="BCA">Bank Central Asia (BCA)</option>
                        <option value="Mandiri">Bank Mandiri</option>
                        <option value="BRI">Bank Rakyat Indonesia (BRI)</option>
                        <option value="BNI">Bank Negara Indonesia (BNI)</option>
                        <option value="CIMB">CIMB Niaga</option>
                        <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        {isId ? 'Nomor Rekening' : 'Account Number'}
                      </label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Contoh: 1234567890"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        {isId ? 'Nama Pemegang Rekening' : 'Account Holder Name'}
                      </label>
                      <input
                        type="text"
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  /* Form PayPal */
                  <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        {isId ? 'Alamat Email Akun PayPal' : 'PayPal Account Email'}
                      </label>
                      <input
                        type="email"
                        value={paypalEmail}
                        onChange={(e) => setPaypalEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Tombol Konfirmasi Aksi */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPayoutModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
                  >
                    {isId ? 'Batal' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingPayout || payoutAmount < 3000 || payoutAmount > currentBalance}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    {isSubmittingPayout ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>{isId ? 'Ajukan Pencairan Sekarang' : 'Submit Cash Out'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Contextual Auth Modal jika dibutuhkan */}
      <ContextualAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        promptMessage={authMessage}
        locale={locale}
      />


      {/* Modal Dialog Detail E-Tiket & QR Code Verifikasi */}
      {selectedTicketBooking && (() => {
        const DEFAULT_EXPERIENCE_IMAGE = '/images/placeholder-experience.jpg';
        const rawCover = selectedTicketBooking.experience?.cover_image;
        const tourCoverImg = rawCover
          ? (rawCover.startsWith('http') || rawCover.startsWith('/')
              ? rawCover
              : `/images/experiences/${rawCover}`)
          : DEFAULT_EXPERIENCE_IMAGE;

        const hostAvatar = resolveAvatarUrl(selectedTicketBooking.experience?.host?.avatar_url);

        const formattedDate = selectedTicketBooking.selected_date
          ? new Date(selectedTicketBooking.selected_date).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : '-';

        const paymentStatus = selectedTicketBooking.payment?.status || selectedTicketBooking.status;
        const paymentAmount = selectedTicketBooking.payment?.amount || selectedTicketBooking.total_price;
        const paymentCurrency = selectedTicketBooking.payment?.currency || selectedTicketBooking.currency || 'USD';

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 shadow-2xl space-y-5 relative border border-slate-100">
              {/* Header Modal */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-purple-900 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                      E-Tiket Resmi LocallyTrip
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        selectedTicketBooking.status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : selectedTicketBooking.status === 'completed'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {selectedTicketBooking.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                    {selectedTicketBooking.experience?.title || 'Pengalaman Tur'}
                  </h3>
                  {selectedTicketBooking.experience?.city_name && (
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{selectedTicketBooking.experience.city_name}</span>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTicketBooking(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition shrink-0"
                >
                  ✕
                </button>
              </div>

              {/* Foto Sampul Tur Thumbnail dengan Fallback Aman */}
              <div className="relative w-full h-36 sm:h-44 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  src={tourCoverImg}
                  alt={selectedTicketBooking.experience?.title || 'Tour Thumbnail'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_EXPERIENCE_IMAGE;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3.5">
                  <span className="text-white text-xs font-semibold drop-shadow-md">
                    {selectedTicketBooking.experience?.duration_hours} {isId ? 'Jam Durasi Tur' : 'Hours Tour Duration'}
                  </span>
                </div>
              </div>

              {/* Bagian QR Code Dinamis (220x220) */}
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-5 text-center space-y-3">
                <div className="inline-block p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                      selectedTicketBooking.booking_reference
                    )}`}
                    alt={`QR Code Booking ${selectedTicketBooking.booking_reference}`}
                    className="w-44 h-44 mx-auto object-contain"
                  />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Kode Booking</p>
                  <p className="text-lg font-mono font-extrabold text-slate-900 tracking-wider">
                    Ref: {selectedTicketBooking.booking_reference}
                  </p>
                </div>

                <div className="bg-purple-50/80 border border-purple-100 rounded-xl p-3 text-left flex items-start gap-2.5">
                  <QrCode className="w-4 h-4 text-purple-900 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-purple-950 leading-relaxed font-medium">
                    {isId
                      ? 'Tunjukkan QR Code ini kepada Host/Pemandu Lokal saat sesi tur dimulai untuk verifikasi kehadiran.'
                      : 'Show this QR Code to your Local Host/Guide when the tour begins for check-in verification.'}
                  </p>
                </div>
              </div>

              {/* Rincian Pelaksanaan Tur & Catatan Khusus dari Database */}
              <div className="space-y-3 text-xs border border-slate-100 rounded-2xl p-4 bg-white shadow-xs">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
                  {isId ? 'Rincian Pelaksanaan Tur' : 'Tour Schedule & Details'}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[11px]">{isId ? 'Tanggal Tur' : 'Date'}</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-900 shrink-0" />
                      <span>{formattedDate}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">{isId ? 'Waktu Mulai' : 'Start Time'}</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-purple-900 shrink-0" />
                      <span>{selectedTicketBooking.selected_time || '08:00 WIB'}</span>
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">{isId ? 'Titik Kumpul' : 'Meeting Point'}</span>
                  <span className="font-medium text-slate-800 flex items-start gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>
                      {selectedTicketBooking.experience?.meeting_point ||
                        (isId
                          ? 'Akan diinformasikan oleh Host via chat/WhatsApp'
                          : 'Will be informed by Host via chat/WhatsApp')}
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">{isId ? 'Rombongan Tamu' : 'Guest Party'}</span>
                    <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <Users className="w-3.5 h-3.5 text-purple-900 shrink-0" />
                      <span>
                        {selectedTicketBooking.participant_count || 1} {isId ? 'Tamu (Paket Privat)' : 'Guests (Private Tour)'}
                      </span>
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">{isId ? 'Total Tagihan & Status Bayar' : 'Total & Payment Status'}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-bold text-slate-900">
                        {paymentCurrency === 'IDR' ? `Rp ${paymentAmount.toLocaleString('id-ID')}` : `$${paymentAmount}`}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          paymentStatus === 'paid' || paymentStatus === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info Host */}
                {selectedTicketBooking.experience?.host && (
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar
                        src={selectedTicketBooking.experience.host.avatar_url}
                        name={selectedTicketBooking.experience.host.name}
                        size={40}
                        className="border border-purple-200"
                      />
                      <div>
                        <p className="text-[11px] text-slate-400">{isId ? 'Pemandu Lokal' : 'Local Host'}</p>
                        <p className="font-bold text-slate-900">{selectedTicketBooking.experience.host.name}</p>
                      </div>
                    </div>

                    {selectedTicketBooking.experience.host.phone ? (
                      <a
                        href={`https://wa.me/${selectedTicketBooking.experience.host.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] transition"
                      >
                        <span>WhatsApp</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">WhatsApp via Chat</span>
                    )}
                  </div>
                )}
              </div>

              {/* Tombol Aksi */}
              <div className="pt-1 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>{isId ? 'Cetak / Simpan Tiket' : 'Print / Save Ticket'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTicketBooking(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs shadow-md transition"
                >
                  {isId ? 'Tutup' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* MODAL VERIFIKASI TIKET & CHECK-IN QR CODE OLEH HOST */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 shadow-2xl space-y-5 relative border border-slate-100">
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-purple-900 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  {isId ? 'Verifikasi E-Tiket Tamu' : 'Verify Guest E-Ticket'}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                  {isId ? 'Check-In & Verifikasi Kode Booking' : 'Check-In & Booking Verification'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsVerifyModalOpen(false);
                  setVerifiedTicket(null);
                  setVerifyError(null);
                  setCheckInSuccess(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form Input Kode Booking */}
            <form onSubmit={handleSearchTicket} className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                {isId ? 'Masukkan Kode Referensi Booking Tamu:' : 'Enter Guest Booking Reference:'}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={verifyRefInput}
                    onChange={(e) => setVerifyRefInput(e.target.value.toUpperCase())}
                    placeholder="Contoh: LT-659744-589"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-sm uppercase font-bold tracking-wider text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearchingTicket || !verifyRefInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {isSearchingTicket ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>{isId ? 'Cari & Verifikasi' : 'Search & Verify'}</span>
                </button>
              </div>
            </form>

            {/* Error Message */}
            {verifyError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}

            {/* Sukses Check-in Alert */}
            {checkInSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold block">
                    {isId ? 'Check-In Berhasil & Tur Selesai! 🎉' : 'Check-In Successful & Tour Completed! 🎉'}
                  </span>
                  <span className="text-emerald-700 text-xs">
                    {isId
                      ? 'Status pemesanan telah diperbarui menjadi Selesai (Completed). Dana akan diteruskan ke dompet host.'
                      : 'Booking status updated to Completed. Payout will be processed to host wallet.'}
                  </span>
                </div>
              </div>
            )}

            {/* Rincian Tiket yang Cocok */}
            {verifiedTicket && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-lg">
                      #{verifiedTicket.booking_reference}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                        verifiedTicket.status === 'completed'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : verifiedTicket.status === 'confirmed' || verifiedTicket.status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {verifiedTicket.status}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">{isId ? 'Judul Tur' : 'Tour Title'}</span>
                    <span className="font-bold text-slate-900 text-sm">{verifiedTicket.experience?.title}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block text-[11px]">{isId ? 'Nama Tamu' : 'Guest Name'}</span>
                      <span className="font-bold text-slate-800">{verifiedTicket.guest?.name || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">{isId ? 'Jumlah Rombongan' : 'Party Size'}</span>
                      <span className="font-bold text-slate-800">{verifiedTicket.participant_count} {isId ? 'Tamu' : 'Guests'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block text-[11px]">{isId ? 'Jadwal Tur' : 'Tour Date'}</span>
                      <span className="font-semibold text-slate-700">
                        {verifiedTicket.selected_date
                          ? new Date(verifiedTicket.selected_date).toLocaleDateString(isId ? 'id-ID' : 'en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">{isId ? 'Total Tagihan' : 'Total Amount'}</span>
                      <span className="font-bold text-slate-900">
                        {verifiedTicket.experience?.currency === 'IDR'
                          ? `Rp ${Number(verifiedTicket.total_price).toLocaleString('id-ID')}`
                          : `$${verifiedTicket.total_price}`}
                      </span>
                    </div>
                  </div>

                  {verifiedTicket.guest?.phone && (
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-slate-500">{isId ? 'WhatsApp Tamu:' : 'Guest WhatsApp:'}</span>
                      <a
                        href={`https://wa.me/${verifiedTicket.guest.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-700 font-bold"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{verifiedTicket.guest.phone}</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Tombol Aksi Konfirmasi Kehadiran */}
                <div className="flex items-center gap-2 pt-1">
                  {verifiedTicket.status !== 'completed' ? (
                    <button
                      type="button"
                      disabled={isCheckingIn}
                      onClick={() => handleConfirmCheckIn(verifiedTicket.id)}
                      className="flex-1 py-3 px-4 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 cursor-pointer"
                    >
                      {isCheckingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
                      <span>{isId ? 'Konfirmasi Kehadiran & Selesaikan Tur' : 'Confirm Check-In & Complete Tour'}</span>
                    </button>
                  ) : (
                    <div className="flex-1 py-3 px-4 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs text-center">
                      {isId ? '✓ Tur Ini Sudah Berstatus Selesai' : '✓ This Tour is Already Completed'}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsVerifyModalOpen(false);
                      setVerifiedTicket(null);
                      setVerifyError(null);
                    }}
                    className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    {isId ? 'Tutup' : 'Close'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL PEMINDAI KAMERA QR CODE HOST */}
      <HostQrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => {
          setIsQrScannerOpen(false);
          setScannerInitialCode('');
        }}
        initialCode={scannerInitialCode}
        onSuccess={(updatedBooking) => {
          setHostList((prev) =>
            prev.map((b) =>
              b.booking_reference === updatedBooking.booking_reference || b.id === updatedBooking.id
                ? { ...b, status: 'completed' }
                : b
            )
          );
        }}
        locale={locale}
      />

      {/* Modal Dialog Konfirmasi Logout Dasbor */}
      {showDashboardLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-150 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                  <LogOut className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-serif">
                    {isId ? 'Konfirmasi Keluar Akun' : 'Confirm Sign Out'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {user.name} (@{user.username})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDashboardLogoutModal(false)}
                disabled={isDashboardLoggingOut}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
              {isId
                ? 'Apakah Anda yakin ingin keluar dari akun Locallytrip? Anda harus masuk kembali untuk mengelola pesanan, cerita, dan dompet.'
                : 'Are you sure you want to sign out of your Locallytrip account? You will need to log back in to manage your bookings, stories, and wallet.'}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDashboardLogoutModal(false)}
                disabled={isDashboardLoggingOut}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-bold transition hover:bg-slate-100"
              >
                {isId ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleDashboardLogout}
                disabled={isDashboardLoggingOut}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isDashboardLoggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isId ? 'Mengeluarkan...' : 'Signing out...'}</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span>{isId ? 'Ya, Keluar' : 'Yes, Sign Out'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
