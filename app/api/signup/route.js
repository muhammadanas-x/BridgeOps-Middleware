import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import * as jose from 'jose'
import bcrypt from "bcryptjs"
import User from "@/models/User"
import { connectDB } from "@/lib/utils"

export async function POST(request) {
    await connectDB();

    const body = await request.json()
    const { name, email, password, role } = body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      isVerified: false
    })

    // Create initial JWT token
    const secret = new TextEncoder().encode("123456789");
    const token = await new jose.SignJWT({ 
      userId: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
      isVerified: false
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);

    // Set the cookie
    await cookies().set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    )
}