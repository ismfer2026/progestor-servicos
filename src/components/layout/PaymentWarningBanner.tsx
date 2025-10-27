import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentWarningBannerProps {
  onUpdatePayment?: () => void;
}

export function PaymentWarningBanner({ onUpdatePayment }: PaymentWarningBannerProps) {
  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-destructive/10 border-destructive">
      <AlertTriangle className="h-4 w-4 text-destructive" />
      <AlertDescription className="flex items-center justify-between w-full">
        <span className="text-destructive font-medium">
          <strong>Pagamento pendente:</strong> Houve um problema com a cobrança da sua assinatura. 
          Por favor, atualize suas informações de pagamento para continuar usando o sistema.
        </span>
        <Button 
          size="sm" 
          variant="destructive"
          onClick={onUpdatePayment}
        >
          Atualizar Pagamento
        </Button>
      </AlertDescription>
    </Alert>
  );
}