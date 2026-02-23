import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BarChart2 } from "lucide-react"

export default async function GameLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ gameId: string }>
}) {
  const { gameId } = await params
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: game } = await supabase
    .from("games")
    .select("id, short_code, host_id, status")
    .eq("id", gameId)
    .single()

  if (!game) notFound()

  const { data: myParticipation } = await supabase
    .from("game_players")
    .select("status")
    .eq("game_id", gameId)
    .eq("user_id", user.id)
    .single()

  const isHost = game.host_id === user.id
  const isPlayer = !!myParticipation
  if (!isHost && !isPlayer) notFound()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
            <Link href={`/game/${gameId}`} className="text-muted-foreground hover:text-foreground transition-colors">
              Game {game.short_code}
            </Link>
            {isHost && <span className="rounded bg-primary/20 px-2 py-0.5 text-xs">Host</span>}
          </div>
          <Link href={`/game/${gameId}/metrics`}>
            <Button variant="outline" size="sm">
              <BarChart2 className="mr-1.5 h-4 w-4" />
              Metrics
            </Button>
          </Link>
        </div>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  )
}

