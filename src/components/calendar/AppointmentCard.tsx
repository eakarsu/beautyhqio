"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Clock,
  User,
  MoreVertical,
  Check,
  X,
  Edit,
  Calendar,
  DollarSign,
} from "lucide-react";

interface AppointmentCardProps {
  appointment: {
    id: string;
    scheduledStart: Date | string;
    scheduledEnd: Date | string;
    status: string;
    notes?: string | null;
    client?: {
      id: string;
      firstName: string;
      lastName: string;
      phone?: string | null;
      profileImage?: string | null;
    } | null;
    staff?: {
      displayName?: string;
      user?: {
        firstName: string;
        lastName: string;
      };
    };
    services: Array<{
      service: {
        name: string;
        price: number;
      };
      price: number;
    }>;
  };
  onCheckIn?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
  onEdit?: () => void;
  onNoShow?: () => void;
  onClick?: () => void;
}

export function AppointmentCard({
  appointment,
  onCheckIn,
  onComplete,
  onCancel,
  onEdit,
  onNoShow,
  onClick,
}: AppointmentCardProps) {
  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const statusColors: Record<string, string> = {
    BOOKED: "bg-blue-100 text-blue-800",
    CONFIRMED: "bg-green-100 text-green-800",
    CHECKED_IN: "bg-purple-100 text-purple-800",
    IN_SERVICE: "bg-indigo-100 text-indigo-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
    NO_SHOW: "bg-yellow-100 text-yellow-800",
  };

  const totalPrice = appointment.services.reduce(
    (sum, s) => sum + Number(s.price),
    0
  );

  const clientInitials = appointment.client
    ? `${appointment.client.firstName[0]}${appointment.client.lastName[0]}`
    : "W";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar
            className="h-12 w-12 cursor-pointer"
            onClick={onClick}
          >
            <AvatarImage src={appointment.client?.profileImage || undefined} />
            <AvatarFallback>{clientInitials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h4
                  className="font-semibold cursor-pointer hover:underline"
                  onClick={onClick}
                >
                  {appointment.client
                    ? `${appointment.client.firstName} ${appointment.client.lastName}`
                    : "Walk-in"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {appointment.services.map((s) => s.service.name).join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={statusColors[appointment.status] || "bg-gray-100"}>
                  {appointment.status.replace("_", " ")}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={onEdit}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onCheckIn && appointment.status === "BOOKED" && (
                      <DropdownMenuItem onClick={onCheckIn}>
                        <Check className="h-4 w-4 mr-2" />
                        Check In
                      </DropdownMenuItem>
                    )}
                    {onComplete && ["CHECKED_IN", "IN_SERVICE"].includes(appointment.status) && (
                      <DropdownMenuItem onClick={onComplete}>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Complete & Checkout
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {onNoShow && ["BOOKED", "CONFIRMED"].includes(appointment.status) && (
                      <DropdownMenuItem onClick={onNoShow} className="text-yellow-600">
                        <User className="h-4 w-4 mr-2" />
                        Mark No-Show
                      </DropdownMenuItem>
                    )}
                    {onCancel && !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(appointment.status) && (
                      <DropdownMenuItem onClick={onCancel} className="text-destructive">
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                  {formatTime(appointment.scheduledStart)} -{" "}
                  {formatTime(appointment.scheduledEnd)}
                </span>
              </div>
              {appointment.staff && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>
                    {appointment.staff.displayName ||
                      `${appointment.staff.user?.firstName} ${appointment.staff.user?.lastName}`}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1 font-medium text-foreground">
                <DollarSign className="h-4 w-4" />
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            {appointment.notes && (
              <p className="mt-2 text-sm text-muted-foreground bg-muted/50 rounded px-2 py-1">
                {appointment.notes}
              </p>
            )}

            {appointment.client?.phone && (
              <p className="mt-2 text-sm text-muted-foreground">
                {appointment.client.phone}
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {["BOOKED", "CONFIRMED"].includes(appointment.status) && (
          <div className="flex gap-2 mt-4 pt-3 border-t">
            {onCheckIn && (
              <Button size="sm" className="flex-1" onClick={onCheckIn}>
                <Check className="h-4 w-4 mr-1" />
                Check In
              </Button>
            )}
            {onCancel && (
              <Button size="sm" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        )}

        {["CHECKED_IN", "IN_SERVICE"].includes(appointment.status) && onComplete && (
          <div className="flex gap-2 mt-4 pt-3 border-t">
            <Button size="sm" className="flex-1" onClick={onComplete}>
              <DollarSign className="h-4 w-4 mr-1" />
              Complete & Checkout
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
