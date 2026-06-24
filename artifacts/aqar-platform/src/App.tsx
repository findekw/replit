import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useLayoutEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/AuthContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Properties from "@/pages/Properties";
import PropertyDetail from "@/pages/PropertyDetail";
import Offices from "@/pages/Offices";
import Plans from "@/pages/Plans";
import Dashboard from "@/pages/Dashboard";
import DashboardListings from "@/pages/DashboardListings";
import DashboardLeads from "@/pages/DashboardLeads";
import DashboardAnalytics from "@/pages/DashboardAnalytics";
import DashboardAddListing from "@/pages/DashboardAddListing";
import DashboardEditListing from "@/pages/DashboardEditListing";
import DashboardLanding from "@/pages/DashboardLanding";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AdminLogin from "@/pages/AdminLogin";
import ForgotPassword from "@/pages/ForgotPassword";
import Admin from "@/pages/Admin";
import AdminAnalytics from "@/pages/AdminAnalytics";
import OfficePage from "@/pages/OfficePage";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Disclaimer from "@/pages/Disclaimer";
import Contact from "@/pages/Contact";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

function ScrollToTop() {
  const [location] = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  }, [location]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/properties" component={Properties} />
      <Route path="/properties/:id" component={PropertyDetail} />
      <Route path="/offices" component={Offices} />
      <Route path="/plans" component={Plans} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/listings" component={DashboardListings} />
      <Route path="/dashboard/listings/new" component={DashboardAddListing} />
      <Route path="/dashboard/listings/:id/edit" component={DashboardEditListing} />
      <Route path="/dashboard/leads" component={DashboardLeads} />
      <Route path="/dashboard/analytics" component={DashboardAnalytics} />
      <Route path="/dashboard/landing" component={DashboardLanding} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/office/login" component={Login} />
      <Route path="/office/register" component={Register} />
      <Route path="/office/forgot" component={ForgotPassword} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/disclaimer" component={Disclaimer} />
      <Route path="/contact" component={Contact} />
      <Route path="/office/:slug" component={OfficePage} />
      <Route path="/:slug" component={OfficePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <ScrollToTop />
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
