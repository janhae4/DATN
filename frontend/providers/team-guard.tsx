"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useProjects } from "@/hooks/useProjects"
import { useTeamContext } from "@/contexts/TeamContext"

function RedirectToDefaultProject({ teamId }: { teamId: string }) {
  const router = useRouter()
  const { projects, isLoading } = useProjects(teamId)
  useEffect(() => {
    if (isLoading) return

    if (projects && projects.length > 0) {
      router.replace(`/${teamId}/${projects[0].id}/dashboard`)
    } else {
      router.replace(`/${teamId}`) 
    }
  }, [projects, isLoading, teamId, router])
  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Redirecting to your workspace...</p>
      </div>
    </div>
  )
}

// --- COMPONENT CHÍNH: TeamGuard ---
export function TeamGuard({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const router = useRouter()
  const teamId = params.teamId as string | undefined
  
  // 3. Sử dụng Context để lấy data đã cache (tránh fetch lại)
  const { teams, isLoading, setActiveTeam } = useTeamContext()

  // Biến cờ để xác định xem team hiện tại có hợp lệ không
  // Lưu ý: Logic tính toán này nằm ngoài useEffect
  const currentTeam = teamId ? teams?.find((t) => t.id === teamId) : undefined
  const shouldRedirect =
    !!teamId &&
    !isLoading &&
    Array.isArray(teams) &&
    teams.length > 0 &&
    !currentTeam

  console.log("currentTeam", currentTeam)
  console.log("shouldRedirect", shouldRedirect)
  useEffect(() => {
    if (isLoading || teams === undefined) return

    // Trường hợp 1: User chưa có team nào -> Đá về trang tạo
    if (Array.isArray(teams) && teams.length === 0) {
      router.push("/team-create")
      return
    }

    // Trường hợp 2: Team hợp lệ -> Cập nhật Context
    if (currentTeam) {
      setActiveTeam(currentTeam)
    }
  }, [teams, isLoading, router, currentTeam, setActiveTeam])

  // --- RENDER LOGIC ---

  // Nếu route không có teamId (vd: /team), bỏ qua logic redirect và chỉ render children
  if (!teamId) {
    return <>{children}</>
  }

  if (isLoading || teams === undefined) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Trường hợp 3: ID trên URL sai hoặc không có quyền -> Render Component Redirect
  if (shouldRedirect && teams && teams.length > 0) {
    // Lấy team đầu tiên làm mặc định
    const defaultTeam = teams[0]
    // Return Component này để nó tự đi fetch Project và redirect
    return <RedirectToDefaultProject teamId={defaultTeam.id} />
  }

  // Trường hợp 4: Mọi thứ OK -> Render nội dung trang
  if (currentTeam) {
    return <>{children}</>
  }

  return null
}