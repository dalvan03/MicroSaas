// client/src/pages/auth-callback.tsx
import { useEffect } from "react";
import { useLocation } from "wouter";
import supabase from "@/lib/supabaseClient"; // Use default import
import { apiRequest } from "@/lib/queryClient";

export default function AuthCallback() {
  const [_, navigate] = useLocation();

  useEffect(() => {
    const processOAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        console.error("Error retrieving session", error);
        return;
      }
      // Envie o access_token para o endpoint de social-login no backend
      const res = await apiRequest("POST", "/api/social-login", {
        access_token: data.session.access_token,
      });
      const result = await res.json();
      console.log("Social login result:", result);
      navigate("/");
    };

    processOAuth();
  }, [navigate]);

  return <div>Processando login social...</div>;
}
