import { NextRequest, NextResponse } from 'next/server'
import { driverDB } from '@/lib/driver-db'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const requestId = searchParams.get('requestId')

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID required' }, { status: 400 })
    }

    const request = driverDB.getRideRequest(requestId)

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    let driver = null
    if (request.acceptedBy) {
      driver = driverDB.getDriver(request.acceptedBy)
    }

    return NextResponse.json({
      success: true,
      request,
      driver: driver ? {
        name: driver.name,
        vehicleMake: driver.vehicleMake,
        vehicleModel: driver.vehicleModel,
        licensePlate: driver.licensePlate,
        rating: driver.averageRating,
        currentLat: driver.currentLat,
        currentLng: driver.currentLng
      } : null
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get ride status' },
      { status: 500 }
    )
  }
}
