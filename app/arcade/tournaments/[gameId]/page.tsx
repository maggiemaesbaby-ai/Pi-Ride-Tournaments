import { TournamentPageClient } from "./tournament-client"

interface TournamentPageProps {
  params: Promise<{
    gameId: string
  }>
}

// Generate metadata on the server
export async function generateMetadata({ params }: TournamentPageProps) {
  const { gameId } = await params
  const resolvedGameId = gameId || "asteroids"

  const GAME_DATA: Record<
    string,
    { name: string; icon: string; headerBg: string; tagline: string; tierDecoration: string }
  > = {
    asteroids: {
      name: "ASTEROIDS",
      icon: "🚀",
      headerBg: "from-indigo-600 via-purple-600 to-pink-600",
      tagline: "Blast Through Space!",
      tierDecoration: "🚀",
    },
    "trivia-general-knowledge": {
      name: "General Knowledge",
      icon: "🌍",
      headerBg: "from-blue-500 to-cyan-600",
      tagline: "Test your knowledge across all topics",
      tierDecoration: "🧠",
    },
    "trivia-science": {
      name: "Science & Nature",
      icon: "🔬",
      headerBg: "from-green-500 to-emerald-600",
      tagline: "Biology, Chemistry, Physics & more",
      tierDecoration: "🧪",
    },
    "trivia-history": {
      name: "History",
      icon: "📜",
      headerBg: "from-amber-500 to-orange-600",
      tagline: "Ancient civilizations to modern times",
      tierDecoration: "📚",
    },
    "trivia-entertainment": {
      name: "Entertainment",
      icon: "🎬",
      headerBg: "from-purple-500 to-pink-600",
      tagline: "Movies, TV, Music & Pop Culture",
      tierDecoration: "🎭",
    },
    "trivia-sports": {
      name: "Sports",
      icon: "⚽",
      headerBg: "from-red-500 to-rose-600",
      tagline: "From football to Formula 1",
      tierDecoration: "🏆",
    },
    "trivia-geography": {
      name: "Geography",
      icon: "🗺️",
      headerBg: "from-teal-500 to-cyan-600",
      tagline: "Countries, capitals & landmarks",
      tierDecoration: "🌎",
    },
    pacman: {
      name: "Pac-Man",
      icon: "🟡",
      headerBg: "from-blue-950 via-indigo-950 to-black",
      tagline: "Eat pellets, dodge ghosts, dominate the maze",
      tierDecoration: "👻",
    },
    galaga: {
      name: "Galaga",
      icon: "🚀",
      headerBg: "from-indigo-950 via-blue-950 to-black",
      tagline: "Defend against the alien invasion",
      tierDecoration: "👾",
    },
    "double-dragon": {
      name: "Double Dragon",
      icon: "🐉",
      headerBg: "from-red-950 via-orange-950 to-black",
      tagline: "Fight through the streets",
      tierDecoration: "🥋",
    },
    minesweeper: {
      name: "Minesweeper",
      icon: "💣",
      headerBg: "from-gray-950 via-slate-950 to-black",
      tagline: "Clear the field without hitting mines",
      tierDecoration: "💥",
    },
    frogger: {
      name: "Frogger",
      icon: "🐸",
      headerBg: "from-green-950 via-teal-950 to-black",
      tagline: "Hop to safety across traffic and rivers",
      tierDecoration: "🚗",
    },
    "space-invaders": {
      name: "Space Invaders",
      icon: "👾",
      headerBg: "from-purple-950 via-indigo-950 to-black",
      tagline: "Defend Earth from the invasion",
      tierDecoration: "🛸",
    },
    "donkey-kong": {
      name: "Donkey Kong",
      icon: "🦍",
      headerBg: "from-amber-950 via-orange-950 to-black",
      tagline: "Rescue the princess from the ape",
      tierDecoration: "🔨",
    },
    "street-fighter": {
      name: "Street Fighter",
      icon: "🥊",
      headerBg: "from-red-950 via-yellow-950 to-black",
      tagline: "Master the combos and dominate",
      tierDecoration: "⚡",
    },
    centipede: {
      name: "Centipede",
      icon: "🐛",
      headerBg: "from-green-950 via-lime-950 to-black",
      tagline: "Shoot through the mushroom field",
      tierDecoration: "🍄",
    },
  }

  const gameTheme = GAME_DATA[resolvedGameId] || GAME_DATA["asteroids"]

  return {
    title: `Tournaments - ${gameTheme.name}`,
    description: `Join exciting ${gameTheme.name} tournaments and compete for prizes!`,
  }
}

export default async function TournamentPage({ params }: TournamentPageProps) {
  const { gameId } = await params
  return <TournamentPageClient gameId={gameId} />
}
