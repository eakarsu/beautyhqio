"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Plus, X } from "lucide-react";

interface Service {
  id: string;
  name: string;
  category?: string;
}

interface StaffFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: StaffFormData) => Promise<void>;
  services: Service[];
  existingStaff?: {
    id: string;
    displayName?: string;
    title?: string;
    phone?: string;
    bio?: string;
    profileImage?: string;
    commissionRate?: number;
    serviceIds?: string[];
    user?: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

interface StaffFormData {
  firstName: string;
  lastName: string;
  email: string;
  displayName?: string;
  title?: string;
  phone?: string;
  bio?: string;
  commissionRate?: number;
  serviceIds: string[];
  createUser: boolean;
  password?: string;
}

export function StaffForm({
  open,
  onClose,
  onSubmit,
  services,
  existingStaff,
}: StaffFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [commissionRate, setCommissionRate] = useState("50");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [createUser, setCreateUser] = useState(true);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (existingStaff) {
      setFirstName(existingStaff.user?.firstName || "");
      setLastName(existingStaff.user?.lastName || "");
      setEmail(existingStaff.user?.email || "");
      setDisplayName(existingStaff.displayName || "");
      setTitle(existingStaff.title || "");
      setPhone(existingStaff.phone || "");
      setBio(existingStaff.bio || "");
      setCommissionRate(existingStaff.commissionRate?.toString() || "50");
      setSelectedServiceIds(existingStaff.serviceIds || []);
      setCreateUser(false);
    }
  }, [existingStaff]);

  const serviceCategories = [...new Set(services.map((s) => s.category || "Other"))];

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = async () => {
    if (!firstName || !lastName || !email) return;

    setIsLoading(true);
    try {
      await onSubmit({
        firstName,
        lastName,
        email,
        displayName: displayName || undefined,
        title: title || undefined,
        phone: phone || undefined,
        bio: bio || undefined,
        commissionRate: parseFloat(commissionRate) || undefined,
        serviceIds: selectedServiceIds,
        createUser,
        password: createUser ? password : undefined,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const initials = firstName && lastName ? `${firstName[0]}${lastName[0]}` : "?";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {existingStaff ? "Edit Staff Member" : "Add Staff Member"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="w-full">
            <TabsTrigger value="basic" className="flex-1">Basic Info</TabsTrigger>
            <TabsTrigger value="services" className="flex-1">Services</TabsTrigger>
            <TabsTrigger value="compensation" className="flex-1">Compensation</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="basic" className="m-0 space-y-6">
              {/* Profile Photo */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={existingStaff?.profileImage} />
                    <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <p className="font-medium">Profile Photo</p>
                  <p className="text-sm text-muted-foreground">
                    Click to upload a photo
                  </p>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Smith"
                  />
                </div>
              </div>

              {/* Display Name & Title */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Optional display name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title / Role</Label>
                  <Select value={title} onValueChange={setTitle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select title" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stylist">Stylist</SelectItem>
                      <SelectItem value="senior_stylist">Senior Stylist</SelectItem>
                      <SelectItem value="master_stylist">Master Stylist</SelectItem>
                      <SelectItem value="colorist">Colorist</SelectItem>
                      <SelectItem value="esthetician">Esthetician</SelectItem>
                      <SelectItem value="nail_technician">Nail Technician</SelectItem>
                      <SelectItem value="massage_therapist">Massage Therapist</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@salon.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Brief bio for client-facing profiles..."
                  rows={3}
                />
              </div>

              {/* User Account */}
              {!existingStaff && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="createUser"
                      checked={createUser}
                      onCheckedChange={(checked) => setCreateUser(!!checked)}
                    />
                    <Label htmlFor="createUser">Create login account</Label>
                  </div>
                  {createUser && (
                    <div className="space-y-2">
                      <Label htmlFor="password">Initial Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Set initial password"
                      />
                      <p className="text-xs text-muted-foreground">
                        Staff member will be prompted to change on first login
                      </p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="services" className="m-0 space-y-4">
              <p className="text-sm text-muted-foreground">
                Select the services this staff member can perform
              </p>

              {selectedServiceIds.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
                  {selectedServiceIds.map((id) => {
                    const service = services.find((s) => s.id === id);
                    return service ? (
                      <Badge key={id} variant="secondary" className="gap-1">
                        {service.name}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => toggleService(id)}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}

              {serviceCategories.map((category) => {
                const categoryServices = services.filter(
                  (s) => (s.category || "Other") === category
                );
                return (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-sm">{category}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {categoryServices.map((service) => (
                        <label
                          key={service.id}
                          className={`flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-muted ${
                            selectedServiceIds.includes(service.id) ? "border-primary bg-primary/5" : ""
                          }`}
                        >
                          <Checkbox
                            checked={selectedServiceIds.includes(service.id)}
                            onCheckedChange={() => toggleService(service.id)}
                          />
                          <span className="text-sm">{service.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="compensation" className="m-0 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  placeholder="50"
                  min="0"
                  max="100"
                />
                <p className="text-xs text-muted-foreground">
                  Percentage of service revenue paid as commission
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-medium">Commission Example</h4>
                <p className="text-sm text-muted-foreground">
                  For a $100 service at {commissionRate}% commission:
                </p>
                <div className="flex justify-between text-sm">
                  <span>Staff earns:</span>
                  <span className="font-medium">
                    ${((100 * parseFloat(commissionRate || "0")) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Business keeps:</span>
                  <span className="font-medium">
                    ${(100 - (100 * parseFloat(commissionRate || "0")) / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !firstName || !lastName || !email}
          >
            {isLoading ? "Saving..." : existingStaff ? "Update" : "Add Staff Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
