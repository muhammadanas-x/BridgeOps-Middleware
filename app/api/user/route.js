import { NextResponse } from "next/server"
import { connectDB } from "@/lib/utils"
import User from "@/models/User"

export async function GET() {
  try {
    // Connect to MongoDB
    await connectDB()

    // Fetch all users but exclude password field
    const users = await User.find({}).select('-password')

    // Return users as JSON
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}