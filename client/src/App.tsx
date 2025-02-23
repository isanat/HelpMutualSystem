import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { WagmiConfig } from 'wagmi';
import { config } from "@/lib/web3modal";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Analytics from "@/pages/analytics";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route path="/analytics" component={Analytics}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    </WagmiConfig>
  );
}

export default App;