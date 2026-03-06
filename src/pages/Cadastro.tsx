import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PROFESSION_LABELS, type ProfessionType } from '@/types/database';

function formatWhatsApp(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function Cadastro() {
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [professionType, setProfessionType] = useState<ProfessionType | ''>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect when user is logged in (auto-login after signup)
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast({ title: 'Senha muito curta', description: 'A senha deve ter no mínimo 8 caracteres.', variant: 'destructive' });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: 'Senhas não conferem', description: 'As senhas digitadas são diferentes.', variant: 'destructive' });
      return;
    }

    if (!professionType) {
      toast({ title: 'Selecione sua profissão', variant: 'destructive' });
      return;
    }

    setLoading(true);

    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          name,
          business_name: businessName || null,
          phone: whatsapp.replace(/\D/g, '') || null,
          phone_whatsapp: whatsapp.replace(/\D/g, '') || null,
          profession_type: professionType as ProfessionType,
        },
      },
    });

    if (error) {
      toast({ title: 'Erro ao criar conta', description: error.message, variant: 'destructive' });
      setLoading(false);
    } else if (signUpData.session) {
      // Auto-confirmed: useEffect will redirect to /dashboard
      toast({ title: 'Conta criada com sucesso!' });
    } else {
      // Email confirmation required
      toast({ title: 'Conta criada!', description: 'Verifique seu e-mail para confirmar.' });
      setLoading(false);
      navigate('/login');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <h1 className="mb-6 text-center text-2xl font-semibold text-card-foreground">
            Crie sua conta
          </h1>

          <form onSubmit={handleCadastro} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" placeholder="Seu nome completo" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business">Clínica ou consultório <span className="text-muted-foreground">(opcional)</span></Label>
              <Input id="business" placeholder="Nome da clínica" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                placeholder="(00) 00000-0000"
                value={whatsapp}
                onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de profissão</Label>
              <Select value={professionType} onValueChange={(v) => setProfessionType(v as ProfessionType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione sua profissão" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROFESSION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha (mínimo 8 caracteres)</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar senha</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar minha conta'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já tem conta?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
