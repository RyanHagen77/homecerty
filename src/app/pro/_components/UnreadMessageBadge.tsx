/**
 * UNREAD MESSAGE BADGE COMPONENT
 *
 * Displays unread messages count in navigation.
 * Fetches count from API and updates periodically.
 *
 * Usage: Add this to your navigation bar
 * <Link href="/pro/contractor/messages">
 *   Messages <UnreadMessageBadge />
 * </Link>
 *
 * Location: app/_components/UnreadMessageBadge.tsx
 */

"use client";

import { useEffect, useState } from "react";

export function UnreadMessageBadge() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const response = await fetch("/api/messages/unread");
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.total || 0);
        }
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };

    // Fetch immediately
    fetchUnread();

    // Poll every 30 seconds
    const interval = setInterval(fetchUnread, 30000);

    return () => clearInterval(interval);
  }, []);

  if (unreadCount === 0) return null;

  return (
    <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white min-w-[20px]">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
}