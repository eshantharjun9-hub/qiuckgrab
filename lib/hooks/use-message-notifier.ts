"use client";

import { useEffect } from "react";

/**
 * Hook to start message notifier on any page where user is logged in
 * This ensures notifications work across all pages
 */
export function useMessageNotifier() {
  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem("user");
    if (!userStr) return;

    let userId: string | null = null;
    try {
      const user = JSON.parse(userStr);
      if (user && typeof user.id === "string") {
        userId = user.id;
      }
    } catch {
      return;
    }

    if (!userId) return;

    // Dynamically import to avoid SSR issues
    import("@/lib/services/message-notifier").then(({ messageNotifier }) => {
      messageNotifier.start(userId);
    });

    // Cleanup on unmount
    return () => {
      // Note: We don't stop here because other pages might need it
      // The notifier will handle multiple starts gracefully
    };
  }, []);
}

