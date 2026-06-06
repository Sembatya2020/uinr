import { supabase, isConfigured } from './supabase';

/* Fetch the profile row for a given Supabase auth user id and
   return a unified user object the rest of the app expects. */
async function loadProfile(authUser) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, username, role, district, status, must_change_password')
    .eq('id', authUser.id)
    .single();
  if (error) throw new Error(`Profile lookup failed: ${error.message}`);
  if (!data) throw new Error('No profile found for this account. Contact your administrator.');
  if (data.status === 'Suspended') throw new Error('This account has been suspended.');
  return {
    id: data.id,
    email: authUser.email,
    name: data.name,
    username: data.username,
    role: data.role,
    district: data.district,
    status: data.status,
    mustChangePassword: !!data.must_change_password
  };
}

export async function signInWithEmail(email, password) {
  if (!isConfigured) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return loadProfile(data.user);
}

export async function signUpOrganization({ email, password, name, organizationName, phone, district, orgType, plan }) {
  if (!isConfigured) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: {
      data: {
        name,
        organization_name: organizationName,
        phone, district,
        org_type: orgType,
        plan,
        role: 'Super Admin'
      }
    }
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function sendResetEmail(email) {
  if (!isConfigured) throw new Error('Supabase is not configured.');
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin
  });
  if (error) throw new Error(error.message);
}

export async function updatePassword(newPassword) {
  if (!isConfigured) throw new Error('Supabase is not configured.');
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

export async function signOut() {
  if (!isConfigured) return;
  await supabase.auth.signOut();
}

export async function restoreSession() {
  if (!isConfigured) return null;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  try {
    return await loadProfile(session.user);
  } catch {
    await supabase.auth.signOut();
    return null;
  }
}

export function onAuthChange(cb) {
  if (!isConfigured) return () => {};
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT' || !session) { cb(null); return; }
    try { cb(await loadProfile(session.user)); }
    catch { cb(null); }
  });
  return () => subscription.unsubscribe();
}
