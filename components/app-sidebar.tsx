"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Settings, Users, FileText, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const mainNavItems = [
  { title: "Documents", icon: FileText, href: "/documents" },
  { title: "Student", icon: FileText, href: "/students" },
];

const appName = "TU Server";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="gap-3">
              <div className="flex size-8 items-center justify-center overflow-hidden rounded-lg bg-primary text-primary-foreground">
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src="/7823.png" alt={appName} />
                  <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
                    {getInitials(appName)}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">{appName}</span>
                <span className="text-xs text-muted-foreground">
                  MI Soebono Mantofani
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="gap-3" onClick={handleLogout}>
              <Avatar className="size-7">
                <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                <AvatarFallback className="text-xs">AD</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col gap-0.5 leading-none">
                <span className="text-sm font-medium">Administrator</span>
                <span className="text-xs text-muted-foreground">
                  admin@tu.local
                </span>
              </div>
              <LogOut className="size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
