import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Mail, MessageSquare, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WhatsAppMessageDialog } from "@/components/shared/WhatsAppMessageDialog";

interface EnviarOrcamentoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orcamento: any;
}

export function EnviarOrcamentoSheet({
  open,
  onOpenChange,
  orcamento,
}: EnviarOrcamentoSheetProps) {
  const [loading, setLoading] = useState(false);
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);

  const getNumeroOrcamento = (id: string) => {
    return `#${id.substring(0, 8).toUpperCase()}`;
  };

  const getMensagemWhatsApp = () => {
    if (!orcamento) return "";
    const numero = getNumeroOrcamento(orcamento.id);
    return `Olá! Segue o orçamento ${numero} no valor de ${new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(orcamento.valor_total || 0)}. Qualquer dúvida estou à disposição!`;
  };

  const enviarEmail = async () => {
    if (!orcamento?.cliente_id) {
      toast.error("Cliente não encontrado");
      return false;
    }

    const { data: cliente } = await supabase
      .from("clientes")
      .select("email")
      .eq("id", orcamento.cliente_id)
      .single();

    if (!cliente?.email) {
      toast.error("Cliente não possui email cadastrado");
      return false;
    }

    const { error } = await supabase.functions.invoke("enviar-orcamento", {
      body: {
        orcamento_id: orcamento.id,
        email_destinatario: cliente.email,
      },
    });

    if (error) {
      console.error("Erro ao enviar email:", error);
      toast.error("Erro ao enviar orçamento por email");
      return false;
    }

    toast.success("Orçamento enviado por email com sucesso!");
    return true;
  };

  const handleEnviarWhatsApp = () => {
    if (!orcamento) return;
    
    const telefone = orcamento.clientes?.telefone || orcamento.clientes?.telefones?.[0];
    if (!telefone) {
      toast.error("Cliente não possui telefone cadastrado");
      return;
    }
    
    setWhatsappDialogOpen(true);
  };

  const handleEnviarEmail = async () => {
    setLoading(true);
    const sucesso = await enviarEmail();
    setLoading(false);
    if (sucesso) {
      onOpenChange(false);
    }
  };

  const handleEnviarAmbos = async () => {
    setLoading(true);
    const sucesso = await enviarEmail();
    setLoading(false);
    
    if (sucesso) {
      handleEnviarWhatsApp();
      onOpenChange(false);
    }
  };

  const telefone = orcamento?.clientes?.telefone || orcamento?.clientes?.telefones?.[0] || "";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Enviar Orçamento</SheetTitle>
            <SheetDescription>
              Escolha como deseja enviar o orçamento para o cliente
            </SheetDescription>
          </SheetHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Enviando orçamento...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 mt-6">
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm font-medium">Cliente</p>
                <p className="text-sm text-muted-foreground">
                  {orcamento?.clientes?.nome || "Nome não disponível"}
                </p>
                {orcamento?.clientes?.email && (
                  <p className="text-xs text-muted-foreground">
                    Email: {orcamento.clientes.email}
                  </p>
                )}
                {telefone && (
                  <p className="text-xs text-muted-foreground">
                    Telefone: {telefone}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleEnviarWhatsApp}
                  className="w-full"
                  variant="outline"
                  disabled={!telefone}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Enviar por WhatsApp
                </Button>

                <Button
                  onClick={handleEnviarEmail}
                  className="w-full"
                  variant="outline"
                  disabled={!orcamento?.clientes?.email}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar por Email
                </Button>

                <Button
                  onClick={handleEnviarAmbos}
                  className="w-full"
                  disabled={!telefone || !orcamento?.clientes?.email}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Enviar por Ambos
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <WhatsAppMessageDialog
        open={whatsappDialogOpen}
        onOpenChange={setWhatsappDialogOpen}
        recipientPhone={telefone}
        defaultMessage={getMensagemWhatsApp()}
      />
    </>
  );
}
