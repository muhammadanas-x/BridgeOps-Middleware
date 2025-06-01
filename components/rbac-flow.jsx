"use client"

import React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { CircleUser, FileText, Plus, Save, Settings, ShieldCheck, Trash2 } from "lucide-react"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Types for our diagram elements
const NodeType = {
  ROLE: "role",
  PAGE: "page"
}

const initialRoles = [
  { id: "role-1", type: NodeType.ROLE, name: "Admin", x: 150, y: 100, width: 120, height: 60, icon: ShieldCheck },
  { id: "role-2", type: NodeType.ROLE, name: "Teacher", x: 150, y: 200, width: 120, height: 60, icon: CircleUser },
  { id: "role-3", type: NodeType.ROLE, name: "Student", x: 150, y: 300, width: 120, height: 60, icon: CircleUser },
]

const initialPages = [
  { id: "page-1", type: NodeType.PAGE, name: "Dashboard", x: 450, y: 100, width: 140, height: 60, icon: Settings },
  { id: "page-2", type: NodeType.PAGE, name: "Admin Panel", x: 450, y: 200, width: 140, height: 60, icon: Settings },
  { id: "page-3", type: NodeType.PAGE, name: "Teacher Portal", x: 450, y: 300, width: 140, height: 60, icon: FileText },
  { id: "page-4", type: NodeType.PAGE, name: "Student Portal", x: 450, y: 400, width: 140, height: 60, icon: FileText },
]

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

