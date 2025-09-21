import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import OrderTracker from "@/pages/OrderTracker";

// Safe background logo import
  // Safe background logo import
  const bgLogos = import.meta.glob("../../attached_assets/1000063409_1758280754249.png", {
    eager: true,
    query: "?url",
    import: "default"
  });
});

});
const bgLogoUrl = Object.values(bgLogos)[0] as string | undefined;

function Router() {
  return (
    <Switch>
      <Route path="/" component={OrderTracker} />
      <Route path="*" component={OrderTracker} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div
            className="site-background"
            style={
              {
                "--bg-logo": bgLogoUrl ? `url(${bgLogoUrl})` : "none",
              } as React.CSSProperties & { "--bg-logo": string }
            }
          />
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
