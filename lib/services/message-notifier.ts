/**
 * Global message notification service
 * Polls for new messages across all user transactions
 */

import { showToast } from "@/components/ui/toast";

interface Transaction {
  id: string;
  item: {
    name: string;
  };
  buyer: {
    id: string;
    name: string;
  };
  seller: {
    id: string;
    name: string;
  };
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: {
    name: string;
  };
}

class MessageNotifier {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private lastCheckTime: string | null = null;
  private currentUserId: string | null = null;
  private activeTransactionIds = new Set<string>();
  private lastMessageTimestamps = new Map<string, string>(); // Track last message time per transaction

  start(userId: string) {
    // If already running with same user, don't restart
    if (this.isRunning && this.currentUserId === userId) return;
    
    // Stop previous instance if different user
    if (this.isRunning) {
      this.stop();
    }
    
    this.currentUserId = userId;
    this.isRunning = true;
    this.lastCheckTime = new Date().toISOString();
    this.lastMessageTimestamps.clear();
    
    // Check immediately
    this.checkForNewMessages();
    
    // Then check every 5 seconds
    this.intervalId = setInterval(() => {
      this.checkForNewMessages();
    }, 5000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.lastMessageTimestamps.clear();
  }

  setActiveTransaction(transactionId: string) {
    this.activeTransactionIds.add(transactionId);
  }

  removeActiveTransaction(transactionId: string) {
    this.activeTransactionIds.delete(transactionId);
  }

  private async checkForNewMessages() {
    if (!this.currentUserId) return;
    
    // Skip if tab is hidden (let chat page handle its own polling)
    if (document.hidden) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Get all user transactions
      const res = await fetch("/api/transactions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-cache",
      });

      if (!res.ok) return;

      const data = await res.json();
      const transactions: Transaction[] = data.transactions || [];

      // Check each transaction for new messages
      for (const transaction of transactions) {
        // Skip if user is actively viewing this chat
        if (this.activeTransactionIds.has(transaction.id)) continue;

        // Get last known message timestamp for this transaction
        const lastKnownTime = this.lastMessageTimestamps.get(transaction.id) || this.lastCheckTime;

        // Check for new messages in this transaction
        const checkRes = await fetch(
          `/api/transactions/${transaction.id}/messages/new${lastKnownTime ? `?after=${encodeURIComponent(lastKnownTime)}` : ""}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-cache",
          }
        );

        if (!checkRes.ok) continue;

        const messageData = await checkRes.json();
        const messages: Message[] = messageData.messages || [];

        // Filter messages from other users
        const newMessages = messages.filter(
          (msg) => msg.senderId !== this.currentUserId
        );

        if (newMessages.length > 0) {
          // Find the sender name
          const sender = transaction.buyer.id === newMessages[0].senderId
            ? transaction.buyer
            : transaction.seller;

          // Update last known message time for this transaction
          const latestMessage = newMessages[newMessages.length - 1];
          this.lastMessageTimestamps.set(transaction.id, latestMessage.createdAt);

          // Show notification
          showToast({
            type: "message",
            title: `New message from ${sender.name}`,
            message: newMessages[0].content.substring(0, 50) +
              (newMessages[0].content.length > 50 ? "..." : ""),
            actionUrl: `/chat/${transaction.id}`,
            actionLabel: "View Chat",
            duration: 6000,
          });
        } else if (messages.length > 0) {
          // Update timestamp even if no new messages from others (might be own messages)
          const latestMessage = messages[messages.length - 1];
          this.lastMessageTimestamps.set(transaction.id, latestMessage.createdAt);
        }
      }

      // Update last check time
      this.lastCheckTime = new Date().toISOString();
    } catch (err) {
      console.error("Error checking for new messages:", err);
    }
  }
}

export const messageNotifier = new MessageNotifier();

