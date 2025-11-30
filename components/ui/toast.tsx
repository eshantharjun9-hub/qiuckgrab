"use client";

import { useEffect, useState } from "react";
import { X, MessageCircle, Bell } from "lucide-react";
import { Button } from "./button";
import { useRouter } from "next/navigation";

interface Toast {
  id: string;
  type: "message" | "info" | "success" | "error";
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

// Global toast state
let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

const notifyListeners = () => {
  toastListeners.forEach((listener) => listener([...toasts]));
};

export const showToast = (toast: Omit<Toast, "id">) => {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast: Toast = {
    id,
    duration: 5000,
    ...toast,
  };
  toasts.push(newToast);
  notifyListeners();

  // Auto remove after duration
  if (newToast.duration && newToast.duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, newToast.duration);
  }
};

export const removeToast = (id: string) => {
  toasts = toasts.filter((t) => t.id !== id);
  notifyListeners();
};

export function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);
  const router = useRouter();

  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setCurrentToasts(newToasts);
    };
    toastListeners.push(listener);
    setCurrentToasts([...toasts]);

    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const getToastStyles = (type: Toast["type"]) => {
    switch (type) {
      case "message":
        return "bg-blue-600 text-white border-blue-700";
      case "success":
        return "bg-green-600 text-white border-green-700";
      case "error":
        return "bg-red-600 text-white border-red-700";
      case "info":
        return "bg-gray-800 text-white border-gray-700";
      default:
        return "bg-gray-800 text-white border-gray-700";
    }
  };

  const getIcon = (type: Toast["type"]) => {
    switch (type) {
      case "message":
        return <MessageCircle className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  if (currentToasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-md">
      {currentToasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            ${getToastStyles(toast.type)}
            rounded-lg shadow-lg border p-4 flex items-start gap-3
            animate-in slide-in-from-top-5 fade-in duration-300
          `}
        >
          <div className="flex-shrink-0 mt-0.5">{getIcon(toast.type)}</div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{toast.title}</p>
            <p className="text-sm opacity-90 mt-1">{toast.message}</p>
            {toast.actionUrl && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2 text-white border-white hover:bg-white hover:text-gray-900"
                onClick={() => {
                  router.push(toast.actionUrl!);
                  removeToast(toast.id);
                }}
              >
                {toast.actionLabel || "View"}
              </Button>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

