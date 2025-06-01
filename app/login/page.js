'use client'
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      console.error("Login error:", err)
      setError(err.message || "Something went wrong during login.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-black">
      <div className="max-w-md w-full bg-gray-800 bg-opacity-70 backdrop-blur-lg rounded-lg border border-cyan-500 shadow-lg shadow-cyan-500/30 p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-1 bg-cyan-500"></div>
        <div className="absolute top-0 left-0 w-1 h-32 bg-purple-500"></div>
        <div className="absolute bottom-0 left-0 w-32 h-1 bg-cyan-500"></div>
        <div className="absolute bottom-0 right-0 w-1 h-32 bg-purple-500"></div>

        <h2 className="text-2xl font-mono text-cyan-400 mb-1 tracking-wider">LOGIN</h2>
        <p className="text-gray-400 font-mono text-sm mb-6 border-b border-cyan-800 pb-3">
          Enter your credentials to access your account
        </p>

        {error && (
          <div className="bg-red-900 bg-opacity-50 border border-red-500 text-red-300 px-4 py-2 rounded mb-4 font-mono text-sm flex items-center">
            <span className="mr-2">[!]</span> {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-cyan-300 text-xs font-mono mb-1 uppercase tracking-wider">
              Email
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full bg-gray-900 text-cyan-100 border border-cyan-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none rounded px-4 py-2 font-mono text-sm placeholder-gray-600"
                placeholder="user@domain.com"
              />
              <div className="absolute right-0 top-0 h-full w-2 bg-cyan-600 opacity-70"></div>
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-cyan-300 text-xs font-mono mb-1 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full bg-gray-900 text-cyan-100 border border-cyan-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none rounded px-4 py-2 font-mono text-sm placeholder-gray-600"
                placeholder="********"
              />
              <div className="absolute right-0 top-0 h-full w-2 bg-purple-600 opacity-70"></div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 transition-all duration-300 font-mono relative group"
          >
            <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-cyan-500 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity"></span>
            {loading ? 'Logging in...' : 'LOGIN'}
          </button>

          <p className="text-center text-gray-400 text-sm font-mono mt-4">
            Don't have an account?{" "}
            <a href="/signup" className="text-cyan-400 hover:text-cyan-300 hover:underline transition-all duration-200">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}