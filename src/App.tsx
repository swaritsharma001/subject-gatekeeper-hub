import { useState, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import AuthModal from "@/components/AuthModal";
import Navbar from "@/components/Navbar";
import SplashScreen from "@/components/SplashScreen";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import Index from "./pages/Index";
import Subject from "./pages/Subject";
import Chapter from "./pages/Chapter";
import Lecture from "./pages/Lecture";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [splashComplete, setSplashComplete] = useState(false);

  useEffect(() => {
    // Check if splash was already shown this session
    const splashShown = sessionStorage.getItem('splashShown');
    if (splashShown) {
      setShowSplash(false);
      setSplashComplete(true);
    }
  }, []);

  const handleSplashComplete = () => {
    setSplashComplete(true);
    setShowSplash(false);
    sessionStorage.setItem('splashShown', 'true');
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="studyx-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <PWAInstallPrompt />
            {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
            <BrowserRouter>
              <AuthModal />
              <Navbar />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/subject/:slug" element={<Subject />} />
                <Route path="/subject/:slug/chapter/:chapterId" element={<Chapter />} />
                <Route path="/subject/:slug/chapter/:chapterId/lecture/:lectureId" element={<Lecture />} />
                <Route path="/subject/:slug/lecture/:lectureId" element={<Lecture />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            <Analytics />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
