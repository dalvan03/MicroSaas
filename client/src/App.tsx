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
import TransactionsPage from "@/pages/admin/transactions-page";
import LandingPage from "@/pages/landing-page";
import AuthCallback from "./pages/auth-callback";

function Router() {
  return (
    <Switch>
      {/* Landing Page */}
      <Route path="/" component={LandingPage} />

      {/* Auth Route */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/auth/callback" component={AuthCallback} />

      {/* Client Routes */}
      <Route path="/booking" component={BookingPage} />

      {/* Admin Routes */}
      <Route path="/admin" component={DashboardPage} />
      <Route path="/admin/schedule" component={SchedulePage} />
      <Route path="/admin/clients" component={ClientsPage} />
      <Route path="/admin/finance" component={FinancePage} />
      <Route path="/admin/transactions" component={TransactionsPage} />
      <Route path="/admin/reports" component={ReportsPage} />
      <Route path="/admin/services" component={ServicesPage} />
      <Route path="/admin/professionals" component={ProfessionalsPage} />
      <Route path="/admin/professional-performance" component={ProfessionalPerformancePage} />

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