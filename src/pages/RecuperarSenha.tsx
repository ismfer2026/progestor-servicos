import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <h1 className="mb-2 text-center text-2xl font-semibold text-card-foreground">
            Recuperar senha
          </h1>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Digite seu e-mail para receber o link de recuperação.
          </p>

          {sent ? (
            <div className="text-center">
              <p className="mb-4 text-foreground">
                Enviamos um link de recuperação para <strong>{email}</strong>.
              </p>
              <p className="text-sm text-muted-foreground">Verifique sua caixa de entrada e spam.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/login" className="font-medium text-primary hover:underline">
              Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
