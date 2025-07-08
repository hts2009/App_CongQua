
"use client"

import type { ReactNode, ComponentType } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
// Note: ChartConfig type was previously in ui/chart but moved here for simplicity if it's only used here.
// If it's widely used, it should remain in ui/chart or a types file.
// For this fix, assuming it's specific enough to be co-located or ui/chart will also be updated.

// Assuming ChartConfig might be defined elsewhere or is implicitly handled by ChartContainer's props
// For now, let's define a local version if not imported.
export type ChartConfig = {
  [k in string]: {
    label?: ReactNode
    icon?: ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<string, string> } // Simplified theme type
  )
}


const chartData = [
  { month: "Tháng 1", desktop: 18600000, mobile: 8000000 },
  { month: "Tháng 2", desktop: 30500000, mobile: 20000000 },
  { month: "Tháng 3", desktop: 23700000, mobile: 12000000 },
  { month: "Tháng 4", desktop: 7300000, mobile: 19000000 },
  { month: "Tháng 5", desktop: 20900000, mobile: 13000000 },
  { month: "Tháng 6", desktop: 21400000, mobile: 14000000 },
]

const chartConfigConst = { // Renamed to avoid conflict if ChartConfig type is also named chartConfig
  desktop: {
    label: "Tại Chùa",
    color: "hsl(var(--primary))",
  },
  mobile: {
    label: "Online",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig

export function SampleReportChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Thống Kê Công Quả 6 Tháng</CardTitle>
        <CardDescription>So sánh công quả ghi nhận tại chùa và online.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfigConst} className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis 
                tickFormatter={(value) => `${value/1000000} Tr`}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dashed" />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="desktop"
                fill="var(--color-desktop)"
                radius={4}
              />
              <Bar
                dataKey="mobile"
                fill="var(--color-mobile)"
                radius={4}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
