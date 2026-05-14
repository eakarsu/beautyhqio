"use client";

import { useState, useEffect, useRef } from "react";
import { Search, User, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  totalVisits?: number;
  lastVisit?: string;
  loyaltyTier?: string;
}

interface ClientSelectorProps {
  value?: Client | null;
  onChange: (client: Client | null) => void;
  placeholder?: string;
  className?: string;
  showDetails?: boolean;
}

export default function ClientSelector({
  value,
  onChange,
  placeholder = "Search clients...",
  className = "",
  showDetails = true,
}: ClientSelectorProps) {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Search clients against the real DB
  useEffect(() => {
    const controller = new AbortController();

    const searchClients = async () => {
      if (search.length < 1) {
        setClients([]);
        return;
      }

      setLoading(true);

      try {
        const res = await fetch(
          `/api/clients?search=${encodeURIComponent(search)}&limit=10`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Failed to fetch clients");
        const data = await res.json();
        setClients(data.clients || []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("ClientSelector search error:", err);
          setClients([]);
        }
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchClients, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (client: Client) => {
    onChange(client);
    setSearch("");
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearch("");
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case "Platinum":
        return "bg-gradient-to-r from-slate-400 to-slate-600 text-white";
      case "Gold":
        return "bg-gradient-to-r from-amber-400 to-amber-600 text-white";
      case "Silver":
        return "bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900";
      case "Bronze":
        return "bg-gradient-to-r from-orange-300 to-orange-500 text-white";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {value ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-white">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-rose-100 text-rose-600">
              {getInitials(value.firstName, value.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900">
                {value.firstName} {value.lastName}
              </span>
              {value.loyaltyTier && (
                <Badge className={`text-xs ${getTierColor(value.loyaltyTier)}`}>
                  {value.loyaltyTier}
                </Badge>
              )}
            </div>
            {showDetails && (
              <p className="text-sm text-slate-500 truncate">{value.email}</p>
            )}
          </div>
          <button
            onClick={handleClear}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="pl-10"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 animate-spin" />
            )}
          </div>

          {isOpen && clients.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleSelect(client)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left border-b last:border-b-0"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-rose-100 text-rose-600">
                      {getInitials(client.firstName, client.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">
                        {client.firstName} {client.lastName}
                      </span>
                      {client.loyaltyTier && (
                        <Badge className={`text-xs ${getTierColor(client.loyaltyTier)}`}>
                          {client.loyaltyTier}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="truncate">{client.email}</span>
                      {client.totalVisits && (
                        <>
                          <span>•</span>
                          <span>{client.totalVisits} visits</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {isOpen && search.length > 0 && clients.length === 0 && !loading && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg p-4 text-center">
              <User className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No clients found</p>
              <p className="text-slate-400 text-xs">Try a different search term</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
