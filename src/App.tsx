import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Auth from "./pages/Auth";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Scanner from "./pages/Scanner";
import Events from "./pages/Events";
import Members from "./pages/Members";
import Users from "./pages/Users";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import UploadMembers from "./pages/UploadMembers";
import CountStudents from "./pages/CountStudents";
import ComparisonReport from "./pages/ComparisonReport";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="scanner" element={<Scanner />} />
              <Route path="events" element={<Events />} />
              <Route path="members" element={<Members />} />
              <Route path="users" element={<Users />} />
              <Route path="upload-members" element={<UploadMembers />} />
              <Route path="count-students" element={<CountStudents />} />
              <Route path="comparison" element={<ComparisonReport />} />
              <Route path="reports" element={<Reports />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
