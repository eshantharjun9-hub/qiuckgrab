"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui";
import { MapPin, X } from "lucide-react";

interface MeetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (location: string) => Promise<void>;
  transactionId: string;
}

const PRESET_LOCATIONS = [
  "Canteen",
  "Library",
  "Hostel Gate",
  "Student Union",
  "Sports Complex",
  "Main Entrance",
  "Cafeteria",
  "Parking Lot",
];

export function MeetupModal({ isOpen, onClose, onSelect, transactionId }: MeetupModalProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSelect = async (location: string) => {
    setSelectedLocation(location);
    setLoading(true);
    try {
      await onSelect(location);
      onClose();
    } catch (error) {
      console.error("Error setting meetup location:", error);
      alert("Failed to set meetup location. Please try again.");
    } finally {
      setLoading(false);
      setSelectedLocation(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-blue-600" />
            Select Meetup Location
          </CardTitle>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600 mb-4">
            Choose where you'd like to meet for the exchange:
          </p>
          <div className="grid grid-cols-2 gap-3">
            {PRESET_LOCATIONS.map((location) => (
              <Button
                key={location}
                variant={selectedLocation === location ? "default" : "outline"}
                onClick={() => handleSelect(location)}
                disabled={loading}
                className="h-auto py-3 flex items-center justify-center"
              >
                <MapPin className="h-4 w-4 mr-2" />
                {location}
              </Button>
            ))}
          </div>
          {loading && (
            <div className="text-center text-sm text-gray-500 mt-4">
              Setting meetup location...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
