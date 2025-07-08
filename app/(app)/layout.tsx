"use client";
import { useEffect, type ReactNode } from "react";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import { MainNav } from "@/components/layout/main-nav";
import { UserNav } from "@/components/layout/user-nav";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading || (!user && pathname !== "/login")) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-lg text-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }
  
  if (!user && pathname === "/login") { // If on login page and no user, show login page. AuthProvider is in login page itself.
     return <>{children}</>;
  }

  if (!user) return null; // Should be redirected by useEffect

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-4">
          <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <Image src="https://placehold.co/40x40.png" alt="App Logo" width={32} height={32} className="rounded-md" data-ai-hint="logo temple small" />
            <h1 className="text-xl font-headline font-semibold text-sidebar-primary group-data-[collapsible=icon]:hidden">
              Công Quả
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <MainNav />
        </SidebarContent>
        <SidebarFooter className="p-2 group-data-[collapsible=icon]:p-0">
           <Button variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-10" onClick={logout}>
             <LogOut className="mr-2 h-4 w-4 group-data-[collapsible=icon]:mr-0" />
             <span className="group-data-[collapsible=icon]:hidden">Đăng Xuất</span>
           </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm lg:px-6">
          <div className="flex items-center">
            <SidebarTrigger className="md:hidden" />
            {/* Breadcrumbs or page title can go here */}
          </div>
          <UserNav />
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}


// This component ensures AuthProvider wraps the AuthenticatedLayout
export default function AppLayoutWithAuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </AuthProvider>
  );
}
