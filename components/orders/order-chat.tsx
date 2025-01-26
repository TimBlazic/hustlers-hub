"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Clock } from "lucide-react";

interface OrderChatProps {
  orderId: string;
  messages: {
    id: string;
    content: string;
    createdAt: Date;
    user: {
      id: string;
      name: string | null;
      pfp_url: string | null;
    };
  }[];
  userId: string;
  order: {
    buyerId: string;
    sellerId: string;
  };
}

export function OrderChat({
  orderId,
  messages: initialMessages,
  userId,
  order,
}: OrderChatProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let isSubscribed = true;
    console.log("Setting up Supabase channel for order:", orderId);

    const setupChannel = async () => {
      try {
        // Clean up any existing channels first
        const channels = supabase.getChannels();
        channels.forEach((channel) => {
          console.log("Removing channel:", channel.topic);
          supabase.removeChannel(channel);
        });

        console.log("Creating new channel for order:", orderId);
        const channel = supabase
          .channel(`order_messages:${orderId}`, {
            config: {
              broadcast: { ack: true, self: true },
              presence: { key: orderId },
            },
          })
          .on(
            "postgres_changes" as never,
            {
              event: "*",
              schema: "public",
              table: "order_message",
              filter: `order_id=eq.${orderId}`,
            },
            (payload: {
              new: {
                id: string;
                user_id: string;
                content: string;
                created_at: string;
              };
            }) => {
              console.log("Received real-time message event:", payload);

              if (!isSubscribed) {
                console.log("Component unmounted, ignoring message");
                return;
              }

              if (!payload.new) {
                console.log("Invalid payload received:", payload);
                return;
              }

              // Skip if message is already in the list
              setMessages((prev) => {
                if (prev.some((msg) => msg.id === payload.new.id)) {
                  console.log("Message already exists in state, skipping");
                  return prev;
                }

                // Fetch user data and update messages
                fetch(`/api/user/${payload.new.user_id}`)
                  .then((response) => {
                    if (!response.ok) {
                      throw new Error("Failed to fetch user data");
                    }
                    return response.json();
                  })
                  .then((userData) => {
                    console.log("Fetched user data:", userData);

                    const newMessage = {
                      id: payload.new.id,
                      content: payload.new.content,
                      createdAt: new Date(payload.new.created_at),
                      user: {
                        id: userData.id,
                        name: userData.name,
                        pfp_url: userData.pfp_url,
                      },
                    };

                    console.log(
                      "Adding new real-time message to state:",
                      newMessage
                    );
                    setMessages((currentMessages) => {
                      if (
                        currentMessages.some((msg) => msg.id === newMessage.id)
                      ) {
                        return currentMessages;
                      }
                      const updated = [...currentMessages, newMessage];
                      console.log("Updated messages:", updated);
                      scrollToBottom();
                      return updated;
                    });
                  })
                  .catch((error) => {
                    console.error("Error processing real-time message:", error);
                  });

                return prev;
              });
            }
          );

        // Subscribe to the channel
        console.log("Subscribing to channel...");
        const status = await channel.subscribe((status) => {
          console.log("Channel status changed:", status);
          if (status === "SUBSCRIBED") {
            console.log("Successfully subscribed to channel");
            setConnectionStatus("connected");

            // Track presence after successful subscription
            channel
              .track({
                user: userId,
                online_at: new Date().toISOString(),
              })
              .then(() => {
                console.log("Presence tracked successfully");
              })
              .catch((err) => {
                console.error("Error tracking presence:", err);
              });
          } else {
            console.log("Channel not subscribed, status:", status);
            setConnectionStatus("disconnected");
          }
        });

        console.log("Channel subscription result:", status);

        return () => {
          if (isSubscribed) {
            console.log("Cleaning up channel");
            supabase.removeChannel(channel);
          }
        };
      } catch (error) {
        console.error("Error setting up channel:", error);
        setConnectionStatus("disconnected");
      }
    };

    setupChannel();

    return () => {
      console.log("Component unmounting, cleaning up...");
      isSubscribed = false;
    };
  }, [orderId, supabase, userId]);

  const createNotification = async (message: any) => {
    try {
      const isOnOrderPage = window.location.pathname === `/orders/${orderId}`;
      console.log("Is on order page:", isOnOrderPage);
      if (isOnOrderPage) return;

      const notificationData = {
        type: "NEW_MESSAGE",
        content: `New message: ${message.content.substring(0, 50)}${
          message.content.length > 50 ? "..." : ""
        }`,
        orderId,
        userId: message.user.id === userId ? order.buyerId : order.sellerId,
      };

      console.log("Sending notification data:", notificationData);

      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Failed to create notification: ${JSON.stringify(errorData)}`
        );
      }

      const result = await response.json();
      console.log("Notification created:", result);
    } catch (error) {
      console.error("Error creating notification:", {
        message: error,
        stack: error,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const messageContent = newMessage;
    setNewMessage(""); // Clear input immediately

    try {
      console.log("Sending message:", messageContent);
      const response = await fetch(`/api/orders/${orderId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: messageContent }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const message = await response.json();
      console.log("Message sent successfully:", message);

      // Add message to UI immediately
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === message.id)) {
          console.log("Message already in state, skipping");
          return prev;
        }
        console.log("Adding sent message to state");
        const updated = [...prev, message];
        console.log("Updated messages:", updated);
        return updated;
      });
      scrollToBottom();

      await createNotification(message);
    } catch (error) {
      console.error("Error sending message:", error);
      // Restore message if failed
      setNewMessage(messageContent);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection status indicator */}
      <div className="flex items-center justify-end gap-2 text-sm">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            connectionStatus === "connected"
              ? "bg-green-500"
              : connectionStatus === "connecting"
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
        />
        <span className="text-gray-500 dark:text-gray-400">
          {connectionStatus === "connected"
            ? "Connected"
            : connectionStatus === "connecting"
            ? "Connecting..."
            : "Disconnected"}
        </span>
      </div>
      {/* Chat messages */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="h-[400px] overflow-y-auto p-6">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.user.id === userId
                    ? "flex-row-reverse space-x-reverse"
                    : ""
                }`}
              >
                <div className="flex-shrink-0">
                  <div className="relative h-8 w-8 rounded-full overflow-hidden">
                    {message.user.pfp_url ? (
                      <Image
                        src={message.user.pfp_url}
                        alt={message.user.name || "User"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {message.user.name?.[0]?.toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div
                  className={`flex max-w-[75%] flex-col ${
                    message.user.id === userId ? "items-end" : ""
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.user.id === userId
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(message.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 min-w-0 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
