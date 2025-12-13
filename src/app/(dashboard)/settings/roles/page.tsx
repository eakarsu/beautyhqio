"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Plus,
  Edit,
  Shield,
  Users,
  Calendar,
  DollarSign,
  Settings,
  FileText,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface PermissionGroup {
  name: string;
  icon: React.ElementType;
  permissions: Permission[];
}

const permissionGroups: PermissionGroup[] = [
  {
    name: "Clients",
    icon: Users,
    permissions: [
      { id: "clients_view", name: "View Clients", description: "View client profiles and history" },
      { id: "clients_create", name: "Create Clients", description: "Add new clients" },
      { id: "clients_edit", name: "Edit Clients", description: "Modify client information" },
      { id: "clients_delete", name: "Delete Clients", description: "Remove client records" },
      { id: "clients_export", name: "Export Clients", description: "Export client data" },
    ],
  },
  {
    name: "Calendar & Appointments",
    icon: Calendar,
    permissions: [
      { id: "appointments_view", name: "View Appointments", description: "View all appointments" },
      { id: "appointments_create", name: "Create Appointments", description: "Book new appointments" },
      { id: "appointments_edit", name: "Edit Appointments", description: "Modify appointments" },
      { id: "appointments_cancel", name: "Cancel Appointments", description: "Cancel appointments" },
      { id: "appointments_view_all", name: "View All Staff", description: "View appointments for all staff" },
    ],
  },
  {
    name: "Point of Sale",
    icon: DollarSign,
    permissions: [
      { id: "pos_checkout", name: "Process Checkout", description: "Complete sales transactions" },
      { id: "pos_discounts", name: "Apply Discounts", description: "Apply discounts to sales" },
      { id: "pos_refunds", name: "Process Refunds", description: "Issue refunds" },
      { id: "pos_cash_drawer", name: "Manage Cash Drawer", description: "Open and manage cash drawer" },
      { id: "pos_void", name: "Void Transactions", description: "Void completed transactions" },
    ],
  },
  {
    name: "Reports",
    icon: FileText,
    permissions: [
      { id: "reports_view", name: "View Reports", description: "Access basic reports" },
      { id: "reports_financial", name: "Financial Reports", description: "View revenue and financial data" },
      { id: "reports_staff", name: "Staff Reports", description: "View staff performance reports" },
      { id: "reports_export", name: "Export Reports", description: "Export report data" },
    ],
  },
  {
    name: "Settings",
    icon: Settings,
    permissions: [
      { id: "settings_business", name: "Business Settings", description: "Modify business information" },
      { id: "settings_services", name: "Manage Services", description: "Add/edit services and pricing" },
      { id: "settings_staff", name: "Manage Staff", description: "Add/edit staff members" },
      { id: "settings_users", name: "Manage Users", description: "Add/edit user accounts" },
      { id: "settings_roles", name: "Manage Roles", description: "Create and modify roles" },
      { id: "settings_integrations", name: "Integrations", description: "Configure third-party integrations" },
    ],
  },
];

const mockRoles = [
  {
    id: "owner",
    name: "Owner",
    description: "Full access to all features",
    userCount: 1,
    isSystem: true,
    permissions: permissionGroups.flatMap((g) => g.permissions.map((p) => p.id)),
  },
  {
    id: "manager",
    name: "Manager",
    description: "Manage day-to-day operations",
    userCount: 2,
    isSystem: true,
    permissions: [
      "clients_view", "clients_create", "clients_edit",
      "appointments_view", "appointments_create", "appointments_edit", "appointments_cancel", "appointments_view_all",
      "pos_checkout", "pos_discounts", "pos_refunds",
      "reports_view", "reports_financial", "reports_staff",
      "settings_services", "settings_staff",
    ],
  },
  {
    id: "staff",
    name: "Staff",
    description: "Service providers and stylists",
    userCount: 5,
    isSystem: true,
    permissions: [
      "clients_view", "clients_edit",
      "appointments_view", "appointments_create", "appointments_edit",
      "pos_checkout",
      "reports_view",
    ],
  },
  {
    id: "front_desk",
    name: "Front Desk",
    description: "Reception and check-in",
    userCount: 2,
    isSystem: false,
    permissions: [
      "clients_view", "clients_create", "clients_edit",
      "appointments_view", "appointments_create", "appointments_edit", "appointments_cancel", "appointments_view_all",
      "pos_checkout", "pos_discounts",
    ],
  },
];

export default function RolesSettingsPage() {
  const [showAddRole, setShowAddRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState<typeof mockRoles[0] | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground mt-1">
            Define access levels and permissions for your team
          </p>
        </div>
        <Button onClick={() => setShowAddRole(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockRoles.map((role) => (
          <Card
            key={role.id}
            className={`cursor-pointer hover:shadow-md transition-shadow ${
              selectedRole?.id === role.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedRole(role)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {role.name}
                      {role.isSystem && (
                        <Badge variant="secondary" className="text-xs">System</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </div>
                </div>
                {!role.isSystem && (
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  <Users className="h-4 w-4 inline mr-1" />
                  {role.userCount} users
                </span>
                <span className="text-muted-foreground">
                  {role.permissions.length} permissions
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permission Details */}
      {selectedRole && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Permissions for {selectedRole.name}</CardTitle>
                <CardDescription>
                  {selectedRole.isSystem
                    ? "System roles cannot be modified"
                    : "Click to toggle permissions"}
                </CardDescription>
              </div>
              {!selectedRole.isSystem && (
                <Button variant="outline">Save Changes</Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full" defaultValue={permissionGroups.map((g) => g.name)}>
              {permissionGroups.map((group) => {
                const GroupIcon = group.icon;
                const enabledCount = group.permissions.filter((p) =>
                  selectedRole.permissions.includes(p.id)
                ).length;

                return (
                  <AccordionItem key={group.name} value={group.name}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <GroupIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{group.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {enabledCount}/{group.permissions.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pl-7">
                        {group.permissions.map((permission) => {
                          const isEnabled = selectedRole.permissions.includes(permission.id);
                          return (
                            <div
                              key={permission.id}
                              className="flex items-center justify-between py-2"
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={isEnabled}
                                  disabled={selectedRole.isSystem}
                                />
                                <div>
                                  <p className="font-medium text-sm">{permission.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {permission.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {permission.id.includes("view") && (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                                {(permission.id.includes("create") || permission.id.includes("edit")) && (
                                  <Pencil className="h-4 w-4 text-muted-foreground" />
                                )}
                                {permission.id.includes("delete") && (
                                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Add Role Dialog */}
      <Dialog open={showAddRole} onOpenChange={setShowAddRole}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name</Label>
              <Input id="roleName" placeholder="e.g., Senior Stylist" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleDescription">Description</Label>
              <Input
                id="roleDescription"
                placeholder="Brief description of this role"
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Copy permissions from</Label>
              <div className="grid grid-cols-2 gap-2">
                {mockRoles.map((role) => (
                  <Button key={role.id} variant="outline" className="justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    {role.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRole(false)}>
              Cancel
            </Button>
            <Button>Create Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
