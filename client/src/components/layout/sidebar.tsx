import { Link, useLocation } from "wouter";
import { 
  Calendar, 
  Users, 
  DollarSign, 
  BarChart, 
  Scissors, 
  UserSquare,
  Home,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, ReactNode } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import React from 'react';

interface SidebarProps {
  className?: string;
  children?: ReactNode;
}

export function Sidebar({ className, children }: SidebarProps) {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sidebarItems = [
    {
      icon: <Home className="mr-2 h-5 w-5" />,
      label: "Dashboard",
      href: "/admin",
    },
    {
      icon: <Calendar className="mr-2 h-5 w-5" />,
      label: "Agenda",
      href: "/admin/schedule",
    },
    {
      icon: <Users className="mr-2 h-5 w-5" />,
      label: "Clientes",
      href: "/admin/clients",
    },
    {
      icon: <DollarSign className="mr-2 h-5 w-5" />,
      label: "Financeiro",
      href: "/admin/finance",
    },
    {
      icon: <BarChart className="mr-2 h-5 w-5" />,
      label: "Relatórios",
      href: "/admin/reports",
    },
    {
      icon: <Scissors className="mr-2 h-5 w-5" />,
      label: "Meus Serviços",
      href: "/admin/services",
    },
    {
      icon: <UserSquare className="mr-2 h-5 w-5" />,
      label: "Profissionais",
      href: "/admin/professionals",
    },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between h-14 px-4 border-b border-border">
        <Link href="/admin" className="font-semibold text-lg">
          Salão
        </Link>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && setMobileOpen(false)}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                location === item.href
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="border-t border-border p-4 space-y-4">
        <ThemeToggle />
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {isMobile ? (
        <>
          <Button
            variant="outline"
            size="icon"
            className="fixed top-4 left-4 z-50 h-8 w-8 md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="w-[240px] p-0">
              {renderSidebarContent()}
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <div className="hidden md:flex h-screen w-[240px] flex-col fixed left-0 top-0 border-r border-border bg-background">
          {renderSidebarContent()}
        </div>
      )}
      <main className={cn(
        "flex-1 min-h-screen",
        isMobile ? "pt-16 px-4" : "md:pl-[240px] p-8"
      )}>
        {children}
      </main>
    </>
  );
}