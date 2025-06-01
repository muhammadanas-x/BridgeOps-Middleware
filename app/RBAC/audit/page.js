"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import { Shield, Users, Activity, Clock, Database } from "lucide-react"

const Audit = () => {
  const [users, setUsers] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [roleCounts, setRoleCounts] = useState({})
  const [pages, setPages] = useState([])
  const [pathCounts, setPathCounts] = useState({})
  const [chartData, setChartData] = useState([])

  // Fetch users and roles
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/user")
        if (!response.ok) throw new Error("Failed to fetch users")

        const data = await response.json()
        setUsers(data)

        const counts = data.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1
          return acc
        }, {})
        setRoleCounts(counts)
      } catch (err) {
        console.error("Error fetching users:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Fetch logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const logRes = await fetch("/api/audit")
        if (!logRes.ok) throw new Error("Failed to fetch audit logs")

        const logData = await logRes.json()
        console.log(logData)
        setLogs(logData.reverse()) // Reverse for most recent first

        // Calculate path counts
        const pathCounts = logData.reduce((acc, log) => {
          acc[log.path] = (acc[log.path] || 0) + 1
          return acc
        }, {})
        setPathCounts(pathCounts)
      } catch (err) {
        console.error("Error:", err)
      }
    }

    fetchLogs()
  }, [])

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const pagesRes = await fetch("/api/rbac")
        if (!pagesRes.ok) throw new Error("Failed to fetch pages")

        const pagesData = await pagesRes.json()
        console.log(pagesData)

        setPages(pagesData)
      } catch (err) {
        console.error("Error:", err)
      }
    }

    fetchPages()
  }, [])

  // Prepare chart data whenever pages or pathCounts change
  useEffect(() => {
    if (pages.length > 0 && Object.keys(pathCounts).length > 0) {
      // Create chart data by matching page paths with log counts
      const data = pages.map((page) => {
        // Normalize paths for comparison (replace \ with / for consistency)
        const normalizedPage = page.replace(/\\/g, "/")

        // Find matching path in logs
        let count = 0
        Object.entries(pathCounts).forEach(([path, pathCount]) => {
          const normalizedLogPath = path.replace(/\\/g, "/")
          // Check if the path matches exactly or is a sub-path
          if (normalizedLogPath === normalizedPage || normalizedLogPath.startsWith(normalizedPage + "/")) {
            count += pathCount
          }
        })

        // Display path with forward slashes for consistency
        return {
          path: normalizedPage === "." ? "home" : normalizedPage,
          count: count,
        }
      })

      setChartData(data)
    }
  }, [pages, pathCounts])

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-cyan-400 text-xl font-bold animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.7)]">
          Loading system data...
        </div>
      </div>
    )

  if (error)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-red-400 text-xl font-bold shadow-[0_0_15px_rgba(248,113,113,0.7)]">Error: {error}</div>
      </div>
    )

  return (
    <div className="p-4 lg:p-6 min-h-screen bg-gray-900 text-cyan-300">
      <h1 className="text-4xl md:text-3xl font-bold mb-6 text-cyan-400 text-center tracking-wider ">
        SYSTEM AUDIT LOGS
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          {/* Path Analytics Chart */}
          <div className="bg-gray-900 p-4 lg:p-6 rounded-lg border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <h2 className="text-lg md:text-xl font-semibold mb-3 text-cyan-300 flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              PAGE ACCESS ANALYTICS
            </h2>
            <div className="h-64 md:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 50 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="path"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tick={{ fill: "#67e8f9", fontSize: 11 }}
                    stroke="#0891b2"
                  />
                  <YAxis tick={{ fill: "#67e8f9" }} stroke="#0891b2" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      borderColor: "#06b6d4",
                      color: "#67e8f9",
                      boxShadow: "0 0 10px rgba(6, 182, 212, 0.5)",
                    }}
                    itemStyle={{ color: "#67e8f9" }}
                    labelStyle={{ color: "#06b6d4" }}
                  />
                  <Legend wrapperStyle={{ color: "#67e8f9" }} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Access Count"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                    activeDot={{
                      r: 6,
                      stroke: "#06b6d4",
                      strokeWidth: 2,
                      fill: "#0e7490",
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Role Distribution */}
          <div className="bg-gray-900 p-4 lg:p-6 rounded-lg border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <h2 className="text-lg md:text-xl font-semibold mb-3 text-cyan-300 flex items-center">
              <Users className="mr-2 h-5 w-5" />
              ROLE DISTRIBUTION
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(roleCounts).map(([role, count]) => ({ role, count }))}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#67e8f9" stopOpacity={1} />
                      <stop offset="100%" stopColor="#0891b2" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="role" tick={{ fill: "#67e8f9" }} stroke="#0891b2" />
                  <YAxis tick={{ fill: "#67e8f9" }} stroke="#0891b2" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      borderColor: "#06b6d4",
                      color: "#67e8f9",
                      boxShadow: "0 0 10px rgba(6, 182, 212, 0.5)",
                    }}
                    itemStyle={{ color: "#67e8f9" }}
                    labelStyle={{ color: "#06b6d4" }}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#barGradient)"
                    radius={[4, 4, 0, 0]}
                    className="shadow-[0_0_8px_rgba(6,182,212,0.7)]"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User List */}
          <div className="bg-gray-900 p-4 lg:p-6 rounded-lg border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <h2 className="text-lg md:text-xl font-semibold mb-3 text-cyan-300 flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              USER ACCOUNTS
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="p-3 bg-gray-800/60 rounded-lg border border-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.2)] hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all duration-300"
                >
                  <p className="text-cyan-400 font-medium">{user.name}</p>
                  <p className="text-cyan-200 text-sm">{user.email}</p>
                  <p className="mt-2 inline-block px-2 py-1 rounded bg-cyan-900/50 text-xs font-medium text-cyan-300 border border-cyan-700/50">
                    {user.role}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-4 lg:space-y-6">
          {/* Role Count Cards */}
          <div className="bg-gray-900 p-4 lg:p-6 rounded-lg border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <h2 className="text-lg md:text-xl font-semibold mb-3 text-cyan-300 flex items-center">
              <Users className="mr-2 h-5 w-5" />
              ROLE SUMMARY
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(roleCounts).map(([role, count]) => (
                <div
                  key={role}
                  className="bg-gray-800/60 p-3 rounded-md border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.3)] hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all duration-300"
                >
                  <p className="font-medium capitalize text-cyan-400">{role}</p>
                  <p className="text-2xl font-bold text-white">
                    {count} <span className="text-sm text-cyan-300">users</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Log List */}
          <div className="bg-gray-900 p-4 lg:p-6 rounded-lg border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <h2 className="text-lg md:text-xl font-semibold mb-3 text-cyan-300 flex items-center">
              <Database className="mr-2 h-5 w-5" />
              RECENT ACCESS LOGS
            </h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {logs.map((log) => (
                <div
                  key={log._id}
                  className="p-3 bg-gray-800/60 rounded-lg border border-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.2)] hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all duration-300"
                >
                  <div className="flex flex-wrap justify-between">
                    <p className="text-cyan-400 font-medium text-sm">
                      {log.name || log.userId} <span className="text-cyan-600">({log.role})</span>
                    </p>
                    <p className="text-cyan-300 text-xs flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-cyan-200 mt-2 text-sm">
                    <span className="text-cyan-500 font-medium">Route:</span> {log.path}
                  </p>
                  <p className="text-cyan-200 text-xs">
                    <span className="text-cyan-500 font-medium">IP:</span> {log.ip || "N/A"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Audit