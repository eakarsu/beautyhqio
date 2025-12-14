"use client";

import { useSession, signOut } from "next-auth/react";
import { Bell, Search, Menu, LogOut, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";
import Link from "next/link";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-white px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search clients, appointments..."
            className="pl-9 bg-slate-50 border-0"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:ring-2 hover:ring-rose-100">
              <Avatar className="h-10 w-10">
                <AvatarImage src={session?.user?.image || ""} />
                <AvatarFallback className="bg-rose-100 text-rose-600 font-semibold">
                  {session?.user?.firstName && session?.user?.lastName
                    ? getInitials(session.user.firstName, session.user.lastName)
                    : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64 bg-white border border-gray-200 shadow-lg rounded-xl p-2"
            align="end"
            sideOffset={8}
          >
            {/* User Info Header */}
            <div className="px-3 py-3 bg-gray-50 rounded-lg mb-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={session?.user?.image || ""} />
                  <AvatarFallback className="bg-rose-100 text-rose-600 font-semibold">
                    {session?.user?.firstName && session?.user?.lastName
                      ? getInitials(session.user.firstName, session.user.lastName)
                      : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {session?.user?.firstName} {session?.user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <Link href="/settings">
              <DropdownMenuItem className="px-3 py-2.5 rounded-lg cursor-pointer text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100">
                <User className="mr-3 h-4 w-4 text-gray-500" />
                <span>My Profile</span>
              </DropdownMenuItem>
            </Link>
            <Link href="/settings">
              <DropdownMenuItem className="px-3 py-2.5 rounded-lg cursor-pointer text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100">
                <Settings className="mr-3 h-4 w-4 text-gray-500" />
                <span>Settings</span>
              </DropdownMenuItem>
            </Link>

            <DropdownMenuSeparator className="my-2 bg-gray-200" />

            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-3 py-2.5 rounded-lg cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700 focus:bg-red-50"
            >
              <LogOut className="mr-3 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
