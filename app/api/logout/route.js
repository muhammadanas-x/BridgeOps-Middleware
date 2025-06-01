import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    // Create response first
    const response = NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    )

    // Delete the token cookie with proper options
    cookies().delete('token', {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    )
  }
}