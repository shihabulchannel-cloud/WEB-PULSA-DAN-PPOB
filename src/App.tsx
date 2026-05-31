import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { routers } from "./router";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on auth or not-found errors
        if (error && typeof error === 'object') {
          const code = String((error as Record<string, unknown>).code || '');
          const status = Number((error as Record<string, unknown>).status || 0);
          if (status === 401 || status === 403 || code === 'PGRST116') return false;
        }
        return failureCount < 1;
      },
      staleTime: 60000,
      // Convert non-Error objects to proper Error instances
      throwOnError: false,
    },
  },
});

const router = createBrowserRouter(routers);

const App = () => {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <RouterProvider router={router} />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
