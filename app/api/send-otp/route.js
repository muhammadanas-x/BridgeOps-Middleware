import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import OTP from '@/models/otps';
import { connectDB } from '@/lib/utils';

// Configure email transporter with secure settings
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "midnightdemise123@gmail.com",
    pass: "oklt vihs vkjr slkv",
  },
  tls: {
    rejectUnauthorized: false
  }
});

export async function POST(req) {
  try {
    const { email } = await req.json();
    
    // Connect to database
    await connectDB();
    
    // Generate a secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // Store or update OTP using Mongoose model
    await OTP.findOneAndUpdate(
      { email },
      {
        otp,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry
      },
      { upsert: true, new: true }
    );

    // Send email with cyberpunk-styled OTP
    await transporter.sendMail({
      from: "midnightdemise123@gmail.com",
      to: email,
      subject: 'BridgeOps Verification Code',
      html: `
        <div style="font-family: 'Courier New', monospace; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #e2e8f0; border: 1px solid #0891b2;">
          <h2 style="color: #0891b2; text-transform: uppercase;">System Authentication Required</h2>
          <p>Your verification code is:</p>
          <div style="background-color: #1e293b; padding: 20px; border-radius: 4px; text-align: center; margin: 20px 0; border-left: 2px solid #0891b2;">
            <span style="font-size: 32px; letter-spacing: 8px; color: #0891b2; font-weight: bold;">${otp}</span>
          </div>
          <p>⚠️ CODE EXPIRES IN 5 MINUTES</p>
          <div style="margin-top: 20px; padding: 10px; border-top: 1px solid #0891b2;">
            <p style="font-size: 12px; color: #64748b;">
              [SYSTEM]: If you didn't request this code, please ignore this transmission.
            </p>
            <p style="font-size: 12px; color: #64748b;">
              BridgeOps Security Protocol v1.0
            </p>
          </div>
        </div>
      `,
    });

    // Return success response
    return NextResponse.json({ 
      success: true,
      message: 'Verification code transmitted successfully',
      expiresIn: '5 minutes'
    });

  } catch (error) {
    console.error('OTP transmission error:', error);
    
    // Return error response
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send verification code',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { 
      status: 500 
    });
  }
}