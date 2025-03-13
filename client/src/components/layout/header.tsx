import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Scissors, User, Menu } from "lucide-react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header({ transparent = false }) {
  const { user, logoutMutation } = useAuth();
  const isMobile = useMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className={`absolute top-6 z-30 w-full ${transparent ? 'bg-transparent border-none' : 'border-b bg-background shadow-sm'}`}>
      <div className="px-4 sm:px-6 md:px-8 mx-auto flex h-14 sm:h-16 items-center justify-between relative">

        <div className="flex-1">
          {!transparent && (
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <Scissors className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                <span className="text-base sm:text-xl font-semibold truncate">Salão de Beleza</span>
              </div>
            </Link>
          )}
        </div>
        
        {/* Centered Logo */}
        {transparent && (
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center">
            <Link href="/">
              <div className="flex flex-col items-center gap-1 cursor-pointer">
                <Scissors className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                <span className="text-base sm:text-xl font-semibold text-white">Salão de Beleza</span>
              </div>
            </Link>
          </div>
        )}
        
        <div className="flex-1 flex justify-end">
          <div className="flex items-center gap-2 sm:gap-4">
          {isMobile && !user && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/auth">Entrar</Link>
            </Button>
          )}

          {!isMobile && !user && (
            <Button variant="default" className="bg-purple-700 hover:bg-purple-800" asChild>
              <Link href="/auth">Entrar / Cadastrar</Link>
            </Button>
          )}

          <ThemeToggle />

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full">
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                    {user.profilePicture ? (
                      <AvatarImage src={user.profilePicture} alt={user.name} />
                    ) : (
                      <AvatarFallback>
                        <User className="h-3 w-3 sm:h-4 sm:w-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name || user.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Admin Dashboard</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout} disabled={logoutMutation.isPending}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{logoutMutation.isPending ? "Saindo..." : "Sair"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          </div>
        </div>
      </div>
    </header>
  );
}