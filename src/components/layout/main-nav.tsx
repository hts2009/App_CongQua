"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { navItems } from "@/config/nav";
import type { NavItem, User } from "@/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth"; // Assuming useAuth provides user info

export function MainNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { user } = useAuth(); // Get current user

  const hasAccess = (itemRoles?: User["role"][]) => {
    if (!itemRoles || itemRoles.length === 0) return true; // No specific roles means public
    return user && itemRoles.includes(user.role);
  };
  
  const filteredNavItems = navItems.filter(item => hasAccess(item.role));

  return (
    <SidebarMenu>
      {filteredNavItems.map((item) => (
        <SidebarMenuItem key={item.href} className="group/menu-item">
          <Link href={item.href}>
            <SidebarMenuButton
              asChild={false} // Ensure it's a button for proper styling and behavior with Sidebar component
              isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
              disabled={item.disabled}
              className={cn(
                "w-full justify-start",
                item.disabled && "cursor-not-allowed opacity-50"
              )}
              onClick={() => setOpenMobile(false)}
              tooltip={{ children: item.title, className: "font-headline"}}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="truncate group-data-[collapsible=icon]:hidden font-body">{item.title}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
