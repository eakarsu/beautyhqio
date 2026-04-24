"use client";

import { useState, useEffect } from "react";
import { Moon, ArrowLeft, Loader2, Sun, Coffee, Smartphone, Dumbbell, Thermometer, Volume2, Lightbulb, Trash2, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Coaching {
  sleepScore: number;
  analysis: {
    duration: { status: string; message: string };
    quality: { status: string; message: string };
    environment: { status: string; message: string };
    habits: { status: string; message: string };
  };
  insights: { type: string; icon: string; title: string; message: string }[];
  recommendations: { priority: string; category: string; action: string; benefit: string }[];
  beautyConnection: { skinImpact: string; hairImpact: string; overallWellness: string };
  suggestedServices: { service: string; reason: string }[];
  bedtimeRoutine: { time: string; activity: string }[];
}

interface SleepRecord {
  id: string;
  date: string;
  sleepScore: number;
  sleepDuration: number;
  sleepQuality: number;
}

export default function SleepCoachPage() {
  const [records, setRecords] = useState<SleepRecord[]>([]);
  const [coaching, setCoaching] = useState<Coaching | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form state
  const [bedtime, setBedtime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [sleepQuality, setSleepQuality] = useState(7);
  const [caffeineIntake, setCaffeineIntake] = useState(false);
  const [screenTime, setScreenTime] = useState(60);
  const [exercise, setExercise] = useState(false);
  const [stress, setStress] = useState(5);
  const [roomTemp, setRoomTemp] = useState("cool");
  const [noiseLevel, setNoiseLevel] = useState("quiet");
  const [lightLevel, setLightLevel] = useState("dark");

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/ai/sleep-coach?limit=30");
      const data = await res.json();
      if (data.success) setRecords(data.data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/ai/sleep-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bedtime, wakeTime, sleepQuality, caffeineIntake,
          screenTime, exercise, stress, roomTemp, noiseLevel, lightLevel,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCoaching(data.coaching);
        fetchRecords();
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/ai/sleep-coach?id=${id}`, { method: "DELETE" });
      setRecords(records.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "optimal": case "good": case "ideal": case "healthy": return "bg-green-100 text-green-700";
      case "fair": case "needs_improvement": case "needs_work": return "bg-yellow-100 text-yellow-700";
      default: return "bg-red-100 text-red-700";
    }
  };

  const loadSampleData = () => {
    setBedtime("00:30");
    setWakeTime("06:45");
    setSleepQuality(4);
    setCaffeineIntake(true);
    setScreenTime(120);
    setExercise(false);
    setStress(8);
    setRoomTemp("warm");
    setNoiseLevel("moderate");
    setLightLevel("some light");
    setShowForm(true);
    setCoaching(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/ai-wellness" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="p-3 bg-indigo-500 rounded-xl">
                <Moon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Sleep Coach</h1>
                <p className="text-sm text-gray-500">Improve your beauty sleep</p>
              </div>
            </div>
            <button
              onClick={() => { setShowForm(true); setCoaching(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
            >
              <Plus className="h-5 w-5" />
              Log Sleep
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showForm && !coaching ? (
          /* Sleep Log Form */
          <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Log Your Sleep</h2>
                <button type="button" onClick={loadSampleData} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-300">Load Sample Data</button>
              </div>

              {/* Time Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bedtime</label>
                  <input
                    type="time"
                    value={bedtime}
                    onChange={(e) => setBedtime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Wake Time</label>
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Sleep Quality */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sleep Quality: {sleepQuality}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={sleepQuality}
                  onChange={(e) => setSleepQuality(parseInt(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* Factors */}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={caffeineIntake}
                    onChange={(e) => setCaffeineIntake(e.target.checked)}
                    className="w-5 h-5 accent-indigo-500"
                  />
                  <Coffee className="h-5 w-5 text-amber-600" />
                  <span className="text-sm">Had caffeine</span>
                </label>
                <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exercise}
                    onChange={(e) => setExercise(e.target.checked)}
                    className="w-5 h-5 accent-indigo-500"
                  />
                  <Dumbbell className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Exercised</span>
                </label>
              </div>

              {/* Screen Time */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Smartphone className="h-4 w-4" />
                  Screen time before bed: {screenTime} min
                </label>
                <input
                  type="range"
                  min="0"
                  max="180"
                  step="15"
                  value={screenTime}
                  onChange={(e) => setScreenTime(parseInt(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* Stress Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stress Level: {stress}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={stress}
                  onChange={(e) => setStress(parseInt(e.target.value))}
                  className="w-full accent-red-500"
                />
              </div>

              {/* Environment */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Thermometer className="h-4 w-4" /> Room Temp
                  </label>
                  <select value={roomTemp} onChange={(e) => setRoomTemp(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="cold">Cold</option>
                    <option value="cool">Cool</option>
                    <option value="warm">Warm</option>
                    <option value="hot">Hot</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Volume2 className="h-4 w-4" /> Noise
                  </label>
                  <select value={noiseLevel} onChange={(e) => setNoiseLevel(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="quiet">Quiet</option>
                    <option value="white noise">White noise</option>
                    <option value="moderate">Moderate</option>
                    <option value="loud">Loud</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Lightbulb className="h-4 w-4" /> Light
                  </label>
                  <select value={lightLevel} onChange={(e) => setLightLevel(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="dark">Dark</option>
                    <option value="some light">Some light</option>
                    <option value="bright">Bright</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Moon className="h-5 w-5" />}
                  {loading ? "Analyzing..." : "Get Sleep Coaching"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : coaching ? (
          /* Coaching Results */
          <div className="space-y-8">
            {/* Sleep Score */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your Sleep Score</h2>
              <div className={`text-7xl font-bold ${getScoreColor(coaching.sleepScore)}`}>{coaching.sleepScore}</div>
              <p className="text-gray-500 mt-2">out of 100</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {Object.entries(coaching.analysis).map(([key, value]) => (
                  <div key={key} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(value.status)}`}>
                      {value.status.replace("_", " ")}
                    </span>
                    <p className="text-sm font-medium mt-2 capitalize">{key}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recommendations</h3>
              <div className="space-y-3">
                {coaching.recommendations.map((rec, idx) => (
                  <div key={idx} className={`p-4 rounded-lg border-l-4 ${
                    rec.priority === "high" ? "border-red-500 bg-red-50" :
                    rec.priority === "medium" ? "border-yellow-500 bg-yellow-50" :
                    "border-green-500 bg-green-50"
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="font-medium">{rec.action}</div>
                      <span className="text-xs uppercase font-medium text-gray-500">{rec.priority}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{rec.benefit}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Beauty Connection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Skin Impact", content: coaching.beautyConnection.skinImpact, icon: "✨" },
                { title: "Hair Impact", content: coaching.beautyConnection.hairImpact, icon: "💇" },
                { title: "Overall Wellness", content: coaching.beautyConnection.overallWellness, icon: "💪" },
              ].map((item) => (
                <div key={item.title} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.content}</p>
                </div>
              ))}
            </div>

            {/* Bedtime Routine */}
            {coaching.bedtimeRoutine && (
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 text-white">
                <h3 className="font-semibold mb-4">Suggested Bedtime Routine</h3>
                <div className="flex flex-wrap gap-4">
                  {coaching.bedtimeRoutine.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
                      <span className="font-medium">{step.time}</span>
                      <span className="text-white/80">→</span>
                      <span>{step.activity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => { setShowForm(true); setCoaching(null); }}
              className="w-full py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
            >
              Log Another Night
            </button>
          </div>
        ) : (
          /* Dashboard */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 text-center">
              <Moon className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Track Your Beauty Sleep</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Log your sleep and receive AI-powered coaching to improve your sleep quality and its connection to beauty and wellness.
              </p>
              <button onClick={() => setShowForm(true)} className="px-8 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">
                Log Sleep
              </button>
            </div>

            {/* History */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Sleep History</h3>
              {records.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No records yet</p>
              ) : (
                <div className="space-y-3">
                  {records.slice(0, 7).map((record) => (
                    <div key={record.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex justify-between items-center">
                      <div>
                        <div className={`text-lg font-bold ${getScoreColor(record.sleepScore || 50)}`}>{record.sleepScore || "N/A"}</div>
                        <p className="text-xs text-gray-500">{new Date(record.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{Number(record.sleepDuration || 0).toFixed(1)}h</p>
                        <button onClick={() => setConfirmDeleteId(record.id)} className="p-1 hover:bg-gray-200 rounded">
                          <Trash2 className="h-4 w-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDeleteId}
        onConfirm={() => {
          if (confirmDeleteId) handleDelete(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        onCancel={() => setConfirmDeleteId(null)}
        title="Delete Record"
        description="Delete this record?"
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}
