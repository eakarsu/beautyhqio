"use client";

import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  Filter,
  Users,
  Trash2,
} from "lucide-react";
import { formatPhone, getInitials, formatDate } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { DetailSheet, DetailField } from "@/components/ui/detail-sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  status: string;
  lastVisit: string | null;
  totalVisits: number;
  totalSpent: number;
  tags: string[];
}

interface ClientsData {
  clients: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ClientsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [clientsData, setClientsData] = useState<ClientsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Check if user is staff or receptionist (limited permissions)
  const isLimitedRole = session?.user?.role === "STAFF" || session?.user?.role === "RECEPTIONIST";

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast({ title: "Success", description: "Client deleted successfully" });
        setSelectedClient(null);
        fetchClients(searchQuery, currentPage, pageSize);
        setDeleteId(null);
      } else {
        toast({ title: "Error", description: "Failed to delete client", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      toast({ title: "Error", description: "Failed to delete client", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchClients(undefined, 1, pageSize);
  }, []);

  const fetchClients = async (search?: string, page?: number, limit?: number) => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", String(page || currentPage));
      params.set("limit", String(limit || pageSize));

      const response = await fetch(`/api/clients?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setClientsData(data);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      setCurrentPage(1);
      fetchClients(searchQuery, 1, pageSize);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchClients(searchQuery, page, pageSize);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    fetchClients(searchQuery, 1, size);
  };

  const clients = clientsData?.clients || [];
  const totalClients = clientsData?.pagination?.total || 0;
  const vipClients = clients.filter(c => c.status === "VIP").length;

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
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500 mt-1">
            Manage your client database and view their profiles
          </p>
        </div>
        <Button onClick={() => router.push("/clients/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Client
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/clients")}>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total Clients</p>
            <p className="text-2xl font-bold">{totalClients}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/clients?status=VIP")}>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">VIP Clients</p>
            <p className="text-2xl font-bold">{vipClients}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/clients?filter=new")}>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Active Clients</p>
            <p className="text-2xl font-bold">{clients.filter(c => c.status === "ACTIVE").length}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/clients?filter=inactive")}>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Inactive Clients</p>
            <p className="text-2xl font-bold">{clients.filter(c => c.status === "INACTIVE").length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Client List</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => toast({ title: "Filter Options", description: "Status, Tags, Last Visit Date" })}>
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead>Total Visits</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length > 0 ? (
                clients.map((client) => (
                  <TableRow key={client.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedClient(client)}>
                    <TableCell>
                      <div
                        className="flex items-center gap-3 hover:opacity-80"
                      >
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(client.firstName, client.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {client.firstName} {client.lastName}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Phone className="h-3 w-3" />
                          {formatPhone(client.phone)}
                        </div>
                        {client.email && (
                          <div className="flex items-center gap-1 text-sm text-slate-500">
                            <Mail className="h-3 w-3" />
                            {client.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          client.status === "VIP"
                            ? "default"
                            : client.status === "ACTIVE"
                            ? "success"
                            : "secondary"
                        }
                      >
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {client.lastVisit ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {formatDate(new Date(client.lastVisit))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">No visits</span>
                      )}
                    </TableCell>
                    <TableCell>{client.totalVisits}</TableCell>
                    <TableCell>${(client.totalSpent || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {client.tags?.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/clients/${client.id}`); }}>
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/calendar?client=${client.id}`); }}>
                            Book Appointment
                          </DropdownMenuItem>
                          {!isLimitedRole && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/marketing?action=message&client=${client.id}`); }}>
                              Send Message
                            </DropdownMenuItem>
                          )}
                          {!isLimitedRole && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/clients/${client.id}?edit=true`); }}>
                              Edit
                            </DropdownMenuItem>
                          )}
                          {!isLimitedRole && (
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); setDeleteId(client.id); }}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500">No clients found</p>
                    <Button
                      variant="link"
                      onClick={() => router.push("/clients/new")}
                      className="mt-2 text-rose-600"
                    >
                      Add your first client
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {clientsData?.pagination && (
            <Pagination
              page={currentPage}
              totalPages={clientsData.pagination.totalPages}
              onPageChange={handlePageChange}
              totalItems={clientsData.pagination.total}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <DetailSheet
        open={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        title={selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : ""}
        onEdit={
          selectedClient && !isLimitedRole
            ? () => router.push(`/clients/${selectedClient.id}/edit`)
            : undefined
        }
        onDelete={
          selectedClient && !isLimitedRole
            ? () => {
                setDeleteId(selectedClient.id);
              }
            : undefined
        }
      >
        {selectedClient && (
          <dl className="divide-y">
            <DetailField
              label="Name"
              value={`${selectedClient.firstName} ${selectedClient.lastName}`}
            />
            <DetailField label="Email" value={selectedClient.email} />
            <DetailField label="Phone" value={formatPhone(selectedClient.phone)} />
            <DetailField
              label="Status"
              value={
                <Badge
                  variant={
                    selectedClient.status === "VIP"
                      ? "default"
                      : selectedClient.status === "ACTIVE"
                      ? "success"
                      : "secondary"
                  }
                >
                  {selectedClient.status}
                </Badge>
              }
            />
            <DetailField
              label="Tags"
              value={
                selectedClient.tags?.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {selectedClient.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null
              }
            />
            <DetailField label="Total Visits" value={selectedClient.totalVisits} />
            <DetailField
              label="Total Spent"
              value={`$${(selectedClient.totalSpent || 0).toLocaleString()}`}
            />
            <DetailField
              label="Last Visit"
              value={
                selectedClient.lastVisit
                  ? formatDate(new Date(selectedClient.lastVisit))
                  : "No visits"
              }
            />
          </dl>
        )}
      </DetailSheet>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) handleDelete(deleteId);
        }}
        title="Delete Client"
        description="Are you sure you want to delete this client? This action cannot be undone."
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        variant="destructive"
      />
    </div>
  );
}
