import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { format } from 'date-fns';

interface ImportarArquivoDialogProps {
  empresaId: string;
  bancos: any[];
  categorias: any[];
  onImportSuccess: () => void;
  onCancel: () => void;
}

interface MovimentacaoImportada {
  data: string;
  descricao: string;
  valor: number;
  tipo: 'receber' | 'pagar';
}

export default function ImportarArquivoDialog({ 
  empresaId, 
  bancos, 
  categorias,
  onImportSuccess, 
  onCancel 
}: ImportarArquivoDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [bancoId, setBancoId] = useState('');
  const [categoria, setCategoria] = useState('');
  const [processing, setProcessing] = useState(false);

  const parseOFX = (content: string): MovimentacaoImportada[] => {
    const movimentacoes: MovimentacaoImportada[] = [];
    
    // Regex para extrair transações OFX
    const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
    let match;

    while ((match = transactionRegex.exec(content)) !== null) {
      const transaction = match[1];
      
      // Extrair campos da transação
      const dateMatch = transaction.match(/<DTPOSTED>(\d{8})/);
      const amountMatch = transaction.match(/<TRNAMT>([-\d.]+)/);
      const memoMatch = transaction.match(/<MEMO>(.*?)<\//);
      
      if (dateMatch && amountMatch) {
        const dateStr = dateMatch[1];
        const date = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
        const valor = parseFloat(amountMatch[1]);
        const descricao = memoMatch ? memoMatch[1].trim() : 'Transação importada';

        movimentacoes.push({
          data: date,
          descricao,
          valor: Math.abs(valor),
          tipo: valor >= 0 ? 'receber' : 'pagar'
        });
      }
    }

    return movimentacoes;
  };

  const parseCSV = (content: string): Promise<MovimentacaoImportada[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const movimentacoes: MovimentacaoImportada[] = [];
          
          console.log('Total de linhas parseadas:', results.data.length);
          console.log('Primeira linha de dados:', results.data[0]);
          
          results.data.forEach((row: any, index: number) => {
            // Tentar diferentes formatos de CSV comuns
            const data = row.data || row.Data || row.DATE || row.date || 
                        row['Data Lançamento'] || row['Data Lancamento'] || 
                        row['Data Contábil'] || row['Data Contabil'];
            
            const descricao = row.descricao || row.Descricao || row.DESCRIPTION || row.description || 
                             row.historico || row.Historico || row.Título || row.Titulo || 
                             row['Descrição'] || row['Descricao'];
            
            // Suporte para formato C6 Bank e outros bancos brasileiros com colunas separadas de entrada/saída
            const entrada = row['Entrada(R$)'] || row.Entrada || row.entrada || row.credito || row.Credito;
            const saida = row['Saída(R$)'] || row.Saida || row.saida || row.debito || row.Debito;
            
            // Formato tradicional com coluna única de valor
            const valorStr = row.valor || row.Valor || row.AMOUNT || row.amount;
            const tipoStr = row.tipo || row.Tipo || row.TYPE || row.type;

            console.log(`Linha ${index}:`, { data, descricao, entrada, saida });

            // Processar apenas se tiver data e descrição
            if (data && descricao) {
              // Converter data para formato YYYY-MM-DD
              let dataFormatada = data;
              if (data.includes('/')) {
                const parts = data.split('/');
                if (parts.length === 3) {
                  // Assumir DD/MM/YYYY
                  dataFormatada = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
              }

              let valor = 0;
              let tipo: 'receber' | 'pagar' = 'receber';

              // Se tiver colunas separadas de entrada/saída (formato C6 Bank)
              if (entrada !== undefined || saida !== undefined) {
                const entradaLimpo = entrada ? entrada.toString().replace(/[^\d.,-]/g, '').replace(',', '.') : '0';
                const saidaLimpo = saida ? saida.toString().replace(/[^\d.,-]/g, '').replace(',', '.') : '0';
                
                const valorEntrada = parseFloat(entradaLimpo) || 0;
                const valorSaida = parseFloat(saidaLimpo) || 0;

                console.log(`Processando linha ${index}: entrada=${valorEntrada}, saida=${valorSaida}`);

                if (valorEntrada > 0) {
                  valor = valorEntrada;
                  tipo = 'receber';
                } else if (valorSaida > 0) {
                  valor = valorSaida;
                  tipo = 'pagar';
                } else {
                  // Pular se não tiver valor
                  console.log(`Pulando linha ${index} - sem valor`);
                  return;
                }
              } 
              // Formato tradicional com coluna única de valor
              else if (valorStr) {
                const valorLimpo = valorStr.toString().replace(/[^\d.,-]/g, '').replace(',', '.');
                valor = Math.abs(parseFloat(valorLimpo));

                // Determinar tipo
                if (tipoStr) {
                  tipo = tipoStr.toLowerCase().includes('pagar') || 
                         tipoStr.toLowerCase().includes('debito') || 
                         tipoStr.toLowerCase().includes('saida') 
                    ? 'pagar' 
                    : 'receber';
                } else {
                  // Se não tiver tipo, assumir pelo sinal do valor
                  tipo = parseFloat(valorLimpo) < 0 ? 'pagar' : 'receber';
                }
              } else {
                // Pular se não tiver valor
                console.log(`Pulando linha ${index} - sem coluna de valor`);
                return;
              }

              if (valor > 0) {
                console.log(`Adicionando movimentação: ${descricao} - R$ ${valor}`);
                movimentacoes.push({
                  data: dataFormatada,
                  descricao: descricao.toString().trim(),
                  valor,
                  tipo
                });
              }
            } else {
              console.log(`Pulando linha ${index} - falta data ou descrição`);
            }
          });

          console.log('Total de movimentações encontradas:', movimentacoes.length);
          resolve(movimentacoes);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Selecione um arquivo');
      return;
    }

    if (!bancoId) {
      toast.error('Selecione um banco');
      return;
    }

    setProcessing(true);

    try {
      const fileContent = await file.text();
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      let movimentacoes: MovimentacaoImportada[] = [];

      if (fileExtension === 'ofx') {
        movimentacoes = parseOFX(fileContent);
      } else if (fileExtension === 'csv') {
        movimentacoes = await parseCSV(fileContent);
      } else {
        toast.error('Formato de arquivo não suportado');
        setProcessing(false);
        return;
      }

      if (movimentacoes.length === 0) {
        toast.error('Nenhuma movimentação encontrada no arquivo');
        setProcessing(false);
        return;
      }

      // Importar movimentações para o Supabase
      const { supabase } = await import('@/integrations/supabase/client');
      
      const movimentacoesParaInserir = movimentacoes.map(mov => ({
        empresa_id: empresaId,
        banco_id: bancoId,
        tipo: mov.tipo,
        descricao: mov.descricao,
        valor: mov.valor,
        data_vencimento: mov.data,
        categoria: categoria || null,
        status: 'pago',
        data_pagamento: mov.data
      }));

      const { error } = await supabase
        .from('financeiro_movimentacoes')
        .insert(movimentacoesParaInserir);

      if (error) throw error;

      toast.success(`${movimentacoes.length} movimentações importadas com sucesso!`);
      onImportSuccess();
    } catch (error) {
      console.error('Error importing file:', error);
      toast.error('Erro ao importar arquivo');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Arquivo OFX/CSV</label>
        <Input 
          type="file" 
          accept=".ofx,.csv" 
          onChange={handleFileChange}
          disabled={processing}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Formatos aceitos: OFX, CSV (data, descrição, valor, tipo)
        </p>
      </div>

      <div>
        <label className="text-sm font-medium">Banco *</label>
        <Select value={bancoId} onValueChange={setBancoId} disabled={processing}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o banco" />
          </SelectTrigger>
          <SelectContent>
            {bancos.map(banco => (
              <SelectItem key={banco.id} value={banco.id}>
                {banco.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium">Categoria Padrão (Opcional)</label>
        <Select value={categoria} onValueChange={setCategoria} disabled={processing}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {categorias.map(cat => (
              <SelectItem key={cat.id} value={cat.nome}>
                {cat.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={processing}>
          Cancelar
        </Button>
        <Button onClick={handleImport} disabled={processing || !file}>
          {processing ? 'Importando...' : 'Importar'}
        </Button>
      </div>
    </div>
  );
}
