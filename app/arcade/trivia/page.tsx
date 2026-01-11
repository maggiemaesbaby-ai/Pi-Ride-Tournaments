"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const TRIVIA_CATEGORIES = [
  {
    id: "general-knowledge",
    name: "General Knowledge",
    icon: "🌍",
    description: "Test your knowledge across all topics",
    color: "from-blue-500 to-cyan-600",
  },
  {
    id: "science",
    name: "Science & Nature",
    icon: "🔬",
    description: "Biology, Chemistry, Physics & more",
    color: "from-green-500 to-emerald-600",
  },
  {
    id: "history",
    name: "History",
    icon: "📜",
    description: "Ancient civilizations to modern times",
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "entertainment",
    name: "Entertainment",
    icon: "🎬",
    description: "Movies, TV, Music & Pop Culture",
    color: "from-purple-500 to-pink-600",
  },
  {
    id: "sports",
    name: "Sports",
    icon: "⚽",
    description: "From football to Formula 1",
    color: "from-red-500 to-rose-600",
  },
  {
    id: "geography",
    name: "Geography",
    icon: "🗺️",
    description: "Countries, capitals & landmarks",
    color: "from-teal-500 to-cyan-600",
  },
]

export default function TriviaPage() {
  const router = useRouter()

  const handleFreePlay = (categoryId: string) => {
    router.push(`/arcade/trivia/${categoryId}/free-play`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => router.push("/arcade")}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">
              🧠 IQ Arena
            </h1>
            <p className="text-gray-300 text-lg mt-2">Choose Your Category & Compete for Pi!</p>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TRIVIA_CATEGORIES.map((category) => (
            <Card
              key={category.id}
              className={`bg-gradient-to-br ${category.color} border-4 border-white/20 hover:border-white/40 transition-all shadow-2xl`}
            >
              <CardContent className="p-6">
                <div className="text-6xl mb-4 text-center">{category.icon}</div>
                <h3 className="text-2xl font-bold text-center mb-2 text-white drop-shadow-lg">{category.name}</h3>
                <p className="text-white/80 text-center mb-4 text-sm">{category.description}</p>
                <p className="text-white/60 text-center text-xs mb-4">6 Tournament Arenas • 0.1π to 20π Entry</p>
                <div className="space-y-2">
                  <Link href={`/arcade/trivia/${category.id}/arenas`} className="block">
                    <Button
                      size="lg"
                      className="w-full bg-white/20 hover:bg-white/30 text-white font-bold backdrop-blur-sm"
                    >
                      Choose Your Arena
                    </Button>
                  </Link>
                  <Button
                    size="lg"
                    onClick={() => handleFreePlay(category.id)}
                    className="w-full bg-black/30 hover:bg-black/40 text-white font-bold backdrop-blur-sm"
                  >
                    Free Play
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        <Card className="mt-8 bg-gradient-to-br from-purple-900/50 to-slate-900/50 border-purple-500/30">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-cyan-400">How Trivia Tournaments Work</h2>
            <div className="grid md:grid-cols-2 gap-4 text-gray-300">
              <div>
                <h3 className="font-bold text-white mb-2">📝 Format</h3>
                <p className="text-sm">
                  Answer multiple-choice questions as fast as you can. Speed + accuracy = higher score!
                </p>
              </div>
              <div>
                <h3 className="font-bold text-white mb-2">🏆 Winning</h3>
                <p className="text-sm">Top scorers in each arena win Pi! Prizes based on entry tier.</p>
              </div>
              <div>
                <h3 className="font-bold text-white mb-2">⏱️ Time Limit</h3>
                <p className="text-sm">Each question has a time limit. Answer quickly for bonus points!</p>
              </div>
              <div>
                <h3 className="font-bold text-white mb-2">💰 6 Arena Tiers</h3>
                <p className="text-sm">From Newbie Practice (0.1π) to Champion's Duel (20π entry).</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
