"use client"

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    ReferenceLine
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { formatDollar } from "@/lib/utils"

type SessionPlayer = {
    user_id: string
    display_name: string | null
    venmo_handle: string | null
    game_net: number
    cash_in: number
    cash_out: number
    session_net: number
    is_me: boolean
    was_kicked: boolean
}

type StandingsPlayer = {
    user_id: string
    display_name: string | null
    venmo_handle: string | null
    game_net: number
    is_me: boolean
    was_kicked: boolean
}

type SessionChartPoint = { label: string; date: string; net: number }

const TOOLTIP_STYLE = {
    contentStyle: {
        backgroundColor: "#18181b",
        border: "1px solid #27272a",
        borderRadius: "10px",
        color: "#fafafa",
        fontSize: 13,
        boxShadow: "0 4px 24px rgba(0,0,0,0.5)"
    },
    itemStyle: { color: "#a1a1aa" },
    labelStyle: { color: "#fafafa", fontWeight: 600, marginBottom: 2 }
}

const TICK = { fontSize: 11, fill: "#71717a" }

function yDomain(data: { net: number }[]): [number, number] {
    if (!data.length) return [-10, 10]
    const vals = data.map((d) => d.net)
    const max = Math.max(...vals, 0)
    const min = Math.min(...vals, 0)
    const range = max - min || 1
    const pad = range * 0.2
    return [Math.floor(min - pad), Math.ceil(max + pad)]
}

function NetBadge({ value }: { value: number }) {
    if (value > 0.01)
        return (
            <span className="flex items-center gap-1 text-emerald-400 font-semibold tabular-nums">
                <TrendingUp className="h-3.5 w-3.5" />
                {formatDollar(value)}
            </span>
        )
    if (value < -0.01)
        return (
            <span className="flex items-center gap-1 text-red-400 font-semibold tabular-nums">
                <TrendingDown className="h-3.5 w-3.5" />
                {formatDollar(value)}
            </span>
        )
    return (
        <span className="flex items-center gap-1 text-zinc-500 font-semibold">
            <Minus className="h-3.5 w-3.5" />
            $0
        </span>
    )
}

