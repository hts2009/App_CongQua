"use client";
import { useState, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow }  from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, Trash2, Search, ToggleLeft, ToggleRight, KeyRound } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth'; // To check role
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from '@/hooks/use-toast';

const mockUsers: User[] = [
  { id: '1', username: 'admin', role: UserRole.Admin, isActive: true, createdAt: new Date().toISOString() },
  { id: '2', username: 'le_tan_1', role: UserRole.Receptionist, isActive: true, createdAt: new Date().toISOString() },
  { id: '3', username: 'le_tan_2', role: UserRole.Receptionist, isActive: false, createdAt: new Date().toISOString() },
];

const userFormSchema = z.object({
  username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự."),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự.").optional(), // Optional for edit
  role: z.nativeEnum(UserRole),
  isActive: z.boolean().default(true),
});

type UserFormData = z.infer<typeof userFormSchema>;

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { control, register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
  });

  // Redirect if not admin
  useEffect(() => {
    if (currentUser && currentUser.role !== UserRole.Admin) {
      toast({ variant: "destructive", title: "Không có quyền truy cập", description: "Bạn không phải là quản trị viên." });
      router.push('/dashboard');
    }
  }, [currentUser, router, toast]);

  if (currentUser?.role !== UserRole.Admin) {
    return <div className="p-4 text-center">Đang chuyển hướng...</div>; // Or a proper access denied component
  }
  
  const handleOpenForm = (user?: User) => {
    setEditingUser(user || null);
    reset(user ? { username: user.username, role: user.role, isActive: user.isActive } : { username: '', role: UserRole.Receptionist, isActive: true });
    setIsFormOpen(true);
  };
  
  const handleFormSubmit = async (data: UserFormData) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...editingUser, ...data } : u));
      toast({ title: "Đã cập nhật", description: `Người dùng "${data.username}" đã được cập nhật.` });
    } else {
      const newUser: User = { id: String(Date.now()), ...data, createdAt: new Date().toISOString() };
      setUsers([newUser, ...users]);
      toast({ title: "Đã thêm mới", description: `Người dùng "${data.username}" đã được tạo.` });
    }
    setIsFormOpen(false);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      setUsers(users.filter(u => u.id !== userId));
      toast({ title: "Đã xóa", description: "Người dùng đã được xóa." });
    }
  };

  const handleToggleActive = (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
    toast({ title: "Trạng thái cập nhật" });
  };
  
  const handleResetPassword = (userId: string) => {
     if (window.confirm("Bạn có chắc chắn muốn đặt lại mật khẩu cho người dùng này? Mật khẩu mới sẽ là '123456'.")) {
      // Logic for resetting password - In a real app, this would be an API call
      toast({ title: "Mật khẩu đã được đặt lại", description: "Mật khẩu mới là '123456'. Yêu cầu người dùng đổi mật khẩu sau khi đăng nhập." });
    }
  };


  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-headline font-bold">Quản Lý Người Dùng</h1>
        <Button onClick={() => handleOpenForm()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Thêm Người Dùng Mới
        </Button>
      </div>

      <div className="mb-6 relative">
        <Input
          type="text"
          placeholder="Tìm kiếm người dùng..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên Đăng Nhập</TableHead>
              <TableHead>Vai Trò</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead>Ngày Tạo</TableHead>
              <TableHead className="text-right">Hành Động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>
                    <Badge variant={user.role === UserRole.Admin ? "destructive" : "secondary"}>
                        {user.role === UserRole.Admin ? 'Quản Trị Viên' : 'Lễ Tân'}
                    </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => handleToggleActive(user.id)} className="px-2">
                    {user.isActive ? <ToggleRight className="h-5 w-5 text-green-500 mr-1" /> : <ToggleLeft className="h-5 w-5 text-red-500 mr-1" />}
                    {user.isActive ? 'Hoạt động' : 'Vô hiệu'}
                  </Button>
                </TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="outline" size="icon" onClick={() => handleOpenForm(user)} aria-label="Sửa người dùng">
                    <Edit className="h-4 w-4" />
                  </Button>
                   <Button variant="outline" size="icon" onClick={() => handleResetPassword(user.id)} aria-label="Đặt lại mật khẩu">
                    <KeyRound className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDeleteUser(user.id)} aria-label="Xóa người dùng" disabled={user.id === currentUser?.id}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {filteredUsers.length === 0 && <p className="text-center py-4 text-muted-foreground">Không tìm thấy người dùng nào.</p>}

      {/* User Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-headline">{editingUser ? 'Chỉnh Sửa Người Dùng' : 'Thêm Người Dùng Mới'}</DialogTitle>
            <DialogDescription>
              {editingUser ? `Cập nhật thông tin cho ${editingUser.username}.` : 'Tạo tài khoản mới cho nhân viên lễ tân.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            <div>
              <Label htmlFor="username">Tên Đăng Nhập</Label>
              <Input id="username" {...register("username")} className="mt-1" />
              {errors.username && <p className="text-sm text-destructive mt-1">{errors.username.message}</p>}
            </div>
            <div>
              <Label htmlFor="password">{editingUser ? 'Mật Khẩu Mới (nếu đổi)' : 'Mật Khẩu'}</Label>
              <Input id="password" type="password" {...register("password")} className="mt-1" />
              {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <Label htmlFor="role">Vai Trò</Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="role" className="mt-1">
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UserRole.Receptionist}>Lễ Tân</SelectItem>
                      <SelectItem value={UserRole.Admin}>Quản Trị Viên</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && <p className="text-sm text-destructive mt-1">{errors.role.message}</p>}
            </div>
             <div className="flex items-center space-x-2 pt-2">
                <Controller
                name="isActive"
                control={control}
                render={({ field }) => ( <input type="checkbox" id="isActive" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/> )}
                />
                <Label htmlFor="isActive">Kích hoạt tài khoản</Label>
            </div>
            <DialogFooter className="pt-4">
              <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Hủy</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang xử lý..." : (editingUser ? 'Lưu Thay Đổi' : 'Tạo Người Dùng')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
