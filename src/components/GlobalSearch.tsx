"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  User,
  Calendar,
  DollarSign,
  Settings,
  FileText,
  Clock,
  Users,
  Loader2,
  Command,
} from "lucide-react";

interface SearchResult {
  id: string;
  type: "client" | "appointment" | "service" | "staff" | "setting" | "action";
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  href?: string;
  action?: () => void;
}

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Quick actions always available
  const quickActions: SearchResult[] = [
    {
      id: "new-appointment",
      type: "action",
      title: "New Appointment",
      subtitle: "Book a new appointment",
      icon: <Calendar className="h-4 w-4" />,
      href: "/calendar?action=new",
    },
    {
      id: "new-client",
      type: "action",
      title: "New Client",
      subtitle: "Add a new client",
      icon: <User className="h-4 w-4" />,
      href: "/clients?action=new",
    },
    {
      id: "new-sale",
      type: "action",
      title: "New Sale",
      subtitle: "Process a sale",
      icon: <DollarSign className="h-4 w-4" />,
      href: "/pos",
    },
    {
      id: "reports",
      type: "action",
      title: "View Reports",
      subtitle: "Sales, appointments, and more",
      icon: <FileText className="h-4 w-4" />,
      href: "/reports",
    },
  ];

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();

        const searchResults: SearchResult[] = [];

        // Add clients
        if (data.clients) {
          data.clients.forEach((client: { id: string; firstName: string; lastName: string; phone?: string; email?: string }) => {
            searchResults.push({
              id: `client-${client.id}`,
              type: "client",
              title: `${client.firstName} ${client.lastName}`,
              subtitle: client.phone || client.email,
              icon: <User className="h-4 w-4" />,
              href: `/clients/${client.id}`,
            });
          });
        }

        // Add appointments
        if (data.appointments) {
          data.appointments.forEach((apt: { id: string; client?: { firstName: string; lastName: string }; scheduledStart: string }) => {
            searchResults.push({
              id: `apt-${apt.id}`,
              type: "appointment",
              title: apt.client ? `${apt.client.firstName} ${apt.client.lastName}` : "Walk-in",
              subtitle: new Date(apt.scheduledStart).toLocaleDateString(),
              icon: <Calendar className="h-4 w-4" />,
              href: `/calendar?appointment=${apt.id}`,
            });
          });
        }

        // Add staff
        if (data.staff) {
          data.staff.forEach((s: { id: string; displayName?: string; user?: { firstName: string; lastName: string }; title?: string }) => {
            searchResults.push({
              id: `staff-${s.id}`,
              type: "staff",
              title: s.displayName || `${s.user?.firstName} ${s.user?.lastName}`,
              subtitle: s.title,
              icon: <Users className="h-4 w-4" />,
              href: `/staff/${s.id}`,
            });
          });
        }

        // Add services
        if (data.services) {
          data.services.forEach((service: { id: string; name: string; price: number; duration: number }) => {
            searchResults.push({
              id: `service-${service.id}`,
              type: "service",
              title: service.name,
              subtitle: `$${Number(service.price).toFixed(2)} • ${service.duration}min`,
              icon: <Clock className="h-4 w-4" />,
              href: `/settings/services?id=${service.id}`,
            });
          });
        }

        setResults(searchResults);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, performSearch]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const allResults = query.length >= 2 ? results : quickActions;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % allResults.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allResults.length) % allResults.length);
        break;
      case "Enter":
        e.preventDefault();
        const selected = allResults[selectedIndex];
        if (selected) {
          handleSelect(selected);
        }
        break;
      case "Escape":
        onClose();
        break;
    }
  };

  const handleSelect = (result: SearchResult) => {
    if (result.action) {
      result.action();
    } else if (result.href) {
      router.push(result.href);
    }
    onClose();
  };

  const displayResults = query.length >= 2 ? results : quickActions;

  const getTypeColor = (type: SearchResult["type"]) => {
    switch (type) {
      case "client":
        return "bg-blue-100 text-blue-800";
      case "appointment":
        return "bg-green-100 text-green-800";
      case "staff":
        return "bg-purple-100 text-purple-800";
      case "service":
        return "bg-orange-100 text-orange-800";
      case "action":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="p-0 gap-0 max-w-xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search clients, appointments, services..."
            className="border-0 focus-visible:ring-0 px-0 text-base"
          />
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <kbd className="hidden sm:inline-flex h-5 px-1.5 items-center gap-1 rounded border bg-muted text-xs font-medium text-muted-foreground">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>

        {/* Results */}
        <ScrollArea className="max-h-[400px]">
          {query.length >= 2 && results.length === 0 && !isLoading ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="py-2">
              {query.length < 2 && (
                <p className="px-4 py-2 text-xs text-muted-foreground uppercase font-medium">
                  Quick Actions
                </p>
              )}

              {displayResults.map((result, index) => (
                <div
                  key={result.id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${
                    index === selectedIndex ? "bg-muted" : "hover:bg-muted/50"
                  }`}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className={`p-2 rounded-lg ${getTypeColor(result.type)}`}>
                    {result.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-sm text-muted-foreground truncate">
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs capitalize">
                    {result.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t text-xs text-muted-foreground bg-muted/50">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-background border">↑</kbd>
              <kbd className="px-1 py-0.5 rounded bg-background border">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-background border">↵</kbd>
              to select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-background border">esc</kbd>
            to close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
