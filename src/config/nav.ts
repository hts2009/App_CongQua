import type { NavItem } from '@/types';
import { LayoutDashboard, Users, FileText, BarChart2, Settings, PlusCircle, Archive, Type } from 'lucide-react';
import { UserRole } from '@/types';

export const navItems: NavItem[] = [
  {
    title: 'Bảng Điều Khiển',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Ghi Nhận Công Quả',
    href: '/contributions/new',
    icon: PlusCircle,
  },
  {
    title: 'Quản Lý Mẫu Phiếu',
    href: '/templates',
    icon: FileText,
  },
  {
    title: 'Danh Mục',
    href: '/categories',
    icon: Archive,
    // subNav: [ // Example for sub-navigation, can be implemented later
    //   { title: 'Đơn Vị', href: '/categories/units', icon: Users },
    //   { title: 'Loại Việc', href: '/categories/work-types', icon: Type },
    // ]
  },
  {
    title: 'Báo Cáo & Thống Kê',
    href: '/reports',
    icon: BarChart2,
  },
  {
    title: 'Quản Lý Người Dùng',
    href: '/users',
    icon: Users,
    role: [UserRole.Admin],
  },
  {
    title: 'Cài Đặt Hệ Thống',
    href: '/settings',
    icon: Settings,
    role: [UserRole.Admin],
  },
];
