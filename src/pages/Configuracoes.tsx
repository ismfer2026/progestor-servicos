import React, { useState, useEffect } from 'react';
import { Settings, Users, Building, Mail, MessageCircle, Palette, Bell, CreditCard, Plus, Pencil, Trash2, AlertTriangle, Check, X, Link as LinkIcon } from 'lucide-react';
import { useWhatsAppConfig } from '@/hooks/useWhatsAppConfig';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Colaborador {
  id: string;
  nome: string;
  funcao: string | null;
  ativo: boolean;
}

interface CategoriaServico {
  nome: string;
  cor: string;
}

interface Usuario {
  id: string;
  nome_completo: string | null;
  nome: string;
  email: string;
  telefone_whatsapp: string | null;
  cpf_cnpj: string | null;
  data_cadastro: string | null;
  status_conta: string;
  ultimo_pagamento: string | null;
  proximo_vencimento: string | null;
  observacoes: string | null;
  bloqueado: boolean;
  conta_principal: boolean;
  funcao: string | null;
  ativo: boolean;
  empresa_id: string;
}

interface EmpresaData {
  id: string;
  plano: string;
  limite_usuarios: number;
  data_proximo_pagamento: string | null;
  data_ultimo_pagamento: string | null;
  status_pagamento: string;
}

interface PlanoConfig {
  nome: string;
  quantidade_acessos_adicionais: number;
  modulos: string[];
}

const MODULOS_DISPONIVEIS = [
  { value: 'dashboard', label: 'Tela Principal' },
  { value: 'orcamentos', label: 'Orçamentos' },
  { value: 'servicos', label: 'Serviços / Produtos' },
  { value: 'funil_vendas', label: 'Funil de Vendas' },
  { value: 'agenda', label: 'Agenda' },
  { value: 'clientes', label: 'Clientes' },
  { value: 'estoque', label: 'Estoque' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'contratos', label: 'Contratos' },
  { value: 'relatorios', label: 'Relatórios' },
  { value: 'configuracoes', label: 'Configurações' },
  { value: 'vendas', label: 'Vendas (futuro)' },
];

const PERMISSOES_PADRAO = {
  administrador: ['dashboard', 'orcamentos', 'servicos', 'funil_vendas', 'agenda', 'clientes', 'estoque', 'financeiro', 'contratos', 'relatorios', 'configuracoes', 'vendas'],
  gerente: ['dashboard', 'orcamentos', 'servicos', 'funil_vendas', 'agenda', 'clientes', 'estoque', 'financeiro', 'contratos', 'relatorios', 'vendas'],
  lider: ['dashboard', 'orcamentos', 'servicos', 'agenda', 'clientes', 'vendas'],
  colaborador: ['funil_vendas', 'agenda'],
  personalizado: []
};

