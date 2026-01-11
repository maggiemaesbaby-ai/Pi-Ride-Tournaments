import { Suspense } from "react"
import TriviaArenasClient from "./arenas-client"

export default async function TriviaArenasPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = await params

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TriviaArenasClient categoryId={categoryId} />
    </Suspense>
  )
}
