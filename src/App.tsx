import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { routers } from "./router";

// Normalize any thrown value to a proper Error instance
function toError(e: unknown): Error {
  if (e instanceof Error) return e;
  if (typeof e === 'object' && e !== null) {
    const obj = e as Record<string, unknown>;
    const msg = String(obj.message || obj.msg || obj.error_description || JSON.stringify(e));
    return new Error(msg);
  }
  return new Error(String(e));
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const err = toError(error);
      // Only log in development, and only once per query key
      if (import.meta.env.DEV) {
        console.warn(`[Query failed] ${String(query.queryKey[0])}: ${err.message}`);
      }
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error && typeof error === 'object') {
          const code = String((error as Record<string, unknown>).code || '');
          const status = Number((error as Record<string, unknown>).status || 0);
          if (status === 401 || status === 403 || code === 'PGRST116') return false;
        }
        return failureCount < 1;
      },
      staleTime: 60000,
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
