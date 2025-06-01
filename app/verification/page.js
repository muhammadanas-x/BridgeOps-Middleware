"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function VerificationPage() {
  const [otp, setOtp] = useState("")
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [message, setMessage] = useState("")
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get("email")

  useEffect(() => {
    if (!email) {
      router.push("/signup")
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [email, router])

  const handleVerify = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Email verified successfully!")
        setTimeout(() => router.push("/login"), 2000)
      } else {
        setMessage(data.message || "Invalid verification code")
      }
    } catch (error) {
      setMessage("Error verifying code")
    }
  }

  const handleResend = async () => {
    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setTimeLeft(300)
        setMessage("New verification code sent!")
      }
    } catch (error) {
      setMessage("Error sending new code")
    }
  }

  return (
   <div className="flex items-center justify-center min-h-screen bg-white px-4">
  <div className="w-full max-w-md border rounded-lg shadow-lg p-6">
    <h2 className="text-xl font-semibold mb-2">Verify Your Email</h2>
    <p className="text-sm text-gray-600 mb-4">
      Enter the verification code sent to {email}
    </p>

    <form onSubmit={handleVerify}>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="otp" className="text-sm font-medium">Verification Code</label>
          <span className="text-sm text-black">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
          </span>
        </div>
        <input
          id="otp"
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          maxLength={6}
          required
          className="w-full border border-gray-300 rounded px-4 py-2 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-col space-y-4">
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          Verify Code
        </button>

        {timeLeft === 0 && (
          <button
            type="button"
            onClick={handleResend}
            className="w-full border border-gray-300 py-2 px-4 rounded hover:bg-gray-100 transition"
          >
            Resend Code
          </button>
        )}

        {message && (
          <p
            className={`text-center text-sm ${
              message.includes("successfully") ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </form>
  </div>
</div>
  )
}
