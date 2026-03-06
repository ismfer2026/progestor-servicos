import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Check, Upload, ArrowRight, ArrowLeft } from 'lucide-react';

const STATES = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

export default function Onboarding() {
  const { professional, refreshProfessional } = useAuth();
  const [step, setStep] = useState(1);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [address, setAddress] = useState({
    street: '', number: '', neighborhood: '', city: '', state: '', zip: '',
  });
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleFinish = async () => {
    if (!professional) return;
    setLoading(true);

    let avatarUrl = professional.avatar_url;

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop();
      const path = `${professional.user_id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { upsert: true });

      if (!uploadError) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        avatarUrl = data.publicUrl;
      }
    }

    const { error } = await supabase
      .from('professionals')
      .update({
        avatar_url: avatarUrl,
        address_street: address.street || null,
        address_number: address.number || null,
        address_neighborhood: address.neighborhood || null,
        address_city: address.city || null,
        address_state: address.state || null,
        address_zip: address.zip || null,
        onboarding_completed: true,
      })
      .eq('user_id', professional.user_id);

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      await refreshProfessional();
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const steps = [
    // Step 1: Welcome
    <div key="1" className="text-center space-y-4">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
        <span className="text-3xl">👋</span>
      </div>
      <h2 className="text-2xl font-semibold text-foreground">
        Bem-vindo ao iaprafaturar, {professional?.name?.split(' ')[0]}!
      </h2>
      <p className="text-muted-foreground">
        Vamos configurar seu perfil em 2 minutos.
      </p>
    </div>,

    // Step 2: Avatar
    <div key="2" className="space-y-4 text-center">
      <h2 className="text-xl font-semibold">Foto ou logo</h2>
      <p className="text-sm text-muted-foreground">Adicione uma imagem para personalizar seu perfil.</p>
      <div
        className="mx-auto flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-primary/30 bg-secondary hover:border-primary/60 transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        {avatarPreview ? (
          <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <p className="text-xs text-muted-foreground">Clique para fazer upload</p>
    </div>,

    // Step 3: Address
    <div key="3" className="space-y-4">
      <h2 className="text-xl font-semibold text-center">Endereço da clínica</h2>
      <p className="text-sm text-muted-foreground text-center">Opcional — você pode preencher depois.</p>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-1">
          <Label>Rua</Label>
          <Input placeholder="Rua / Avenida" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Número</Label>
          <Input placeholder="Nº" value={address.number} onChange={(e) => setAddress({ ...address, number: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Bairro</Label>
          <Input placeholder="Bairro" value={address.neighborhood} onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Cidade</Label>
          <Input placeholder="Cidade" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Estado</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={address.state}
            onChange={(e) => setAddress({ ...address, state: e.target.value })}
          >
            <option value="">UF</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label>CEP</Label>
          <Input placeholder="00000-000" value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })} />
        </div>
      </div>
    </div>,

    // Step 4: Done
    <div key="4" className="text-center space-y-4">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary">
        <Check className="h-8 w-8 text-primary-foreground" />
      </div>
      <h2 className="text-2xl font-semibold text-foreground">Tudo pronto!</h2>
      <p className="text-muted-foreground">Seu CRM inteligente está configurado.</p>
    </div>,
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="mb-8 flex justify-center"><Logo /></div>

        {/* Progress dots */}
        <div className="mb-6 flex justify-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`h-2 w-8 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </div>

        <div className="rounded-xl border bg-card p-8 shadow-sm">
          {steps[step - 1]}

          <div className="mt-8 flex justify-between">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
            ) : <div />}

            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)}>
                Próximo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={loading}>
                {loading ? 'Salvando...' : 'Ir para o Dashboard'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
