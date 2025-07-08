"use client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { KeyRound, UserCircle2 } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return <div className="p-4 text-center">Vui lòng đăng nhập để xem trang cá nhân.</div>;
  }
  
  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length > 1) {
      return parts[0][0] + parts[parts.length - 1][0];
    }
    return name.substring(0, 2);
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-headline font-bold mb-8">Trang Cá Nhân</h1>
      
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col items-center text-center">
          <Avatar className="h-24 w-24 mb-4 ring-2 ring-primary ring-offset-2">
            <AvatarImage src={`https://placehold.co/100x100.png?text=${getInitials(user.username)}`} alt={user.username} data-ai-hint="avatar placeholder" />
            <AvatarFallback className="text-3xl">{getInitials(user.username).toUpperCase()}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl font-headline">{user.username}</CardTitle>
          <CardDescription className="capitalize">{user.role}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-3 font-headline flex items-center"><UserCircle2 className="mr-2 h-5 w-5 text-primary"/>Thông Tin Tài Khoản</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="username">Tên đăng nhập</Label>
                <Input id="username" value={user.username} readOnly className="mt-1 bg-muted/50 cursor-not-allowed" />
              </div>
              <div>
                <Label htmlFor="role">Vai trò</Label>
                <Input id="role" value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} readOnly className="mt-1 bg-muted/50 cursor-not-allowed capitalize" />
              </div>
               <div>
                <Label htmlFor="createdAt">Ngày tạo</Label>
                <Input id="createdAt" value={new Date(user.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })} readOnly className="mt-1 bg-muted/50 cursor-not-allowed" />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-3 font-headline flex items-center"><KeyRound className="mr-2 h-5 w-5 text-primary"/>Đổi Mật Khẩu</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                <Input id="currentPassword" type="password" placeholder="••••••••" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <Input id="newPassword" type="password" placeholder="••••••••" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" className="mt-1" />
              </div>
              <Button className="w-full sm:w-auto">Cập Nhật Mật Khẩu</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
