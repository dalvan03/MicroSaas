
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";

export function ProtectedRoute({ component: Component, path, ...rest }) {
  const { user, isLoading } = useAuth();
  const [_, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate("/auth");
      } else {
        // Verificar se o usuário está acessando a página correta baseado em seu papel
        const isAdminRoute = path?.startsWith("/admin");
        const isClientRoute = path === "/booking";

        if (user.role === "authenticated" && isAdminRoute) {
          navigate("/booking");
        } else if (user.role === "admin" && isClientRoute) {
          navigate("/admin");
        }
      }
    }
  }, [user, isLoading, navigate, path]);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return <Component {...rest} />
}
