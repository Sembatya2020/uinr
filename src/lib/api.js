import { supabase, isConfigured } from './supabase';

/* ============================================================
   Mappers — Postgres snake_case <-> JS camelCase
   ============================================================ */
const mapStudent = {
  fromDb: (r) => ({
    id: r.id, name: r.name, nin: r.nin, school: r.school, district: r.district,
    level: r.level, enrolmentYear: r.enrolment_year, unebResults: r.uneb_results,
    status: r.status, guardianNin: r.guardian_nin
  }),
  toDb: (s) => ({
    name: s.name, nin: s.nin, school: s.school, district: s.district, level: s.level,
    enrolment_year: s.enrolmentYear, uneb_results: s.unebResults,
    status: s.status, guardian_nin: s.guardianNin
  })
};

const mapHospital = {
  fromDb: (r) => ({
    id: r.id, name: r.name, level: r.level, district: r.district, inCharge: r.in_charge,
    beds: r.beds, stock: r.stock, lastInspection: r.last_inspection,
    visits: r.visits, vacCoverage: r.vac_coverage
  }),
  toDb: (h) => ({
    name: h.name, level: h.level, district: h.district, in_charge: h.inCharge,
    beds: h.beds, stock: h.stock, last_inspection: h.lastInspection,
    visits: h.visits, vac_coverage: h.vacCoverage
  })
};

const mapFamily = {
  fromDb: (r) => ({
    id: r.id, head: r.head, nin: r.nin, clan: r.clan, tribe: r.tribe,
    village: r.village, district: r.district, members: r.members,
    marriage: r.marriage, tree: r.tree || { grandparents:[], parents:[], children:[] }
  }),
  toDb: (f) => ({
    head: f.head, nin: f.nin, clan: f.clan, tribe: f.tribe, village: f.village,
    district: f.district, members: f.members, marriage: f.marriage, tree: f.tree
  })
};

const mapAudit = {
  fromDb: (r) => ({
    id: r.id, ts: r.ts ? r.ts.replace('T',' ').slice(0,16) : '',
    action: r.action, module: r.module, record: r.record,
    by: r.performed_by, role: r.role, district: r.district
  }),
  toDb: (a) => ({
    action: a.action, module: a.module, record: a.record,
    performed_by: a.by, role: a.role, district: a.district
  })
};

const mapAdmin = {
  fromDb: (r) => ({ id: r.id, name: r.name, username: r.username, role: r.role, district: r.district, status: r.status }),
  toDb:   (u) => ({ name: u.name, username: u.username, role: u.role, district: u.district, status: u.status })
};

const mapSync = {
  fromDb: (r) => ({
    district: r.district, status: r.status,
    lastSync: r.last_sync ? r.last_sync.replace('T',' ').slice(0,16) : ''
  })
};

const mapSettings = {
  fromDb: (r) => ({ sysName: r.sys_name, adminEmail: r.admin_email, offlineSync: r.offline_sync }),
  toDb:   (s) => ({ sys_name: s.sysName, admin_email: s.adminEmail, offline_sync: s.offlineSync })
};

/* ============================================================
   Helper: assert configured
   ============================================================ */
function need() {
  if (!isConfigured) throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.');
}

/* ============================================================
   Connection probe
   ============================================================ */
