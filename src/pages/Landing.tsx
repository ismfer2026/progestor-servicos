import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Users, 
  FileText, 
  Calendar, 
  Package, 
  TrendingUp, 
  Shield, 
  Smartphone,
  Bell,
  DollarSign,
  BarChart3,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const benefits = [
    { icon: Users, text: 'CRM para não perder vendas' },
    { icon: FileText, text: 'Criação e envio de orçamentos por e-mail e WhatsApp' },
    { icon: FileText, text: 'Download de orçamentos em PDF' },
    { icon: BarChart3, text: 'Dashboard de CRM + Orçamentos' },
    { icon: Package, text: 'Cadastro de produtos e clientes' },
    { icon: Calendar, text: 'Agenda integrada, tarefas e notificações' },
    { icon: Package, text: 'Controle de estoque' },
    { icon: FileText, text: 'Geração de contratos com marca própria' },
    { icon: TrendingUp, text: 'Módulo completo de vendas' },
    { icon: DollarSign, text: 'Financeiro integrado (receitas, despesas, pendências)' },
    { icon: BarChart3, text: 'Dashboards e relatórios para decisões precisas' },
    { icon: Smartphone, text: 'Mobile-friendly (celular e tablet)' },
    { icon: Bell, text: 'Notificações de tarefas e alertas de vendas' },
  ];

  const plans = [
    {
      name: 'Essencial',
      price: 'R$ 99,90',
      period: '/mês',
      description: 'Ideal para começar a organizar suas vendas',
      priceId: 'https://pay.kiwify.com.br/Mc7Lzvn',
      features: [
        'CRM + criação de orçamentos',
        'Envio por e-mail',
        'Download do orçamento',
        'Dashboard CRM + Orçamentos',
        'Cadastro de produtos e clientes',
        '+1 usuário para o time'
      ],
      highlight: false
    },
    {
      name: 'Estratégico',
      price: 'R$ 249,90',
      period: '/mês',
      description: 'Para empresas que querem escalar',
      priceId: 'https://pay.kiwify.com.br/hmXqePV',
      features: [
        'Tudo do Essencial',
        'Agenda integrada',
        'Gestão de tarefas',
        'Notificações automáticas',
        'Controle de estoque',
        '+3 usuários para o time'
      ],
      highlight: true
    },
    {
      name: 'Performance',
      price: 'R$ 449,90',
      period: '/mês',
      description: 'Solução completa para alta performance',
      priceId: 'https://pay.kiwify.com.br/agoKfIS',
      features: [
        'Tudo do Estratégico',
        'Geração de contratos com marca própria',
        'Módulo completo de vendas',
        'Financeiro integrado',
        '+7 usuários para o time'
      ],
      highlight: false
    }
  ];

  const differentials = [
    {
      icon: TrendingUp,
      title: 'Aumento de Vendas',
      description: 'Não perca mais oportunidades com nosso CRM inteligente'
    },
    {
      icon: Shield,
      title: 'Segurança Total',
      description: 'Seus dados protegidos com criptografia de ponta'
    },
    {
      icon: Smartphone,
      title: 'Acesso Mobile',
      description: 'Gerencie seu negócio de qualquer lugar'
    },
    {
      icon: Users,
      title: 'Suporte Dedicado',
      description: 'Time pronto para ajudar você a crescer'
    }
  ];

  const faqs = [
    {
      question: 'Funciona no celular e tablet?',
      answer: 'Sim! O Synca Gestão é totalmente responsivo e funciona perfeitamente em celular, tablet e desktop. Você pode gerenciar seu negócio de qualquer lugar.'
    },
    {
      question: 'Posso expandir usuários?',
      answer: 'Sim! Cada plano já inclui usuários, e você pode contratar usuários adicionais conforme sua empresa cresce. Entre em contato para personalizar seu plano.'
    },
    {
      question: 'Existe contrato de longo prazo?',
      answer: 'Não! Nossos planos são mensais e você pode cancelar quando quiser. Acreditamos na qualidade do nosso serviço e não prendemos ninguém em contratos longos.'
    },
    {
      question: 'É seguro para meus dados?',
      answer: 'Absolutamente! Utilizamos criptografia de ponta e seguimos as melhores práticas de segurança. Seus dados são armazenados em servidores seguros com backup automático.'
    }
  ];

  const handleCheckout = (url: string) => {
    window.open(url, '_blank');
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/5511999999999?text=Olá! Gostaria de saber mais sobre o Synca Gestão', '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-7xl">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Synca Gestão</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#beneficios" className="text-sm font-medium hover:text-primary transition-colors">
              Benefícios
            </a>
            <a href="#planos" className="text-sm font-medium hover:text-primary transition-colors">
              Planos
            </a>
            <a href="#faq" className="text-sm font-medium hover:text-primary transition-colors">
              FAQ
            </a>
            <Link to="/login">
              <Button variant="outline" size="sm">Login</Button>
            </Link>
            <Button size="sm" onClick={handleWhatsApp}>Fale Conosco</Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background p-4">
            <nav className="flex flex-col gap-4">
              <a href="#beneficios" className="text-sm font-medium hover:text-primary transition-colors">
                Benefícios
              </a>
              <a href="#planos" className="text-sm font-medium hover:text-primary transition-colors">
                Planos
              </a>
              <a href="#faq" className="text-sm font-medium hover:text-primary transition-colors">
                FAQ
              </a>
              <Link to="/login">
                <Button variant="outline" size="sm" className="w-full">Login</Button>
              </Link>
              <Button size="sm" onClick={handleWhatsApp} className="w-full">Fale Conosco</Button>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div className="container relative px-4 mx-auto max-w-7xl">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Sem controle não existe crescimento. Organize sua operação agora e pare de perder dinheiro.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              Synca Gestão combina CRM, orçamentos, contratos, financeiro, agenda, notificações, estoque e dashboards em uma única plataforma para empresas que querem crescer sem perder vendas ou clientes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleWhatsApp} className="text-lg px-8">
                Fale com nosso time
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8">
                <a href="#planos">Ver Planos</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-20 bg-muted/30">
        <div className="container px-4 mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa em uma única plataforma
            </h2>
            <p className="text-lg text-muted-foreground">
              Funcionalidades completas para transformar sua gestão
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium leading-relaxed">{benefit.text}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-background">
        <div className="container px-4 mx-auto max-w-7xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-6 py-3 mb-8">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="font-semibold">+50 empresas já transformaram sua gestão</span>
            </div>
            <p className="text-2xl md:text-3xl font-bold mb-2">
              Resultados reais de empresas que crescem com o Synca
            </p>
            <p className="text-muted-foreground">
              Aumento médio de 40% na conversão de vendas no primeiro trimestre
            </p>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="planos" className="py-20 bg-muted/30">
        <div className="container px-4 mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Escolha o plano ideal para o seu negócio
            </h2>
            <p className="text-lg text-muted-foreground">
              Sem contratos longos. Cancele quando quiser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.name} 
                className={`relative ${plan.highlight ? 'border-primary shadow-xl scale-105' : ''}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-sm font-bold px-4 py-1 rounded-full">
                      Mais Popular
                    </span>
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button 
                    className="w-full" 
                    size="lg"
                    variant={plan.highlight ? 'default' : 'outline'}
                    onClick={() => handleCheckout(plan.priceId)}
                  >
                    Contrate Agora
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Differentials Section */}
      <section className="py-20 bg-background">
        <div className="container px-4 mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Por que escolher o Synca Gestão?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {differentials.map((item, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-muted/30">
        <div className="container px-4 mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-lg text-muted-foreground">
              Tire suas dúvidas sobre o Synca Gestão
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
        <div className="container px-4 mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para transformar sua gestão?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Junte-se a mais de 50 empresas que já escolheram crescer com o Synca Gestão
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={handleWhatsApp} className="text-lg px-8">
              Fale com nosso time
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <a href="#planos">Ver Planos</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-12">
        <div className="container px-4 mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">Synca Gestão</span>
              </div>
              <p className="text-sm text-muted-foreground">
                A plataforma completa para gestão empresarial moderna.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#beneficios" className="hover:text-primary">Funcionalidades</a></li>
                <li><a href="#planos" className="hover:text-primary">Planos</a></li>
                <li><a href="#faq" className="hover:text-primary">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Sobre Nós</a></li>
                <li><a href="#" className="hover:text-primary">Contato</a></li>
                <li><a href="#" className="hover:text-primary">Blog</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-primary">Termos de Uso</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 Synca Gestão. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <button
        onClick={handleWhatsApp}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
        aria-label="Fale conosco no WhatsApp"
      >
        <svg
          className="w-8 h-8"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </button>
    </div>
  );
}
