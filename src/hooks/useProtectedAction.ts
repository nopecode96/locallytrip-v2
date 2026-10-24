'use client';

import { useSession } from 'next-auth/react';
import { useState, useCallback } from 'react';

export function useProtectedAction() {
  const { data: session, status } = useSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | undefined>(undefined);

  const executeProtected = useCallback(
    (action: () => void, customPromptMessage?: string) => {
      if (status === 'loading') return;
      if (!session) {
        if (customPromptMessage) setAuthMessage(customPromptMessage);
        setIsAuthModalOpen(true);
        return;
      }
      action();
    },
    [session, status]
  );

  return {
    isAuthenticated: !!session,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authMessage,
    executeProtected,
    session,
  };
}
