"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { CircleUser, FileText, Plus, Save, ShieldCheck, Trash2 } from "lucide-react"
import { FaHome, FaFolder } from "react-icons/fa" // Replace or add icons as needed

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import MiddlewareButton from "./MiddlewareButton"
import Link from "next/link"
import { useRouter } from "next/navigation"
import AIChat from "./AIChat"

// Initial data
// const initialRoles = [
//   { id: "role-1", type: "role", name: "Admin", x: 150, y: 100, width: 120, height: 60, icon: ShieldCheck },
//   { id: "role-2", type: "role", name: "Teacher", x: 150, y: 200, width: 120, height: 60, icon: CircleUser },
//   { id: "role-3", type: "role", name: "Student", x: 150, y: 300, width: 120, height: 60, icon: CircleUser },
// ]

// const initialPages = [
//   { id: "page-1", type: "page", name: "Dashboard", x: 450, y: 100, width: 140, height: 60, icon: Home },
//   { id: "page-2", type: "page", name: "Admin Panel", x: 450, y: 200, width: 140, height: 60, icon: Settings },
//   { id: "page-3", type: "page", name: "Teacher Portal", x: 450, y: 300, width: 140, height: 60, icon: FileText },
//   { id: "page-4", type: "page", name: "Student Portal", x: 450, y: 400, width: 140, height: 60, icon: FileText },
// ]

// const initialConnections = [
//   {
//     id: "conn-1",
//     from: "role-1",
//     to: "page-1",
//     points: [
//       { x: 270, y: 130 },
//       { x: 450, y: 130 },
//     ],
//   },
//   {
//     id: "conn-2",
//     from: "role-1",
//     to: "page-2",
//     points: [
//       { x: 270, y: 130 },
//       { x: 360, y: 130 },
//       { x: 360, y: 230 },
//       { x: 450, y: 230 },
//     ],
//   },
//   {
//     id: "conn-3",
//     from: "role-2",
//     to: "page-1",
//     points: [
//       { x: 270, y: 230 },
//       { x: 360, y: 230 },
//       { x: 360, y: 130 },
//       { x: 450, y: 130 },
//     ],
//   },
//   {
//     id: "conn-4",
//     from: "role-2",
//     to: "page-3",
//     points: [
//       { x: 270, y: 230 },
//       { x: 360, y: 230 },
//       { x: 360, y: 330 },
//       { x: 450, y: 330 },
//     ],
//   },
//   {
//     id: "conn-5",
//     from: "role-3",
//     to: "page-4",
//     points: [
//       { x: 270, y: 330 },
//       { x: 360, y: 330 },
//       { x: 360, y: 430 },
//       { x: 450, y: 430 },
//     ],
//   },
// ]

