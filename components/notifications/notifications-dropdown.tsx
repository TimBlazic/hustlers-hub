"use client";

import { useState, useEffect, useRef, RefObject } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  content: string;
  orderId: string;
  read: boolean;
  createdAt: Date;
}

// Dodamo tip za Supabase notification payload
interface SupabaseNotification {
  id: string;
  type: string;
  content: string;
  order_id: string;
  user_id: string;
  read: boolean;
  created_at: string;
}

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);

  useClickOutside(dropdownRef as RefObject<HTMLElement>, () =>
    setIsOpen(false)
  );

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession) return;

      setSession(currentSession);
      fetchNotifications();

      const channel = supabase
        .channel("public:notification")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notification",
            filter: `user_id=eq.${currentSession.user.id}`,
          },
          (payload) => {
            console.log("Realtime event received:", payload);

            if (payload.eventType === "INSERT") {
              const newNotification = {
                id: payload.new.id,
                type: payload.new.type,
                content: payload.new.content,
                orderId: payload.new.order_id,
                read: payload.new.read,
                createdAt: new Date(payload.new.created_at),
              };

              // Zvočno opozorilo
              const audio = new Audio("/notification.mp3");
              audio.play().catch(() => {});

              setNotifications((prev) => [newNotification, ...prev]);
              if (!newNotification.read) {
                setUnreadCount((prev) => prev + 1);
              }
            } else if (payload.eventType === "UPDATE") {
              setNotifications((prev) =>
                prev.map((n) =>
                  n.id === payload.new.id
                    ? {
                        ...n,
                        read: payload.new.read,
                      }
                    : n
                )
              );
            }
          }
        )
        .subscribe((status) => {
          console.log("Subscription status:", status);
        });

      return () => {
        console.log("Cleaning up subscription");
        supabase.removeChannel(channel);
      };
    };

    fetchData();
  }, [supabase]);

  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      console.log(
        "Setting up notifications subscription for user:",
        session.user.id
      );

      const channel = supabase
        .channel(`notifications_${session.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notification",
            filter: `user_id=eq.${session.user.id}`,
          },
          (payload) => {
            console.log("Notification event received:", payload);

            if (payload.eventType === "INSERT") {
              const newNotification = {
                id: payload.new.id,
                type: payload.new.type,
                content: payload.new.content,
                orderId: payload.new.order_id,
                read: payload.new.read,
                createdAt: new Date(payload.new.created_at),
              };

              setNotifications((prev) => [newNotification, ...prev]);
              if (!newNotification.read) {
                setUnreadCount((prev) => prev + 1);
              }
            } else if (payload.eventType === "UPDATE") {
              setNotifications((prev) =>
                prev.map((n) =>
                  n.id === payload.new.id ? { ...n, read: payload.new.read } : n
                )
              );
            }
          }
        )
        .subscribe((status) => {
          console.log("Notifications subscription status:", status);
        });

      return () => {
        console.log("Cleaning up notifications subscription");
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeSubscription();
  }, [supabase]);

  useEffect(() => {
    // Debug logging za Supabase channel status
    const channel = supabase.channel("debug");
    channel
      .on("system", { event: "*" }, (payload) => {
        console.log("Supabase system event:", payload);
      })
      .subscribe((status) => {
        console.log("Debug channel status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.read).length);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ read: true }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => prev - 1);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    router.push(`/orders/${notification.orderId}`);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={async () => {
                  await supabase
                    .from("Notification")
                    .update({ read: true })
                    .eq("read", false);
                  setNotifications((prev) =>
                    prev.map((n) => ({ ...n, read: true }))
                  );
                  setUnreadCount(0);
                }}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                    !notification.read ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                >
                  <p className="text-sm text-gray-900 dark:text-white">
                    {notification.content}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
