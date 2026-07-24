"use client";

import { useState, useEffect, useRef } from "react";
import { Brain, Send, ArrowLeft, Loader2, Smile, Frown, Meh, Heart, RefreshCw } from "lucide-react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Analysis {
  emotionalTone: string;
  identifiedConcerns: string[];
  copingStrategies: string[];
  suggestedServices: string[];
  needsProfessionalHelp: boolean;
  crisisDetected: boolean;
}

export default function MentalHealthPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>(`mh-${Date.now()}`);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mood tracking
  const [moodScore, setMoodScore] = useState<number>(5);
  const [stressLevel, setStressLevel] = useState<number>(5);
  const [showMoodTracker, setShowMoodTracker] = useState(true);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/mental-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          sessionId,
          moodScore,
          stressLevel,
          previousMessages: messages,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm sorry, I had trouble processing that. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startNewSession = () => {
    setMessages([]);
    setSessionId(`mh-${Date.now()}`);
    setAnalysis(null);
    setShowMoodTracker(true);
  };

  const getMoodEmoji = (score: number) => {
    if (score <= 3) return <Frown className="h-6 w-6 text-red-500" />;
    if (score <= 6) return <Meh className="h-6 w-6 text-yellow-500" />;
    return <Smile className="h-6 w-6 text-green-500" />;
  };

  const loadSampleData = () => {
    setMoodScore(3);
    setStressLevel(8);
    setShowMoodTracker(false);
    setInput("I've been feeling overwhelmed with work lately. I can't seem to relax even after leaving the office. My shoulders are tense and I've been having trouble sleeping.");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/ai" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="p-2 bg-purple-500 rounded-xl">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">AI Mental Health Companion</h1>
                <p className="text-xs text-gray-500">Your supportive wellness companion</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadSampleData}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-300"
              >
                Load Sample Data
              </button>
              <button
                onClick={startNewSession}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
              >
                <RefreshCw className="h-4 w-4" />
                New Session
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col">
        {/* Mood Tracker */}
        {showMoodTracker && messages.length === 0 && (
          <div className="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">How are you feeling today?</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mood Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mood</label>
                  <div className="flex items-center gap-2">
                    {getMoodEmoji(moodScore)}
                    <span className="text-lg font-semibold">{moodScore}/10</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={moodScore}
                  onChange={(e) => setMoodScore(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              {/* Stress Level */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Stress Level</label>
                  <span className="text-lg font-semibold">{stressLevel}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={stressLevel}
                  onChange={(e) => setStressLevel(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Calm</span>
                  <span>Stressed</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowMoodTracker(false)}
              className="mt-4 w-full py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              Start Chat
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && !showMoodTracker && (
            <div className="text-center py-12">
              <Brain className="h-16 w-16 text-purple-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Hello! I'm your wellness companion
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                I'm here to support your mental wellbeing. Share what's on your mind, and I'll offer coping strategies,
                relaxation techniques, and self-care recommendations.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {["I'm feeling stressed", "I need relaxation tips", "Help me unwind", "I can't sleep well"].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  message.role === "user"
                    ? "bg-purple-500 text-white rounded-br-md"
                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-md"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl rounded-bl-md">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                  <span className="text-gray-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Analysis Panel */}
        {analysis && (
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border-t border-purple-200 dark:border-purple-800">
            <div className="flex flex-wrap gap-4">
              {analysis.copingStrategies.length > 0 && (
                <div className="flex-1 min-w-[200px]">
                  <h4 className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2">Coping Strategies</h4>
                  <div className="flex flex-wrap gap-1">
                    {analysis.copingStrategies.slice(0, 3).map((strategy, idx) => (
                      <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                        {strategy}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {analysis.suggestedServices.length > 0 && (
                <div className="flex-1 min-w-[200px]">
                  <h4 className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2">Suggested Services</h4>
                  <div className="flex flex-wrap gap-1">
                    {analysis.suggestedServices.map((service, idx) => (
                      <span key={idx} className="px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Share what's on your mind..."
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
          <p className="text-xs text-gray-500 text-center mt-2">
            This is wellness support, not therapy. For mental health concerns, please consult a licensed professional.
          </p>
        </div>
      </div>
    </div>
  );
}
