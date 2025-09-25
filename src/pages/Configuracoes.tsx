import React, { useState } from 'react';
import { Settings, Users, Building, Mail, MessageCircle, Palette, Bell, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';

// Mock data para demonstração
const usuarios = [
  { id: '1', nome: 'João Silva', email: 'joao@empresa.com', permissao: 'admin', status: 'ativo' },
  { id: '2', nome: 'Maria Santos', email: 'maria@empresa.com', permissao: 'colaborador', status: 'ativo' },
  { id: '3', nome: 'Pedro Costa', email: 'pedro@empresa.com', permissao: 'colaborador', status: 'inativo' }
];

const categoriasServicos = [
  { id: '1', nome: 'Instalação', cor: '#3B82F6' },
  { id: '2', nome: 'Manutenção', cor: '#EF4444' },
  { id: '3', nome: 'Consultoria', cor: '#10B981' },
  { id: '4', nome: 'Suporte', cor: '#F59E0B' }
];

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState('empresa');
  const [showInviteUser, setShowInviteUser] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);

  const renderEmpresaTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="nomeEmpresa">Nome da Empresa</Label>
            <Input id="nomeEmpresa" defaultValue="ProGestor Ltda" />
          </div>
          <div>
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input id="cnpj" placeholder="00.000.000/0001-00" />
          </div>
          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input id="telefone" placeholder="(11) 99999-9999" />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" defaultValue="contato@progestor.com" />
          </div>
          <div>
            <Label htmlFor="endereco">Endereço</Label>
            <Textarea id="endereco" placeholder="Rua, número, bairro, cidade, estado" />
          </div>
          <Button>Salvar Alterações</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logo e Identidade Visual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">P</span>
            </div>
            <Button variant="outline">Alterar Logo</Button>
          </div>
          <div>
            <Label htmlFor="corPrimaria">Cor Primária</Label>
            <div className="flex items-center space-x-2">
              <Input id="corPrimaria" defaultValue="#3B82F6" className="w-20" />
              <div className="w-8 h-8 bg-primary rounded border"></div>
            </div>
          </div>
          <div>
            <Label htmlFor="corSecundaria">Cor Secundária</Label>
            <div className="flex items-center space-x-2">
              <Input id="corSecundaria" defaultValue="#10B981" className="w-20" />
              <div className="w-8 h-8 bg-green-500 rounded border"></div>
            </div>
          </div>
          <Button>Salvar Cores</Button>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Configurações Regionais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="moeda">Moeda</Label>
              <Select defaultValue="BRL">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                  <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="timezone">Fuso Horário</Label>
              <Select defaultValue="America/Sao_Paulo">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                  <SelectItem value="America/New_York">Nova York (GMT-5)</SelectItem>
                  <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="idioma">Idioma</Label>
              <Select defaultValue="pt-BR">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="es-ES">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderUsuariosTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Usuários do Sistema</CardTitle>
            <Dialog open={showInviteUser} onOpenChange={setShowInviteUser}>
              <DialogTrigger asChild>
                <Button>Convidar Usuário</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Convidar Novo Usuário</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nomeUsuario">Nome</Label>
                    <Input id="nomeUsuario" placeholder="Nome completo" />
                  </div>
                  <div>
                    <Label htmlFor="emailUsuario">E-mail</Label>
                    <Input id="emailUsuario" type="email" placeholder="email@exemplo.com" />
                  </div>
                  <div>
                    <Label htmlFor="permissaoUsuario">Permissão</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a permissão" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="gerente">Gerente</SelectItem>
                        <SelectItem value="colaborador">Colaborador</SelectItem>
                        <SelectItem value="vendedor">Vendedor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowInviteUser(false)}>
                      Cancelar
                    </Button>
                    <Button>Enviar Convite</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Permissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map(usuario => (
                <TableRow key={usuario.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {usuario.nome.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{usuario.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>
                    <Badge variant={usuario.permissao === 'admin' ? 'default' : 'secondary'}>
                      {usuario.permissao}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={usuario.status === 'ativo' ? 'default' : 'secondary'}>
                      {usuario.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost">Editar</Button>
                      <Button size="sm" variant="ghost">
                        {usuario.status === 'ativo' ? 'Desativar' : 'Ativar'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissões por Função</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-sm font-medium">Módulo</div>
              <div className="text-sm font-medium text-center">Admin</div>
              <div className="text-sm font-medium text-center">Gerente</div>
              <div className="text-sm font-medium text-center">Colaborador</div>
            </div>
            {['Dashboard', 'Orçamentos', 'Serviços', 'Clientes', 'Financeiro', 'Estoque', 'Relatórios'].map(modulo => (
              <div key={modulo} className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                <div className="text-sm">{modulo}</div>
                <div className="flex justify-center">
                  <Switch defaultChecked />
                </div>
                <div className="flex justify-center">
                  <Switch defaultChecked={modulo !== 'Configurações'} />
                </div>
                <div className="flex justify-center">
                  <Switch defaultChecked={!['Financeiro', 'Relatórios'].includes(modulo)} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCategoriasTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Categorias de Serviços</CardTitle>
            <Dialog open={showNewCategory} onOpenChange={setShowNewCategory}>
              <DialogTrigger asChild>
                <Button size="sm">Nova Categoria</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Categoria</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nomeCategoria">Nome</Label>
                    <Input id="nomeCategoria" placeholder="Nome da categoria" />
                  </div>
                  <div>
                    <Label htmlFor="corCategoria">Cor</Label>
                    <Input id="corCategoria" type="color" defaultValue="#3B82F6" />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowNewCategory(false)}>
                      Cancelar
                    </Button>
                    <Button>Salvar</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {categoriasServicos.map(categoria => (
              <div key={categoria.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: categoria.cor }}
                  ></div>
                  <span>{categoria.nome}</span>
                </div>
                <div className="flex space-x-1">
                  <Button size="sm" variant="ghost">Editar</Button>
                  <Button size="sm" variant="ghost">Excluir</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Etapas do Funil CRM</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Fechamento'].map((etapa, index) => (
              <div key={etapa} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{index + 1}.</span>
                  <span>{etapa}</span>
                </div>
                <div className="flex space-x-1">
                  <Button size="sm" variant="ghost">Editar</Button>
                  <Button size="sm" variant="ghost">Remover</Button>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              Adicionar Etapa
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderIntegracoes = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5" />
            Configurações de E-mail
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="smtpHost">Servidor SMTP</Label>
            <Input id="smtpHost" placeholder="smtp.gmail.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="smtpPort">Porta</Label>
              <Input id="smtpPort" defaultValue="587" />
            </div>
            <div>
              <Label htmlFor="smtpSecurity">Segurança</Label>
              <Select defaultValue="tls">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tls">TLS</SelectItem>
                  <SelectItem value="ssl">SSL</SelectItem>
                  <SelectItem value="none">Nenhuma</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="smtpUser">Usuário</Label>
            <Input id="smtpUser" placeholder="seu@email.com" />
          </div>
          <div>
            <Label htmlFor="smtpPass">Senha</Label>
            <Input id="smtpPass" type="password" placeholder="********" />
          </div>
          <Button>Testar Conexão</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="mr-2 h-5 w-5" />
            WhatsApp Business
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="whatsappToken">Token da API</Label>
            <Input id="whatsappToken" placeholder="Cole aqui o token do WhatsApp Business" />
          </div>
          <div>
            <Label htmlFor="whatsappPhone">Número do Telefone</Label>
            <Input id="whatsappPhone" placeholder="5511999999999" />
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="whatsappEnabled" />
            <Label htmlFor="whatsappEnabled">Habilitar integração</Label>
          </div>
          <Button>Conectar WhatsApp</Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderPlanoTab = () => (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            Plano Atual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold">Plano Gratuito</h3>
              <p className="text-sm text-muted-foreground">
                Até 100 orçamentos por mês
              </p>
            </div>
            <Badge variant="secondary">Ativo</Badge>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Recursos inclusos:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>✓ Dashboard básico</li>
              <li>✓ Até 100 orçamentos/mês</li>
              <li>✓ 2 usuários</li>
              <li>✓ Suporte via e-mail</li>
              <li>✗ WhatsApp Business API</li>
              <li>✗ Relatórios avançados</li>
              <li>✗ Integrações personalizadas</li>
            </ul>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Usar este período de teste</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Restam 23 dias do período de teste. Após este período, algumas funcionalidades serão limitadas.
            </p>
            <Button>Fazer Upgrade</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="integracoes">Integrações</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="plano">Plano</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="mt-6">
          {renderEmpresaTab()}
        </TabsContent>

        <TabsContent value="usuarios" className="mt-6">
          {renderUsuariosTab()}
        </TabsContent>

        <TabsContent value="categorias" className="mt-6">
          {renderCategoriasTab()}
        </TabsContent>

        <TabsContent value="integracoes" className="mt-6">
          {renderIntegracoes()}
        </TabsContent>

        <TabsContent value="notificacoes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Preferências de Notificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                Configurações de notificação em desenvolvimento
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plano" className="mt-6">
          {renderPlanoTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
}