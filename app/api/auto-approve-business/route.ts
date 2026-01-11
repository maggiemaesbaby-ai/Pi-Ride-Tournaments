import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { businessData, paymentId } = await request.json()

    console.log("[AUTO-APPROVE] Processing business approval after payment:", {
      businessId: businessData.id,
      businessName: businessData.businessName,
      paymentId,
    })

    // Auto-create shop for the business
    const shopData = {
      id: businessData.id,
      businessId: businessData.id,
      businessName: businessData.businessName,
      walletAddress: businessData.piWalletAddress,
      category: businessData.category,
      description: businessData.description,
      address: businessData.address,
      city: businessData.city,
      state: businessData.state,
      zipCode: businessData.zipCode,
      phone: businessData.phone,
      email: businessData.email,
      website: businessData.website,
      coordinates: null, // Will be geocoded later
      approved: true,
      active: true,
      createdAt: new Date().toISOString(),
      feeStructure: businessData.feeOption,
      setupFee: businessData.setupFee,
      promoUsed: businessData.promoApplied,
    }

    return NextResponse.json({
      success: true,
      shop: shopData,
      message: "Business automatically approved and shop created",
    })
  } catch (error: any) {
    console.error("[AUTO-APPROVE] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to auto-approve business",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
