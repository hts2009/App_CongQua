
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Save, Database, TestTubeDiagonal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

const DATA_SOURCE_KEY = "appDataSourceMode";
type DataSourceMode = "demo" | "sqlite";

export default function SettingsPage() {
  const { toast } = useToast();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [dataSource, setDataSource] = useState<DataSourceMode>("demo");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedDataSource = localStorage.getItem(DATA_SOURCE_KEY) as DataSourceMode | null;
    if (storedDataSource && (storedDataSource === "demo" || storedDataSource === "sqlite")) {
      setDataSource(storedDataSource);
    }
  }, []);

  const handleDataSourceChange = (value: DataSourceMode) => {
    setDataSource(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(DATA_SOURCE_KEY, value);
    }
    toast({
      title: "Đã đổi nguồn dữ liệu (Lựa chọn UI)",
      description: `Lựa chọn nguồn dữ liệu được đặt thành: ${value === "demo" ? "Dữ liệu Demo" : "Cơ sở dữ liệu SQLite (Nhúng)"}. Thay đổi này chỉ lưu trên trình duyệt của bạn. Để có hiệu lực thực sự, backend của ứng dụng cần được cấu hình để đọc lựa chọn này (ví dụ: thông qua biến môi trường DATA_SOURCE_MODE) và kết nối với cơ sở dữ liệu tương ứng.`,
    });
  };

  const handleSaveChanges = () => {
    // In a real app, you would save these settings to a backend or localStorage.
    toast({
      title: "Đã lưu cài đặt (Giả lập)",
      description: "Các thay đổi cài đặt chung đã được ghi nhận (trong môi trường giả lập).",
    });
  };

  if (!isClient) {
    return (
        <div className="container mx-auto py-8 max-w-2xl space-y-8">
            <h1 className="text-3xl font-headline font-bold">Cài Đặt Hệ Thống Chung</h1>
            <p>Đang tải cài đặt...</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl space-y-8">
      <h1 className="text-3xl font-headline font-bold">Cài Đặt Hệ Thống Chung</h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Nguồn Dữ Liệu</CardTitle>
          <CardDescription>Chọn nguồn dữ liệu cho ứng dụng. Thay đổi có thể cần tải lại trang để áp dụng cho các tác vụ dữ liệu.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={dataSource}
            onValueChange={(value: string) => handleDataSourceChange(value as DataSourceMode)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2 p-3 border rounded-md has-[input:checked]:bg-accent has-[input:checked]:text-accent-foreground">
              <RadioGroupItem value="demo" id="dataSourceDemo" />
              <Label htmlFor="dataSourceDemo" className="flex items-center cursor-pointer">
                <TestTubeDiagonal className="mr-2 h-5 w-5" /> Dữ liệu Demo (Mặc định, cho phát triển)
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-md has-[input:checked]:bg-accent has-[input:checked]:text-accent-foreground">
              <RadioGroupItem value="sqlite" id="dataSourceSqlite" />
              <Label htmlFor="dataSourceSqlite" className="flex items-center cursor-pointer">
                <Database className="mr-2 h-5 w-5" /> Cơ sở dữ liệu SQLite (Cần cấu hình backend & database)
              </Label>
            </div>
          </RadioGroup>
          <Alert variant="default" className="mt-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Lưu ý quan trọng</AlertTitle>
            <AlertDescription>
              Việc chuyển đổi nguồn dữ liệu ở đây <strong className="font-semibold">chỉ lưu lựa chọn của bạn vào bộ nhớ cục bộ của trình duyệt</strong>.
              Hiện tại, các chức năng lấy dữ liệu của ứng dụng này <strong className="font-semibold">vẫn đang sử dụng dữ liệu demo (mock data)</strong> làm mặc định, trừ khi backend được cấu hình khác (ví dụ: qua biến môi trường <code className="font-mono bg-muted px-1 py-0.5 rounded">DATA_SOURCE_MODE=sqlite</code>).
              Để sử dụng SQLite một cách đầy đủ, cần phải:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Thiết lập và khởi tạo file cơ sở dữ liệu SQLite (ví dụ: <code className="font-mono bg-muted px-1 py-0.5 rounded">local-database.db</code>).</li>
                <li>Chạy migrations để tạo cấu trúc bảng (schema).</li>
                <li>Hoàn thiện các hàm tương tác với SQLite trong <code className="font-mono bg-muted px-1 py-0.5 rounded">src/services/sqliteService.ts</code>.</li>
                <li>Cấu hình backend (server actions) để sử dụng <code className="font-mono bg-muted px-1 py-0.5 rounded">sqliteService.ts</code> khi lựa chọn SQLite được kích hoạt (ví dụ, thông qua biến môi trường).</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Cài Đặt Chung Khác</CardTitle>
          <CardDescription>Các cấu hình này áp dụng toàn bộ hệ thống (nếu không được ghi đè bởi cài đặt riêng của Mẫu Phiếu).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="maintenanceMode"
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
            />
            <Label htmlFor="maintenanceMode">Bật Chế Độ Bảo Trì Toàn Hệ Thống</Label>
          </div>
           <p className="text-sm text-muted-foreground">
            Lưu ý: Các cài đặt chi tiết về Tên Tổ Chức, Địa Chỉ, Tiêu Đề Phiếu, Chân Trang Phiếu, và Logo
            nay được quản lý riêng cho từng Mẫu Phiếu trong phần Quản Lý Mẫu Phiếu.
          </p>
        </CardContent>
      </Card>
      
      <div className="flex justify-end pt-4">
        <Button onClick={handleSaveChanges}>
          <Save className="mr-2 h-4 w-4" /> Lưu Cài Đặt Chung
        </Button>
      </div>
    </div>
  );
}
