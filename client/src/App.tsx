/**
 * Main Application Component
 * 
 * This is the root component that sets up the application structure with:
 * - Client-side routing for different pages
 * - React Query for server state management
 * - UI providers for tooltips and notifications
 * - Global application context and providers
 */

import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Chat from "@/pages/chat";
import Admin from "@/pages/admin";
import Database from "@/pages/database";
import NotFound from "@/pages/not-found";

/**
 * Application Router Component
 * 
 * Defines the route structure for the application:
 * - "/" - Main chat interface
 * - "/admin" - Admin dashboard for user management
 * - "/database" - Database statistics and monitoring
 * - Fallback to 404 page for undefined routes
 */
function Router() {
  return (
    <Switch>
      <Route path="/" component={Chat} />
      <Route path="/admin" component={Admin} />
      <Route path="/database" component={Database} />
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * Root Application Component
 * 
 * Sets up the application providers and context:
 * - QueryClientProvider: Manages server state and caching
 * - TooltipProvider: Enables tooltips throughout the app
 * - Toaster: Provides notification system
 * - Router: Handles client-side navigation
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
