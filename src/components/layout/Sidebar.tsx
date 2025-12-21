"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Appointments", href: "/appointments", icon: Clock },
  { name: "Point of Sale", href: "/pos", icon: ShoppingCart },
  { name: "Services", href: "/services", icon: Scissors },
  { name: "Staff", href: "/staff", icon: UserCircle },
  { name: "Products", href: "/products", icon: Package },
  { name: "Loyalty", href: "/loyalty", icon: Gift },
  { name: "Gift Cards", href: "/gift-cards", icon: CreditCard },
  { name: "Billing", href: "/billing", icon: Wallet },
  { name: "Marketing", href: "/marketing", icon: Megaphone },
  { name: "Reviews", href: "/reviews", icon: Star },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Marketplace Leads", href: "/reports/leads", icon: TrendingUp },
  { name: "AI Features", href: "/ai", icon: Bot },
  { name: "Sales CRM", href: "/crm", icon: Target },
  { name: "Marketplace", href: "/marketplace", icon: Store },
  { name: "Subscription", href: "/subscription", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigation = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(href);
  };

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r z-30 relative">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-rose-500 flex items-center justify-center">
            <Scissors className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">BeautyAI</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4" style={{ pointerEvents: 'auto' }}>
        <ul className="space-y-1 px-3" role="navigation">
          {navigation.map((item) => {
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
