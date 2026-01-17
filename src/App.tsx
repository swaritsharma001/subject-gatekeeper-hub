import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index";
import Subject from "./pages/Subject";
import Chapter from "./pages/Chapter";
import Lecture from "./pages/Lecture";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthModal />
          <Navbar />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/subject/:slug" element={<Subject />} />
            <Route path="/subject/:slug/chapter/:chapterId" element={<Chapter />} />
            <Route path="/subject/:slug/chapter/:chapterId/lecture/:lectureId" element={<Lecture />} />
            <Route path="/subject/:slug/lecture/:lectureId" element={<Lecture />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
