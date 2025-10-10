import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useWhatsAppConfig() {
  const { user } = useAuth();
  const [defaultPhone, setDefaultPhone] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.empresa_id) {
      loadWhatsAppConfig();
    }
  }, [user?.empresa_id]);

  const loadWhatsAppConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('empresa_id', user!.empresa_id)
        .eq('chave', 'whatsapp_phone')
        .single();

      if (error) throw error;
      
      if (data?.valor) {
        setDefaultPhone(data.valor as string);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração WhatsApp:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveWhatsAppConfig = async (phone: string) => {
    try {
      const { error } = await supabase
        .from('configuracoes')
        .upsert({
          empresa_id: user!.empresa_id,
          chave: 'whatsapp_phone',
          valor: phone,
          tipo: 'texto',
          descricao: 'Número padrão do WhatsApp'
        }, {
          onConflict: 'empresa_id,chave'
        });

      if (error) throw error;
      setDefaultPhone(phone);
      return true;
    } catch (error) {
      console.error('Erro ao salvar configuração WhatsApp:', error);
      return false;
    }
  };

  const formatPhoneNumber = (phone: string): string => {
    // Remove tudo que não é número
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Adiciona código do Brasil se não tiver
    if (cleanPhone.length === 11) {
      return `55${cleanPhone}`;
    } else if (cleanPhone.length === 10) {
      return `55${cleanPhone}`;
    }
    
    return cleanPhone;
  };

  return {
    defaultPhone,
    loading,
    saveWhatsAppConfig,
    formatPhoneNumber
  };
}
