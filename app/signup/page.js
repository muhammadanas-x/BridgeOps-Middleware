"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [roles ,setRoles] = useState([])  
  const [middlewareData, setMiddlewareData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch middleware data when component mounts
    const fetchMiddleware = async () => {
      try {
        setLoading(true)
        const response = await fetch("http://localhost:3000/api/middleware", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch middleware data")
        }

        const data = await response.json()
        setMiddlewareData(data)
      // Get unique roles using Set
      const uniqueRoles = [...new Set(data.map(item => item.from))]
      // Transform to expected format
      const uniqueData = uniqueRoles.map(role => ({ from: role }))
      setRoles(uniqueData)

      // Set default role to the first one if available
      if (uniqueData && uniqueData.length > 0 && !role) {
        setRole(uniqueData[0].from)
      }
      } catch (err) {
        setError(err.message)
        console.error("Error fetching middleware:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchMiddleware()
  }, [role])

  const handleSubmit = async (e) => {
    e.preventDefault()

    const userData = { name, email, password, role }

    try {
      // 1. First create the user
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(userData)
      })

      if (response.ok) {
        // 2. Send OTP
        const otpResponse = await fetch("/api/send-otp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email })
        })

        if (otpResponse.ok) {
          // 3. Redirect to verification page with email
          window.location.href = `/verification?email=${encodeURIComponent(email)}`
        } else {
          throw new Error("Failed to send verification code")
        }
      } else {
        throw new Error("Failed to create account")
      }
    } catch (err) {
      console.error("Signup error:", err)
      setError(err.message || "Signup failed. Please try again.")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black">
      <Card className="w-full max-w-md border border-cyan-500 bg-gray-800 bg-opacity-70 backdrop-blur-lg shadow-lg shadow-cyan-500/30 text-gray-100 relative overflow-hidden">
        {/* Cyber decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-1 bg-cyan-500"></div>
        <div className="absolute top-0 left-0 w-1 h-40 bg-purple-600"></div>
        <div className="absolute bottom-0 left-0 w-40 h-1 bg-cyan-500"></div>
        <div className="absolute bottom-0 right-0 w-1 h-40 bg-purple-600"></div>
        
        <CardHeader className="border-b border-cyan-800/50">
          <CardTitle className="text-2xl font-mono text-cyan-400 tracking-wider">CREATE AN ACCOUNT</CardTitle>
          <CardDescription className="text-gray-400 font-mono">Enter your information to access the system</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-mono text-cyan-300 uppercase tracking-wider">
                Name
              </label>
              <div className="relative">
                <Input 
                  id="name" 
                  placeholder="John Doe" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  className="bg-gray-900 border-cyan-700 text-cyan-100 focus:border-cyan-400 focus:ring-cyan-400 font-mono placeholder-gray-600"
                />
                <div className="absolute right-0 top-0 h-full w-2 bg-cyan-600 opacity-70"></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-mono text-cyan-300 uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-gray-900 border-cyan-700 text-cyan-100 focus:border-cyan-400 focus:ring-cyan-400 font-mono placeholder-gray-600"
                />
                <div className="absolute right-0 top-0 h-full w-2 bg-purple-600 opacity-70"></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-mono text-cyan-300 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-gray-900 border-cyan-700 text-cyan-100 focus:border-cyan-400 focus:ring-cyan-400 font-mono placeholder-gray-600"
                />
                <div className="absolute right-0 top-0 h-full w-2 bg-cyan-600 opacity-70"></div>
              </div>
            </div>

            {/* Role selection dropdown */}
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-mono text-cyan-300 uppercase tracking-wider">
                Role
              </label>
              {loading ? (
                <div className="h-10 bg-gray-800 border border-cyan-700 animate-pulse rounded-md relative">
                  <div className="absolute right-0 top-0 h-full w-2 bg-purple-600 opacity-70"></div>
                </div>
              ) : (
                <div className="relative">
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="role" className="bg-gray-900 border-cyan-700 text-cyan-100 focus:border-cyan-400 focus:ring-cyan-400 font-mono">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-cyan-700 text-cyan-100 font-mono">
                      {roles &&
                        roles.map((item) => (
                          <SelectItem key={item.from} value={item.from} className="hover:bg-cyan-900 focus:bg-cyan-900">
                            {item.from}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <div className="absolute right-0 top-0 h-full w-2 bg-purple-600 opacity-70"></div>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 border-t border-cyan-800/50 pt-6">
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 transition-all duration-300 font-mono relative group"
            >
              <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-cyan-500 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity"></span>
              SIGN UP
            </Button>
            <div className="text-center text-sm font-mono text-gray-400">
              Already have an account?{" "}
              <Link href="/login" className="text-cyan-400 hover:text-cyan-300 hover:underline transition-all duration-200">
                Login
              </Link>
            </div>
          </CardFooter>
        </form>

        {/* Display middleware data with cyber styling */}
        {error && (
          <div className="mx-6 mb-6 bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded font-mono text-sm flex items-center">
            <span className="mr-2">[!]</span> Error: {error}
          </div>
        )}
        
        {roles && roles.length > 0 && (
          <div className="mx-6 mb-6 p-4 bg-gray-900/80 border border-cyan-800 rounded-md">
            <h3 className="font-mono text-cyan-400 mb-2 text-sm uppercase tracking-wider">Available Roles:</h3>
            <pre className="text-xs font-mono text-gray-400 overflow-auto p-2 bg-black/50 rounded border border-gray-700">{JSON.stringify(middlewareData, null, 2)}</pre>
          </div>
        )}
      </Card>
    </div>
  )
}