import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MessageCircle, Mail, Send } from "lucide-react";

interface Orcamento {
  id: string;
  cliente_id: string;
  usuario_id: string;
  valor_total: number;
  status: string;
  criado_em: string;
  data_envio?: string;
  pdf_gerado: boolean;
  servicos: any;
  clientes?: {
    nome: string;
    email: string;
    telefone?: string;
  };
  usuarios?: {
    nome: string;
  };
}

interface EnviarOrcamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orcamento: Orcamento | null;
  onSent?: () => void;
}

export function EnviarOrcamentoDialog({
  open,
  onOpenChange,
  orcamento,
  onSent,
}: EnviarOrcamentoDialogProps) {
  const { user } = useAuth();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleEnviarWhatsApp = () => {
    if (!orcamento) {
      onOpenChange(false);
      return;
    }

    const telefone = orcamento.clientes?.telefone;
    if (!telefone) {
      toast.error("Cliente sem telefone cadastrado");
      return;
    }

    // 1. Ações SÍNCRONAS: abrir WhatsApp
    const mensagem = `Olá ${orcamento.clientes?.nome}! Segue o orçamento solicitado.\n\nOrçamento #${orcamento.id.slice(0, 8)}\nValor Total: ${formatCurrency(orcamento.valor_total || 0)}`;
    const url = `https://wa.me/${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');

    // 2. Fechar dialog IMEDIATAMENTE
    onOpenChange(false);

    // 3. Toast de sucesso
    toast.success("WhatsApp aberto!");

    // 4. Operações ASSÍNCRONAS em background
    setTimeout(async () => {
      try {
        // Salvar log de envio
        await supabase.from('logs_envio').insert({
          orcamento_id: orcamento.id,
          empresa_id: user!.empresa_id,
          enviado_por: user!.id,
          destinatario: telefone,
          tipo_envio: 'whatsapp',
          status: 'enviado'
        });

        // Atualizar status do orçamento
        await supabase
          .from('orcamentos')
          .update({ status: 'Enviado', data_envio: new Date().toISOString() })
          .eq('id', orcamento.id);

        // Notificar componente pai para atualizar lista
        if (onSent) {
          onSent();
        }
      } catch (error) {
        console.error("Erro em operações de background:", error);
      }
    }, 100);
  };

  const handleEnviarEmail = () => {
    if (!orcamento) {
      onOpenChange(false);
      return;
    }

    const clienteEmail = orcamento.clientes?.email;
    if (!clienteEmail) {
      toast.error("Cliente sem email cadastrado");
      return;
    }

    // 1. Fechar dialog IMEDIATAMENTE
    onOpenChange(false);

    // 2. Toast informativo
    toast.info("Enviando orçamento por email...");

    // 3. Operações ASSÍNCRONAS em background
    setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('enviar-orcamento', {
          body: {
            orcamento_id: orcamento.id,
            email_destinatario: clienteEmail,
            mensagem_adicional: `Olá ${orcamento.clientes!.nome}! Segue o orçamento solicitado.`,
          }
        });

        if (error) {
          console.error("Erro ao enviar email:", error);
          toast.error("Erro ao enviar orçamento");
          return;
        }

        if (data?.error) {
          console.error("Erro da edge function:", data.error);
          toast.error(data.error);
          return;
        }

        toast.success("Orçamento enviado por email!");

        // Atualizar status do orçamento
        await supabase
          .from('orcamentos')
          .update({ status: 'Enviado', data_envio: new Date().toISOString() })
          .eq('id', orcamento.id);

        // Notificar componente pai para atualizar lista
        if (onSent) {
          onSent();
        }
      } catch (error) {
        console.error("Erro ao enviar email:", error);
        toast.error("Erro ao enviar orçamento");
      }
    }, 100);
  };

  const handleEnviarAmbos = () => {
    if (!orcamento) {
      onOpenChange(false);
      return;
    }

    const telefone = orcamento.clientes?.telefone;
    const clienteEmail = orcamento.clientes?.email;

    if (!telefone && !clienteEmail) {
      toast.error("Cliente sem telefone ou email cadastrado");
      return;
    }

    // 1. Ações SÍNCRONAS: abrir WhatsApp se tiver telefone
    if (telefone) {
      const mensagem = `Olá ${orcamento.clientes?.nome}! Segue o orçamento solicitado.\n\nOrçamento #${orcamento.id.slice(0, 8)}\nValor Total: ${formatCurrency(orcamento.valor_total || 0)}`;
      const url = `https://wa.me/${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
      window.open(url, '_blank');
    }

    // 2. Fechar dialog IMEDIATAMENTE
    onOpenChange(false);

    // 3. Toast informativo
    if (clienteEmail) {
      toast.info("Enviando orçamento...");
    } else {
      toast.success("WhatsApp aberto!");
    }

    // 4. Operações ASSÍNCRONAS em background
    setTimeout(async () => {
      try {
        // Enviar email se tiver
        if (clienteEmail) {
          const { data, error } = await supabase.functions.invoke('enviar-orcamento', {
            body: {
              orcamento_id: orcamento.id,
              email_destinatario: clienteEmail,
              mensagem_adicional: `Olá ${orcamento.clientes?.nome}! Segue o orçamento solicitado.`,
            }
          });

          if (!error && !data?.error) {
            toast.success("Orçamento enviado!");
          }
        }

        // Atualizar status do orçamento
        await supabase
          .from('orcamentos')
          .update({ status: 'Enviado', data_envio: new Date().toISOString() })
          .eq('id', orcamento.id);

        // Notificar componente pai para atualizar lista
        if (onSent) {
          onSent();
        }
      } catch (error) {
        console.error("Erro ao enviar:", error);
      }
    }, 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {orcamento ? (
          <>
            <DialogHeader>
              <DialogTitle>Enviar Orçamento</DialogTitle>
              <DialogDescription>
                Escolha como deseja enviar o orçamento para {orcamento.clientes?.nome}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Button
                onClick={handleEnviarWhatsApp}
                className="w-full gap-2"
                variant="default"
                disabled={!orcamento.clientes?.telefone}
              >
                <MessageCircle className="h-4 w-4" />
                Enviar por WhatsApp
              </Button>
              <Button
                onClick={handleEnviarEmail}
                className="w-full gap-2"
                variant="outline"
                disabled={!orcamento.clientes?.email}
              >
                <Mail className="h-4 w-4" />
                Enviar por Email
              </Button>
              <Button
                onClick={handleEnviarAmbos}
                className="w-full gap-2"
                variant="secondary"
                disabled={!orcamento.clientes?.telefone && !orcamento.clientes?.email}
              >
                <Send className="h-4 w-4" />
                Enviar por Ambos
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
