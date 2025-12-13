"use client";

import { Scissors } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

export function PublicHeader() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="container mx-auto px-4 py-6 border-b bg-white">
      <nav className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="p-2 bg-rose-600 rounded-lg">
            <Scissors className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">BeautyHQ</span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/features"
            className={isActive("/features") ? "text-rose-600 font-medium" : "text-gray-600 hover:text-gray-900"}
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className={isActive("/pricing") ? "text-rose-600 font-medium" : "text-gray-600 hover:text-gray-900"}
          >
            Pricing
          </Link>
          <Link
            href="/about"
            className={isActive("/about") ? "text-rose-600 font-medium" : "text-gray-600 hover:text-gray-900"}
          >
            About
          </Link>
          <Link
            href="/contact"
            className={isActive("/contact") ? "text-rose-600 font-medium" : "text-gray-600 hover:text-gray-900"}
          >
            Contact
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button className="bg-rose-600 hover:bg-rose-700">Start Free Trial</Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}
