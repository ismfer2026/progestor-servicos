import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClienteAvatar } from './ClienteAvatar';
import { StageBadge } from './StageBadge';
import { StageSelector } from './StageSelector';
import { useClientJourney, useClientSessions, useClientClinical, useClientFamily, useMoveClientStage, useUpdateClinicalProfile, useAddFamilyMember } from '@/hooks/useClientes';
import { formatLastContact, formatCurrency, formatDate, whatsappLink } from '@/lib/formatters';
import { STAGE_MAP, RELATIONSHIP_OPTIONS, type ClientRecord, type JourneyStage } from '@/types/client';
import { MessageCircle, Mail, Pencil, Calendar, Users, Clock, DollarSign, Package, FileText } from 'lucide-react';

interface Props {
  client: ClientRecord;
  onEdit: () => void;
}

export function ClienteDetailPanel({ client, onEdit }: Props) {
  const { data: journey = [] } = useClientJourney(client.id);
  const { data: sessions = [] } = useClientSessions(client.id);
  const { data: clinical } = useClientClinical(client.id);
  const { data: family = [] } = useClientFamily(client.id);
  const moveStage = useMoveClientStage();
  const updateClinical = useUpdateClinicalProfile();
  const addFamily = useAddFamilyMember();

  const [editingClinical, setEditingClinical] = useState(false);
  const [clinicalForm, setClinicalForm] = useState({ skin_type: '', main_complaints: '', allergies: '', contraindications: '' });
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [familyForm, setFamilyForm] = useState({ name: '', relationship: 'Cônjuge', birth_date: '', health_notes: '' });

  const totalSessions = sessions.length;
  const serviceRevenue = sessions.reduce((a, s) => a + (s.service_revenue || 0), 0);
  const productRevenue = sessions.reduce((a, s) => a + (s.product_revenue || 0), 0);
  const daysSinceContact = client.last_contact_at
    ? Math.floor((Date.now() - new Date(client.last_contact_at).getTime()) / 86400000)
    : null;

  const handleMoveStage = (stage: JourneyStage) => {
    if (stage !== client.journey_stage) {
      moveStage.mutate({ clientId: client.id, toStage: stage });
    }
  };

  const saveClinical = () => {
    updateClinical.mutate({ clientId: client.id, ...clinicalForm });
    setEditingClinical(false);
  };

  const saveFamily = () => {
    if (!familyForm.name) return;
    addFamily.mutate({
      client_id: client.id,
      name: familyForm.name,
      relationship: familyForm.relationship,
      birth_date: familyForm.birth_date || null,
      health_notes: familyForm.health_notes || null,
    });
    setFamilyForm({ name: '', relationship: 'Cônjuge', birth_date: '', health_notes: '' });
    setShowFamilyForm(false);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <ClienteAvatar name={client.name} avatarUrl={client.avatar_url} size="lg" />
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-foreground truncate">{client.name}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <StageBadge stage={client.journey_stage} />
            {client.tags?.map(t => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Button size="sm" variant="outline" onClick={onEdit}><Pencil size={14} /> Editar</Button>
            <Button size="sm" variant="outline" disabled><Calendar size={14} /> Nova Sessão</Button>
            {client.phone_whatsapp && (
              <a href={whatsappLink(client.phone_whatsapp)} target="_blank" rel="noopener noreferrer">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600"><MessageCircle size={16} /></Button>
              </a>
            )}
            {client.email && (
              <a href={`mailto:${client.email}`}>
                <Button size="icon" variant="ghost" className="h-8 w-8"><Mail size={16} /></Button>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stage Selector */}
      <StageSelector currentStage={client.journey_stage} onSelect={handleMoveStage} />

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: FileText, label: 'Sessões', value: totalSessions.toString() },
          { icon: DollarSign, label: 'Serviços', value: formatCurrency(serviceRevenue) },
          { icon: Package, label: 'Produtos', value: formatCurrency(productRevenue) },
          { icon: Clock, label: 'Último contato', value: daysSinceContact !== null ? `${daysSinceContact} dias` : 'Nunca' },
        ].map(m => (
          <Card key={m.label}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <m.icon size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">{m.label}</p>
                <p className="text-sm font-semibold text-foreground">{m.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="perfil">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="jornada">Jornada</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="clinico">Perfil Clínico</TabsTrigger>
          <TabsTrigger value="familia">Família</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="space-y-3 mt-4">
          <InfoRow label="WhatsApp" value={client.phone_whatsapp} />
          <InfoRow label="E-mail" value={client.email} />
          <InfoRow label="Data de nascimento" value={client.birth_date ? formatDate(client.birth_date) : null} />
          <InfoRow label="CPF" value={client.cpf} />
          <InfoRow label="Como chegou" value={client.source ? { indicacao: 'Indicação', trafego_pago: 'Tráfego Pago', organico: 'Orgânico', evento: 'Evento', outros: 'Outros' }[client.source] : null} />
          <InfoRow label="Primeira queixa" value={client.first_complaint} />
          <InfoRow label="Observações" value={client.notes} />
        </TabsContent>

        <TabsContent value="jornada" className="mt-4">
          {journey.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma movimentação registrada.</p>
          ) : (
            <div className="space-y-3">
              {journey.map(j => (
                <div key={j.id} className="flex gap-3 items-start">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: STAGE_MAP[j.to_stage]?.color || '#94A3B8' }} />
                    <div className="w-px h-full bg-border" />
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium">
                      {j.from_stage ? `${STAGE_MAP[j.from_stage]?.label} → ` : ''}{STAGE_MAP[j.to_stage]?.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(j.created_at)}</p>
                    {j.reason && <p className="text-xs text-muted-foreground mt-0.5">{j.reason}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma sessão registrada ainda.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map(s => (
                <Card key={s.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{s.service_name || 'Sessão'}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(s.session_date)}</p>
                    </div>
                    <p className="text-sm font-semibold text-primary">{formatCurrency(s.service_revenue + s.product_revenue)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="clinico" className="mt-4">
          {editingClinical ? (
            <div className="space-y-3">
              <div><label className="text-xs text-muted-foreground">Tipo de pele</label><Input value={clinicalForm.skin_type} onChange={e => setClinicalForm(f => ({ ...f, skin_type: e.target.value }))} /></div>
              <div><label className="text-xs text-muted-foreground">Queixas principais</label><Textarea value={clinicalForm.main_complaints} onChange={e => setClinicalForm(f => ({ ...f, main_complaints: e.target.value }))} /></div>
              <div><label className="text-xs text-muted-foreground">Alergias</label><Input value={clinicalForm.allergies} onChange={e => setClinicalForm(f => ({ ...f, allergies: e.target.value }))} /></div>
              <div><label className="text-xs text-muted-foreground">Contraindicações</label><Input value={clinicalForm.contraindications} onChange={e => setClinicalForm(f => ({ ...f, contraindications: e.target.value }))} /></div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveClinical}>Salvar</Button>
                <Button size="sm" variant="outline" onClick={() => setEditingClinical(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <InfoRow label="Tipo de pele" value={clinical?.skin_type} />
              <InfoRow label="Queixas principais" value={clinical?.main_complaints} />
              <InfoRow label="Alergias" value={clinical?.allergies} />
              <InfoRow label="Contraindicações" value={clinical?.contraindications} />
              <Button size="sm" variant="outline" onClick={() => {
                setClinicalForm({
                  skin_type: clinical?.skin_type || '',
                  main_complaints: clinical?.main_complaints || '',
                  allergies: clinical?.allergies || '',
                  contraindications: clinical?.contraindications || '',
                });
                setEditingClinical(true);
              }}><Pencil size={14} /> Editar</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="familia" className="mt-4">
          {family.map(f => (
            <Card key={f.id} className="mb-2">
              <CardContent className="p-3">
                <p className="text-sm font-medium">{f.name}</p>
                <p className="text-xs text-muted-foreground">{f.relationship}{f.birth_date ? ` • ${formatDate(f.birth_date)}` : ''}</p>
                {f.health_notes && <p className="text-xs text-muted-foreground mt-1">{f.health_notes}</p>}
              </CardContent>
            </Card>
          ))}
          {showFamilyForm ? (
            <div className="space-y-2 mt-3 p-3 border rounded-lg">
              <Input placeholder="Nome" value={familyForm.name} onChange={e => setFamilyForm(f => ({ ...f, name: e.target.value }))} />
              <Select value={familyForm.relationship} onValueChange={v => setFamilyForm(f => ({ ...f, relationship: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="date" value={familyForm.birth_date} onChange={e => setFamilyForm(f => ({ ...f, birth_date: e.target.value }))} />
              <Textarea placeholder="Observações de saúde" value={familyForm.health_notes} onChange={e => setFamilyForm(f => ({ ...f, health_notes: e.target.value }))} />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveFamily}>Salvar</Button>
                <Button size="sm" variant="outline" onClick={() => setShowFamilyForm(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowFamilyForm(true)}>
              <Users size={14} /> Adicionar Familiar
            </Button>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value || '—'}</span>
    </div>
  );
}
