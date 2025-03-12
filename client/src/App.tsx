import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-toggle";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import BookingPage from "@/pages/client/booking-page";
import { ProtectedRoute } from "@/lib/protected-route";
import DashboardPage from "@/pages/admin/dashboard-page";
import SchedulePage from "@/pages/admin/schedule-page";
import ClientsPage from "@/pages/admin/clients-page";
import FinancePage from "@/pages/admin/finance-page";
import ReportsPage from "@/pages/admin/reports-page";
import ServicesPage from "@/pages/admin/services-page";
import ProfessionalsPage from "@/pages/admin/professionals-page";
import ProfessionalPerformancePage from "@/pages/admin/professional-performance-page";
import LandingPage from "@/pages/landing-page";

function Router() {
  return (
    <Switch>
      {/* Landing Page */}
      <Route path="/" component={LandingPage} />

      {/* Auth Route */}
      <Route path="/auth" component={AuthPage} />

      {/* Client Routes */}
      <ProtectedRoute path="/booking" component={BookingPage} />

      {/* Admin Routes */}
      <ProtectedRoute path="/admin" component={DashboardPage} />
      <ProtectedRoute path="/admin/schedule" component={SchedulePage} />
      <ProtectedRoute path="/admin/clients" component={ClientsPage} />
      <ProtectedRoute path="/admin/finance" component={FinancePage} />
      <ProtectedRoute path="/admin/reports" component={ReportsPage} />
      <ProtectedRoute path="/admin/services" component={ServicesPage} />
      <ProtectedRoute path="/admin/professionals" component={ProfessionalsPage} />
      <ProtectedRoute path="/admin/professional-performance" component={ProfessionalPerformancePage} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;