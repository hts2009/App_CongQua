
"use client";
import { useState, useEffect, useMemo } from 'react';
import { SampleReportChart } from "@/components/reports/sample-report-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Download, Filter, Calendar as CalendarIcon, Printer } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { vi } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import type { ReportDataItem, Contribution } from "@/types"; 
import { getAllContributionsForReport, updatePrintStatus as serverUpdatePrintStatus } from '@/actions/contributionActions';
import { useToast } from '@/hooks/use-toast';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [allReportData, setAllReportData] = useState<ReportDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getAllContributionsForReport();
        const mappedData: ReportDataItem[] = data.map(item => ({
            ...item,
            type: item.workTypeId || "Không rõ", 
            receptionist: item.userId, 
        }));
        setAllReportData(mappedData);
      } catch (error) {
        toast({variant: "destructive", title: "Lỗi tải báo cáo", description: "Không thể tải dữ liệu báo cáo."});
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const filteredReportData = useMemo(() => {
    if (isLoading) return []; // Don't filter while loading initial data
    if (!dateRange || (!dateRange.from && !dateRange.to)) {
      return allReportData; // Show all if no range selected
    }
    return allReportData.filter(item => {
      try {
        const itemDate = parseISO(item.datetime);
        const from = dateRange.from ? startOfDay(dateRange.from) : null;
        const to = dateRange.to ? endOfDay(dateRange.to) : null;

        if (from && to) {
          return isWithinInterval(itemDate, { start: from, end: to });
        }
        if (from) {
          return itemDate >= from;
        }
        if (to) {
          return itemDate <= to;
        }
        return true; 
      } catch (e) {
        console.error("Error parsing date for filtering:", item.datetime, e);
        return false; // Exclude item if date is unparsable
      }
    });
  }, [allReportData, dateRange, isLoading]);
  
  const totalAmount = useMemo(() => {
    return filteredReportData.reduce((acc, item) => acc + item.amount, 0);
  }, [filteredReportData]);

  const handleReprint = async (item: ReportDataItem) => {
    console.log("Reprinting receipt:", item.receiptNumber);
    // This is a simplified reprint. A real app might open a dedicated print view.
    // For now, it just triggers the browser print.
    // To make it print only the receipt, you'd need a specific component for printing
    // that gets populated with `item`'s data and uses the print CSS.
    // For now, this will print the current page, and the print CSS might not
    // isolate the receipt if it's not the primary preview on the page.
    window.print(); 
    
    const result = await serverUpdatePrintStatus(item.id, true);
    if (result.success) {
        setAllReportData(prevData => 
            prevData.map(d => d.id === item.id ? { ...d, isPrinted: true } : d)
        );
        toast({title: "Đã In (Giả lập)", description: `Phiếu ${item.receiptNumber} được đánh dấu đã in.`});
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-3xl font-headline font-bold mb-4 sm:mb-0">Báo Cáo & Thống Kê</h1>
        <div className="flex items-center gap-2">
          <PopoverDateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
          <Button>
            <Download className="mr-2 h-4 w-4" /> Xuất Báo Cáo
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Tổng Quan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">Tổng Công Quả ({dateRange?.from || dateRange?.to ? "Trong Khoảng Đã Chọn" : "Toàn Thời Gian"}): {totalAmount.toLocaleString('vi-VN')} VNĐ</p>
          <p className="text-sm text-muted-foreground">
            {dateRange?.from || dateRange?.to ? `Từ ${dateRange.from ? format(dateRange.from, "dd/MM/yyyy") : '...'} đến ${dateRange.to ? format(dateRange.to, "dd/MM/yyyy") : '...'}` : "Tính đến thời điểm hiện tại."}
          </p>
        </CardContent>
      </Card>
      
      <SampleReportChart />

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Chi Tiết Giao Dịch</CardTitle>
          <CardDescription>
            Danh sách các khoản công quả đã được ghi nhận {dateRange?.from || dateRange?.to ? "trong khoảng đã chọn." : "(tất cả)."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Đang tải dữ liệu chi tiết...</p>}
          {!isLoading && filteredReportData.length === 0 && <p className="text-muted-foreground">Không có giao dịch nào {dateRange?.from || dateRange?.to ? "phù hợp với khoảng đã chọn." : "được tìm thấy."}</p>}
          {!isLoading && filteredReportData.length > 0 && (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Số Phiếu</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Người Đóng Góp</TableHead>
                    <TableHead>Loại Công Quả</TableHead>
                    <TableHead>Lễ Tân</TableHead>
                    <TableHead className="text-right">Số Tiền (VNĐ)</TableHead>
                    <TableHead className="text-center">Đã In</TableHead>
                    <TableHead className="text-right">Hành Động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReportData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.receiptNumber}</TableCell>
                      <TableCell>{format(parseISO(item.datetime), "dd/MM/yyyy HH:mm")}</TableCell>
                      <TableCell>{item.donorName}</TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>{item.receptionist}</TableCell>
                      <TableCell className="text-right">{item.amount.toLocaleString('vi-VN')}</TableCell>
                       <TableCell className="text-center">
                        <Badge variant={item.isPrinted ? "default" : "outline"} className={item.isPrinted ? "bg-green-500 text-white" : ""}>
                          {item.isPrinted ? "Đã In" : "Chưa In"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleReprint(item)}>
                           <Printer className="mr-1 h-4 w-4"/> In Lại
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


function PopoverDateRangePicker({dateRange, setDateRange}: {dateRange?: DateRange, setDateRange: (range?: DateRange) => void}) {
 return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant={"outline"}
          className="w-[260px] justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateRange?.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, "PPP", {locale: vi})} -{" "}
                {format(dateRange.to, "PPP", {locale: vi})}
              </>
            ) : (
              format(dateRange.from, "PPP", {locale: vi})
            )
          ) : (
            <span>Chọn khoảng ngày</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={setDateRange}
          numberOfMonths={2}
          locale={vi}
        />
      </PopoverContent>
    </Popover>
  )
}
