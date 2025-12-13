"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Send,
  MessageSquare,
  User,
  Lightbulb,
  Calendar,
  Clock,
  HelpCircle,
  Phone,
  Loader2,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  status?: "sending" | "sent" | "delivered" | "error";
}

const quickPrompts = [
  {
    icon: Calendar,
    label: "Book Appointment",
    prompt: "I'd like to book an appointment",
  },
  {
    icon: Clock,
    label: "Check Availability",
    prompt: "What times are available this week?",
  },
  {
    icon: HelpCircle,
    label: "Services & Pricing",
    prompt: "What services do you offer and what are the prices?",
  },
  {
    icon: Phone,
    label: "Contact Info",
    prompt: "What are your hours and location?",
  },
];

export default function TwilioSMSChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [twilioNumber, setTwilioNumber] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Fetch Twilio phone number
    const fetchPhoneNumber = async () => {
      try {
        const response = await fetch("/api/voice/status");
        if (response.ok) {
          const data = await response.json();
          setTwilioNumber(data.phoneNumber || "");
        }
      } catch (error) {
        console.error("Error fetching phone number:", error);
      }
    };
    fetchPhoneNumber();
  }, []);

  // Start chat after phone number is entered
  const startChat = () => {
    if (!userPhone.trim()) return;

    // Basic phone validation
    const cleanPhone = userPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      alert("Please enter a valid phone number");
      return;
    }

    setIsPhoneVerified(true);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Welcome to Serenity Salon & Spa! We'll send SMS responses to ${userPhone}. How can I help you today?`,
        timestamp: new Date(),
        status: "delivered",
      },
    ]);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
      status: "sending",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Send SMS via Twilio to the user's phone number
      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: userPhone,
          message: content.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update message status to sent
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMessage.id ? { ...msg, status: "sent" } : msg
          )
        );

        // Simulate receiving a response (in real scenario, this would come from webhook)
        setTimeout(() => {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: getAutoResponse(content.trim()),
            timestamp: new Date(),
            status: "delivered",
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }, 1500);
      } else {
        throw new Error(data.error || "Failed to send SMS");
      }
    } catch (error) {
      // Update message status to error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, status: "error" } : msg
        )
      );

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, there was an error sending your message. Please try again.",
        timestamp: new Date(),
        status: "delivered",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Simple auto-response for demo (in production, this comes from Twilio webhook)
  const getAutoResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("book") || lowerMessage.includes("appointment")) {
      return "Great! I'd be happy to help you book an appointment. What service are you interested in? We offer:\n\n- Haircuts & Styling\n- Hair Color\n- Manicure & Pedicure\n- Facial Treatments\n- Massage Therapy";
    }
    if (lowerMessage.includes("available") || lowerMessage.includes("time")) {
      return "We have availability this week! Here are some open slots:\n\n- Tomorrow 10:00 AM, 2:00 PM\n- Wednesday 9:00 AM, 11:00 AM, 3:00 PM\n- Thursday 10:00 AM, 1:00 PM\n\nWhich time works best for you?";
    }
    if (lowerMessage.includes("price") || lowerMessage.includes("cost") || lowerMessage.includes("service")) {
      return "Here are our popular services:\n\n- Haircut: $35-65\n- Hair Color: $75-150\n- Manicure: $25\n- Pedicure: $40\n- Facial: $65-95\n- Massage (60 min): $85\n\nWould you like to book any of these?";
    }
    if (lowerMessage.includes("hour") || lowerMessage.includes("location") || lowerMessage.includes("address")) {
      return "Serenity Salon & Spa\n\nHours:\nMon-Fri: 9 AM - 7 PM\nSat: 9 AM - 5 PM\nSun: Closed\n\nLocation:\n123 Beauty Lane\nYour City, ST 12345\n\nPhone: " + (twilioNumber || "(804) 409-2778");
    }

    return "Thank you for your message! One of our team members will respond shortly. Is there anything specific I can help you with?\n\n- Book an appointment\n- Check availability\n- View services & pricing\n- Get our contact info";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "sending":
        return <Loader2 className="h-3 w-3 animate-spin text-slate-400" />;
      case "sent":
        return <span className="text-xs text-slate-400">Sent</span>;
      case "delivered":
        return <span className="text-xs text-green-500">Delivered</span>;
      case "error":
        return <span className="text-xs text-red-500">Failed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/ai/voice")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Twilio SMS Chat</h1>
            <p className="text-sm text-slate-500">
              {isPhoneVerified ? `Sending to: ${userPhone}` : "Chat via SMS"}
            </p>
          </div>
        </div>
        <Badge className="ml-auto bg-blue-100 text-blue-700">SMS</Badge>
      </div>

      {/* Phone Number Entry Screen */}
      {!isPhoneVerified && (
        <Card className="flex-1 flex flex-col items-center justify-center">
          <CardContent className="text-center max-w-md">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mx-auto mb-4">
              <Phone className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold mb-2">Enter Your Phone Number</h2>
            <p className="text-slate-500 mb-6">
              We&apos;ll send SMS messages to your phone. You can reply directly to continue the conversation.
            </p>
            <div className="flex gap-2">
              <Input
                type="tel"
                placeholder="(555) 123-4567"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && startChat()}
                className="flex-1"
              />
              <Button onClick={startChat} className="bg-blue-600 hover:bg-blue-700">
                Start Chat
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-4">
              Messages will be sent from {twilioNumber || "our salon number"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Chat Container - Only show when phone is verified */}
      {isPhoneVerified && (
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback
                  className={
                    message.role === "assistant"
                      ? "bg-gradient-to-br from-blue-500 to-cyan-600 text-white"
                      : "bg-slate-200"
                  }
                >
                  {message.role === "assistant" ? (
                    <MessageSquare className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div
                className={`max-w-[75%] ${
                  message.role === "user" ? "text-right" : ""
                }`}
              >
                <div
                  className={`inline-block p-3 rounded-2xl ${
                    message.role === "assistant"
                      ? "bg-slate-100 text-slate-900 rounded-tl-sm"
                      : "bg-blue-500 text-white rounded-tr-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                </div>
                <div className="flex items-center gap-2 mt-1 px-1">
                  <p className="text-xs text-slate-400">
                    {formatTime(message.timestamp)}
                  </p>
                  {message.role === "user" && getStatusIcon(message.status)}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                  <MessageSquare className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-slate-100 rounded-2xl rounded-tl-sm p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-sm text-slate-500">Typing...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Quick Prompts */}
        {messages.length === 1 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
              <Lightbulb className="h-3 w-3" />
              Quick options
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickPrompt(prompt.prompt)}
                  className="flex items-center gap-2 p-3 rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <prompt.icon className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">{prompt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Messages are sent via Twilio SMS to {userPhone}
          </p>
        </div>
      </Card>
      )}
    </div>
  );
}
