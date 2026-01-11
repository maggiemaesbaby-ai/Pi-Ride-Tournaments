import { Suspense } from "react"
import TriviaClient from "./trivia-client"

export default async function TriviaArenaPage({ params }: { params: Promise<{ tierId: string }> }) {
  const { tierId } = await params

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
          <div className="text-2xl">Loading...</div>
        </div>
      }
    >
      <TriviaClient tierId={tierId} />
    </Suspense>
  )
}
