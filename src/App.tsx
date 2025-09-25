import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { Orcamentos } from "@/pages/Orcamentos";
import { NovoOrcamento } from "@/pages/NovoOrcamento";
import { Servicos } from "@/pages/Servicos";
import { NovoServico } from "@/pages/NovoServico";
import FunilVendas from "@/pages/FunilVendas";
import Agenda from "@/pages/Agenda";
import Clientes from "@/pages/Clientes";
import Estoque from "@/pages/Estoque";
import Financeiro from "@/pages/Financeiro";
import Relatorios from "@/pages/Relatorios";
import Configuracoes from "@/pages/Configuracoes";
import Contratos from "@/pages/Contratos";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return user ? <Navigate to="/" /> : <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/orcamentos" 
                element={
                  <ProtectedRoute>
                    <Orcamentos />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/orcamentos/novo" 
                element={
                  <ProtectedRoute>
                    <NovoOrcamento />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/servicos" 
                element={
                  <ProtectedRoute>
                    <Servicos />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/servicos/novo" 
                element={
                  <ProtectedRoute>
                    <NovoServico />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/funil" 
                element={
                  <ProtectedRoute>
                    <FunilVendas />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/agenda" 
                element={
                  <ProtectedRoute>
                    <Agenda />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/clientes" 
                element={
                  <ProtectedRoute>
                    <Clientes />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/estoque" 
                element={
                  <ProtectedRoute>
                    <Estoque />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/financeiro" 
                element={
                  <ProtectedRoute>
                    <Financeiro />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/relatorios" 
                element={
                  <ProtectedRoute>
                    <Relatorios />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/configuracoes" 
                element={
                  <ProtectedRoute>
                    <Configuracoes />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/contratos" 
                element={
                  <ProtectedRoute>
                    <Contratos />
                  </ProtectedRoute>
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
