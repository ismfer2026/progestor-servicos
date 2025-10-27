import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showMagicLinkDialog, setShowMagicLinkDialog] = useState(false);
  
  // Signup form states
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  
  // Reset password state
  const [resetEmail, setResetEmail] = useState('');
  
  // Magic link state
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  
  const { login, signup, signInWithMagicLink, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await login(email, password);
      if (error) {
        toast({
          title: "Erro no login",
          description: error,
          variant: "destructive",
        });
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao tentar fazer login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await signup(signupEmail, signupPassword, signupName);
      if (error) {
        toast({
          title: "Erro no cadastro",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique seu e-mail para confirmar a conta.",
        });
        setShowSignupDialog(false);
        setSignupEmail('');
        setSignupPassword('');
        setSignupName('');
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao criar a conta",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await signInWithMagicLink(magicLinkEmail);
      if (error) {
        toast({
          title: "Erro ao enviar link",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Link enviado!",
          description: "Verifique seu e-mail para o link de acesso.",
        });
        setShowMagicLinkDialog(false);
        setMagicLinkEmail('');
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao enviar o link",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await resetPassword(resetEmail);
      if (error) {
        toast({
          title: "Erro ao enviar reset",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "E-mail enviado!",
          description: "Verifique sua caixa de entrada para redefinir a senha.",
        });
        setShowResetDialog(false);
        setResetEmail('');
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao enviar o reset",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light to-background p-4">
      <div className="w-full max-w-md space-y-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="h-4 w-4" />
          Voltar para página inicial
        </Link>

        {/* Logo */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl gradient-primary flex items-center justify-center shadow-primary">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold">Synca Gestão</h1>
          <p className="text-muted-foreground">Sistema de Gestão Completa</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Entrar</CardTitle>
            <CardDescription className="text-center">
              Digite suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6 border-primary/50 bg-primary/5">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <strong className="block mb-2">Primeiro acesso?</strong>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>• <strong>Login:</strong> e-mail cadastrado na assinatura</li>
                  <li>• <strong>Senha inicial:</strong> seu CPF ou CNPJ (apenas números)</li>
                  <li>• Você será solicitado a trocar a senha no primeiro login</li>
                </ul>
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Primeiro acesso? Use seu CPF/CNPJ como senha
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                variant="primary"
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    ou
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Dialog open={showMagicLinkDialog} onOpenChange={setShowMagicLinkDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Entrar com Link Mágico
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Entrar com Link Mágico</DialogTitle>
                      <DialogDescription>
                        Digite seu e-mail e enviaremos um link para acesso direto
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleMagicLink} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="magicLinkEmail">E-mail</Label>
                        <Input
                          id="magicLinkEmail"
                          type="email"
                          placeholder="seu@email.com"
                          value={magicLinkEmail}
                          onChange={(e) => setMagicLinkEmail(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Enviando...' : 'Enviar Link Mágico'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="w-full text-sm">
                      Esqueci minha senha
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Redefinir Senha</DialogTitle>
                      <DialogDescription>
                        Digite seu e-mail para receber instruções de redefinição
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="resetEmail">E-mail</Label>
                        <Input
                          id="resetEmail"
                          type="email"
                          placeholder="seu@email.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Enviando...' : 'Enviar Instruções'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Não tem uma conta?{' '}
                <Dialog open={showSignupDialog} onOpenChange={setShowSignupDialog}>
                  <DialogTrigger asChild>
                    <Button variant="link" className="p-0 h-auto text-sm">
                      Criar conta grátis
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Conta</DialogTitle>
                      <DialogDescription>
                        Preencha os dados para criar sua conta grátis
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signupName">Nome Completo</Label>
                        <Input
                          id="signupName"
                          type="text"
                          placeholder="Seu nome completo"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signupEmail">E-mail</Label>
                        <Input
                          id="signupEmail"
                          type="email"
                          placeholder="seu@email.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signupPassword">Senha</Label>
                        <Input
                          id="signupPassword"
                          type="password"
                          placeholder="Digite uma senha segura"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Criando conta...' : 'Criar Conta Grátis'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Trial Info */}
        <Card className="border-success bg-success-light">
          <CardContent className="p-4 text-center">
            <p className="text-sm font-medium text-success">
              🎉 Teste grátis por 7 dias
            </p>
            <p className="text-xs text-success/80 mt-1">
              Sem cartão de crédito • Sem compromisso
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}