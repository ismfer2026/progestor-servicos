import { createClient } from '@supabase/supabase-js';

// Configure these values
const SUPABASE_URL = "https://fapcvweygrzepxcnaojl.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // You need to set this environment variable

// New admin user details
const adminEmail = "ism01art@gmail.com";
const adminPassword = "123456";
const adminName = "Administrador Geral";

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY environment variable is not set!');
  console.error('Please set it using: set SUPABASE_SERVICE_KEY=your_key (on Windows)');
  process.exit(1);
}

async function createAdminUser() {
  try {
    console.log('🔄 Creating admin user...');
    
    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Step 1: Create user in Auth
    console.log('📝 Creating user in authentication...');
    const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: adminName,
      },
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError.message);
      process.exit(1);
    }

    console.log('✅ Auth user created:', user.id);

    // Step 2: Create company/empresa first
    console.log('📝 Creating company (empresa)...');
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .insert({
        nome: 'Administração Geral',
        status_pagamento: 'ativo',
        acesso_vitalicio: true,
        data_criacao: new Date().toISOString(),
      })
      .select()
      .single();

    if (empresaError) {
      console.log('⚠️  Could not create new company, trying to use existing one...');
      // Try to get an existing company
      const { data: existingEmpresa, error: fetchError } = await supabase
        .from('empresas')
        .select('id')
        .limit(1)
        .single();

      if (fetchError || !existingEmpresa) {
        console.error('❌ Error getting existing company:', fetchError?.message);
        process.exit(1);
      }
      
      // Step 3: Create user record in usuarios table
      console.log('📝 Creating user record in database...');
      const { error: usuarioError } = await supabase
        .from('usuarios')
        .insert({
          id: user.id,
          email: adminEmail,
          nome: adminName,
          permissao: 'admin',
          empresa_id: existingEmpresa.id,
          ativo: true,
          primeiro_acesso: true,
          conta_principal: true,
          data_cadastro: new Date().toISOString(),
        });

      if (usuarioError) {
        console.error('❌ Error creating usuario record:', usuarioError.message);
        process.exit(1);
      }
    } else {
      // Step 3: Create user record in usuarios table with new empresa
      console.log('📝 Creating user record in database...');
      const { error: usuarioError } = await supabase
        .from('usuarios')
        .insert({
          id: user.id,
          email: adminEmail,
          nome: adminName,
          permissao: 'admin',
          empresa_id: empresa.id,
          ativo: true,
          primeiro_acesso: true,
          conta_principal: true,
          data_cadastro: new Date().toISOString(),
        });

      if (usuarioError) {
        console.error('❌ Error creating usuario record:', usuarioError.message);
        process.exit(1);
      }
    }

    console.log('✅ User record created in database');
    console.log('\n🎉 Admin user created successfully!');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔐 Password: ${adminPassword}`);
    console.log('\n⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

createAdminUser();