export function RbacCombined() {
  const [roles, setRoles] = useState([])
  const [pages, setPages] = useState([])
  const [connections, setConnections] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [selectedConnection, setSelectedConnection] = useState(null)
  const [isCreatingConnection, setIsCreatingConnection] = useState(false)
  const [connectionStart, setConnectionStart] = useState(null)
  const [newRoleDialog, setNewRoleDialog] = useState(false)
  const [newPageDialog, setNewPageDialog] = useState(false)
  const [newNodeName, setNewNodeName] = useState("")
  const [draggedNode, setDraggedNode] = useState(null)
  const [connectionPoints, setConnectionPoints] = useState([])
  const [gridSize] = useState(20)
  const [showGrid, setShowGrid] = useState(true)
  const [draggingFromSidebar, setDraggingFromSidebar] = useState(null)
  const [dirs, setDirs] = useState([])
  const canvasRef = useRef(null)
  const isDragging = useRef(false)


  const router = useRouter();

  useEffect(() => {
    const fetchDirectories = async () => {
      const response = await fetch("/api/rbac")
      const data = await response.json()
      console.log(data)
      setDirs(data)
    }

    fetchDirectories()
  }, [])

  const sidebarPages = dirs.map((dir) => {
    if (dir === ".") {
      return {
        name: "Home",
        displayName: "Home", // This will be shown on the canvas
        icon: FaHome,
        path: ".",
      }
    }

    const normalizedPath = dir.replace(/\\/g, "/")
    const name = normalizedPath.split("/").pop()

    return {
      name: name, // Original name (lowercase)
      displayName: name,
      icon: FaFolder,
      path: normalizedPath,
    }
  })

  // Function to snap to grid
  const snapToGrid = (value) => {
    return Math.round(value / gridSize) * gridSize
  }

  // Handle node dragging from canvas
  const handleMouseDown = (e, node) => {
    if (isCreatingConnection) {
      console.log("Creating connection from", node)
      // Start creating a connection
      setConnectionStart({
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        x: node.x + node.width,
        y: node.y + node.height / 2,
      })
      setConnectionPoints([{ x: node.x + node.width, y: node.y + node.height / 2 }])
    } else {
      // Start dragging a node
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const offsetX = e.clientX - rect.left - node.x
        const offsetY = e.clientY - rect.top - node.y
        setDraggedNode({ id: node.id , nodeName : node.name, nodeType: node.type, offsetX, offsetY })
        setSelectedNode(node)
        setSelectedConnection(null)
        isDragging.current = true
      }
    }
    e.stopPropagation()
  }

  // Handle dragging from sidebar
  const handleSidebarDragStart = (e, type, name, displayName, icon) => {
    e.dataTransfer.setData("text/plain", `${type}:${name}:${displayName}`)
    setDraggingFromSidebar({ type, name, displayName, icon })
  }

  // Handle drag over for canvas
  const handleDragOver = (e) => {
    e.preventDefault()
  }

  // Handle drop on canvas
  const handleDrop = (e) => {
    e.preventDefault()
    if (!draggingFromSidebar) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      const x = snapToGrid(e.clientX - rect.left)
      const y = snapToGrid(e.clientY - rect.top)

      const newNode = {
        id: `${draggingFromSidebar.type}-${Date.now()}`,
        type: draggingFromSidebar.type,
        name: draggingFromSidebar.displayName || draggingFromSidebar.name, // Use displayName if available
        x,
        y,
        width: draggingFromSidebar.type === "role" ? 150 : 200,
        height: 60,
        icon: draggingFromSidebar.icon,
      }

      if (draggingFromSidebar.type === "role") {
        setRoles([...roles, newNode])
      } else {
        setPages([...pages, newNode])
      }
    }

    setDraggingFromSidebar(null)
  }

  // Handle mouse move for dragging nodes or creating connections
  const handleMouseMove = useCallback(
    (e) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      if (draggedNode) {
        // Update node position
        const newX = snapToGrid(mouseX - draggedNode.offsetX)
        const newY = snapToGrid(mouseY - draggedNode.offsetY)

        const updateNodes = (nodes) =>
          nodes.map((node) => (node.id === draggedNode.id ? { ...node, x: newX, y: newY } : node))

        if (draggedNode.id.startsWith("role")) {
          setRoles(updateNodes(roles))
        } else {
          setPages(updateNodes(pages))
        }

        // Update connections when nodes move
        const updatedConnections = connections.map((conn) => {
          const allNodes = [...roles, ...pages]
          if (conn.from === draggedNode.id) {
            const fromNode = allNodes.find((n) => n.id === conn.from)
            if (fromNode) {
              const newPoints = [...conn.points]
              newPoints[0] = {
                x: newX + fromNode.width,
                y: newY + fromNode.height / 2,
              }
              return { ...conn, points: newPoints }
            }
          }
          if (conn.to === draggedNode.id) {
            const toNode = allNodes.find((n) => n.id === conn.to)
            if (toNode) {
              const newPoints = [...conn.points]
              newPoints[newPoints.length - 1] = {
                x: newX,
                y: newY + toNode.height / 2,
              }
              return { ...conn, points: newPoints }
            }
          }
          return conn
        })

        setConnections(updatedConnections)
      } else if (isCreatingConnection && connectionStart) {
        // Update the connection line while drawing
        setConnectionPoints([connectionPoints[0], { x: mouseX, y: mouseY }])
      }
    },
    [draggedNode, isCreatingConnection, connectionStart, connectionPoints, roles, pages, connections, gridSize],
  )

  // Handle mouse up for finishing drag or connection creation
  const handleMouseUp = useCallback(
    (e) => {
      if (draggedNode) {
        setDraggedNode(null)
        isDragging.current = false
      }

      if (isCreatingConnection && connectionStart) {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (rect) {
          const mouseX = e.clientX - rect.left
          const mouseY = e.clientY - rect.top

          const allNodes = [...roles, ...pages]
          // Check if mouse is over a node
          const targetNode = allNodes.find(
            (node) =>
              mouseX >= node.x &&
              mouseX <= node.x + node.width &&
              mouseY >= node.y &&
              mouseY <= node.y + node.height &&
              node.id !== connectionStart.nodeId &&
              ((node.type === "page" && connectionStart.nodeId.startsWith("role")) ||
                (node.type === "role" && connectionStart.nodeId.startsWith("page"))),
          )

          if (targetNode) {
            console.log(targetNode)
            // Create a new connection
            const newConnection = {
              id: `conn-${Date.now()}`, 
              from: connectionStart.nodeName,
              to: targetNode.name,
              points: [connectionPoints[0], { x: targetNode.x, y: targetNode.y + targetNode.height / 2 }],
            }
            console.log(newConnection)
            const updatedConnections = [...connections, newConnection]
            setConnections(updatedConnections)
          }
        }

        setConnectionStart(null)
        setConnectionPoints([])
        setIsCreatingConnection(false)
      }
    },
    [draggedNode, isCreatingConnection, connectionStart, connectionPoints, roles, pages, connections],
  )

  // Handle canvas click
  const handleCanvasClick = (e) => {
    // Deselect if clicking on empty canvas
    if (!isDragging.current) {
      setSelectedNode(null)
      setSelectedConnection(null)
    }
  }

  // Handle connection click
  const handleConnectionClick = (e, connection) => {
    setSelectedConnection(connection)
    setSelectedNode(null)
    e.stopPropagation()
  }

  // Create a new role
  const handleCreateRole = () => {
    if (!newNodeName) return

    const newRole = {
      id: `role-${Date.now()}`,
      type: "role",
      name: newNodeName,
      x: 150,
      y: roles.length * 100 + 100,
      width: 120,
      height: 60,
      icon: CircleUser,
    }

    setRoles([...roles, newRole])
    setNewNodeName("")
    setNewRoleDialog(false)
  }

  // Create a new page
  const handleCreatePage = async () => {
    if (!newNodeName) return

    // const newPage = {
    //   id: `page-${Date.now()}`,
    //   type: "page",
    //   name: newNodeName,
    //   x: 450,
    //   y: pages.length * 100 + 100,
    //   width: 140,
    //   height: 60,
    //   icon: FileText,
    // }

 try {
    // Create the actual page file
    const response = await fetch('/api/rbac', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pageName: newNodeName,
        path: newNodeName.toLowerCase(), // Convert to lowercase for URL-friendly path
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create page file');
    }

  }
  catch(error) {
    console.error('Error creating page file:', error);
    alert('Error creating page file: ' + error.message);
  }

    // setPages([...pages, newPage])
    setNewNodeName("")
    setNewPageDialog(false)
  }

  // Delete selected node or connection
  const handleDelete = () => {
    if (selectedNode) {
      if (selectedNode.type === "role") {
        setRoles(roles.filter((role) => role.id !== selectedNode.id))
      } else {
        setPages(pages.filter((page) => page.id !== selectedNode.id))
      }
      // Also delete any connections to/from this node
      const updatedConnections = connections.filter((conn) => conn.id !== selectedConnection.id)
      setConnections(updatedConnections)
      setSelectedNode(null)
    } else if (selectedConnection) {
      const updatedConnections = connections.filter((conn) => conn.id !== selectedConnection.id)
      setConnections(updatedConnections)
      setSelectedConnection(null)
    }
  }

  // Add this function to your component (near your other handlers)
  const handleDeleteRole = (roleId) => {
    // Remove the role
    setRoles(roles.filter((role) => role.id !== roleId))

    // Remove any connections involving this role
    const updatedConnections = connections.filter((conn) => conn.from !== roleId && conn.to !== roleId)
    setConnections(updatedConnections)
    localStorage.setItem("rbacConnections", JSON.stringify(updatedConnections))

    // Clear selection if deleted role was selected
    if (selectedNode?.id === roleId) {
      setSelectedNode(null)
    }
  }

  // Set up event listeners
  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  // Draw a connection line
  const renderConnection = (connection, isSelected, isTemp = false) => {
    if (connection.points.length < 2) return null

    // Generate SVG path
    let path = `M ${connection.points[0].x} ${connection.points[0].y}`

    for (let i = 1; i < connection.points.length; i++) {
      path += ` L ${connection.points[i].x} ${connection.points[i].y}`
    }

    return (
      <g
        key={isTemp ? "temp-connection" : connection.id}
        onClick={isTemp ? undefined : (e) => handleConnectionClick(e, connection)}
        className={`cursor-pointer ${isSelected ? "stroke-primary stroke-[3px]" : "stroke-gray-500 stroke-[2px]"} ${
          isTemp ? "stroke-dashed stroke-gray-400" : ""
        }`}
      >
        <path
          d={path}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={isTemp ? "5,5" : "none"}
        />
        {/* Arrow at the end */}
        {!isTemp && (
          <polygon
            points="0,-6 12,0 0,6"
            className={isSelected ? "fill-primary" : "fill-gray-500"}
            transform={
              `translate(${connection.points[connection.points.length - 1].x},${
              connection.points[connection.points.length - 1].y
            }) rotate(${
              (Math.atan2(
                connection.points[connection.points.length - 1].y - [connection.points.length - 2].y,
                connection.points[connection.points.length - 1].x - [connection.points.length - 2].x,
              ) *
                180) /
              Math.PI
            })`
            }
          />
        )}
      </g>
    )
  }

  return (
  <div className="flex h-screen bg-gray-900 text-cyan-50">
    {/* Sidebar */}
    <SidebarProvider>
      <Sidebar className="z-20 h-screen border-r border-cyan-900/40 bg-gray-900 shadow-lg shadow-cyan-500/20">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-cyan-900/40">
            <ShieldCheck className="h-6 w-6 text-cyan-400 animate-pulse" />
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">RBAC MANAGER</h1>
          </div>
        </SidebarHeader>
        <SidebarContent className="bg-gradient-to-b from-gray-900 to-gray-950">
          {/* Roles Section */}
          <SidebarGroup>
            <div className="flex items-center justify-between px-4">
              <SidebarGroupLabel className="text-cyan-400 font-bold">ROLES</SidebarGroupLabel>
              <Dialog open={newRoleDialog} onOpenChange={setNewRoleDialog}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20">
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Create new role</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border border-cyan-800 shadow-lg shadow-cyan-500/20 text-cyan-50">
                  <DialogHeader>
                    <DialogTitle className="text-cyan-400">Create New Role</DialogTitle>
                    <DialogDescription className="text-cyan-200">Add a new role to your RBAC system.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="role-name" className="text-cyan-300">Role Name</Label>
                      <Input
                        id="role-name"
                        value={newNodeName}
                        onChange={(e) => setNewNodeName(e.target.value)}
                        placeholder="Enter role name"
                        className="bg-gray-800 border-cyan-700 text-cyan-50 focus-visible:ring-cyan-500"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setNewRoleDialog(false)} 
                      className="border-cyan-700 text-cyan-400 hover:bg-cyan-900/30 hover:text-cyan-300">
                      Cancel
                    </Button>
                    <Button onClick={handleCreateRole} disabled={!newNodeName}
                      className="bg-gradient-to-r from-cyan-600 to-indigo-700 hover:from-cyan-500 hover:to-indigo-600 text-cyan-50">
                      Create Role
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {roles.map((role) => (
                  <SidebarMenuItem key={role.id}>
                    <div className="flex items-center w-full">
                      <SidebarMenuButton
                        draggable
                        onDragStart={(e) => handleSidebarDragStart(e, "role", role.name, role.icon)}
                        className="cursor-grab flex-1 hover:bg-cyan-900/30 group"
                      >
                        <role.icon className="mr-2 h-4 w-4 text-cyan-400 group-hover:text-cyan-300" />
                        <span className="text-cyan-100 group-hover:text-cyan-50">{role.name}</span>
                        <div className="ml-auto text-xs text-cyan-500 group-hover:text-cyan-400">Drag to canvas</div>
                      </SidebarMenuButton>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 ml-1 text-rose-500 hover:text-rose-400 hover:bg-rose-900/20"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteRole(role.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete role</span>
                      </Button>
                    </div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Pages Section */}
          <SidebarGroup>
            <div className="flex items-center justify-between px-4">
              <SidebarGroupLabel className="text-purple-400 font-bold">PAGES</SidebarGroupLabel>
              <Dialog open={newPageDialog} onOpenChange={setNewPageDialog}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-purple-400 hover:text-purple-300 hover:bg-purple-900/20">
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Create new page</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border border-purple-800 shadow-lg shadow-purple-500/20 text-cyan-50">
                  <DialogHeader>
                    <DialogTitle className="text-purple-400">Create New Page</DialogTitle>
                    <DialogDescription className="text-purple-200">Add a new page to your RBAC system.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="page-name" className="text-purple-300">Page Name</Label>
                      <Input
                        id="page-name"
                        value={newNodeName}
                        onChange={(e) => setNewNodeName(e.target.value)}
                        placeholder="Enter page name"
                        className="bg-gray-800 border-purple-700 text-cyan-50 focus-visible:ring-purple-500"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setNewPageDialog(false)}
                      className="border-purple-700 text-purple-400 hover:bg-purple-900/30 hover:text-purple-300">
                      Cancel
                    </Button>
                    <Button onClick={handleCreatePage} disabled={!newNodeName}
                      className="bg-gradient-to-r from-purple-600 to-fuchsia-700 hover:from-purple-500 hover:to-fuchsia-600 text-cyan-50">
                      Create Page
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {sidebarPages.map((page, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuButton
                      draggable
                      onDragStart={(e) => handleSidebarDragStart(e, "page", page.name, page.path, page.icon)}
                      className="cursor-grab hover:bg-purple-900/30 group"
                    >
                      <page.icon className="mr-2 h-4 w-4 text-purple-400 group-hover:text-purple-300" />
                      <span className="text-purple-100 group-hover:text-purple-50">{page.path}</span>
                      <div className="ml-auto text-xs text-purple-500 group-hover:text-purple-400">Drag to canvas</div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-cyan-900/40 bg-gray-900">
          <div className="p-4 space-y-2">
            <Button
              variant="outline"
              className="w-full border-cyan-700 bg-gradient-to-r from-cyan-900/40 to-cyan-900/20 text-cyan-400 hover:text-cyan-300 hover:border-cyan-600 hover:from-cyan-900/50 hover:to-cyan-900/30"
              onClick={() => {
                setNewNodeName("")
                setNewRoleDialog(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Role
            </Button>
            <Button
              variant="outline"
              className="w-full border-purple-700 bg-gradient-to-r from-purple-900/40 to-purple-900/20 text-purple-400 hover:text-purple-300 hover:border-purple-600 hover:from-purple-900/50 hover:to-purple-900/30"
              onClick={() => {
                setNewNodeName("")
                setNewPageDialog(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Page
            </Button>

           <Button
              variant="outline"
              className="w-full border-fuchsia-700 bg-gradient-to-r from-fuchsia-900/40 to-fuchsia-900/20 text-fuchsia-400 hover:text-fuchsia-300 hover:border-fuchsia-600 hover:from-fuchsia-900/50 hover:to-fuchsia-900/30"
              onClick={() => {
                router.push("/RBAC/audit")  // Changed from "/audit" to "/RBAC/audit"
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              View Audit
            </Button>
          </div>
        </SidebarFooter>
        <SidebarRail className="bg-gray-950 border-r border-cyan-900/40" />
      </Sidebar>
    </SidebarProvider>

    {/* Main content with canvas */}
    <div className="flex flex-1 flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-cyan-900/40 bg-gray-900 p-2">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreatingConnection(!isCreatingConnection)}
                  className={isCreatingConnection 
                    ? "bg-gradient-to-r from-cyan-600 to-indigo-700 text-cyan-50 border-cyan-700 shadow-md shadow-cyan-500/30"
                    : "bg-gray-800 text-cyan-400 border-cyan-800 hover:bg-cyan-900/30 hover:text-cyan-300 hover:border-cyan-700"}
                >
                  Connect
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-800 text-cyan-50 border-cyan-800">
                {isCreatingConnection
                  ? "Click on a node to start connection, then click on another node to connect"
                  : "Create connections between roles and pages"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowGrid(!showGrid)}
            className="bg-gray-800 text-purple-400 border-purple-800 hover:bg-purple-900/30 hover:text-purple-300 hover:border-purple-700"
          >
            {showGrid ? "Hide Grid" : "Show Grid"}
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDelete} 
            disabled={!selectedNode && !selectedConnection}
            className="bg-gray-800 text-rose-400 border-rose-800 hover:bg-rose-900/30 hover:text-rose-300 hover:border-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <Button 
            variant="outline" 
            size="sm"
            className="bg-gray-800 text-emerald-400 border-emerald-800 hover:bg-emerald-900/30 hover:text-emerald-300 hover:border-emerald-700"
          >
            <Save className="mr-1 h-4 w-4" /> Save
          </Button>
          <MiddlewareButton 
            connections={connections}
            className="bg-gray-800 text-amber-400 border-amber-800 hover:bg-amber-900/30 hover:text-amber-300 hover:border-amber-700"
          />
        </div>
      </div>

      {/* Canvas */}
      <div
        className="relative flex-1 overflow-auto bg-gray-950"
        onClick={handleCanvasClick}
        ref={canvasRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          backgroundImage: "radial-gradient(circle at 50% 50%, rgba(0, 252, 255, 0.03) 0%, rgba(8, 8, 16, 0) 70%)",
          backgroundSize: "100% 100%",
          backgroundPosition: "center center"
        }}
      >
        {/* Grid */}
        {showGrid && (
          <svg className="absolute inset-0 h-full w-full">
            <defs>
              <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
                <path
                  d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
                  fill="none"
                  stroke="rgba(6, 182, 212, 0.1)"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        )}

        {/* Diagram elements */}
        <div className="relative h-[2000px] w-[2000px]">
          {/* Connections */}
          <svg className="absolute inset-0 h-full w-full pointer-events-none">
            <filter id="neonGlow" height="300%" width="300%" x="-75%" y="-75%">
              <feMorphology operator="dilate" radius="2" in="SourceAlpha" result="thicken" />
              <feGaussianBlur in="thicken" stdDeviation="3" result="blurred" />
              <feFlood floodColor="#06b6d4" result="glowColor" />
              <feComposite in="glowColor" in2="blurred" operator="in" result="softGlow" />
              <feMerge>
                <feMergeNode in="softGlow"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            <filter id="purpleNeonGlow" height="300%" width="300%" x="-75%" y="-75%">
              <feMorphology operator="dilate" radius="2" in="SourceAlpha" result="thicken" />
              <feGaussianBlur in="thicken" stdDeviation="3" result="blurred" />
              <feFlood floodColor="#a855f7" result="glowColor" />
              <feComposite in="glowColor" in2="blurred" operator="in" result="softGlow" />
              <feMerge>
                <feMergeNode in="softGlow"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {connections.map((connection) => {
              const fromNode = [...roles, ...pages].find(n => n.id === connection.from);
              const toNode = [...roles, ...pages].find(n => n.id === connection.to);
              const isRoleToPage = 
                (fromNode && toNode && roles.some(r => r.id === fromNode.id) && pages.some(p => p.id === toNode.id));
              
              return renderConnection(
                connection, 
                selectedConnection?.id === connection.id,
                false,
                isRoleToPage ? "#06b6d4" : "#a855f7",
                isRoleToPage ? "url(#neonGlow)" : "url(#purpleNeonGlow)"
              );
            })}

            {/* Temporary connection line while creating */}
            {isCreatingConnection &&
              connectionPoints.length >= 2 &&
              renderConnection(
                {
                  id: "temp",
                  from: "temp",
                  to: "temp",
                  points: connectionPoints,
                },
                false,
                true,
                "#06b6d4",
                "url(#neonGlow)"
              )}
          </svg>

          {/* Roles */}
          <div className="absolute left-0 top-0">
            {roles.map((role) => (
              <div
                key={role.id}
                className={`absolute flex cursor-move items-center rounded-md border-2 bg-gray-800 p-3 transition-all ${
                  selectedNode?.id === role.id
                    ? "border-cyan-400 ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-500/30"
                    : "border-cyan-800 hover:border-cyan-600 shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30"
                }`}
                style={{
                  left: `${role.x}px`,
                  top: `${role.y}px`,
                  width: `${role.width}px`,
                  height: `${role.height}px`,
                  zIndex: selectedNode?.id === role.id ? 10 : 1,
                  background: "linear-gradient(to right, rgba(8, 47, 73, 0.8), rgba(8, 47, 73, 0.6))"
                }}
                onMouseDown={(e) => handleMouseDown(e, role)}
              >
                <role.icon className="mr-2 h-5 w-5 text-cyan-400" />
                <span className="font-medium text-cyan-50">{role.name}</span>
              </div>
            ))}
          </div>

          {/* Pages */}
          <div className="absolute left-0 top-0">
            {pages.map((page) => (
              <div
                key={page.id}
                className={`absolute flex cursor-move items-center rounded-md border-2 bg-gray-800 p-3 transition-all ${
                  selectedNode?.id === page.id
                    ? "border-purple-400 ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/30"
                    : "border-purple-800 hover:border-purple-600 shadow-md shadow-purple-500/20 hover:shadow-purple-500/30"
                }`}
                style={{
                  left: `${page.x}px`,
                  top: `${page.y}px`,
                  width: `${page.width}px`,
                  height: `${page.height}px`,
                  zIndex: selectedNode?.id === page.id ? 10 : 1,
                  background: "linear-gradient(to right, rgba(59, 7, 100, 0.8), rgba(59, 7, 100, 0.6))"
                }}
                onMouseDown={(e) => handleMouseDown(e, page)}
              >
                <page.icon className="mr-2 h-5 w-5 text-purple-400" />
                <span className="font-medium text-purple-50">{page.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    <AIChat/>
  </div>
)
}
