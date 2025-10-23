import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
  console.log("testar-email function called", { method: req.method });
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Request body received:", { 
      smtpHost: body.smtpHost, 
      smtpPort: body.smtpPort,
      smtpSecurity: body.smtpSecurity,
      hasUser: !!body.smtpUser,
      hasPass: !!body.smtpPass,
      testEmail: body.testEmail
    });
    
    const { smtpHost, smtpPort, smtpSecurity, smtpUser, smtpPass, testEmail }: EmailTestRequest = body;

    console.log(`Testing email connection to ${smtpHost}:${smtpPort} with security ${smtpSecurity}`);

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error("Missing configuration");
      throw new Error("Configurações incompletas");
    }

    // Criar comando SMTP usando raw TCP
    const secure = smtpSecurity === 'ssl' || smtpSecurity === 'tls';
    const protocol = secure ? 'smtps' : 'smtp';
    
    console.log(`Attempting to send email via ${protocol}://${smtpHost}:${smtpPort}`);
    
    // Usar curl para enviar email de teste
    const emailBody = `From: ${smtpUser}
To: ${testEmail}
Subject: Teste de Configuracao SMTP
Content-Type: text/plain; charset=utf-8

Configuracao SMTP Testada com Sucesso!

Este e um e-mail de teste enviado pelo sistema.
Se voce recebeu esta mensagem, suas configuracoes SMTP estao funcionando corretamente.

Servidor: ${smtpHost}
Porta: ${smtpPort}
Seguranca: ${smtpSecurity.toUpperCase()}`;

    // Criar comando curl
    const curlCommand = [
      'curl',
      '--url', `${protocol}://${smtpHost}:${smtpPort}`,
      '--mail-from', smtpUser,
      '--mail-rcpt', testEmail,
      '--user', `${smtpUser}:${smtpPass}`,
      '--upload-file', '-',
    ];
    
    if (secure) {
      curlCommand.push('--ssl-reqd');
    }
    
    console.log("Executing curl command (password hidden)");
    
    try {
      const process = new Deno.Command('curl', {
        args: curlCommand.slice(1),
        stdin: 'piped',
        stdout: 'piped',
        stderr: 'piped',
      });

      const child = process.spawn();
      
      // Enviar o corpo do email via stdin
      const writer = child.stdin.getWriter();
      await writer.write(new TextEncoder().encode(emailBody));
      await writer.close();
      
      const { code, stdout, stderr } = await child.output();
      
      const stdoutText = new TextDecoder().decode(stdout);
      const stderrText = new TextDecoder().decode(stderr);
      
      console.log("Curl exit code:", code);
      console.log("Curl stdout:", stdoutText);
      console.log("Curl stderr:", stderrText);
      
      if (code !== 0) {
        let errorMessage = "Erro ao enviar e-mail de teste";
        
        if (stderrText.includes("authentication") || stderrText.includes("login") || stderrText.includes("535")) {
          errorMessage = "Erro de autenticação. Verifique usuário e senha.";
        } else if (stderrText.includes("connect") || stderrText.includes("resolve")) {
          errorMessage = "Erro de conexão. Verifique servidor e porta.";
        } else if (stderrText.includes("ssl") || stderrText.includes("tls")) {
          errorMessage = "Erro de segurança. Verifique o tipo de segurança (TLS/SSL).";
        }
        
        throw new Error(`${errorMessage}: ${stderrText || stdoutText}`);
      }
      
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
      console.error("SMTP/Curl error:", error);
      throw error;
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
