"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const MiddlewareButton = ({ connections }) => {
  const [open, setOpen] = useState(false)
  const [showMongoDialog, setShowMongoDialog] = useState(false)
  const [mongoUri, setMongoUri] = useState("")

  const handleButtonClick = () => {
    setOpen(true)
  }

  const handleInitialConfirm = () => {
    setOpen(false)
    setShowMongoDialog(true)
  }

  const handleFinalConfirm = async () => {
    try {
      // First request: Create login and signup pages with MongoDB URI
      const pagesResponse = await fetch("/api/create-auth-pages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          createPages: true,
          mongoUri: mongoUri 
        }),
      })

      if (!pagesResponse.ok) {
        throw new Error("Failed to create authentication pages")
      }

      const pagesData = await pagesResponse.json()

      // Second request: Call middleware endpoint
      const middlewareResponse = await fetch("/api/middleware", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(connections),
      })

      if (!middlewareResponse.ok) {
        throw new Error("Middleware attachment failed")
      }

      const middlewareData = await middlewareResponse.json()

      // Close dialogs
      setShowMongoDialog(false)

      // Show success message
      alert(
        `Pages created successfully: ${pagesData.message}\nMiddleware attachment successful: ${middlewareData.message}`,
      )
    } catch (error) {
      console.error("Error in operation:", error)
      alert("Error: " + error.message)
      setShowMongoDialog(false)
    }
  }

  return (
    <div className="ml-auto">
      <Button variant="outline" size="sm" onClick={handleButtonClick}>
        Generate Middleware
      </Button>

      {/* Initial Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Authentication Pages</DialogTitle>
            <DialogDescription>
              Would you like to generate login and sign up pages for your application?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInitialConfirm}>Create Pages</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MongoDB URI Dialog */}
      <Dialog open={showMongoDialog} onOpenChange={setShowMongoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>MongoDB Connection</DialogTitle>
            <DialogDescription>
              Please enter your MongoDB connection URI
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="mongodb://username:password@host:port/database"
              value={mongoUri}
              onChange={(e) => setMongoUri(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMongoDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleFinalConfirm}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MiddlewareButton