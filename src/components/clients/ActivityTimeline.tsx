"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  DollarSign,
  Star,
  FileText,
  Camera,
  Gift,
  UserPlus,
  AlertCircle,
} from "lucide-react";

interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date | string;
  userId?: string | null;
}

interface ActivityTimelineProps {
  activities: Activity[];
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const activityIcons: Record<string, React.ReactNode> = {
  APPOINTMENT_BOOKED: <Calendar className="h-4 w-4" />,
  APPOINTMENT_COMPLETED: <Calendar className="h-4 w-4" />,
  APPOINTMENT_CANCELLED: <Calendar className="h-4 w-4" />,
  APPOINTMENT_NO_SHOW: <AlertCircle className="h-4 w-4" />,
  PURCHASE: <DollarSign className="h-4 w-4" />,
  LOYALTY_EARNED: <Star className="h-4 w-4" />,
  LOYALTY_REDEEMED: <Star className="h-4 w-4" />,
  EMAIL_SENT: <Mail className="h-4 w-4" />,
  SMS_SENT: <MessageSquare className="h-4 w-4" />,
  CALL_LOGGED: <Phone className="h-4 w-4" />,
  NOTE_ADDED: <FileText className="h-4 w-4" />,
  PHOTO_ADDED: <Camera className="h-4 w-4" />,
  REVIEW_RECEIVED: <Star className="h-4 w-4" />,
  PROFILE_UPDATED: <UserPlus className="h-4 w-4" />,
  REFERRAL_MADE: <UserPlus className="h-4 w-4" />,
  GIFT_CARD_PURCHASED: <Gift className="h-4 w-4" />,
  GIFT_CARD_REDEEMED: <Gift className="h-4 w-4" />,
};

const activityColors: Record<string, string> = {
  APPOINTMENT_BOOKED: "bg-blue-100 text-blue-600",
  APPOINTMENT_COMPLETED: "bg-green-100 text-green-600",
  APPOINTMENT_CANCELLED: "bg-red-100 text-red-600",
  APPOINTMENT_NO_SHOW: "bg-yellow-100 text-yellow-600",
  PURCHASE: "bg-emerald-100 text-emerald-600",
  LOYALTY_EARNED: "bg-purple-100 text-purple-600",
  LOYALTY_REDEEMED: "bg-purple-100 text-purple-600",
  EMAIL_SENT: "bg-sky-100 text-sky-600",
  SMS_SENT: "bg-indigo-100 text-indigo-600",
  CALL_LOGGED: "bg-orange-100 text-orange-600",
  NOTE_ADDED: "bg-gray-100 text-gray-600",
  PHOTO_ADDED: "bg-pink-100 text-pink-600",
  REVIEW_RECEIVED: "bg-amber-100 text-amber-600",
  PROFILE_UPDATED: "bg-teal-100 text-teal-600",
  REFERRAL_MADE: "bg-cyan-100 text-cyan-600",
  GIFT_CARD_PURCHASED: "bg-rose-100 text-rose-600",
  GIFT_CARD_REDEEMED: "bg-rose-100 text-rose-600",
};

export function ActivityTimeline({ activities, onLoadMore, hasMore }: ActivityTimelineProps) {
  const [filter, setFilter] = useState<string>("all");

  const filteredActivities = filter === "all"
    ? activities
    : activities.filter((a) => a.type === filter);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `Today at ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    } else if (days === 1) {
      return `Yesterday at ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    } else if (days < 7) {
      return d.toLocaleDateString("en-US", { weekday: "long", hour: "numeric", minute: "2-digit" });
    } else {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
  };

  const activityTypes = [
    { value: "all", label: "All Activities" },
    { value: "APPOINTMENT_BOOKED", label: "Appointments" },
    { value: "PURCHASE", label: "Purchases" },
    { value: "EMAIL_SENT", label: "Emails" },
    { value: "SMS_SENT", label: "SMS" },
    { value: "CALL_LOGGED", label: "Calls" },
    { value: "NOTE_ADDED", label: "Notes" },
    { value: "LOYALTY_EARNED", label: "Loyalty" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Activity Timeline</CardTitle>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter activities" />
          </SelectTrigger>
          <SelectContent>
            {activityTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {filteredActivities.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No activities to display</p>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-6">
                {filteredActivities.map((activity) => (
                  <div key={activity.id} className="relative pl-10">
                    <div
                      className={`absolute left-0 p-2 rounded-full ${
                        activityColors[activity.type] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {activityIcons[activity.type] || <FileText className="h-4 w-4" />}
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{activity.title}</p>
                          {activity.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {activity.description}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {activity.type.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {hasMore && (
            <div className="text-center mt-4">
              <Button variant="outline" onClick={onLoadMore}>
                Load More
              </Button>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
