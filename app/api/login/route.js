import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import mongoose from "mongoose"
import User from "@/models/User"
import * as jose from 'jose'
import { connectDB } from "@/lib/utils"


// ...existing connectDB function...

export async function POST(request) {
  try {
    await connectDB();

    console.log("Connected to MongoDB");
    const body = await request.json()
    const { email, password } = body

    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json({ error: "Invalid User" }, { status: 401 })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Create JWT token directly using jose
    const secret = new TextEncoder().encode("123456789")
    const token = await new jose.SignJWT({ 
      userId: user._id.toString(),
      role: user.role,
      isVerified: user.isVerified,
      name: user.name,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret)


    await cookies().set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    })

    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}