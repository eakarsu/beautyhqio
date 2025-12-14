"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  MailOpen,
  Trash2,
  RefreshCw,
  ChevronLeft,
  Clock,
  Phone,
  ShieldAlert,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ContactMessage {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = session?.user?.role === "OWNER" || session?.user?.role === "MANAGER";

  useEffect(() => {
    if (status === "authenticated" && isAdmin) {
      fetchMessages();
    } else if (status === "authenticated" && !isAdmin) {
      setIsLoading(false);
    }
  }, [status, isAdmin]);

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/contact");
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/contact/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isRead: true } : m))
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      await fetch(`/api/contact/${id}`, {
        method: "DELETE",
      });
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleSelectMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      markAsRead(message.id);
    }
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;

  if (status === "loading" || isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-slate-500">Loading messages...</div>
      </div>
    );
  }

  // Access denied for non-admin users
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-16 text-center">
            <ShieldAlert className="h-12 w-12 mx-auto text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Access Denied</h3>
            <p className="text-slate-500 mb-4">
              Only administrators can view contact messages.
            </p>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contact Messages</h1>
          <p className="text-slate-500 mt-1">
            Messages from the website contact form
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} unread</Badge>
          )}
          <Button variant="outline" onClick={fetchMessages}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Mail className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No messages yet</h3>
            <p className="text-slate-500">
              Messages from the contact form will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Inbox</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => handleSelectMessage(message)}
                    className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                      selectedMessage?.id === message.id ? "bg-rose-50" : ""
                    } ${!message.isRead ? "bg-blue-50/50" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {message.isRead ? (
                          <MailOpen className="h-4 w-4 text-slate-400" />
                        ) : (
                          <Mail className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`font-medium truncate ${!message.isRead ? "text-slate-900" : "text-slate-600"}`}>
                            {message.firstName} {message.lastName}
                          </p>
                          {!message.isRead && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-slate-900 truncate mt-0.5">
                          {message.subject}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {message.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Message Detail */}
          <Card className="lg:col-span-2">
            {selectedMessage ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 lg:hidden">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMessage(null)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle className="text-lg">{selectedMessage.subject}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => deleteMessage(selectedMessage.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {/* Sender Info */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 font-semibold">
                        {selectedMessage.firstName[0]}{selectedMessage.lastName[0]}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">
                          {selectedMessage.firstName} {selectedMessage.lastName}
                        </h3>
                        <a
                          href={`mailto:${selectedMessage.email}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {selectedMessage.email}
                        </a>
                        {selectedMessage.phone && (
                          <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3" />
                            {selectedMessage.phone}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                          <Clock className="h-3 w-3" />
                          {new Date(selectedMessage.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-slate-700 whitespace-pre-wrap">
                        {selectedMessage.message}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button asChild className="bg-rose-600 hover:bg-rose-700">
                        <a href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}>
                          Reply via Email
                        </a>
                      </Button>
                      {selectedMessage.phone && (
                        <Button variant="outline" asChild>
                          <a href={`tel:${selectedMessage.phone}`}>
                            <Phone className="h-4 w-4 mr-2" />
                            Call
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="py-16 text-center">
                <MailOpen className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  Select a message
                </h3>
                <p className="text-slate-500">
                  Click on a message to view its contents
                </p>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
