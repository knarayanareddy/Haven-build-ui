import { admin } from './core.ts';

function readInternalKey() {
  return Deno.env.get('HAVEN_INTERNAL_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? null;
}

export function requireInternalAccess(req: Request) {
  const expected = readInternalKey();
  if (!expected) throw new Error('HAVEN internal access key is not configured');
  const provided = req.headers.get('x-haven-internal-key') ?? req.headers.get('x-internal-key');
  if (!provided || provided !== expected) throw new Error('Internal access required');
  return true;
}

export function requireVendorSecretHeader(req: Request, envName: string, headerNames: string[]) {
  const expected = Deno.env.get(envName);
  if (!expected) throw new Error(`${envName} is not configured`);
  const provided = headerNames.map((name) => req.headers.get(name)).find(Boolean);
  if (!provided || provided !== expected) throw new Error(`Missing or invalid vendor secret for ${envName}`);
  return true;
}

export async function requireAdminBearer(req: Request) {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) throw new Error('Admin bearer token is required');
  const { data, error } = await admin().auth.getUser(token);
  if (error || !data.user) throw new Error('Invalid admin bearer token');
  const { data: profile, error: profileError } = await admin().from('profiles').select('role').eq('id', data.user.id).single();
  if (profileError || profile?.role !== 'admin') throw new Error('Admin role required');
  return data.user.id;
}
