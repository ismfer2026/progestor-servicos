import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

export function TrialBanner() {
  const { trialDaysLeft } = useAuth();

  if (!trialDaysLeft || trialDaysLeft <= 0) return null;

  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-trial-bg border-trial-border">
      <AlertTriangle className="h-4 w-4 text-trial-text" />
      <AlertDescription className="flex items-center justify-between w-full">
        <span className="text-trial-text font-medium">
          <strong>Período de teste:</strong> {trialDaysLeft} {trialDaysLeft === 1 ? 'dia restante' : 'dias restantes'}. 
          Assine agora para continuar usando todas as funcionalidades!
        </span>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-primary hover:bg-primary-hover">
            Assinar Agora
          </Button>
          <Button variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}