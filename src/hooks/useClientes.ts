import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { ClientRecord, JourneyStage, ClientJourneyHistory, ClientClinicalProfile, ClientFamilyMember, SessionRecord } from '@/types/client';
import { useToast } from '@/hooks/use-toast';

export function useClientes(filters?: {
  search?: string;
  stage?: JourneyStage | 'todos';
  tags?: string[];
}) {
  const { professional } = useAuth();
  const profId = professional?.id;

  return useQuery({
    queryKey: ['clientes', profId, filters],
    queryFn: async () => {
      if (!profId) return [];
      let q = supabase
        .from('clients')
        .select('*')
        .eq('professional_id', profId)
        .order('last_contact_at', { ascending: false, nullsFirst: false });

      if (filters?.search) {
        q = q.or(`name.ilike.%${filters.search}%,phone_whatsapp.ilike.%${filters.search}%`);
      }
      if (filters?.stage && filters.stage !== 'todos') {
        q = q.eq('journey_stage', filters.stage);
      }
      if (filters?.tags && filters.tags.length > 0) {
        q = q.overlaps('tags', filters.tags);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as ClientRecord[];
    },
    enabled: !!profId,
  });
}

export function useClienteDetail(clientId: string | null) {
  return useQuery({
    queryKey: ['cliente', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const { data, error } = await supabase.from('clients').select('*').eq('id', clientId).single();
      if (error) throw error;
      return data as ClientRecord;
    },
    enabled: !!clientId,
  });
}

export function useClientJourney(clientId: string | null) {
  return useQuery({
    queryKey: ['cliente-journey', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('client_journey_history')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ClientJourneyHistory[];
    },
    enabled: !!clientId,
  });
}

export function useClientClinical(clientId: string | null) {
  return useQuery({
    queryKey: ['cliente-clinical', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const { data, error } = await supabase
        .from('client_clinical_profiles')
        .select('*')
        .eq('client_id', clientId)
        .single();
      if (error) return null;
      return data as ClientClinicalProfile;
    },
    enabled: !!clientId,
  });
}

export function useClientFamily(clientId: string | null) {
  return useQuery({
    queryKey: ['cliente-family', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('client_family_members')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ClientFamilyMember[];
    },
    enabled: !!clientId,
  });
}

export function useClientSessions(clientId: string | null) {
  return useQuery({
    queryKey: ['cliente-sessions', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('client_id', clientId)
        .order('session_date', { ascending: false });
      if (error) throw error;
      return (data || []) as SessionRecord[];
    },
    enabled: !!clientId,
  });
}

export function useMoveClientStage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ clientId, toStage, changedBy = 'manual' }: { clientId: string; toStage: JourneyStage; changedBy?: string }) => {
      const { error } = await supabase.rpc('move_client_stage', {
        p_client_id: clientId,
        p_new_stage: toStage,
        p_changed_by: changedBy,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      const stageLabels: Record<string, string> = {
        lead: 'Lead', agendado: 'Agendado', em_tratamento: 'Em Tratamento',
        pos_tratamento: 'Pós-Tratamento', cliente_fiel: 'Cliente Fiel', inativo: 'Inativo',
      };
      toast({ title: `Cliente movido para ${stageLabels[vars.toStage]}` });
      qc.invalidateQueries({ queryKey: ['clientes'] });
      qc.invalidateQueries({ queryKey: ['cliente', vars.clientId] });
      qc.invalidateQueries({ queryKey: ['cliente-journey', vars.clientId] });
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao mover cliente', description: err.message, variant: 'destructive' });
    },
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (client: Partial<ClientRecord>) => {
      const payload = { ...client } as Partial<ClientRecord>;

      // ensure professional_id is always populated; fetch from professionals table if missing
      if (!payload.professional_id) {
        if (!user) {
          throw new Error('Usuário não autenticado');
        }
        const { data: prof, error: profErr } = await supabase
          .from('professionals')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();
        if (profErr || !prof) {
          throw profErr || new Error('Profissional não encontrado');
        }
        payload.professional_id = prof.id;
      }

      const { data, error } = await supabase.from('clients').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Cliente cadastrado com sucesso' });
      qc.invalidateQueries({ queryKey: ['clientes'] });
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao cadastrar cliente', description: err.message, variant: 'destructive' });
    },
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClientRecord> & { id: string }) => {
      const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({ title: 'Cliente atualizado com sucesso' });
      qc.invalidateQueries({ queryKey: ['clientes'] });
      qc.invalidateQueries({ queryKey: ['cliente', data.id] });
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao atualizar cliente', description: err.message, variant: 'destructive' });
    },
  });
}

export function useUpdateClinicalProfile() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ clientId, ...updates }: { clientId: string; skin_type?: string | null; main_complaints?: string | null; allergies?: string | null; contraindications?: string | null }) => {
      const { error } = await supabase
        .from('client_clinical_profiles')
        .upsert({ client_id: clientId, ...updates }, { onConflict: 'client_id' });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast({ title: 'Perfil clínico atualizado' });
      qc.invalidateQueries({ queryKey: ['cliente-clinical', vars.clientId] });
    },
    onError: (err: Error) => {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    },
  });
}

export function useAddFamilyMember() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (member: Omit<ClientFamilyMember, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('client_family_members').insert(member);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast({ title: 'Familiar adicionado' });
      qc.invalidateQueries({ queryKey: ['cliente-family', vars.client_id] });
    },
    onError: (err: Error) => {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    },
  });
}
