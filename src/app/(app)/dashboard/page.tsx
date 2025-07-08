
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart as BarChartIcon, DollarSign, Users, FileText } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";

const dailyContributionsData = [
  { date: "2024-07-01", total: 1250000 },
  { date: "2024-07-02", total: 1800000 },
  { date: "2024-07-03", total: 950000 },
  { date: "2024-07-04", total: 2100000 },
  { date: "2024-07-05", total: 1500000 },
  { date: "2024-07-06", total: 1750000 },
  { date: "2024-07-07", total: 2300000 },
];

const chartConfig = {
  total: {
    label: "Tổng Tiền (VNĐ)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const contributionTypesData = [
  { name: "Xây Dựng Chùa", value: 4000000, fill: "hsl(var(--chart-1))" },
  { name: "Cúng Dường Trai Tăng", value: 3000000, fill: "hsl(var(--chart-2))" },
  { name: "Phóng Sanh", value: 2000000, fill: "hsl(var(--chart-3))" },
  { name: "Ấn Tống Kinh Sách", value: 2780000, fill: "hsl(var(--chart-4))" },
  { name: "Từ Thiện", value: 1890000, fill: "hsl(var(--chart-5))" },
];

const pieChartConfig = {
  value: {
    label: "Số Tiền",
  },
  "Xây Dựng Chùa": { label: "Xây Dựng Chùa", color: "hsl(var(--chart-1))" },
  "Cúng Dường Trai Tăng": { label: "Cúng Dường Trai Tăng", color: "hsl(var(--chart-2))" },
  "Phóng Sanh": { label: "Phóng Sanh", color: "hsl(var(--chart-3))" },
  "Ấn Tống Kinh Sách": { label: "Ấn Tống Kinh Sách", color: "hsl(var(--chart-4))" },
  "Từ Thiện": { label: "Từ Thiện", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;


export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-headline font-bold mb-6">
        Chào mừng trở lại, {user?.username || "Người Dùng"}!
      </h1>
      <p className="text-muted-foreground mb-8">
        Đây là trang tổng quan quản lý công quả của nhà chùa.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Thu Hôm Nay</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5,250,000 VNĐ</div>
            <p className="text-xs text-muted-foreground">+10.5% so với hôm qua</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Số Lượt Ghi Nhận</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+35</div>
            <p className="text-xs text-muted-foreground">+5 so với hôm qua</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mẫu Phiếu Hoạt Động</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Tổng số mẫu phiếu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Thu Tháng Này</CardTitle>
            <BarChartIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">125,780,000 VNĐ</div>
            <p className="text-xs text-muted-foreground">Tính đến hiện tại</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Công Quả Theo Ngày (Tuần Này)</CardTitle>
            <CardDescription>Tổng số tiền công quả ghi nhận mỗi ngày trong tuần này.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={dailyContributionsData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                {/* <CartesianGrid strokeDasharray="3 3" vertical={false} /> */}
                <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit'})} />
                {/* <YAxis tickFormatter={(value) => `${value/1000000}Tr`} /> */}
                {/* <ChartTooltip content={<ChartTooltipContent />} /> */}
                <Bar dataKey="total" fill="var(--color-total)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Phân Loại Công Quả (Tháng Này)</CardTitle>
             <CardDescription>Tỷ lệ đóng góp theo các loại công quả chính.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
             <ChartContainer config={pieChartConfig} className="h-[300px] w-full aspect-square">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                  <Pie data={contributionTypesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs fill-primary-foreground">
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}>
                    {contributionTypesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    