"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Plus,
  Star,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Trash2,
} from "lucide-react";
import { formatCurrency, getInitials } from "@/lib/utils";

interface Staff {
  id: string;
  displayName: string | null;
  title: string | null;
  color: string | null;
  specialties: string[];
  isActive: boolean;
  user: {
    firstName: string;
    lastName: string;
  };
}

export default function StaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/staff/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchStaff();
        setDeleteId(null);
      } else {
        alert("Failed to delete staff member");
      }
    } catch (error) {
      console.error("Error deleting staff:", error);
      alert("Failed to delete staff member");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await fetch("/api/staff");
      if (response.ok) {
        const data = await response.json();
        setStaff(data || []);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStaffName = (s: Staff) => {
    return s.displayName || `${s.user.firstName} ${s.user.lastName}`;
  };

  const activeStaff = staff.filter((s) => s.isActive);
  const onDutyCount = activeStaff.length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-32 bg-slate-200 rounded animate-pulse" />
            <div className="h-5 w-64 bg-slate-200 rounded animate-pulse mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-16 bg-slate-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff</h1>
          <p className="text-slate-500 mt-1">
            Manage your team and view performance
          </p>
        </div>
        <Button onClick={() => router.push("/staff/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/staff")}>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total Staff</p>
            <p className="text-2xl font-bold">{staff.length}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/staff/schedule")}>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Active Staff</p>
            <p className="text-2xl font-bold">{onDutyCount}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/staff/compensation")}>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Inactive</p>
            <p className="text-2xl font-bold">{staff.length - onDutyCount}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/reviews")}>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Team Size</p>
            <p className="text-2xl font-bold flex items-center gap-1">
              {staff.length}
              <Users className="h-4 w-4 text-slate-500" />
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Staff Cards */}
      {staff.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">No staff members found</p>
            <Button
              variant="link"
              onClick={() => router.push("/staff/new")}
              className="mt-2 text-rose-600"
            >
              Add your first staff member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map((member) => (
            <Card key={member.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/staff/${member.id}`)}>
              <div
                className="h-2"
                style={{ backgroundColor: member.color || "#94a3b8" }}
              />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback
                        style={{ backgroundColor: member.color || "#94a3b8" }}
                        className="text-white"
                      >
                        {getInitials(
                          member.user.firstName,
                          member.user.lastName
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{getStaffName(member)}</CardTitle>
                      <p className="text-sm text-slate-500">{member.title || "Staff"}</p>
                    </div>
                  </div>
                  <Badge variant={member.isActive ? "success" : "secondary"}>
                    {member.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Specialties */}
                {member.specialties && member.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {member.specialties.map((specialty) => (
                      <Badge key={specialty} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); router.push(`/staff/${member.id}`); }}>
                    View Profile
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); router.push(`/staff/schedule?staffId=${member.id}`); }}>
                    Schedule
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(member.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Staff Member</h3>
            <p className="text-slate-600 mb-4">
              Are you sure you want to delete this staff member? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(deleteId)}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