function PlayerBarChart({
    data,
    tooltipLabel
}: {
    data: { name: string; net: number; isMe: boolean }[]
    tooltipLabel: string
}) {
    const allZero = data.every((d) => Math.abs(d.net) < 0.01)
    if (allZero) {
        return (
            <p className="text-muted-foreground text-sm text-center py-6">
                No data yet — this updates when games are ended.
            </p>
        )
    }
    const domain = yDomain(data)
    return (
        <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }} barSize={36} barCategoryGap="40%">
                    <CartesianGrid vertical={false} stroke="#27272a" strokeDasharray="4 4" />
                    <XAxis
                        dataKey="name"
                        tick={TICK}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        tickFormatter={(v: string) => (v.length > 10 ? v.slice(0, 10) + "…" : v)}
                    />
                    <YAxis
                        tickFormatter={(v) => formatDollar(v)}
                        tick={TICK}
                        width={58}
                        axisLine={false}
                        tickLine={false}
                        domain={domain}
                    />
                    <Tooltip
                        formatter={(value: number) => [formatDollar(value), tooltipLabel]}
                        cursor={{ fill: "#27272a", radius: 6 }}
                        {...TOOLTIP_STYLE}
                    />
                    <ReferenceLine y={0} stroke="#3f3f46" strokeWidth={1.5} />
                    <Bar dataKey="net" radius={[6, 6, 2, 2]}>
                        {data.map((entry, i) => (
                            <Cell
                                key={i}
                                fill={entry.isMe
                                    ? entry.net >= 0 ? "#22c55e" : "#ef4444"
                                    : entry.net >= 0 ? "#16a34a" : "#b91c1c"}
                                opacity={entry.isMe ? 1 : 0.5}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

export function GameMetricsClient({
    sessionPlayers,
    standingsPlayers,
    sessionChartPoints,
    cumulativeChartPoints,
    currentUserId
}: {
    sessionPlayers: SessionPlayer[]
    standingsPlayers: StandingsPlayer[]
    sessionChartPoints: SessionChartPoint[]
    cumulativeChartPoints: SessionChartPoint[]
    currentUserId: string
}) {
    const me = sessionPlayers.find((p) => p.user_id === currentUserId)

    const sessionBarData = sessionPlayers.map((p) => ({
        name: p.display_name || p.venmo_handle || p.user_id.slice(0, 8),
        net: p.session_net,
        isMe: p.user_id === currentUserId
    }))

    const allTimeBarData = standingsPlayers.map((p) => ({
        name: p.display_name || p.venmo_handle || p.user_id.slice(0, 8),
        net: p.game_net,
        isMe: p.user_id === currentUserId
    }))

    const sessionDomain = yDomain(sessionChartPoints)
    const cumDomain = yDomain(cumulativeChartPoints)

    // Line color is based on the final cumulative value
    const finalCumNet = cumulativeChartPoints[cumulativeChartPoints.length - 1]?.net ?? 0
    const lineColor = finalCumNet >= 0 ? "#22c55e" : "#ef4444"

    return (
        <div className="space-y-5">
            {/* Stat cards */}
            {me && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                        { label: "Session In", value: me.cash_in, neutral: true },
                        { label: "Session Out", value: me.cash_out, neutral: true },
                        { label: "Session Net", value: me.session_net },
                        { label: "Game Net", value: me.game_net }
                    ].map(({ label, value, neutral }) => (
                        <Card key={label}>
                            <CardContent className="px-4 pt-4 pb-3">
                                <p className="text-xs text-zinc-500 mb-1">{label}</p>
                                <p className={`text-xl font-bold tabular-nums ${neutral ? "text-foreground"
                                    : value > 0.01 ? "text-emerald-400"
                                        : value < -0.01 ? "text-red-400"
                                            : "text-zinc-500"
                                    }`}>
                                    {formatDollar(value)}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Current session */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Current Session</CardTitle>
                    <CardDescription>Live net profit / loss per player</CardDescription>
                </CardHeader>
                <CardContent>
                    {sessionBarData.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-8 text-center">No approved players yet.</p>
                    ) : (
                        <PlayerBarChart data={sessionBarData} tooltipLabel="Session Net" />
                    )}
                </CardContent>
            </Card>

            {/* Per-session profit bars */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Your Profit Per Session</CardTitle>
                    <CardDescription>Net for each time the host closed this table</CardDescription>
                </CardHeader>
                <CardContent>
                    {sessionChartPoints.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-8 text-center">
                            Close the session to record the first data point.
                        </p>
                    ) : (
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={sessionChartPoints}
                                    margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
                                    barSize={36}
                                    barCategoryGap="40%"
                                >
                                    <CartesianGrid vertical={false} stroke="#27272a" strokeDasharray="4 4" />
                                    <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
                                    <YAxis
                                        tickFormatter={(v) => formatDollar(v)}
                                        tick={TICK}
                                        width={58}
                                        axisLine={false}
                                        tickLine={false}
                                        domain={sessionDomain}
                                    />
                                    <Tooltip
                                        formatter={(value: number) => [formatDollar(value), "Session Net"]}
                                        labelFormatter={(label, payload) => {
                                            const pt = payload?.[0]?.payload as SessionChartPoint | undefined
                                            return pt ? `${label} · ${pt.date}` : label
                                        }}
                                        cursor={{ fill: "#27272a", radius: 6 }}
                                        {...TOOLTIP_STYLE}
                                    />
                                    <ReferenceLine y={0} stroke="#3f3f46" strokeWidth={1.5} />
                                    <Bar dataKey="net" radius={[6, 6, 2, 2]}>
                                        {sessionChartPoints.map((entry, i) => (
                                            <Cell key={i} fill={entry.net >= 0 ? "#22c55e" : "#ef4444"} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Cumulative line */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Cumulative Profit — This Game</CardTitle>
                    <CardDescription>Running total across all closed sessions</CardDescription>
                </CardHeader>
                <CardContent>
                    {cumulativeChartPoints.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-8 text-center">
                            Close the session to record the first data point.
                        </p>
                    ) : (
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={cumulativeChartPoints} margin={{ top: 8, right: 20, left: 0, bottom: 4 }}>
                                    <CartesianGrid vertical={false} stroke="#27272a" strokeDasharray="4 4" />
                                    <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
                                    <YAxis
                                        tickFormatter={(v) => formatDollar(v)}
                                        tick={TICK}
                                        width={58}
                                        axisLine={false}
                                        tickLine={false}
                                        domain={cumDomain}
                                    />
                                    <Tooltip
                                        formatter={(value: number) => [formatDollar(value), "Cumulative Net"]}
                                        labelFormatter={(label, payload) => {
                                            const pt = payload?.[0]?.payload as SessionChartPoint | undefined
                                            return pt ? `${label} · ${pt.date}` : label
                                        }}
                                        cursor={{ stroke: "#3f3f46", strokeWidth: 1.5 }}
                                        {...TOOLTIP_STYLE}
                                    />
                                    <ReferenceLine y={0} stroke="#3f3f46" strokeWidth={1.5} />
                                    <Line
                                        type="monotone"
                                        dataKey="net"
                                        stroke={lineColor}
                                        strokeWidth={2.5}
                                        dot={(props) => {
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            const { cx, cy, payload } = props as any
                                            const c = (payload.net ?? 0) >= 0 ? "#22c55e" : "#ef4444"
                                            return (
                                                <circle
                                                    key={payload.label}
                                                    cx={cx}
                                                    cy={cy}
                                                    r={5}
                                                    fill={c}
                                                    stroke="#18181b"
                                                    strokeWidth={2}
                                                />
                                            )
                                        }}
                                        activeDot={{ r: 7, fill: lineColor, stroke: "#18181b", strokeWidth: 2 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* All-time standings */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">All-Time Standings</CardTitle>
                    <CardDescription>Lifetime net profit for players at this table</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {standingsPlayers.length === 0 ? (
                        <p className="text-muted-foreground text-sm text-center py-8">No data yet.</p>
                    ) : (
                        <div className="space-y-1.5">
                            {[...standingsPlayers]

                                .sort((a, b) => b.game_net - a.game_net)
                                .map((p, i) => (
                                    <div
                                        key={p.user_id}
                                        className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${p.user_id === currentUserId
                                            ? "bg-emerald-500/10 border border-emerald-500/20"
                                            : "bg-zinc-900/60"
                                            } ${p.was_kicked ? "opacity-60" : ""}`}
                                    >
                                        <span className="flex items-center gap-2.5">
                                            <span className="text-zinc-600 text-xs w-5 tabular-nums">#{i + 1}</span>
                                            <span className="font-medium">
                                                {p.display_name || p.venmo_handle || p.user_id.slice(0, 8)}
                                                {p.user_id === currentUserId && (
                                                    <span className="ml-2 text-xs text-emerald-500 font-normal">you</span>
                                                )}
                                                {p.was_kicked && (
                                                    <span className="ml-2 text-xs text-zinc-500 font-normal">removed</span>
                                                )}
                                            </span>
                                        </span>
                                        <NetBadge value={p.game_net} />
                                    </div>
                                ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
