-- Delete the existing user from auth.users to force recreation with proper password
DELETE FROM auth.users WHERE email = 'fernandohenrriquedeoliveira@gmail.com';

-- Also clean up the corresponding profile
DELETE FROM public.usuarios WHERE email = 'fernandohenrriquedeoliveira@gmail.com';