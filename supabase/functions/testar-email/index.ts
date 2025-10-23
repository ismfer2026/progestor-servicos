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

async function testSmtpConnection(
  host: string,
  port: number,
  secure: boolean,
  user: string,
  pass: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Conectar ao servidor SMTP
    const conn = await Deno.connect({
      hostname: host,
      port: port,
    });

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    
    // Buffer para ler respostas
    const buffer = new Uint8Array(1024);
    
    // Ler banner de boas-vindas
    await conn.read(buffer);
    console.log("Banner:", decoder.decode(buffer));
    
    // EHLO
    await conn.write(encoder.encode(`EHLO lovable.dev\r\n`));
    await conn.read(buffer);
    console.log("EHLO response:", decoder.decode(buffer));
    
    // STARTTLS se necessário
    if (secure && port !== 465) {
      await conn.write(encoder.encode(`STARTTLS\r\n`));
      await conn.read(buffer);
      console.log("STARTTLS response:", decoder.decode(buffer));
    }
    
    // AUTH LOGIN
    await conn.write(encoder.encode(`AUTH LOGIN\r\n`));
    await conn.read(buffer);
    
    // Enviar username em base64
    const userB64 = btoa(user);
    await conn.write(encoder.encode(`${userB64}\r\n`));
    await conn.read(buffer);
    
    // Enviar password em base64
    const passB64 = btoa(pass);
    await conn.write(encoder.encode(`${passB64}\r\n`));
    const authResponse = await conn.read(buffer);
    const authText = decoder.decode(buffer.subarray(0, authResponse || 0));
    
    console.log("AUTH response:", authText);
    
    // QUIT
    await conn.write(encoder.encode(`QUIT\r\n`));
    conn.close();
    
    // Verificar se autenticação foi bem-sucedida
    if (authText.includes("235") || authText.includes("Authentication successful")) {
      return {
        success: true,
        message: "Autenticação SMTP realizada com sucesso! Credenciais válidas."
      };
    } else if (authText.includes("535") || authText.includes("authentication failed")) {
      return {
        success: false,
        message: "Erro de autenticação. Verifique usuário e senha."
      };
    } else {
      return {
        success: false,
        message: `Resposta inesperada do servidor: ${authText.substring(0, 100)}`
      };
    }
  } catch (error: any) {
    console.error("Connection error:", error);
    
    if (error.message?.includes("connection refused")) {
      return {
        success: false,
        message: "Conexão recusada. Verifique o host e porta."
      };
    } else if (error.message?.includes("timeout")) {
      return {
        success: false,
        message: "Timeout na conexão. Verifique o host e porta."
      };
    } else {
      return {
        success: false,
        message: `Erro na conexão: ${error.message}`
      };
    }
  }
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

    const isSecure = smtpSecurity === 'tls' || smtpSecurity === 'ssl';
    const result = await testSmtpConnection(smtpHost, smtpPort, isSecure, smtpUser, smtpPass);
    
    if (result.success) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: result.message
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.message
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
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
