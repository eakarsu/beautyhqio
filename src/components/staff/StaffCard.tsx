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
  MoreVertical,
  Edit,
  Calendar,
  Clock,
  Star,
  Phone,
  Mail,
  DollarSign,
} from "lucide-react";

interface StaffCardProps {
  staff: {
    id: string;
    displayName?: string;
    title?: string;
    phone?: string;
    email?: string;
    profileImage?: string;
    rating?: number;
    todayAppointments?: number;
    weekRevenue?: number;
    isActive?: boolean;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
    };
    services?: Array<{ name: string }>;
    workingHours?: {
      start: string;
      end: string;
    };
  };
  onEdit?: () => void;
  onViewSchedule?: () => void;
  onViewPerformance?: () => void;
  onClick?: () => void;
}

export function StaffCard({
  staff,
  onEdit,
  onViewSchedule,
  onViewPerformance,
  onClick,
}: StaffCardProps) {
  const displayName = staff.displayName ||
    (staff.user ? `${staff.user.firstName} ${staff.user.lastName}` : "Staff Member");

  const initials = staff.user
    ? `${staff.user.firstName[0]}${staff.user.lastName[0]}`
    : displayName.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar
            className="h-14 w-14 cursor-pointer"
            onClick={onClick}
          >
            <AvatarImage src={staff.profileImage} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h4
                  className="font-semibold cursor-pointer hover:underline"
                  onClick={onClick}
                >
                  {displayName}
                </h4>
                {staff.title && (
                  <p className="text-sm text-muted-foreground">{staff.title}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={staff.isActive !== false ? "default" : "secondary"}>
                  {staff.isActive !== false ? "Active" : "Inactive"}
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
                        Edit Profile
                      </DropdownMenuItem>
                    )}
                    {onViewSchedule && (
                      <DropdownMenuItem onClick={onViewSchedule}>
                        <Calendar className="h-4 w-4 mr-2" />
                        View Schedule
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {onViewPerformance && (
                      <DropdownMenuItem onClick={onViewPerformance}>
                        <Star className="h-4 w-4 mr-2" />
                        View Performance
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Contact Info */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
              {(staff.phone || staff.user?.email) && (
                <>
                  {staff.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {staff.phone}
                    </span>
                  )}
                  {(staff.email || staff.user?.email) && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {staff.email || staff.user?.email}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Services */}
            {staff.services && staff.services.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {staff.services.slice(0, 3).map((service, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {service.name}
                  </Badge>
                ))}
                {staff.services.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{staff.services.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t">
              {staff.rating !== undefined && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">{staff.rating.toFixed(1)}</span>
                </div>
              )}
              {staff.todayAppointments !== undefined && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{staff.todayAppointments} today</span>
                </div>
              )}
              {staff.weekRevenue !== undefined && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>${staff.weekRevenue.toLocaleString()} this week</span>
                </div>
              )}
              {staff.workingHours && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{staff.workingHours.start} - {staff.workingHours.end}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
