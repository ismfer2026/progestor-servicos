import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createTransport } from "npm:nodemailer@6.9.7";

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
  console.log("testar-email function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { smtpHost, smtpPort, smtpSecurity, smtpUser, smtpPass, testEmail }: EmailTestRequest = body;

    console.log(`Testing SMTP: ${smtpHost}:${smtpPort} (${smtpSecurity})`);

    if (!smtpHost || !smtpUser || !smtpPass) {
      throw new Error("Configurações incompletas");
    }

    // Configurar transporter do nodemailer
    const transporter = createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecurity === 'ssl', // true para porta 465, false para outras portas
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false, // Aceita certificados autoassinados
      },
    });

    console.log("Verifying SMTP connection...");
    
    // Verificar conexão
    try {
      await transporter.verify();
      console.log("SMTP connection verified successfully");
      
      // Enviar email de teste
      console.log(`Sending test email to ${testEmail}`);
      const info = await transporter.sendMail({
        from: smtpUser,
        to: testEmail,
        subject: "Teste de Configuração SMTP",
        text: `Configuração SMTP Testada com Sucesso!

Este é um e-mail de teste enviado pelo sistema.
Se você recebeu esta mensagem, suas configurações SMTP estão funcionando corretamente.

Servidor: ${smtpHost}
Porta: ${smtpPort}
Segurança: ${smtpSecurity.toUpperCase()}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
            <h2 style="color: #4CAF50;">✅ Configuração SMTP Testada com Sucesso!</h2>
            <p>Este é um e-mail de teste enviado pelo sistema.</p>
            <p>Se você recebeu esta mensagem, suas configurações SMTP estão funcionando corretamente.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 14px;">
              <strong>Servidor:</strong> ${smtpHost}<br>
              <strong>Porta:</strong> ${smtpPort}<br>
              <strong>Segurança:</strong> ${smtpSecurity.toUpperCase()}
            </p>
          </div>
        `,
      });
      
      console.log("Test email sent successfully:", info.messageId);
      
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
      console.error("SMTP verification/send error:", error);
      
      let errorMessage = "Erro ao testar conexão SMTP";
      
      if (error.code === 'EAUTH' || error.responseCode === 535) {
        errorMessage = "Erro de autenticação. Verifique usuário e senha.";
      } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
        errorMessage = "Erro de conexão. Verifique servidor e porta.";
      } else if (error.code === 'ESOCKET') {
        errorMessage = "Erro de conexão. Verifique o tipo de segurança (TLS/SSL).";
      }
      
      throw new Error(`${errorMessage} - ${error.message}`);
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
