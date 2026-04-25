import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";

// Lazy imports for pages
import Home from "./pages/Home";
import Sessions from "./pages/Sessions";
import SessionDetail from "./pages/SessionDetail";
import Avatars from "./pages/Avatars";
import Aides from "./pages/Aides";
import FusionEngine from "./pages/FusionEngine";
import BurnoutMonitor from "./pages/BurnoutMonitor";
import Analytics from "./pages/Analytics";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/sessions" component={Sessions} />
        <Route path="/sessions/:sessionId" component={SessionDetail} />
        <Route path="/avatars" component={Avatars} />
        <Route path="/aides" component={Aides} />
        <Route path="/fusion" component={FusionEngine} />
        <Route path="/burnout" component={BurnoutMonitor} />
        <Route path="/analytics" component={Analytics} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
