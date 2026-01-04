"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  ShoppingCart,
  Scissors,
  Package,
  Gift,
  Megaphone,
  BarChart3,
  Settings,
  Bot,
  Clock,
  CreditCard,
  Star,
  UserCircle,
  Target,
  Wallet,
  Store,
  TrendingUp,
  Building2,
  DollarSign,
  LucideIcon,
} from "lucide-react";

type UserRole = "PLATFORM_ADMIN" | "OWNER" | "MANAGER" | "RECEPTIONIST" | "STAFF" | "CLIENT";

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[]; // Which roles can see this item
}

// Define navigation with role-based access
const navigation: NavigationItem[] = [
  // Platform Admin Only
  {
    name: "Platform Overview",
    href: "/admin",
    icon: Building2,
    roles: ["PLATFORM_ADMIN"],
  },
  {
    name: "All Salons",
    href: "/admin/salons",
    icon: Store,
    roles: ["PLATFORM_ADMIN"],
  },
  {
    name: "Platform Revenue",
    href: "/admin/revenue",
    icon: DollarSign,
    roles: ["PLATFORM_ADMIN"],
  },
  {
    name: "Subscriptions",
    href: "/admin/subscriptions",
    icon: CreditCard,
    roles: ["PLATFORM_ADMIN"],
  },

  // Salon Dashboard - All roles
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"],
  },

  // Client Management
  {
    name: "Clients",
    href: "/clients",
    icon: Users,
    roles: ["OWNER", "MANAGER", "RECEPTIONIST"],
  },

  // Calendar & Appointments - All salon roles
  {
    name: "Calendar",
    href: "/calendar",
    icon: Calendar,
    roles: ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"],
  },
  {
    name: "Appointments",
    href: "/appointments",
    icon: Clock,
    roles: ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"],
  },

  // Point of Sale - Checkout roles
  {
    name: "Point of Sale",
    href: "/pos",
    icon: ShoppingCart,
    roles: ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"],
  },

  // Service & Product Management - Management roles
  {
    name: "Services",
    href: "/services",
    icon: Scissors,
    roles: ["OWNER", "MANAGER"],
  },
  {
    name: "Staff",
    href: "/staff",
    icon: UserCircle,
    roles: ["OWNER", "MANAGER"],
  },
  {
    name: "Products",
    href: "/products",
    icon: Package,
    roles: ["OWNER", "MANAGER"],
  },

  // Loyalty & Gift Cards - Management roles
  {
    name: "Loyalty",
    href: "/loyalty",
    icon: Gift,
    roles: ["OWNER", "MANAGER"],
  },
  {
    name: "Gift Cards",
    href: "/gift-cards",
    icon: CreditCard,
    roles: ["OWNER", "MANAGER", "RECEPTIONIST"],
  },

  // Billing - Owner only
  {
    name: "Billing",
    href: "/billing",
    icon: Wallet,
    roles: ["OWNER"],
  },

  // Marketing - Management roles
  {
    name: "Marketing",
    href: "/marketing",
    icon: Megaphone,
    roles: ["OWNER", "MANAGER"],
  },

  // Reviews - Management roles
  {
    name: "Reviews",
    href: "/reviews",
    icon: Star,
    roles: ["OWNER", "MANAGER"],
  },

  // Reports - Management roles
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["OWNER", "MANAGER"],
  },
  {
    name: "Marketplace Leads",
    href: "/reports/leads",
    icon: TrendingUp,
    roles: ["OWNER", "MANAGER"],
  },

  // AI Features - Management roles
  {
    name: "AI Features",
    href: "/ai",
    icon: Bot,
    roles: ["OWNER", "MANAGER"],
  },

  // Sales CRM - Platform admin & owners
  {
    name: "Sales CRM",
    href: "/crm",
    icon: Target,
    roles: ["PLATFORM_ADMIN", "OWNER"],
  },

  // Marketplace - Public facing
  {
    name: "Marketplace",
    href: "/marketplace",
    icon: Store,
    roles: ["OWNER", "MANAGER"],
  },

  // Subscription - Owner only
  {
    name: "Subscription",
    href: "/subscription",
    icon: CreditCard,
    roles: ["OWNER"],
  },

  // Settings - Owner & Manager
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["OWNER", "MANAGER"],
  },
];

