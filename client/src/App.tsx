import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import UniverseBuilder from "@/pages/universe-builder";
import AuthLayout from "@/components/layout/auth-layout";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard">
        <AuthLayout>
          <Dashboard />
        </AuthLayout>
      </Route>
      <Route path="/profile">
        <AuthLayout>
          <Profile />
        </AuthLayout>
      </Route>
      <Route path="/universe-builder">
        <AuthLayout>
          <UniverseBuilder />
        </AuthLayout>
      </Route>
      <Route path="/" component={Login} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
