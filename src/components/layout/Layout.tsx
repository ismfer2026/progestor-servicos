import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { TrialBanner } from './TrialBanner';
import { PaymentWarningBanner } from './PaymentWarningBanner';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isTrialActive, paymentStatus } = useAuth();

  const handleUpdatePayment = () => {
    // Abrir portal do Stripe para atualizar pagamento
    window.open('https://billing.stripe.com/p/login/test_8wM5lx0gv5FQfsceUU', '_blank');
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {isTrialActive && <TrialBanner />}
        {paymentStatus === 'pendente' && (
          <PaymentWarningBanner onUpdatePayment={handleUpdatePayment} />
        )}
        <Header />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}