// Staff-specific navigation (limited view)
const staffNavigation: NavigationItem[] = [
  {
    name: "My Schedule",
    href: "/staff/schedule",
    icon: Calendar,
    roles: ["STAFF"],
  },
  {
    name: "My Clients",
    href: "/staff/clients",
    icon: Users,
    roles: ["STAFF"],
  },
  {
    name: "My Earnings",
    href: "/staff/earnings",
    icon: DollarSign,
    roles: ["STAFF"],
  },
  {
    name: "My Settings",
    href: "/staff/settings",
    icon: Settings,
    roles: ["STAFF"],
  },
];

// Client-specific navigation (customer portal)
const clientNavigation: NavigationItem[] = [
  {
    name: "Book Appointment",
    href: "/client/book",
    icon: Calendar,
    roles: ["CLIENT"],
  },
  {
    name: "My Appointments",
    href: "/client/appointments",
    icon: Clock,
    roles: ["CLIENT"],
  },
  {
    name: "My Profile",
    href: "/client/profile",
    icon: UserCircle,
    roles: ["CLIENT"],
  },
  {
    name: "Payment Methods",
    href: "/client/payments",
    icon: CreditCard,
    roles: ["CLIENT"],
  },
  {
    name: "My Rewards",
    href: "/client/rewards",
    icon: Gift,
    roles: ["CLIENT"],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const userRole = (session?.user?.role as UserRole) || "STAFF";
  const isPlatformAdmin = session?.user?.isPlatformAdmin || false;
  const isClient = session?.user?.isClient || userRole === "CLIENT";

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter((item) => {
    if (isPlatformAdmin && item.roles.includes("PLATFORM_ADMIN")) {
      return true;
    }
    return item.roles.includes(userRole);
  });

  // Add role-specific navigation
  let finalNavigation = filteredNavigation;
  if (userRole === "STAFF") {
    // Staff only sees staff-specific navigation (not the shared salon navigation)
    finalNavigation = staffNavigation;
  } else if (isClient) {
    finalNavigation = clientNavigation; // Clients only see client navigation
  }

  const handleNavigation = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(href);
  };

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r z-30 relative">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b">
        <Link href={isPlatformAdmin ? "/admin" : isClient ? "/client" : userRole === "STAFF" ? "/staff/schedule" : "/dashboard"} className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-rose-500 flex items-center justify-center">
            <Scissors className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">BeautyAI</span>
        </Link>
      </div>

      {/* User Role Badge */}
      <div className="px-6 py-3 border-b">
        <div className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
          isPlatformAdmin ? "bg-purple-100 text-purple-800" :
          isClient ? "bg-rose-100 text-rose-800" :
          userRole === "OWNER" ? "bg-blue-100 text-blue-800" :
          userRole === "MANAGER" ? "bg-green-100 text-green-800" :
          userRole === "RECEPTIONIST" ? "bg-yellow-100 text-yellow-800" :
          "bg-gray-100 text-gray-800"
        )}>
          {isPlatformAdmin ? "Platform Admin" : isClient ? "Customer" : userRole}
        </div>
        {session?.user?.businessName && (
          <p className="text-xs text-slate-500 mt-1 truncate">
            {session.user.businessName}
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4" style={{ pointerEvents: 'auto' }}>
        <ul className="space-y-1 px-3" role="navigation">
          {finalNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <li key={item.name}>
                <button
                  onClick={(e) => handleNavigation(item.href, e)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-rose-50 text-rose-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="rounded-lg bg-rose-50 p-4">
          <p className="text-sm font-medium text-rose-900">Need Help?</p>
          <p className="text-xs text-rose-700 mt-1">
            Contact support or view docs
          </p>
        </div>
      </div>
    </div>
  );
}
