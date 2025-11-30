"use client";

import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui";
import { CheckCircle, X, MessageCircle, Package, IndianRupee } from "lucide-react";

interface Item {
  id: string;
  name: string;
  price: number;
  photo: string | null;
  condition: string;
  category: string;
}

interface ApprovalNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item;
  userId: string;
}

export function ApprovalNotificationModal({
  isOpen,
  onClose,
  item,
  userId,
}: ApprovalNotificationModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleGoToProfileChats = () => {
    onClose();
    router.push(`/profile/${userId}?tab=chats`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            Transaction Approved!
          </CardTitle>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            Transaction approved! You can continue chatting in your profile's Chat board.
          </p>

          {/* Item Details */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center space-x-3">
              {item.photo ? (
                <img
                  src={item.photo}
                  alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">{item.name}</h4>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    {item.condition}
                  </span>
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                </div>
                <div className="flex items-center mt-2">
                  <IndianRupee className="h-4 w-4 text-blue-600" />
                  <span className="text-lg font-bold text-blue-600">
                    {item.price.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2 pt-2">
            <Button
              onClick={handleGoToProfileChats}
              className="w-full"
              variant="default"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Go to Profile Chats
            </Button>
            <Button
              onClick={onClose}
              className="w-full"
              variant="outline"
            >
              Continue Chatting Here
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