export async function ping() {
  if (!isConfigured) return { ok: false, reason: 'not-configured' };
  const { error } = await supabase.from('settings').select('id').limit(1);
  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

/* ============================================================
   Bulk load — everything the app needs to render
   ============================================================ */
export async function loadAll() {
  need();
  const [students, hospitals, families, audit, admins, sync, settings] = await Promise.all([
    supabase.from('students').select('*').order('name'),
    supabase.from('hospitals').select('*').order('name'),
    supabase.from('families').select('*').order('head'),
    supabase.from('audit_log').select('*').order('ts', { ascending:false }).limit(200),
    supabase.from('admins').select('*').order('name'),
    supabase.from('sync_status').select('*').order('district'),
    supabase.from('settings').select('*').eq('id', 1).single()
  ]);
  const oops = [students, hospitals, families, audit, admins, sync, settings].find(r => r.error);
  if (oops) throw new Error(oops.error.message);

  return {
    students:  students.data.map(mapStudent.fromDb),
    hospitals: hospitals.data.map(mapHospital.fromDb),
    families:  families.data.map(mapFamily.fromDb),
    audit:     audit.data.map(mapAudit.fromDb),
    admins:    admins.data.map(mapAdmin.fromDb),
    sync:      sync.data.map(mapSync.fromDb),
    settings:  settings.data ? mapSettings.fromDb(settings.data) : null
  };
}

/* ============================================================
   Per-table CRUD
   ============================================================ */
async function insert(table, row, mapper) {
  need();
  const { data, error } = await supabase.from(table).insert(mapper.toDb(row)).select().single();
  if (error) throw new Error(error.message);
  return mapper.fromDb(data);
}
async function update(table, id, row, mapper) {
  need();
  const { data, error } = await supabase.from(table).update(mapper.toDb(row)).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return mapper.fromDb(data);
}
async function remove(table, id) {
  need();
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export const api = {
  students:  {
    add:    (r)        => insert('students', r, mapStudent),
    update: (id, r)    => update('students', id, r, mapStudent),
    remove: (id)       => remove('students', id)
  },
  hospitals: {
    add:    (r)        => insert('hospitals', r, mapHospital),
    update: (id, r)    => update('hospitals', id, r, mapHospital),
    remove: (id)       => remove('hospitals', id)
  },
  families:  {
    add:    (r)        => insert('families', r, mapFamily),
    update: (id, r)    => update('families', id, r, mapFamily),
    remove: (id)       => remove('families', id)
  },
  admins:    {
    add:    (r)        => insert('admins', r, mapAdmin),
    update: (id, r)    => update('admins', id, r, mapAdmin)
  },
  audit:     {
    add:    async (a)  => {
      need();
      const { data, error } = await supabase.from('audit_log').insert(mapAudit.toDb(a)).select().single();
      if (error) throw new Error(error.message);
      return mapAudit.fromDb(data);
    }
  },
  settings:  {
    save:   async (s) => {
      need();
      const { error } = await supabase.from('settings').update(mapSettings.toDb(s)).eq('id', 1);
      if (error) throw new Error(error.message);
    }
  }
};

/* ============================================================
   Demo seeding (push initial data into an empty database)
   ============================================================ */
export async function isEmpty() {
  need();
  const { count, error } = await supabase.from('students').select('id', { count: 'exact', head: true });
  if (error) throw new Error(error.message);
  return (count || 0) === 0;
}

export async function wipeAll() {
  need();
  const tables = ['audit_log','students','hospitals','families','admins'];
  // delete all rows. Postgres requires a where clause for DELETE in the API, so we use a tautology.
  for (const t of tables) {
    const { error } = await supabase.from(t).delete().gte('id', -1);
    if (error) throw new Error(`${t}: ${error.message}`);
  }
}

export async function seedDemoData(seed) {
  need();
  const studentsRows = seed.students.map(mapStudent.toDb);
  const hospitalsRows = seed.hospitals.map(mapHospital.toDb);
  const familiesRows = seed.families.map(mapFamily.toDb);
  const auditRows = seed.audit.map(mapAudit.toDb);
  const adminsRows = seed.admins.map(mapAdmin.toDb);

  const calls = [
    supabase.from('students').insert(studentsRows),
    supabase.from('hospitals').insert(hospitalsRows),
    supabase.from('families').insert(familiesRows),
    supabase.from('audit_log').insert(auditRows),
    supabase.from('admins').insert(adminsRows)
  ];
  const results = await Promise.all(calls);
  const oops = results.find(r => r.error);
  if (oops) throw new Error(oops.error.message);
}
