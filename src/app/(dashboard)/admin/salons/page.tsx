"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Search,
  Filter,
  MoreVertical,
  Users,
  Calendar,
  DollarSign,
} from "lucide-react";

interface Salon {
  id: string;
  name: string;
  type: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  createdAt: string;
  _count: {
    users: number;
    clients: number;
    locations: number;
  };
  subscription: {
    plan: string;
    status: string;
    monthlyPrice: number;
  } | null;
}

export default function AllSalonsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (status === "authenticated" && !session?.user?.isPlatformAdmin) {
      router.push("/dashboard");
      return;
    }

    if (status === "authenticated" && session?.user?.isPlatformAdmin) {
      fetchSalons();
    }
  }, [session, status, router]);

  const fetchSalons = async () => {
    try {
      const response = await fetch("/api/admin/salons");
      if (response.ok) {
        const data = await response.json();
        setSalons(data.salons);
      }
    } catch (error) {
      console.error("Error fetching salons:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSalons = salons.filter(
    (salon) =>
      salon.name.toLowerCase().includes(search.toLowerCase()) ||
      salon.email?.toLowerCase().includes(search.toLowerCase()) ||
      salon.city?.toLowerCase().includes(search.toLowerCase())
  );

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Salons</h1>
          <p className="text-slate-600">
            Manage all registered salons on the platform
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search salons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50">
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Salons Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">
                Salon
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">
                Location
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">
                Users
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">
                Clients
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">
                Subscription
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">
                Joined
              </th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredSalons.map((salon) => (
              <tr
                key={salon.id}
                className="hover:bg-slate-50 cursor-pointer"
                onClick={() => router.push(`/admin/salons/${salon.id}`)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{salon.name}</p>
                      <p className="text-sm text-slate-500">
                        {salon.type.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-slate-900">
                    {salon.city && salon.state
                      ? `${salon.city}, ${salon.state}`
                      : "Not set"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {salon._count.locations} location(s)
                  </p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span>{salon._count.users}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span>{salon._count.clients}</span>
                </td>
                <td className="px-6 py-4">
                  {salon.subscription ? (
                    <div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          salon.subscription.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : salon.subscription.status === "TRIAL"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {salon.subscription.plan}
                      </span>
                      <p className="text-sm text-slate-500 mt-0.5">
                        ${Number(salon.subscription.monthlyPrice)}/mo
                      </p>
                    </div>
                  ) : (
                    <span className="text-slate-400">No plan</span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {new Date(salon.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <button className="p-1 hover:bg-slate-100 rounded">
                    <MoreVertical className="h-4 w-4 text-slate-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSalons.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No salons found
          </div>
        )}
      </div>
    </div>
  );
}
