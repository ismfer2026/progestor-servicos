import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, SendHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppMessageDialog } from "@/components/shared/WhatsAppMessageDialog";
import { useAuth } from "@/contexts/AuthContext";

interface EnviarOrcamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orcamento: any;
}

export function EnviarOrcamentoDialog({
  open,
  onOpenChange,
  orcamento,
}: EnviarOrcamentoDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  const getNumeroOrcamento = (id: string) => {
    const shortId = id.slice(0, 6).toUpperCase();
    return `ORC-DRAFT-${shortId}`;
  };

  const getMensagemWhatsApp = () => {
    const numero = getNumeroOrcamento(orcamento.id);
    const valorFormatado = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(orcamento.valor_total || 0);

    return `Olá ${orcamento.clientes?.nome || ""}! 

Segue o orçamento ${numero} no valor de ${valorFormatado}.

${orcamento.observacoes || ""}

Qualquer dúvida, estou à disposição!`;
  };

  const enviarEmail = async () => {
    if (!orcamento.clientes?.email) {
      toast.error("Cliente não possui e-mail cadastrado");
      return false;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke("enviar-orcamento", {
        body: {
          orcamento_id: orcamento.id,
          email_destinatario: orcamento.clientes.email,
          mensagem_adicional: orcamento.observacoes || "",
        },
      });

      if (error) throw error;

      toast.success("E-mail enviado com sucesso!");
      return true;
    } catch (error: any) {
      console.error("Erro ao enviar e-mail:", error);
      toast.error("Erro ao enviar e-mail: " + (error.message || "Erro desconhecido"));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarWhatsApp = () => {
    if (!orcamento) {
      onOpenChange(false);
      return;
    }
    if (!orcamento.clientes?.telefone) {
      toast.error("Cliente não possui telefone cadastrado");
      return;
    }
    setShowWhatsApp(true);
  };

  const handleEnviarEmail = async () => {
    if (!orcamento) {
      onOpenChange(false);
      return;
    }
    const sucesso = await enviarEmail();
    if (sucesso) {
      onOpenChange(false);
    }
  };

  const handleEnviarAmbos = async () => {
    if (!orcamento) {
      onOpenChange(false);
      return;
    }
    if (!orcamento.clientes?.telefone) {
      toast.error("Cliente não possui telefone cadastrado");
      return;
    }
    if (!orcamento.clientes?.email) {
      toast.error("Cliente não possui e-mail cadastrado");
      return;
    }

    const sucessoEmail = await enviarEmail();
    if (sucessoEmail) {
      setShowWhatsApp(true);
    }
  };

  const handleWhatsAppSent = () => {
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open && !showWhatsApp} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          {orcamento ? (
            <>
              <DialogHeader>
                <DialogTitle>Enviar Orçamento</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground mb-4">
                  <p>
                    <strong>Cliente:</strong> {orcamento.clientes?.nome || "N/A"}
                  </p>
                  {orcamento.clientes?.email && (
                    <p>
                      <strong>E-mail:</strong> {orcamento.clientes.email}
                    </p>
                  )}
                  {orcamento.clientes?.telefone && (
                    <p>
                      <strong>Telefone:</strong> {orcamento.clientes.telefone}
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleEnviarWhatsApp}
                  disabled={loading || !orcamento.clientes?.telefone}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <MessageCircle className="h-4 w-4" />
                  Enviar por WhatsApp
                </Button>

                <Button
                  onClick={handleEnviarEmail}
                  disabled={loading || !orcamento.clientes?.email}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <Mail className="h-4 w-4" />
                  Enviar por E-mail
                </Button>

                <Button
                  onClick={handleEnviarAmbos}
                  disabled={
                    loading ||
                    !orcamento.clientes?.telefone ||
                    !orcamento.clientes?.email
                  }
                  className="w-full gap-2"
                >
                  <SendHorizontal className="h-4 w-4" />
                  Enviar por Ambos
                </Button>
              </div>
            </>
          ) : (
            <div className="p-4">Carregando...</div>
          )}
        </DialogContent>
      </Dialog>

      <WhatsAppMessageDialog
        open={showWhatsApp}
        onOpenChange={setShowWhatsApp}
        recipientPhone={orcamento.clientes?.telefone}
        defaultMessage={getMensagemWhatsApp()}
        onSent={handleWhatsAppSent}
        context="orcamento"
        contextId={orcamento.id}
      />
    </>
  );
}
