import { NextResponse } from 'next/server';
import { cookies } from "next/headers"
import * as jose from 'jose'
import OTP from '@/models/otps';
import User from '@/models/User';
import { connectDB } from '@/lib/utils';

export async function POST(req) {
  try {
    const { email, otp } = await req.json();
    
    await connectDB();
    
    // Find OTP document
    const otpDoc = await OTP.findOne({ 
      email,
      expiresAt: { $gt: new Date() }
    });
    
    if (!otpDoc) {
      return NextResponse.json({ 
        success: false,
        message: 'OTP expired or not found'
      }, { status: 400 });
    }
    
    if (otp === otpDoc.otp) {
      // Delete the OTP after successful verification
      await OTP.deleteOne({ _id: otpDoc._id });
      
      // Update user verification status
      const user = await User.findOneAndUpdate(
        { email },
        { 
          isVerified: true,
          verifiedAt: new Date()
        },
        { new: true }
      );

      // Create new JWT token with verified status
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const token = await new jose.SignJWT({ 
        userId: user._id.toString(),
        role: user.role,
        name: user.name,
        email: user.email,
        isVerified: true // Updated verification status
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(secret);

      // Update the cookie with new token
      cookies().set("token", token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
      
      return NextResponse.json({ 
        success: true,
        message: 'Email verified successfully' 
      });
    }
    
    return NextResponse.json({ 
      success: false,
      message: 'Invalid verification code' 
    }, { status: 400 });
    
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Verification failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}