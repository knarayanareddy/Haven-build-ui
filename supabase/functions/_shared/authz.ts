import { admin } from './core.ts';

export async function getJwtUser(req: Request) {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) throw new Error('Missing bearer token');
  const { data, error } = await admin().auth.getUser(token);
  if (error || !data.user) throw new Error('Invalid bearer token');
  return data.user;
}

export async function getJwtUserId(req: Request) {
  return (await getJwtUser(req)).id;
}

export async function getProfileRole(userId: string) {
  const { data, error } = await admin().from('profiles').select('role').eq('id', userId).single();
  if (error || !data?.role) throw new Error('Could not determine caller role');
  return String(data.role);
}

export function assertSelf(userId: string, claimedId: string, label = 'resource owner') {
  if (userId !== claimedId) throw new Error(`Caller is not allowed to act for this ${label}`);
  return true;
}

export async function assertSelfOrAdmin(userId: string, claimedId: string) {
  if (userId === claimedId) return true;
  if (await getProfileRole(userId) === 'admin') return true;
  throw new Error('Caller is not allowed to access this elder record');
}

export function assertActorMatches(userId: string, claimedId: string | undefined, fieldName: string) {
  if (claimedId && claimedId !== userId) throw new Error(`${fieldName} must match the authenticated caller`);
  return true;
}

export async function assertElderOrFamilyCan(userId: string, elderId: string, permission: string) {
  if (userId === elderId) return true;
  const { data } = await admin()
    .from('family_relationships')
    .select('*')
    .eq('elder_id', elderId)
    .eq('family_member_id', userId)
    .eq('elder_consented', true)
    .eq('is_active', true)
    .maybeSingle();
  if (!data) throw new Error('No active elder consent');
  const field = {
    medications: 'can_view_medications',
    messages: 'can_view_messages',
    location: 'can_view_location_events',
    alerts: 'can_view_alerts',
    stories: 'can_view_stories',
    financials: 'can_view_financials',
  }[permission] ?? permission;
  if (!data[field]) throw new Error(`Missing permission: ${permission}`);
  return true;
}

export async function assertCarerCan(userId: string, elderId: string) {
  const { data } = await admin()
    .from('carer_relationships')
    .select('id')
    .eq('elder_id', elderId)
    .eq('carer_member_id', userId)
    .eq('elder_consented', true)
    .eq('is_active', true)
    .maybeSingle();
  if (!data) throw new Error('No active carer consent');
  return true;
}

export async function assertCarerPermission(userId: string, elderId: string, permission: string) {
  const { data } = await admin()
    .from('carer_relationships')
    .select('*')
    .eq('elder_id', elderId)
    .eq('carer_member_id', userId)
    .eq('elder_consented', true)
    .eq('is_active', true)
    .maybeSingle();
  if (!data) throw new Error('No active carer consent');
  const field = {
    visit_logs: 'can_view_visit_logs',
    create_visit_logs: 'can_create_visit_logs',
    incidents: 'can_file_incidents',
    medications: 'can_view_medications',
  }[permission] ?? permission;
  if (!data[field]) throw new Error(`Missing carer permission: ${permission}`);
  return true;
}
