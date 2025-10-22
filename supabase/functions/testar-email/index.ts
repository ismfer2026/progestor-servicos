import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailTestRequest {
  smtpHost: string;
  smtpPort: number;
  smtpSecurity: string;
  smtpUser: string;
  smtpPass: string;
  testEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { smtpHost, smtpPort, smtpSecurity, smtpUser, smtpPass, testEmail }: EmailTestRequest = await req.json();

    console.log(`Testing email connection to ${smtpHost}:${smtpPort} with security ${smtpSecurity}`);

    if (!smtpHost || !smtpUser || !smtpPass) {
      throw new Error("Configurações incompletas");
    }

    // Configurar cliente SMTP
    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: smtpSecurity === 'tls' || smtpSecurity === 'ssl',
        auth: {
          username: smtpUser,
          password: smtpPass,
        },
      },
    });

    try {
      // Enviar e-mail de teste simples (apenas texto)
      await client.send({
        from: smtpUser,
        to: testEmail,
        subject: "Teste de Configuracao SMTP",
        content: `Configuracao SMTP Testada com Sucesso!

Este e um e-mail de teste enviado pelo sistema.
Se voce recebeu esta mensagem, suas configuracoes SMTP estao funcionando corretamente.

Servidor: ${smtpHost}
Porta: ${smtpPort}
Seguranca: ${smtpSecurity.toUpperCase()}`,
      });

      await client.close();
      
      console.log(`Test email sent successfully to ${testEmail}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "E-mail de teste enviado com sucesso! Verifique sua caixa de entrada." 
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    } catch (error: any) {
      console.error("SMTP error:", error);
      
      try {
        await client.close();
      } catch (e) {
        console.error("Error closing client:", e);
      }
      
      let errorMessage = "Erro ao enviar e-mail de teste";
      
      if (error.message && error.message.includes("authentication")) {
        errorMessage = "Erro de autenticação. Verifique usuário e senha.";
      } else if (error.message && error.message.includes("connection")) {
        errorMessage = "Erro de conexão. Verifique servidor e porta.";
      } else if (error.message && (error.message.includes("tls") || error.message.includes("ssl"))) {
        errorMessage = "Erro de segurança. Verifique o tipo de segurança (TLS/SSL).";
      }
      
      throw new Error(`${errorMessage}: ${error.message || error.name}`);
    }
  } catch (error: any) {
    console.error("Error in email test function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Erro ao testar configuração de e-mail" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