export function RbacFlowDiagram() {

  const [roles, setRoles] = useState(initialRoles)
  const [pages, setPages] = useState(initialPages)
  const [connections, setConnections] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [selectedConnection, setSelectedConnection] = useState(null)
  const [isCreatingConnection, setIsCreatingConnection] = useState(false)
  const [connectionStart, setConnectionStart] = useState(null)
  const [newNodeDialog, setNewNodeDialog] = useState(false)
  const [newNodeType, setNewNodeType] = useState(NodeType.ROLE)
  const [newNodeName, setNewNodeName] = useState("")
  const [draggedNode, setDraggedNode] = useState(null)
  const [connectionPoints, setConnectionPoints] = useState([])
  const [gridSize] = useState(20)
  const [showGrid, setShowGrid] = useState(true)
  const [dirs, setDirs] = useState([]);

  const canvasRef = useRef(null)
  const isDragging = useRef(false)


  useEffect(() => {
    const fetchPages = async () => {
      try {
        const response = await fetch('/api/rbac') // your API route
        const data = await response.json()
        setDirs(data) // assuming `data` is an array of page names

        console.log(dirs)
      } catch (error) {
        console.error('Failed to fetch pages:', error)
      }
    }
  
    fetchPages()
  }, [])
  
  // Function to snap to grid
  const snapToGrid = (value) => {
    return Math.round(value / gridSize) * gridSize
  }

  // Handle node dragging
  const handleMouseDown = (e, node) => {
    if (isCreatingConnection) {
      // Start creating a connection
      setConnectionStart({
        nodeId: node.id,
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
        setDraggedNode({ id: node.id, offsetX, offsetY })
        setSelectedNode(node)
        setSelectedConnection(null)
        isDragging.current = true
      }
    }
    e.stopPropagation()
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
        setConnections(
          connections.map((conn) => {
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
        )
      } else if (isCreatingConnection && connectionStart) {
        // Update the connection line while drawing
        setConnectionPoints([connectionPoints[0], { x: mouseX, y: mouseY }])
      }
    },
    [draggedNode, isCreatingConnection, connectionStart, connectionPoints, roles, pages, connections, gridSize]
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
              ((node.type === NodeType.PAGE && connectionStart.nodeId.startsWith("role")) ||
                (node.type === NodeType.ROLE && connectionStart.nodeId.startsWith("page")))
          )

          if (targetNode) {
            // Create a new connection
            const newConnection = {
              id: `conn-${Date.now()}`,
              from: connectionStart.nodeId,
              to: targetNode.id,
              points: [connectionPoints[0], { x: targetNode.x, y: targetNode.y + targetNode.height / 2 }],
            }
            setConnections([...connections, newConnection])
          }
        }

        setConnectionStart(null)
        setConnectionPoints([])
        setIsCreatingConnection(false)
      }
    },
    [draggedNode, isCreatingConnection, connectionStart, connectionPoints, roles, pages, connections]
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

  // Create a new node
  const handleCreateNode = () => {
    if (!newNodeName) return

    const newNode = {
      id: `${newNodeType}-${Date.now()}`,
      type: newNodeType,
      name: newNodeName,
      x: 300,
      y: 200,
      width: newNodeType === NodeType.ROLE ? 120 : 140,
      height: 60,
      icon: newNodeType === NodeType.ROLE ? CircleUser : FileText,
    }

    if (newNodeType === NodeType.ROLE) {
      setRoles([...roles, newNode])
    } else {
      setPages([...pages, newNode])
    }

    setNewNodeName("")
    setNewNodeDialog(false)
  }

  // Delete selected node or connection
  const handleDelete = () => {
    if (selectedNode) {
      if (selectedNode.type === NodeType.ROLE) {
        setRoles(roles.filter((role) => role.id !== selectedNode.id))
      } else {
        setPages(pages.filter((page) => page.id !== selectedNode.id))
      }
      // Also delete any connections to/from this node
      setConnections(connections.filter((conn) => conn.from !== selectedNode.id && conn.to !== selectedNode.id))
      setSelectedNode(null)
    } else if (selectedConnection) {
      setConnections(connections.filter((conn) => conn.id !== selectedConnection.id))
      setSelectedConnection(null)
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
        className={`cursor-pointer ${isSelected ? "stroke-primary stroke-[3px]" : "stroke-gray-500 stroke-[2px]"} ${isTemp ? "stroke-dashed stroke-gray-400" : ""}`}
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
            transform={`translate(${connection.points[connection.points.length - 1].x},${connection.points[connection.points.length - 1].y}) rotate(${
              (Math.atan2(
                connection.points[connection.points.length - 1].y - connection.points[connection.points.length - 2].y,
                connection.points[connection.points.length - 1].x - connection.points[connection.points.length - 2].x,
              ) *
                180) /
              Math.PI
            })`}
          />
        )}
      </g>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-background p-2">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreatingConnection(!isCreatingConnection)}
                  className={isCreatingConnection ? "bg-primary text-primary-foreground" : ""}
                >
                  Connect
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isCreatingConnection
                  ? "Click on a node to start connection, then click on another node to connect"
                  : "Create connections between roles and pages"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Dialog open={newNodeDialog} onOpenChange={setNewNodeDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="mr-1 h-4 w-4" /> Add Node
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Node</DialogTitle>
                <DialogDescription>Create a new role or page node for your diagram.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="node-type">Node Type</Label>
                  <Select value={newNodeType} onValueChange={(value) => setNewNodeType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select node type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NodeType.ROLE}>Role</SelectItem>
                      <SelectItem value={NodeType.PAGE}>Page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="node-name">Name</Label>
                  <Input
                    id="node-name"
                    value={newNodeName}
                    onChange={(e) => setNewNodeName(e.target.value)}
                    placeholder={`Enter ${newNodeType} name`}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewNodeDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateNode} disabled={!newNodeName}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={() => setShowGrid(!showGrid)}>
            {showGrid ? "Hide Grid" : "Show Grid"}
          </Button>

          <Button variant="outline" size="sm" onClick={handleDelete} disabled={!selectedNode && !selectedConnection}>
            <Trash2 className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="sm">
            <Save className="mr-1 h-4 w-4" /> Save
          </Button>
        </div>
      </div>

      {/* Main canvas */}
      <div className="relative flex-1 overflow-auto bg-gray-50" onClick={handleCanvasClick} ref={canvasRef}>
        {/* Grid */}
        {showGrid && (
          <svg className="absolute inset-0 h-full w-full">
            <defs>
              <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
                <path
                  d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
                  fill="none"
                  stroke="rgba(0, 0, 0, 0.1)"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="80%" height="100%" fill="url(#grid)" />
          </svg>
        )}

        {/* Diagram elements */}
        <div className="relative h-[2000px] w-[2000px]">
          {/* Connections */}
          <svg className="absolute inset-0 h-full w-full pointer-events-none">
            {connections.map((connection) => renderConnection(connection, selectedConnection?.id === connection.id))}

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
                true
              )}
          </svg>

          {/* Roles */}
          <div className="absolute left-0 top-0">
            {roles.map((role) => (
              <div
                key={role.id}
                className={`absolute flex cursor-move items-center rounded-md border-2 bg-white p-3 shadow-sm transition-all ${
                  selectedNode?.id === role.id
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                style={{
                  left: `${role.x}px`,
                  top: `${role.y}px`,
                  width: `${role.width}px`,
                  height: `${role.height}px`,
                  zIndex: selectedNode?.id === role.id ? 10 : 1,
                }}
                onMouseDown={(e) => handleMouseDown(e, role)}
              >
                <role.icon className="mr-2 h-5 w-5 text-primary" />
                <span className="font-medium">{role.name}</span>
              </div>
            ))}
          </div>

          {/* Pages */}
          <div className="absolute left-0 top-0">
            {pages.map((page) => (
              <div
                key={page.id}
                className={`absolute flex cursor-move items-center rounded-md border-2 bg-white p-3 shadow-sm transition-all ${
                  selectedNode?.id === page.id
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                style={{
                  left: `${page.x}px`,
                  top: `${page.y}px`,
                  width: `${page.width}px`,
                  height: `${page.height}px`,
                  zIndex: selectedNode?.id === page.id ? 10 : 1,
                }}
                onMouseDown={(e) => handleMouseDown(e, page)}
              >
                <page.icon className="mr-2 h-5 w-5 text-blue-500" />
                <span className="font-medium">{page.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Properties panel */}
      <div className="border-t bg-background p-4">
        <h3 className="mb-2 font-medium">Properties</h3>
        {selectedNode ? (
          <div className="grid gap-2">
            <div className="text-sm">
              <span className="font-medium">Type:</span>{" "}
              {selectedNode.type.charAt(0).toUpperCase() + selectedNode.type.slice(1)}
            </div>
            <div className="text-sm">
              <span className="font-medium">Name:</span> {selectedNode.name}
            </div>
            <div className="text-sm">
              <span className="font-medium">Position:</span> x: {selectedNode.x}, y: {selectedNode.y}
            </div>
            <div className="text-sm">
              <span className="font-medium">Connections:</span>{" "}
              {connections.filter((c) => c.from === selectedNode.id || c.to === selectedNode.id).length}
            </div>
          </div>
        ) : selectedConnection ? (
          <div className="grid gap-2">
            <div className="text-sm">
              <span className="font-medium">From:</span>{" "}
              {[...roles, ...pages].find((n) => n.id === selectedConnection.from)?.name}
            </div>
            <div className="text-sm">
              <span className="font-medium">To:</span>{" "}
              {[...roles, ...pages].find((n) => n.id === selectedConnection.to)?.name}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Select a node or connection to view its properties</div>
        )}
      </div>
    </div>
  )
}