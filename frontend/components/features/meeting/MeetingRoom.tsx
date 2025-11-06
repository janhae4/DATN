"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  MessageCircle,
  Send,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  Users,
  Settings,
  MoreVertical
} from "lucide-react"
import { VideoTile } from "@/components/features/meeting/VideoTile"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"

// Mock data for chat messages
interface ChatMessage {
  id: string
  user: string
  message: string
  timestamp: Date
  isOwn: boolean
}

const mockMessages: ChatMessage[] = [
  {
    id: "1",
    user: "Alice Johnson",
    message: "Hello everyone! Ready for the meeting?",
    timestamp: new Date(Date.now() - 300000),
    isOwn: false,
  },
  {
    id: "2",
    user: "You",
    message: "Hi Alice! Yes, I'm ready.",
    timestamp: new Date(Date.now() - 240000),
    isOwn: true,
  },
  {
    id: "3",
    user: "Bob Smith",
    message: "Great! Let's start with the project updates.",
    timestamp: new Date(Date.now() - 180000),
    isOwn: false,
  },
  {
    id: "4",
    user: "Carol Davis",
    message: "I have the design mockups ready to share.",
    timestamp: new Date(Date.now() - 120000),
    isOwn: false,
  },
]

export function MeetingRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages)
  const [newMessage, setNewMessage] = useState("")
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mock video streams (in real app, these would come from WebRTC)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<{[key: string]: MediaStream}>({})

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      user: "You",
      message: newMessage.trim(),
      timestamp: new Date(),
      isOwn: true,
    }

    setMessages([...messages, message])
    setNewMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        {/* Main video area */}
        <SidebarInset className="flex-1 flex flex-col">
          {/* Meeting header */}
          <div className="flex items-center justify-between p-4 border-b bg-background">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div>
                <h1 className="font-semibold">Meeting Room: {roomId}</h1>
                <p className="text-sm text-muted-foreground">4 participants</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsMicMuted(!isMicMuted)}
                className={isMicMuted ? "bg-red-100" : ""}
              >
                {isMicMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsVideoMuted(!isVideoMuted)}
                className={isVideoMuted ? "bg-red-100" : ""}
              >
                {isVideoMuted ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              </Button>

              <Button variant="destructive" size="icon">
                <Phone className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Video grid */}
          <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Local video */}
            <VideoTile
              stream={localStream}
              name="You (Host)"
              isLocal={true}
              isVideoMuted={isVideoMuted}
              isAudioMuted={isMicMuted}
            />

            {/* Remote videos */}
            {Object.entries(remoteStreams).map(([userId, stream]) => (
              <VideoTile
                key={userId}
                stream={stream}
                name={`Participant ${userId}`}
                isVideoMuted={false}
                isAudioMuted={false}
              />
            ))}

            {/* Placeholder for additional participants */}
            {Object.keys(remoteStreams).length < 5 && (
              <Card className="aspect-video flex items-center justify-center">
                <Users className="h-12 w-12 text-muted-foreground" />
              </Card>
            )}
          </div>
        </SidebarInset>

   
      </div>
    </SidebarProvider>
  )
}
