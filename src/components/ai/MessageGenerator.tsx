"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Copy,
  RefreshCw,
  Check,
  MessageSquare,
  Mail,
  Wand2,
} from "lucide-react";

interface MessageGeneratorProps {
  clientName?: string;
  context?: string;
  onUse?: (message: string) => void;
}

const MESSAGE_TYPES = [
  { value: "appointment_reminder", label: "Appointment Reminder" },
  { value: "appointment_confirmation", label: "Appointment Confirmation" },
  { value: "thank_you", label: "Thank You" },
  { value: "birthday", label: "Birthday Greeting" },
  { value: "we_miss_you", label: "We Miss You" },
  { value: "special_offer", label: "Special Offer" },
  { value: "review_request", label: "Review Request" },
  { value: "reschedule", label: "Reschedule Request" },
  { value: "no_show_followup", label: "No-Show Follow-up" },
  { value: "custom", label: "Custom Message" },
];

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "casual", label: "Casual" },
  { value: "warm", label: "Warm & Personal" },
];

const CHANNELS = [
  { value: "sms", label: "SMS", maxLength: 160 },
  { value: "email", label: "Email", maxLength: 2000 },
];

export function MessageGenerator({ clientName, context, onUse }: MessageGeneratorProps) {
  const [messageType, setMessageType] = useState("appointment_reminder");
  const [tone, setTone] = useState("friendly");
  const [channel, setChannel] = useState("sms");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [variations, setVariations] = useState<string[]>([]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/messages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: messageType,
          tone,
          channel,
          clientName,
          context,
          customPrompt: messageType === "custom" ? customPrompt : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedMessage(data.message);
        setVariations(data.variations || []);
      }
    } catch (error) {
      console.error("Error generating message:", error);
      // Demo generated messages
      const demoMessages: Record<string, Record<string, string>> = {
        appointment_reminder: {
          sms: `Hi ${clientName || "there"}! Just a friendly reminder about your appointment tomorrow at 2:00 PM. We can't wait to see you! Reply YES to confirm or call us to reschedule. 💇`,
          email: `Dear ${clientName || "Valued Client"},\n\nThis is a friendly reminder about your upcoming appointment scheduled for tomorrow at 2:00 PM.\n\nWe look forward to seeing you!\n\nIf you need to reschedule, please don't hesitate to contact us.\n\nBest regards,\nYour Beauty Team`,
        },
        thank_you: {
          sms: `Thank you for visiting us today, ${clientName || ""}! We hope you love your new look. See you next time! ✨`,
          email: `Dear ${clientName || "Valued Client"},\n\nThank you so much for choosing us for your recent visit! We hope you absolutely love your new look.\n\nWe'd love to hear your feedback. If you have a moment, please consider leaving us a review.\n\nWe look forward to seeing you again soon!\n\nWarm regards,\nYour Beauty Team`,
        },
        birthday: {
          sms: `Happy Birthday, ${clientName || ""}! 🎂 Celebrate with 20% off your next visit. Book by end of month. You deserve to be pampered!`,
          email: `Happy Birthday, ${clientName || ""}!\n\nWishing you a wonderful day filled with joy and celebration! 🎂\n\nAs our gift to you, enjoy 20% off your next service. Simply mention this email when booking.\n\nOffer valid until the end of the month.\n\nCheers to you!\nYour Beauty Team`,
        },
        we_miss_you: {
          sms: `Hi ${clientName || "there"}! We miss you at the salon! It's been a while since your last visit. Come back and enjoy 15% off your next service! 💕`,
          email: `Dear ${clientName || "Valued Client"},\n\nIt's been a while since we've seen you, and we miss you!\n\nWe'd love to welcome you back with a special offer: 15% off your next service.\n\nWhether you're due for a trim, trying a new style, or just need some pampering, we're here for you.\n\nBook your appointment today!\n\nWarm regards,\nYour Beauty Team`,
        },
      };

      const message = demoMessages[messageType]?.[channel] ||
        `Hi ${clientName || "there"}! Thank you for being a valued client. We look forward to serving you again soon!`;

      setGeneratedMessage(message);
      setVariations([
        message.replace("friendly", "quick"),
        message.replace("!", "."),
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUseMessage = () => {
    onUse?.(generatedMessage);
  };

  const selectedChannel = CHANNELS.find((c) => c.value === channel);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Message Generator
        </CardTitle>
        <CardDescription>
          Generate personalized messages for clients using AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Configuration */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Message Type</Label>
            <Select value={messageType} onValueChange={setMessageType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESSAGE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Channel</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNELS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    <div className="flex items-center gap-2">
                      {c.value === "sms" ? (
                        <MessageSquare className="h-4 w-4" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                      {c.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom Prompt */}
        {messageType === "custom" && (
          <div className="space-y-2">
            <Label>What would you like to say?</Label>
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Describe the message you want to generate..."
              rows={2}
            />
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-rose-600 hover:bg-rose-700"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Message
            </>
          )}
        </Button>

        {/* Generated Message */}
        {generatedMessage && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Generated Message</Label>
                <Badge variant="secondary">
                  {generatedMessage.length}/{selectedChannel?.maxLength} chars
                </Badge>
              </div>
              <Textarea
                value={generatedMessage}
                onChange={(e) => setGeneratedMessage(e.target.value)}
                rows={channel === "email" ? 8 : 4}
                className="font-mono"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button variant="outline" onClick={handleGenerate}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
              {onUse && (
                <Button onClick={handleUseMessage} className="bg-rose-600 hover:bg-rose-700">
                  Use This Message
                </Button>
              )}
            </div>

            {/* Alternative Variations */}
            {variations.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Alternative variations:
                </Label>
                <div className="space-y-2">
                  {variations.map((variation, i) => (
                    <div
                      key={i}
                      className="p-3 bg-muted/50 rounded-lg text-sm cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => setGeneratedMessage(variation)}
                    >
                      {variation.slice(0, 100)}...
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
