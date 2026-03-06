import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useCreateClient, useUpdateClient } from '@/hooks/useClientes';
import { useToast } from '@/hooks/use-toast';
import { JOURNEY_STAGES, GENDER_LABELS, SOURCE_LABELS, SUGGESTED_TAGS, type ClientRecord, type JourneyStage, type Gender, type ClientSource } from '@/types/client';
import { maskWhatsApp, maskCPF } from '@/lib/formatters';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  client?: ClientRecord | null;
}

const emptyForm = {
  name: '', email: '', phone_whatsapp: '', birth_date: '', gender: '' as string,
  cpf: '', source: '' as string, first_complaint: '', journey_stage: 'lead' as JourneyStage,
  tags: [] as string[], notes: '', referred_by_client_id: '',
};

export function ClienteDrawer({ open, onClose, client }: Props) {
  const { professional, user } = useAuth();
  const { toast } = useToast();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const [form, setForm] = useState(emptyForm);
  const [tagInput, setTagInput] = useState('');

  const isEdit = !!client;

  useEffect(() => {
    if (client) {
      setForm({
        name: client.name || '',
        email: client.email || '',
        phone_whatsapp: client.phone_whatsapp || '',
        birth_date: client.birth_date || '',
        gender: client.gender || '',
        cpf: client.cpf || '',
        source: client.source || '',
        first_complaint: client.first_complaint || '',
        journey_stage: client.journey_stage || 'lead',
        tags: client.tags || [],
        notes: client.notes || '',
        referred_by_client_id: client.referred_by_client_id || '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [client, open]);

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }));
    setTagInput('');
  };

  const removeTag = (tag: string) => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));

  const handleSubmit = async () => {
    if (!form.name || !form.phone_whatsapp) {
      toast({ title: 'Preencha nome e WhatsApp', variant: 'destructive' });
      return;
    }

    // when creating a new client we need to ensure we have a valid professional_id
    let profId: string | undefined;

    if (!isEdit) {
      if (!user) {
        toast({ title: 'Erro: usuário não autenticado', variant: 'destructive' });
        return;
      }

      // fetch the professional record associated with the current user
      const { data: prof, error: profErr } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (profErr || !prof) {
        toast({
          title: 'Erro ao localizar profissional',
          description: profErr?.message || 'Faça logout e login novamente.',
          variant: 'destructive',
        });
        return;
      }

      profId = prof.id;
    }

    const payload = {
      name: form.name,
      full_name: form.name,
      email: form.email || null,
      phone_whatsapp: form.phone_whatsapp.replace(/\D/g, ''),
      birth_date: form.birth_date || null,
      gender: (form.gender || null) as Gender | null,
      cpf: form.cpf ? form.cpf.replace(/\D/g, '') : null,
      source: (form.source || null) as ClientSource | null,
      first_complaint: form.first_complaint || null,
      journey_stage: form.journey_stage,
      tags: form.tags,
      notes: form.notes || null,
      avatar_url: client?.avatar_url || null,
    };

    if (isEdit && client) {
      updateClient.mutate({ id: client.id, ...payload }, { onSuccess: () => onClose() });
    } else {
      createClient.mutate(
        { ...payload, professional_id: profId ?? professional?.id! },
        { onSuccess: () => onClose() }
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar Cliente' : 'Novo Cliente'}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Informações Básicas */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Informações Básicas</h3>
            <div>
              <Label>Nome completo *</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <Label>WhatsApp *</Label>
              <Input value={maskWhatsApp(form.phone_whatsapp)} onChange={e => set('phone_whatsapp', e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <Label>Data de nascimento</Label>
              <Input type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} />
            </div>
            <div>
              <Label>Gênero</Label>
              <Select value={form.gender} onValueChange={v => set('gender', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(GENDER_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>CPF</Label>
              <Input value={maskCPF(form.cpf)} onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" />
            </div>
          </section>

          {/* Como chegou */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Como chegou</h3>
            <Select value={form.source} onValueChange={v => set('source', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {Object.entries(SOURCE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <div>
              <Label>Primeira queixa ou objetivo</Label>
              <Textarea value={form.first_complaint} onChange={e => set('first_complaint', e.target.value)} />
            </div>
          </section>

          {/* Estágio */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Estágio Inicial</h3>
            <Select value={form.journey_stage} onValueChange={v => set('journey_stage', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {JOURNEY_STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </section>

          {/* Tags */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {form.tags.map(t => (
                <span key={t} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {t}
                  <button onClick={() => removeTag(t)}><X size={12} /></button>
                </span>
              ))}
            </div>
            <Input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(tagInput))}
              placeholder="Pressione Enter para adicionar"
            />
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_TAGS.filter(t => !form.tags.includes(t)).map(t => (
                <button
                  key={t}
                  onClick={() => addTag(t)}
                  className="text-[11px] px-2 py-0.5 rounded-full border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  + {t}
                </button>
              ))}
            </div>
          </section>

          {/* Observações */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Observações</h3>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} />
          </section>

          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleSubmit} disabled={!form.name || !form.phone_whatsapp || createClient.isPending || updateClient.isPending} className="flex-1">
              {isEdit ? 'Salvar alterações' : 'Cadastrar cliente'}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
