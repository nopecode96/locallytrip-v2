// Real-time Event System with EventTarget & SSE/BroadcastChannel support
// Provides a unified real-time layer for WebSockets / SSE / Client Events in Locallytrip

export type RealTimeEventType =
  | 'chat:new_message'
  | 'meetup:member_joined'
  | 'notification:new'
  | 'user:gamification_update';

export interface ChatMessagePayload {
  meetupId: number;
  messageId: number;
  senderId: number;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  createdAt: string;
}

export interface MemberJoinedPayload {
  meetupId: number;
  member: {
    id: number;
    userId: number;
    name: string | null;
    username: string | null;
    avatar_url: string | null;
    is_verified: boolean;
    status: string | null;
  };
  currentMemberCount: number;
}

export interface NotificationNewPayload {
  userId: number;
  title: string;
  message: string;
  actionUrl?: string | null;
  type?: string;
  createdAt: string;
}

export interface GamificationUpdatePayload {
  userId?: number;
  xpEarned?: number;
  ltpEarned?: number;
  totalXp?: number;
  currentLevel?: number;
}

// In-browser global event emitter
class RealTimeEventEmitter {
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('locallytrip_realtime_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type) {
            this.notifyLocal(event.data.type, event.data.payload);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel initialization error:', e);
      }
    }
  }

  public subscribe(eventType: RealTimeEventType, callback: (payload: any) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)?.add(callback);

    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  public emit(eventType: RealTimeEventType, payload: any, propagate: boolean = true) {
    this.notifyLocal(eventType, payload);

    if (propagate && this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type: eventType, payload });
      } catch (err) {
        console.warn('Failed to propagate realtime message:', err);
      }
    }
  }

  private notifyLocal(eventType: string, payload: any) {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.forEach((fn) => {
        try {
          fn(payload);
        } catch (err) {
          console.error(`Error in realtime handler for ${eventType}:`, err);
        }
      });
    }
  }
}

export const realtimeEmitter = new RealTimeEventEmitter();