export default function Configuracoes() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('empresa');
  const [showInviteUser, setShowInviteUser] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showColaboradorDialog, setShowColaboradorDialog] = useState(false);
  const { defaultPhone, saveWhatsAppConfig } = useWhatsAppConfig();
  const [whatsappPhone, setWhatsappPhone] = useState('');
  
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [nomeColaborador, setNomeColaborador] = useState('');
  const [funcaoColaborador, setFuncaoColaborador] = useState('');
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | null>(null);

  const [categorias, setCategorias] = useState<CategoriaServico[]>([]);
  const [nomeCategoria, setNomeCategoria] = useState('');
  const [corCategoria, setCorCategoria] = useState('#3B82F6');
  const [editingCategoriaIndex, setEditingCategoriaIndex] = useState<number | null>(null);

  // Estados para gerenciamento de usuários
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empresaData, setEmpresaData] = useState<EmpresaData | null>(null);
  const [showUsuarioDialog, setShowUsuarioDialog] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [usuarioForm, setUsuarioForm] = useState({
    nome_completo: '',
    email: '',
    telefone_whatsapp: '',
    cpf_cnpj: '',
    funcao: 'colaborador',
    observacoes: '',
    modulos: [] as string[],
    limite_usuarios_criacao: 0,
    modoPersonalizado: false,
    plano: ''
  });
  const [gerarLinkConvite, setGerarLinkConvite] = useState(false);
  const [linkConvite, setLinkConvite] = useState('');
  
  // Estados para informações da empresa
  const [empresaInfo, setEmpresaInfo] = useState({
    nome_fantasia: '',
    razao_social: '',
    cnpj: '',
    telefone: '',
    email_admin: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    website: '',
    logo_url: ''
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // Estados para gerenciamento de planos
  const [planos, setPlanos] = useState<PlanoConfig[]>([]);
  const [showPlanoDialog, setShowPlanoDialog] = useState(false);
  const [novoPlano, setNovoPlano] = useState<PlanoConfig>({
    nome: '',
    quantidade_acessos_adicionais: 0,
    modulos: []
  });
  const [editingPlanoIndex, setEditingPlanoIndex] = useState<number | null>(null);

  useEffect(() => {
    if (defaultPhone) {
      setWhatsappPhone(defaultPhone);
    }
  }, [defaultPhone]);

  useEffect(() => {
    if (activeTab === 'colaboradores') {
      loadColaboradores();
    } else if (activeTab === 'categorias') {
      loadCategorias();
    } else if (activeTab === 'empresa') {
      loadEmpresaInfo();
    }
  }, [activeTab]);

  const loadEmpresaInfo = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', user.empresa_id)
        .single();

      if (error) throw error;
      if (data) {
        setEmpresaInfo({
          nome_fantasia: data.nome_fantasia || '',
          razao_social: data.razao_social || '',
          cnpj: data.cnpj || '',
          telefone: data.telefone || '',
          email_admin: data.email_admin || '',
          endereco: data.endereco || '',
          cidade: data.cidade || '',
          estado: data.estado || '',
          cep: data.cep || '',
          website: data.website || '',
          logo_url: data.logo_url || ''
        });
      }
    } catch (error) {
      console.error('Error loading empresa info:', error);
      toast.error('Erro ao carregar informações da empresa');
    }
  };

  const handleSaveEmpresaInfo = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('empresas')
        .update({
          nome_fantasia: empresaInfo.nome_fantasia,
          razao_social: empresaInfo.razao_social,
          cnpj: empresaInfo.cnpj,
          telefone: empresaInfo.telefone,
          email_admin: empresaInfo.email_admin,
          endereco: empresaInfo.endereco,
          cidade: empresaInfo.cidade,
          estado: empresaInfo.estado,
          cep: empresaInfo.cep,
          website: empresaInfo.website,
          logo_url: empresaInfo.logo_url
        })
        .eq('id', user.empresa_id);

      if (error) throw error;
      toast.success('Informações da empresa salvas com sucesso!');
    } catch (error) {
      console.error('Error saving empresa info:', error);
      toast.error('Erro ao salvar informações da empresa');
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem');
      return;
    }

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    try {
      setUploadingLogo(true);

      // Upload para storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.empresa_id}/logo.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('servico-imagens')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('servico-imagens')
        .getPublicUrl(fileName);

      // Atualizar estado e salvar no banco
      setEmpresaInfo(prev => ({ ...prev, logo_url: publicUrl }));
      
      const { error: updateError } = await supabase
        .from('empresas')
        .update({ logo_url: publicUrl })
        .eq('id', user.empresa_id);

      if (updateError) throw updateError;

      toast.success('Logo atualizado com sucesso!');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Erro ao fazer upload do logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const loadColaboradores = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .order('nome');

      if (error) throw error;
      if (data) setColaboradores(data);
    } catch (error) {
      console.error('Error loading colaboradores:', error);
      toast.error('Erro ao carregar colaboradores');
    }
  };

  const handleSaveColaborador = async () => {
    if (!nomeColaborador.trim()) {
      toast.error('Preencha o nome do colaborador');
      return;
    }

    if (!user) return;

    try {
      if (editingColaborador) {
        const { error } = await supabase
          .from('colaboradores')
          .update({
            nome: nomeColaborador,
            funcao: funcaoColaborador || null,
          })
          .eq('id', editingColaborador.id);

        if (error) throw error;
        toast.success('Colaborador atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('colaboradores')
          .insert({
            empresa_id: user.empresa_id,
            nome: nomeColaborador,
            funcao: funcaoColaborador || null,
            ativo: true,
          });

        if (error) throw error;
        toast.success('Colaborador cadastrado com sucesso!');
      }

      setShowColaboradorDialog(false);
      setNomeColaborador('');
      setFuncaoColaborador('');
      setEditingColaborador(null);
      loadColaboradores();
    } catch (error) {
      console.error('Error saving colaborador:', error);
      toast.error('Erro ao salvar colaborador');
    }
  };

  const handleEditColaborador = (colaborador: Colaborador) => {
    setEditingColaborador(colaborador);
    setNomeColaborador(colaborador.nome);
    setFuncaoColaborador(colaborador.funcao || '');
    setShowColaboradorDialog(true);
  };

  const handleDeleteColaborador = async (id: string) => {
    if (!confirm('Deseja realmente excluir este colaborador?')) return;

    try {
      const { error } = await supabase
        .from('colaboradores')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Colaborador excluído com sucesso!');
      loadColaboradores();
    } catch (error) {
      console.error('Error deleting colaborador:', error);
      toast.error('Erro ao excluir colaborador');
    }
  };

  const handleToggleColaboradorStatus = async (colaborador: Colaborador) => {
    try {
      const { error } = await supabase
        .from('colaboradores')
        .update({ ativo: !colaborador.ativo })
        .eq('id', colaborador.id);

      if (error) throw error;
      toast.success(`Colaborador ${colaborador.ativo ? 'desativado' : 'ativado'} com sucesso!`);
      loadColaboradores();
    } catch (error) {
      console.error('Error toggling colaborador status:', error);
      toast.error('Erro ao alterar status do colaborador');
    }
  };

  const handleSaveWhatsApp = async () => {
    const success = await saveWhatsAppConfig(whatsappPhone);
    if (success) {
      toast.success('Configuração do WhatsApp salva com sucesso!');
    } else {
      toast.error('Erro ao salvar configuração do WhatsApp');
    }
  };

  const loadCategorias = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('empresa_id', user.empresa_id)
        .eq('chave', 'categorias_servicos')
        .maybeSingle();

      if (error) throw error;
      
      if (data && data.valor && Array.isArray(data.valor)) {
        const categoriasArray = data.valor
          .filter((item): item is { nome: string; cor: string } => 
            typeof item === 'object' && item !== null && 'nome' in item && 'cor' in item
          );
        setCategorias(categoriasArray);
      }
    } catch (error) {
      console.error('Error loading categorias:', error);
      toast.error('Erro ao carregar categorias');
    }
  };

  const handleSaveCategoria = async () => {
    if (!nomeCategoria.trim()) {
      toast.error('Preencha o nome da categoria');
      return;
    }

    if (!user) return;

    try {
      let novasCategorias = [...categorias];
      
      if (editingCategoriaIndex !== null) {
        novasCategorias[editingCategoriaIndex] = { nome: nomeCategoria, cor: corCategoria };
      } else {
        novasCategorias.push({ nome: nomeCategoria, cor: corCategoria });
      }

      const { error } = await supabase
        .from('configuracoes')
        .upsert([{
          empresa_id: user.empresa_id,
          chave: 'categorias_servicos',
          valor: novasCategorias as any,
          tipo: 'json'
        }], {
          onConflict: 'empresa_id,chave'
        });

      if (error) throw error;
      
      toast.success(editingCategoriaIndex !== null ? 'Categoria atualizada!' : 'Categoria cadastrada!');
      setShowNewCategory(false);
      setNomeCategoria('');
      setCorCategoria('#3B82F6');
      setEditingCategoriaIndex(null);
      loadCategorias();
    } catch (error) {
      console.error('Error saving categoria:', error);
      toast.error('Erro ao salvar categoria');
    }
  };

  const handleEditCategoria = (index: number) => {
    const categoria = categorias[index];
    setNomeCategoria(categoria.nome);
    setCorCategoria(categoria.cor);
    setEditingCategoriaIndex(index);
    setShowNewCategory(true);
  };

  const handleDeleteCategoria = async (index: number) => {
    if (!confirm('Deseja realmente excluir esta categoria?')) return;
    if (!user) return;

    try {
      const novasCategorias = categorias.filter((_, i) => i !== index);
      
      const { error } = await supabase
        .from('configuracoes')
        .upsert([{
          empresa_id: user.empresa_id,
          chave: 'categorias_servicos',
          valor: novasCategorias as any,
          tipo: 'json'
        }], {
          onConflict: 'empresa_id,chave'
        });

      if (error) throw error;
      
      toast.success('Categoria excluída!');
      loadCategorias();
    } catch (error) {
      console.error('Error deleting categoria:', error);
      toast.error('Erro ao excluir categoria');
    }
  };

  // ===== FUNÇÕES DE GERENCIAMENTO DE USUÁRIOS =====
  
  const loadEmpresaData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', user.empresa_id)
        .single();

      if (error) throw error;
      if (data) setEmpresaData(data as EmpresaData);
    } catch (error) {
      console.error('Error loading empresa data:', error);
      toast.error('Erro ao carregar dados da empresa');
    }
  };

  const loadUsuarios = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .order('conta_principal', { ascending: false })
        .order('nome_completo');

      if (error) throw error;
      if (data) setUsuarios(data as Usuario[]);
    } catch (error) {
      console.error('Error loading usuarios:', error);
      toast.error('Erro ao carregar usuários');
    }
  };

  const loadPlanos = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('empresa_id', user.empresa_id)
        .eq('chave', 'planos_usuarios')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data && data.valor && Array.isArray(data.valor)) {
        setPlanos(data.valor as unknown as PlanoConfig[]);
      } else {
        // Planos padrão
        setPlanos([
          { nome: 'Gratuito', quantidade_acessos_adicionais: 0, modulos: ['dashboard'] },
          { nome: 'Básico', quantidade_acessos_adicionais: 2, modulos: ['dashboard', 'orcamentos', 'servicos', 'clientes'] },
          { nome: 'Profissional', quantidade_acessos_adicionais: 5, modulos: ['dashboard', 'orcamentos', 'servicos', 'funil_vendas', 'agenda', 'clientes', 'estoque', 'financeiro'] },
          { nome: 'Premium', quantidade_acessos_adicionais: 10, modulos: MODULOS_DISPONIVEIS.map(m => m.value) }
        ]);
      }
    } catch (error) {
      console.error('Error loading planos:', error);
      // Usar planos padrão em caso de erro
      setPlanos([
        { nome: 'Gratuito', quantidade_acessos_adicionais: 0, modulos: ['dashboard'] },
        { nome: 'Básico', quantidade_acessos_adicionais: 2, modulos: ['dashboard', 'orcamentos', 'servicos', 'clientes'] }
      ]);
    }
  };

  const handleSavePlanos = async () => {
    if (!user) return;

    try {
      const { data: existing } = await supabase
        .from('configuracoes')
        .select('id')
        .eq('empresa_id', user.empresa_id)
        .eq('chave', 'planos_usuarios')
        .single();

      if (existing) {
        await supabase
          .from('configuracoes')
          .update({ valor: planos as any })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('configuracoes')
          .insert({
            empresa_id: user.empresa_id,
            chave: 'planos_usuarios',
            valor: planos as any,
            tipo: 'json',
            descricao: 'Lista de planos disponíveis para usuários'
          });
      }
      
      toast.success('Planos atualizados com sucesso!');
    } catch (error) {
      console.error('Error saving planos:', error);
      toast.error('Erro ao salvar planos');
    }
  };

  const handleAddPlano = () => {
    if (!novoPlano.nome.trim()) {
      toast.error('Digite o nome do plano');
      return;
    }

    if (planos.some(p => p.nome === novoPlano.nome.trim())) {
      toast.error('Este plano já existe');
      return;
    }

    const novosPlanos = [...planos, { ...novoPlano, nome: novoPlano.nome.trim() }];
    setPlanos(novosPlanos);
    setNovoPlano({ nome: '', quantidade_acessos_adicionais: 0, modulos: [] });
    setShowPlanoDialog(false);
    
    // Salvar automaticamente
    setTimeout(() => {
      handleSavePlanos();
    }, 100);
  };

  const handleDeletePlano = (index: number) => {
    if (!confirm('Deseja realmente excluir este plano?')) return;
    
    const novosPlanos = planos.filter((_, i) => i !== index);
    setPlanos(novosPlanos);
    
    // Salvar automaticamente
    setTimeout(() => {
      handleSavePlanos();
    }, 100);
  };

  const verificarLimiteUsuarios = (): boolean => {
    if (!empresaData) return false;
    
    const usuariosAtivos = usuarios.filter(u => u.status_conta === 'ativo' && u.ativo).length;
    
    if (empresaData.plano === 'Ilimitado') return true;
    if (empresaData.plano === '2 colaboradores' && usuariosAtivos >= 2) return false;
    if (empresaData.plano === '5 colaboradores' && usuariosAtivos >= 5) return false;
    
    return true;
  };

  const handleSaveUsuario = async () => {
    // Validação de campos obrigatórios
    if (!usuarioForm.nome_completo.trim() || !usuarioForm.email.trim() || !usuarioForm.cpf_cnpj.trim()) {
      toast.error('Preencha todos os campos obrigatórios (Nome, E-mail e CPF/CNPJ)');
      return;
    }

    // Validação básica de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(usuarioForm.email.trim())) {
      toast.error('Digite um e-mail válido');
      return;
    }

    // Validação de CPF/CNPJ (deve ter pelo menos 11 dígitos para CPF ou 14 para CNPJ)
    const cpfCnpjNumeros = usuarioForm.cpf_cnpj.replace(/\D/g, '');
    if (cpfCnpjNumeros.length < 11) {
      toast.error('CPF/CNPJ deve ter pelo menos 11 dígitos');
      return;
    }

    if (!user || !empresaData) return;

    // Verificar limite de usuários apenas para novos usuários
    if (!editingUsuario && !verificarLimiteUsuarios()) {
      toast.error('🚫 Limite de usuários do plano atingido. Atualize seu plano para adicionar mais colaboradores.');
      return;
    }

    try {
      const senha = usuarioForm.cpf_cnpj.replace(/\D/g, ''); // Remove pontuação do CPF/CNPJ

      if (editingUsuario) {
        // Atualizar usuário existente
        const { error } = await supabase
          .from('usuarios')
          .update({
            nome_completo: usuarioForm.nome_completo,
            nome: usuarioForm.nome_completo,
            email: usuarioForm.email,
            telefone_whatsapp: usuarioForm.telefone_whatsapp,
            cpf_cnpj: usuarioForm.cpf_cnpj,
            funcao: usuarioForm.funcao,
            observacoes: usuarioForm.observacoes,
            limite_usuarios_criacao: usuarioForm.limite_usuarios_criacao
          })
          .eq('id', editingUsuario.id);

        if (error) throw error;

        // Atualizar módulos de acesso
        await atualizarModulosAcesso(editingUsuario.id, usuarioForm.modulos);
        
        toast.success('Usuário atualizado com sucesso!');
      } else {
        // Criar novo usuário
        const { data: newUser, error } = await supabase
          .from('usuarios')
          .insert({
            empresa_id: user.empresa_id,
            nome_completo: usuarioForm.nome_completo,
            nome: usuarioForm.nome_completo,
            email: usuarioForm.email,
            telefone_whatsapp: usuarioForm.telefone_whatsapp,
            cpf_cnpj: usuarioForm.cpf_cnpj,
            funcao: usuarioForm.funcao,
            observacoes: usuarioForm.observacoes,
            status_conta: 'ativo',
            ativo: true,
            conta_principal: false,
            data_cadastro: new Date().toISOString().split('T')[0],
            primeiro_acesso: true,
            senha_hash: senha,
            limite_usuarios_criacao: usuarioForm.limite_usuarios_criacao
          })
          .select()
          .single();

        if (error) throw error;
        if (newUser) {
          // Adicionar módulos de acesso
          await atualizarModulosAcesso(newUser.id, usuarioForm.modulos);
        }

        toast.success('Usuário cadastrado com sucesso! Senha inicial: CPF/CNPJ');
      }

      setShowUsuarioDialog(false);
      resetUsuarioForm();
      loadUsuarios();
    } catch (error: any) {
      console.error('Error saving usuario:', error);
      if (error.code === '23505') {
        toast.error('E-mail ou CPF/CNPJ já cadastrado');
      } else {
        toast.error('Erro ao salvar usuário');
      }
    }
  };

  const atualizarModulosAcesso = async (userId: string, modulos: string[]) => {
    // Deletar módulos antigos
    await supabase
      .from('user_modulos_acesso')
      .delete()
      .eq('user_id', userId);

    // Inserir novos módulos
    if (modulos.length > 0) {
      const modulosData = modulos.map(modulo => ({
        user_id: userId,
        modulo: modulo as 'dashboard' | 'orcamentos' | 'servicos' | 'funil_vendas' | 'agenda' | 'clientes' | 'estoque' | 'financeiro' | 'contratos' | 'relatorios' | 'configuracoes' | 'vendas'
      }));

      await supabase
        .from('user_modulos_acesso')
        .insert(modulosData);
    }
  };

  const handleEditUsuario = async (usuario: Usuario) => {
    setEditingUsuario(usuario);
    
    // Carregar módulos de acesso do usuário
    const { data: modulosData } = await supabase
      .from('user_modulos_acesso')
      .select('modulo')
      .eq('user_id', usuario.id);

    const modulos = modulosData?.map(m => m.modulo) || [];

    const funcao = usuario.funcao || 'colaborador';
    const permissoesPadrao = PERMISSOES_PADRAO[funcao as keyof typeof PERMISSOES_PADRAO] || [];
    const isModoPersonalizado = JSON.stringify(modulos.sort()) !== JSON.stringify(permissoesPadrao.sort());

    setUsuarioForm({
      nome_completo: usuario.nome_completo || usuario.nome,
      email: usuario.email,
      telefone_whatsapp: usuario.telefone_whatsapp || '',
      cpf_cnpj: usuario.cpf_cnpj || '',
      funcao: funcao,
      observacoes: usuario.observacoes || '',
      modulos: modulos,
      limite_usuarios_criacao: (usuario as any).limite_usuarios_criacao || 0,
      modoPersonalizado: isModoPersonalizado,
      plano: (usuario as any).plano || ''
    });
    
    setShowUsuarioDialog(true);
  };

  const handleToggleUsuarioStatus = async (usuario: Usuario) => {
    try {
      const novoStatus = usuario.status_conta === 'ativo' ? 'inativo' : 'ativo';
      
      const { error } = await supabase
        .from('usuarios')
        .update({ 
          status_conta: novoStatus,
          ativo: novoStatus === 'ativo'
        })
        .eq('id', usuario.id);

      if (error) throw error;
      toast.success(`Usuário ${novoStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso!`);
      loadUsuarios();
    } catch (error) {
      console.error('Error toggling usuario status:', error);
      toast.error('Erro ao alterar status do usuário');
    }
  };

  const handleToggleBloqueio = async (usuario: Usuario) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ bloqueado: !usuario.bloqueado })
        .eq('id', usuario.id);

      if (error) throw error;
      toast.success(`Usuário ${usuario.bloqueado ? 'desbloqueado' : 'bloqueado'} com sucesso!`);
      loadUsuarios();
    } catch (error) {
      console.error('Error toggling usuario bloqueio:', error);
      toast.error('Erro ao alterar bloqueio do usuário');
    }
  };

  const handleFuncaoChange = (funcao: string) => {
    setUsuarioForm(prev => ({
      ...prev,
      funcao,
      modulos: prev.modoPersonalizado ? prev.modulos : PERMISSOES_PADRAO[funcao as keyof typeof PERMISSOES_PADRAO] || []
    }));
  };

  const handleModuloToggle = (modulo: string) => {
    setUsuarioForm(prev => ({
      ...prev,
      modulos: prev.modulos.includes(modulo)
        ? prev.modulos.filter(m => m !== modulo)
        : [...prev.modulos, modulo]
    }));
  };

  const resetUsuarioForm = () => {
    setUsuarioForm({
      nome_completo: '',
      email: '',
      telefone_whatsapp: '',
      cpf_cnpj: '',
      funcao: 'colaborador',
      observacoes: '',
      modulos: [],
      limite_usuarios_criacao: 0,
      modoPersonalizado: false,
      plano: ''
    });
    setEditingUsuario(null);
  };

  const gerarLinkDeConvite = () => {
    if (!user) return;
    const baseUrl = window.location.origin;
    const token = btoa(`${user.empresa_id}:${Date.now()}`); // Token simples para demo
    const link = `${baseUrl}/cadastro-convite?token=${token}`;
    setLinkConvite(link);
    toast.success('Link de convite gerado!');
  };

  const copiarLink = () => {
    navigator.clipboard.writeText(linkConvite);
    toast.success('Link copiado para a área de transferência!');
  };

  const isPagamentoAtrasado = (vencimento: string | null): boolean => {
    if (!vencimento) return false;
    const hoje = new Date();
    const dataVencimento = new Date(vencimento);
    return dataVencimento < hoje;
  };

  const renderEmpresaTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
            <Input 
              id="nomeFantasia" 
              value={empresaInfo.nome_fantasia}
              onChange={(e) => setEmpresaInfo(prev => ({ ...prev, nome_fantasia: e.target.value }))}
              placeholder="Nome da sua empresa"
            />
          </div>
          <div>
            <Label htmlFor="razaoSocial">Razão Social</Label>
            <Input 
              id="razaoSocial" 
              value={empresaInfo.razao_social}
              onChange={(e) => setEmpresaInfo(prev => ({ ...prev, razao_social: e.target.value }))}
              placeholder="Razão social da empresa"
            />
          </div>
          <div>
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input 
              id="cnpj" 
              value={empresaInfo.cnpj}
              onChange={(e) => setEmpresaInfo(prev => ({ ...prev, cnpj: e.target.value }))}
              placeholder="00.000.000/0001-00"
            />
          </div>
          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input 
              id="telefone" 
              value={empresaInfo.telefone}
              onChange={(e) => setEmpresaInfo(prev => ({ ...prev, telefone: e.target.value }))}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input 
              id="email" 
              type="email" 
              value={empresaInfo.email_admin}
              onChange={(e) => setEmpresaInfo(prev => ({ ...prev, email_admin: e.target.value }))}
              placeholder="contato@empresa.com"
            />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input 
              id="website" 
              value={empresaInfo.website}
              onChange={(e) => setEmpresaInfo(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://www.empresa.com"
            />
          </div>
          <div>
            <Label htmlFor="endereco">Endereço</Label>
            <Input 
              id="endereco" 
              value={empresaInfo.endereco}
              onChange={(e) => setEmpresaInfo(prev => ({ ...prev, endereco: e.target.value }))}
              placeholder="Rua, número, bairro"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cidade">Cidade</Label>
              <Input 
                id="cidade" 
                value={empresaInfo.cidade}
                onChange={(e) => setEmpresaInfo(prev => ({ ...prev, cidade: e.target.value }))}
                placeholder="São Paulo"
              />
            </div>
            <div>
              <Label htmlFor="estado">Estado</Label>
              <Input 
                id="estado" 
                value={empresaInfo.estado}
                onChange={(e) => setEmpresaInfo(prev => ({ ...prev, estado: e.target.value }))}
                placeholder="SP"
                maxLength={2}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="cep">CEP</Label>
            <Input 
              id="cep" 
              value={empresaInfo.cep}
              onChange={(e) => setEmpresaInfo(prev => ({ ...prev, cep: e.target.value }))}
              placeholder="00000-000"
            />
          </div>
          <Button onClick={handleSaveEmpresaInfo}>Salvar Informações</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logo da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-4 border-2 border-dashed border-border rounded-lg flex items-center justify-center overflow-hidden bg-muted">
              {empresaInfo.logo_url ? (
                <img src={empresaInfo.logo_url} alt="Logo da empresa" className="w-full h-full object-contain" />
              ) : (
                <Building className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <Input
              id="logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
              disabled={uploadingLogo}
            />
            <Button 
              variant="outline" 
              onClick={() => document.getElementById('logo-upload')?.click()}
              disabled={uploadingLogo}
            >
              {uploadingLogo ? 'Enviando...' : 'Alterar Logo'}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Formato: PNG, JPG (máx. 2MB)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderUsuariosTab = () => (
    <div className="space-y-6">
      {/* Alerta de pagamento atrasado */}
      {empresaData && empresaData.data_proximo_pagamento && isPagamentoAtrasado(empresaData.data_proximo_pagamento) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
          <div className="flex-1">
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              ⚠️ Pagamento em atraso
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Regularize para evitar bloqueio automático. Vencimento: {format(new Date(empresaData.data_proximo_pagamento), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
          </div>
        </div>
      )}


      {/* Card de Gerenciamento de Planos */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Planos Disponíveis</CardTitle>
            <Dialog open={showPlanoDialog} onOpenChange={setShowPlanoDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Plano
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Plano</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nome_plano">Nome do Plano</Label>
                    <Input
                      id="nome_plano"
                      value={novoPlano.nome}
                      onChange={(e) => setNovoPlano({ ...novoPlano, nome: e.target.value })}
                      placeholder="Ex: Básico, Premium..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantidade_acessos">Quantidade de Acessos Adicionais para Colaboradores</Label>
                    <Input
                      id="quantidade_acessos"
                      type="number"
                      min="0"
                      value={novoPlano.quantidade_acessos_adicionais}
                      onChange={(e) => setNovoPlano({ ...novoPlano, quantidade_acessos_adicionais: parseInt(e.target.value) || 0 })}
                      placeholder="Ex: 5"
                    />
                  </div>
                  <div>
                    <Label>Níveis de Acesso (Módulos)</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2 p-4 border rounded-lg">
                      {MODULOS_DISPONIVEIS.map((modulo) => (
                        <div key={modulo.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`plano-modulo-${modulo.value}`}
                            checked={novoPlano.modulos.includes(modulo.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNovoPlano({ ...novoPlano, modulos: [...novoPlano.modulos, modulo.value] });
                              } else {
                                setNovoPlano({ ...novoPlano, modulos: novoPlano.modulos.filter(m => m !== modulo.value) });
                              }
                            }}
                          />
                          <Label 
                            htmlFor={`plano-modulo-${modulo.value}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {modulo.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => {
                      setShowPlanoDialog(false);
                      setNovoPlano({ nome: '', quantidade_acessos_adicionais: 0, modulos: [] });
                    }}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddPlano}>
                      Adicionar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {planos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum plano cadastrado. Adicione um plano para começar.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {planos.map((plano, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-lg">{plano.nome}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePlano(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        <span className="font-medium">Acessos adicionais:</span> {plano.quantidade_acessos_adicionais}
                      </p>
                      <div>
                        <p className="font-medium mb-2">Módulos inclusos:</p>
                        <div className="flex flex-wrap gap-1">
                          {plano.modulos.map((modulo) => {
                            const moduloInfo = MODULOS_DISPONIVEIS.find(m => m.value === modulo);
                            return (
                              <Badge key={modulo} variant="secondary" className="text-xs">
                                {moduloInfo?.label || modulo}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Gerenciamento de Usuários</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setGerarLinkConvite(true); gerarLinkDeConvite(); }}>
                <LinkIcon className="h-4 w-4 mr-2" />
                Gerar Link de Convite
              </Button>
              <Dialog open={showUsuarioDialog} onOpenChange={(open) => {
                setShowUsuarioDialog(open);
                if (!open) resetUsuarioForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nome_completo">Nome Completo *</Label>
                        <Input
                          id="nome_completo"
                          value={usuarioForm.nome_completo}
                          onChange={(e) => setUsuarioForm(prev => ({ ...prev, nome_completo: e.target.value }))}
                          placeholder="Nome completo do usuário"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">E-mail *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={usuarioForm.email}
                          onChange={(e) => setUsuarioForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="telefone_whatsapp">Telefone/WhatsApp</Label>
                        <Input
                          id="telefone_whatsapp"
                          value={usuarioForm.telefone_whatsapp}
                          onChange={(e) => setUsuarioForm(prev => ({ ...prev, telefone_whatsapp: e.target.value }))}
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cpf_cnpj">CPF/CNPJ *</Label>
                        <Input
                          id="cpf_cnpj"
                          value={usuarioForm.cpf_cnpj}
                          onChange={(e) => setUsuarioForm(prev => ({ ...prev, cpf_cnpj: e.target.value }))}
                          placeholder="000.000.000-00"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Senha inicial será o CPF/CNPJ sem pontuação</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="funcao">Função</Label>
                        <Select value={usuarioForm.funcao} onValueChange={handleFuncaoChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="administrador">Administrador</SelectItem>
                            <SelectItem value="gerente">Gerente</SelectItem>
                            <SelectItem value="lider">Líder</SelectItem>
                            <SelectItem value="colaborador">Colaborador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="plano">Plano</Label>
                        <Select 
                          value={usuarioForm.plano} 
                          onValueChange={(value) => setUsuarioForm(prev => ({ ...prev, plano: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um plano" />
                          </SelectTrigger>
                          <SelectContent>
                            {planos.map((plano) => (
                              <SelectItem key={plano.nome} value={plano.nome}>
                                {plano.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="limite_usuarios">Limite de Usuários que pode Criar</Label>
                        <Select 
                          value={usuarioForm.limite_usuarios_criacao.toString()} 
                          onValueChange={(value) => setUsuarioForm(prev => ({ ...prev, limite_usuarios_criacao: parseInt(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Sem permissão</SelectItem>
                            <SelectItem value="2">2 usuários</SelectItem>
                            <SelectItem value="5">5 usuários</SelectItem>
                            <SelectItem value="-1">Ilimitado</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Define quantos usuários este usuário poderá criar
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Níveis de Acesso (Módulos)</Label>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="modo-personalizado" className="text-sm font-normal cursor-pointer">
                            Personalizado
                          </Label>
                          <Switch
                            id="modo-personalizado"
                            checked={usuarioForm.modoPersonalizado}
                            onCheckedChange={(checked) => {
                              setUsuarioForm(prev => ({
                                ...prev,
                                modoPersonalizado: checked,
                                modulos: checked ? prev.modulos : PERMISSOES_PADRAO[prev.funcao as keyof typeof PERMISSOES_PADRAO] || []
                              }));
                            }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-2 max-h-60 overflow-y-auto p-2 border rounded-md bg-muted/50">
                        {MODULOS_DISPONIVEIS.map(modulo => (
                          <div key={modulo.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={modulo.value}
                              checked={usuarioForm.modulos.includes(modulo.value)}
                              onCheckedChange={() => handleModuloToggle(modulo.value)}
                              disabled={!usuarioForm.modoPersonalizado}
                            />
                            <Label 
                              htmlFor={modulo.value} 
                              className={`text-sm ${usuarioForm.modoPersonalizado ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                            >
                              {modulo.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {!usuarioForm.modoPersonalizado ? (
                        <p className="text-xs text-muted-foreground mt-2">
                          ℹ️ Permissões padrão da função selecionada. Ative "Personalizado" para editar manualmente.
                        </p>
                      ) : (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                          ✓ Modo personalizado ativado. Selecione os módulos desejados acima.
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="observacoes">Observações</Label>
                      <Textarea
                        id="observacoes"
                        value={usuarioForm.observacoes}
                        onChange={(e) => setUsuarioForm(prev => ({ ...prev, observacoes: e.target.value }))}
                        placeholder="Observações sobre o usuário..."
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowUsuarioDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveUsuario}>Salvar</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {usuarios.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário cadastrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Último Pgto</TableHead>
                    <TableHead>Próximo Venc.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map(usuario => (
                    <TableRow key={usuario.id} className={usuario.conta_principal ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {(usuario.nome_completo || usuario.nome).slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{usuario.nome_completo || usuario.nome}</p>
                            {usuario.conta_principal && (
                              <Badge variant="outline" className="text-xs">Titular</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>{usuario.telefone_whatsapp || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {usuario.funcao || 'colaborador'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {usuario.ultimo_pagamento ? format(new Date(usuario.ultimo_pagamento), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                      </TableCell>
                      <TableCell>
                        <div>
                          {usuario.proximo_vencimento ? format(new Date(usuario.proximo_vencimento), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                          {usuario.proximo_vencimento && isPagamentoAtrasado(usuario.proximo_vencimento) && (
                            <div className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                              ⚠️ Atrasado
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={usuario.status_conta === 'ativo' ? 'default' : usuario.status_conta === 'suspenso' ? 'destructive' : 'secondary'}>
                            {usuario.status_conta}
                          </Badge>
                          {usuario.bloqueado && (
                            <Badge variant="destructive" className="text-xs">Bloqueado</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditUsuario(usuario)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {!usuario.conta_principal && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleUsuarioStatus(usuario)}
                              >
                                {usuario.status_conta === 'ativo' ? (
                                  <X className="h-4 w-4 text-red-500" />
                                ) : (
                                  <Check className="h-4 w-4 text-green-500" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleBloqueio(usuario)}
                                title={usuario.bloqueado ? 'Desbloquear' : 'Bloquear'}
                              >
                                {usuario.bloqueado ? '🔓' : '🔒'}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Link de Convite */}
      <Dialog open={gerarLinkConvite} onOpenChange={setGerarLinkConvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link de Convite Gerado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Compartilhe este link com a pessoa que deseja convidar. O link permite que ela crie sua própria conta vinculada à sua empresa.
            </p>
            <div className="flex gap-2">
              <Input value={linkConvite} readOnly className="flex-1" />
              <Button onClick={copiarLink}>
                <LinkIcon className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>
            <Button className="w-full" onClick={() => setGerarLinkConvite(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderColaboradoresTab = () => (
    <div className="max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Colaboradores</CardTitle>
            <Dialog open={showColaboradorDialog} onOpenChange={(open) => {
              setShowColaboradorDialog(open);
              if (!open) {
                setNomeColaborador('');
                setFuncaoColaborador('');
                setEditingColaborador(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Colaborador
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingColaborador ? 'Editar Colaborador' : 'Novo Colaborador'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nomeColaborador">Nome *</Label>
                    <Input
                      id="nomeColaborador"
                      value={nomeColaborador}
                      onChange={(e) => setNomeColaborador(e.target.value)}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="funcaoColaborador">Função</Label>
                    <Input
                      id="funcaoColaborador"
                      value={funcaoColaborador}
                      onChange={(e) => setFuncaoColaborador(e.target.value)}
                      placeholder="Ex: Técnico, Instalador, etc."
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowColaboradorDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveColaborador}>Salvar</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {colaboradores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum colaborador cadastrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colaboradores.map(colaborador => (
                  <TableRow key={colaborador.id}>
                    <TableCell className="font-medium">{colaborador.nome}</TableCell>
                    <TableCell>{colaborador.funcao || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={colaborador.ativo ? 'default' : 'secondary'}>
                        {colaborador.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditColaborador(colaborador)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleColaboradorStatus(colaborador)}
                        >
                          {colaborador.ativo ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteColaborador(colaborador.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderCategoriasTab = () => (
    <div className="max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Categorias de Serviços/Produtos</CardTitle>
            <Dialog open={showNewCategory} onOpenChange={(open) => {
              setShowNewCategory(open);
              if (!open) {
                setNomeCategoria('');
                setCorCategoria('#3B82F6');
                setEditingCategoriaIndex(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategoriaIndex !== null ? 'Editar Categoria' : 'Nova Categoria'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nomeCategoria">Nome *</Label>
                    <Input 
                      id="nomeCategoria" 
                      placeholder="Nome da categoria"
                      value={nomeCategoria}
                      onChange={(e) => setNomeCategoria(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="corCategoria">Cor</Label>
                    <div className="flex gap-2 items-center">
                      <Input 
                        id="corCategoria" 
                        type="color" 
                        value={corCategoria}
                        onChange={(e) => setCorCategoria(e.target.value)}
                        className="w-20 h-10"
                      />
                      <span className="text-sm text-muted-foreground">{corCategoria}</span>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowNewCategory(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveCategoria}>Salvar</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {categorias.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">Nenhuma categoria cadastrada</p>
              <p className="text-sm">Clique em "Nova Categoria" para começar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {categorias.map((categoria, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: categoria.cor }}
                    ></div>
                    <span>{categoria.nome}</span>
                  </div>
                  <div className="flex space-x-1">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleEditCategoria(index)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleDeleteCategoria(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
            Integração WhatsApp (Gratuita)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-3 rounded-lg text-sm">
            <p className="font-medium mb-1">Integração gratuita via WhatsApp Web</p>
            <p className="text-muted-foreground">
              Configure o número padrão do WhatsApp da empresa. 
              Ao enviar mensagens pelo sistema, o WhatsApp Web será aberto automaticamente.
            </p>
            <p className="text-amber-600 dark:text-amber-500 mt-2 flex items-center gap-1">
              <Bell className="h-4 w-4" />
              <span className="font-medium">Importante:</span> Permita pop-ups neste site para que o WhatsApp abra corretamente.
            </p>
          </div>
          <div>
            <Label htmlFor="whatsappPhone">Número do Telefone *</Label>
            <Input 
              id="whatsappPhone" 
              placeholder="5511999999999" 
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Formato: Código do país + DDD + número (ex: 5511999999999)
            </p>
          </div>
          <Button onClick={handleSaveWhatsApp}>Salvar Configuração</Button>
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
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-7">
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="colaboradores">Colaboradores</TabsTrigger>
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

        <TabsContent value="colaboradores" className="mt-6">
          {renderColaboradoresTab()}
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