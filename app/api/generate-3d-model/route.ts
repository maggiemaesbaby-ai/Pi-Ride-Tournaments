import { fal } from "@fal-ai/client"

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json()

    if (!imageUrl) {
      return Response.json({ error: "Image URL required" }, { status: 400 })
    }

    if (!process.env.FAL_KEY) {
      return Response.json({ error: "FAL_KEY not configured" }, { status: 500 })
    }

    // Initialize fal client
    const falClient = fal(process.env.FAL_KEY)

    // Generate 3D model from image using fal AI
    const result = await falClient.subscribe("fal-ai/triposr", {
      input: {
        image_url: imageUrl,
      },
    })

    return Response.json({
      success: true,
      modelUrl: result.data.model_mesh?.url || result.data.model?.url,
    })
  } catch (error: any) {
    console.error("[v0] 3D generation error:", error)
    return Response.json({ error: error.message || "Failed to generate 3D model" }, { status: 500 })
  }
}
