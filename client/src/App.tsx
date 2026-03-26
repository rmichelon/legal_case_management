import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Navigation from "./components/Navigation";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import CaseForm from "./pages/CaseForm";
import CaseDetail from "./pages/CaseDetail";
import Clients from "./pages/Clients";
import SearchCases from "./pages/SearchCases";
import ChatBot from "./pages/ChatBot";
import Notifications from "./pages/Notifications";
import Calendar from "./pages/Calendar";
import CaseDetailPage from "./pages/CaseDetailPage";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <>
      <Navigation />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/cases/new" component={() => <CaseForm caseId={undefined} />} />
        <Route path="/cases/:id/edit" component={(props: any) => <CaseForm caseId={props.id} />} />
        <Route path="/cases/:id" component={(props: any) => <CaseDetail caseId={props.id} />} />
        <Route path="/case-detail/:caseId" component={(props: any) => <CaseDetailPage />} />
        <Route path="/search" component={SearchCases} />
        <Route path="/chat" component={ChatBot} />
        <Route path="/clients" component={Clients} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/404" component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
