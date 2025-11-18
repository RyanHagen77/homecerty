/**
 * UNREAD MESSAGE BADGE FOR HOMEOWNERS
 *
 * Shows total unread messages across ALL homes owned by the user.
 * Polls API every 30 seconds.
 *
 * Usage in HomePicker or navigation:
 * <UnreadMessageBadgeHomeowner />
 *
 * Location: app/_components/UnreadMessageBadgeHomeowner.tsx
 */

"use client";

import { useEffect, useState } from "react";

export function UnreadMessageBadgeHomeowner() {
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