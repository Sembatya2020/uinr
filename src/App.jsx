import React, { useState, useEffect, useMemo, useReducer, useCallback, useRef } from 'react';
import { isConfigured as supabaseConfigured } from './lib/supabase';
import { api, loadAll, seedDemoData, isEmpty, wipeAll } from './lib/api';
import {
  Shield, LogIn, LayoutDashboard, GraduationCap, Hospital, Users2, FileClock,
  KeyRound, Settings as SettingsIcon, LogOut, Search, Plus, Pencil, Trash2,
  X, ChevronUp, ChevronDown, Download, CheckCircle2, AlertTriangle, Info,
  Menu, Building2, MapPin, Activity, Syringe, UserCog, Eye, Filter, ShieldCheck,
  ShieldAlert, RefreshCcw, Save, Lock, TrendingUp, TrendingDown, BellRing,
  Sparkles, ArrowRight, School, Stethoscope, BarChart3, Globe2,
  Command, Bell, FileText, Printer, ArrowLeft, BookOpen, HeartPulse, Network,
  Clock, User as UserIcon, ChevronRight, CheckCheck, RotateCcw,
  Database, WifiOff, Loader2, Cloud, CloudOff
} from 'lucide-react';

/* ===========================================================
   UINR — Uganda Integrated National Registry
   Single-file React app
   =========================================================== */

const DISTRICTS = ['Kampala','Wakiso','Gulu','Mbarara','Jinja','Mbale','Lira','Arua','Masaka','Fort Portal'];
const LEVELS = ['P1','P2','P3','P4','P5','P6','P7','S1','S2','S3','S4','S5','S6','University'];
const STUDENT_STATUSES = ['Enrolled','Dropped Out','Graduated'];
const FACILITY_LEVELS = ['HC II','HC III','General Hospital','Regional Referral'];
const STOCK_STATUSES = ['Adequate','Low','Critical'];
const CLANS = ['Nkima','Ngabi','Ffumbe','Nte','Ngo','Ngonge','Mamba','Ngeye'];
const TRIBES = ['Baganda','Acholi','Banyankole','Basoga','Bagisu','Langi','Lugbara','Banyoro','Batoro'];

const USERS = [
  { username: 'admin',     password: 'uinr2024', role: 'Super Admin',        name: 'Florence Akello',  district: 'Kampala' },
  { username: 'officer',   password: 'uinr2024', role: 'Ministry Officer',   name: 'Patrick Mukasa',   district: 'Kampala' },
  { username: 'registrar', password: 'uinr2024', role: 'District Registrar', name: 'Grace Atim',       district: 'Gulu'    }
];

const ROLE_DESCRIPTIONS = {
  'Super Admin':         'Full system access. Can manage users, modify any record, view all audit logs, and configure system settings.',
  'Ministry Officer':    'Read-only access to all districts. Can view and export records, run reports, and review audit history — cannot edit or delete.',
  'District Registrar':  'Restricted to their assigned district. Can create, edit, and view records only within their district boundary.'
};

/* ---------- Demo data ---------- */
const nin = (i) => `CM${String(90000000 + i).padStart(11,'0')}UG`;

const INITIAL_STUDENTS = [
  { id:1,  name:'Nakato Sarah',       nin:nin(1),  school:'Gayaza High School',           district:'Wakiso',     level:'S4', enrolmentYear:2021, unebResults:'Div 1', status:'Enrolled',     guardianNin:nin(101) },
  { id:2,  name:'Okello Brian',       nin:nin(2),  school:'Sir Samuel Baker',             district:'Gulu',       level:'S6', enrolmentYear:2019, unebResults:'Div 2', status:'Enrolled',     guardianNin:nin(102) },
  { id:3,  name:'Namukasa Patricia',  nin:nin(3),  school:'Kibuli SS',                     district:'Kampala',    level:'S2', enrolmentYear:2023, unebResults:'—',     status:'Enrolled',     guardianNin:nin(103) },
  { id:4,  name:'Ssali Daniel',       nin:nin(4),  school:'Makerere University',           district:'Kampala',    level:'University', enrolmentYear:2022, unebResults:'Div 1', status:'Enrolled', guardianNin:nin(104) },
  { id:5,  name:'Apio Florence',      nin:nin(5),  school:'Lira Town College',             district:'Lira',       level:'S3', enrolmentYear:2022, unebResults:'—',     status:'Enrolled',     guardianNin:nin(105) },
  { id:6,  name:'Tusiime Brenda',     nin:nin(6),  school:'Mbarara High School',           district:'Mbarara',    level:'S5', enrolmentYear:2020, unebResults:'Div 1', status:'Enrolled',     guardianNin:nin(106) },
  { id:7,  name:'Mugisha Allan',      nin:nin(7),  school:'Ntare School',                  district:'Mbarara',    level:'S6', enrolmentYear:2019, unebResults:'Div 1', status:'Graduated',    guardianNin:nin(107) },
  { id:8,  name:'Atim Joyce',         nin:nin(8),  school:'Gulu High School',              district:'Gulu',       level:'P7', enrolmentYear:2024, unebResults:'—',     status:'Enrolled',     guardianNin:nin(108) },
  { id:9,  name:'Kyambadde Moses',    nin:nin(9),  school:'Kings College Budo',            district:'Wakiso',     level:'S5', enrolmentYear:2020, unebResults:'Div 1', status:'Enrolled',     guardianNin:nin(109) },
  { id:10, name:'Namutebi Rebecca',   nin:nin(10), school:'Nabisunsa Girls',               district:'Kampala',    level:'S4', enrolmentYear:2021, unebResults:'Div 2', status:'Enrolled',     guardianNin:nin(110) },
  { id:11, name:'Wasswa Isaac',       nin:nin(11), school:'Jinja SS',                      district:'Jinja',      level:'S3', enrolmentYear:2022, unebResults:'—',     status:'Dropped Out',  guardianNin:nin(111) },
  { id:12, name:'Nalwoga Esther',     nin:nin(12), school:'Mt. St. Mary\'s Namagunga',     district:'Wakiso',     level:'S6', enrolmentYear:2019, unebResults:'Div 1', status:'Graduated',    guardianNin:nin(112) },
  { id:13, name:'Ochieng Peter',      nin:nin(13), school:'Mbale SS',                      district:'Mbale',      level:'S4', enrolmentYear:2021, unebResults:'Div 2', status:'Enrolled',     guardianNin:nin(113) },
  { id:14, name:'Mbabazi Diana',      nin:nin(14), school:'St. Mary\'s Kitende',           district:'Wakiso',     level:'P6', enrolmentYear:2024, unebResults:'—',     status:'Enrolled',     guardianNin:nin(114) },
  { id:15, name:'Asiimwe Joel',       nin:nin(15), school:'Fort Portal SS',                district:'Fort Portal',level:'S5', enrolmentYear:2020, unebResults:'Div 1', status:'Enrolled',     guardianNin:nin(115) },
  { id:16, name:'Okello Faith',       nin:nin(16), school:'Arua Public SS',                district:'Arua',       level:'S3', enrolmentYear:2022, unebResults:'—',     status:'Enrolled',     guardianNin:nin(116) },
  { id:17, name:'Mugisha Ronald',     nin:nin(17), school:'Masaka SS',                     district:'Masaka',     level:'S4', enrolmentYear:2021, unebResults:'Div 1', status:'Enrolled',     guardianNin:nin(117) }
];

const INITIAL_HOSPITALS = [
  { id:1, name:'Mulago National Referral Hospital', level:'Regional Referral', district:'Kampala',    inCharge:'Dr. Rosemary Byanyima', beds:1500, stock:'Adequate', lastInspection:'2026-04-12', visits:24130, vacCoverage:92 },
  { id:2, name:'Butabika National Mental Hospital', level:'Regional Referral', district:'Kampala',    inCharge:'Dr. Juliet Nakku',      beds:550,  stock:'Adequate', lastInspection:'2026-03-28', visits:7820,  vacCoverage:88 },
  { id:3, name:'Mbarara Regional Referral',          level:'Regional Referral', district:'Mbarara',    inCharge:'Dr. Henry Tumwesigye',  beds:600,  stock:'Low',      lastInspection:'2026-02-15', visits:13420, vacCoverage:85 },
  { id:4, name:'Gulu Regional Referral',             level:'Regional Referral', district:'Gulu',       inCharge:'Dr. Nathan Onyachi',    beds:330,  stock:'Adequate', lastInspection:'2026-05-02', visits:9012,  vacCoverage:80 },
  { id:5, name:'Lacor Hospital',                     level:'General Hospital',  district:'Gulu',       inCharge:'Dr. Cyprian Opira',     beds:482,  stock:'Adequate', lastInspection:'2026-04-22', visits:15680, vacCoverage:91 },
  { id:6, name:'Jinja Regional Referral',            level:'Regional Referral', district:'Jinja',      inCharge:'Dr. Edward Nkurunziza', beds:610,  stock:'Critical', lastInspection:'2026-01-30', visits:11240, vacCoverage:78 },
  { id:7, name:'Mbale Regional Referral',            level:'Regional Referral', district:'Mbale',      inCharge:'Dr. Emmanuel Tugaineyo',beds:400,  stock:'Low',      lastInspection:'2026-03-11', visits:8930,  vacCoverage:82 },
  { id:8, name:'Wakiso HC IV',                       level:'HC III',            district:'Wakiso',     inCharge:'Sr. Margaret Naluyima', beds:60,   stock:'Adequate', lastInspection:'2026-05-18', visits:3420,  vacCoverage:87 },
  { id:9, name:'Lira HC III',                        level:'HC III',            district:'Lira',       inCharge:'Mr. James Okumu',       beds:48,   stock:'Low',      lastInspection:'2026-04-05', visits:2810,  vacCoverage:75 },
  { id:10,name:'Fort Portal Regional Referral',      level:'Regional Referral', district:'Fort Portal',inCharge:'Dr. Allan Muhwezi',     beds:380,  stock:'Adequate', lastInspection:'2026-05-09', visits:7610,  vacCoverage:84 },
  { id:11,name:'Arua Regional Referral',             level:'Regional Referral', district:'Arua',       inCharge:'Dr. Pauline Adiru',     beds:340,  stock:'Adequate', lastInspection:'2026-04-30', visits:6940,  vacCoverage:79 },
  { id:12,name:'Masaka HC III',                      level:'HC III',            district:'Masaka',     inCharge:'Sr. Joan Nakimuli',     beds:55,   stock:'Adequate', lastInspection:'2026-05-15', visits:3120,  vacCoverage:86 }
];

const INITIAL_FAMILIES = [
  {
    id:1, head:'Ssali Joseph', nin:nin(201), clan:'Nkima', tribe:'Baganda', village:'Mpigi',     district:'Wakiso',     members:6, marriage:'Monogamous',
    tree:{ grandparents:[{name:'Ssali Yusuf', nin:nin(901)},{name:'Nakato Esther', nin:nin(902)}],
           parents:[{name:'Ssali Joseph', nin:nin(201)},{name:'Namusoke Mary', nin:nin(202)}],
           children:[{name:'Ssali Daniel', nin:nin(4)},{name:'Namutebi Rebecca', nin:nin(10)}] }
  },
  {
    id:2, head:'Okello Patrick', nin:nin(203), clan:'Ngabi', tribe:'Acholi', village:'Pece',     district:'Gulu',
    members:8, marriage:'Polygamous',
    tree:{ grandparents:[{name:'Okello Lakana', nin:nin(903)},{name:'Aceng Susan', nin:nin(904)}],
           parents:[{name:'Okello Patrick', nin:nin(203)},{name:'Lamwaka Beatrice', nin:nin(204)}],
           children:[{name:'Okello Brian', nin:nin(2)},{name:'Atim Joyce', nin:nin(8)},{name:'Okello Faith', nin:nin(16)}] }
  },
  {
    id:3, head:'Tusiime Robert', nin:nin(205), clan:'Nte', tribe:'Banyankole', village:'Rwizi',  district:'Mbarara',
    members:5, marriage:'Monogamous',
    tree:{ grandparents:[{name:'Tusiime Yowasi', nin:nin(905)},{name:'Komuhangi Faith', nin:nin(906)}],
           parents:[{name:'Tusiime Robert', nin:nin(205)},{name:'Atuhaire Joy', nin:nin(206)}],
           children:[{name:'Tusiime Brenda', nin:nin(6)},{name:'Mugisha Allan', nin:nin(7)}] }
  },
  {
    id:4, head:'Wasswa Henry', nin:nin(207), clan:'Ffumbe', tribe:'Basoga', village:'Bugembe',   district:'Jinja',
    members:4, marriage:'Monogamous',
    tree:{ grandparents:[{name:'Wasswa Charles', nin:nin(907)},{name:'Nabirye Robinah', nin:nin(908)}],
           parents:[{name:'Wasswa Henry', nin:nin(207)},{name:'Babirye Sarah', nin:nin(208)}],
           children:[{name:'Wasswa Isaac', nin:nin(11)}] }
  },
  {
    id:5, head:'Mbabazi Andrew', nin:nin(209), clan:'Ngo', tribe:'Banyankole', village:'Kitende',district:'Wakiso',
    members:5, marriage:'Monogamous',
    tree:{ grandparents:[{name:'Mbabazi Silas', nin:nin(909)},{name:'Kyomuhendo Jane', nin:nin(910)}],
           parents:[{name:'Mbabazi Andrew', nin:nin(209)},{name:'Kobusinge Diana', nin:nin(210)}],
           children:[{name:'Mbabazi Diana', nin:nin(14)},{name:'Nakato Sarah', nin:nin(1)}] }
  },
  {
    id:6, head:'Ochieng Samuel', nin:nin(211), clan:'Ngonge', tribe:'Bagisu', village:'Bungokho',district:'Mbale',
    members:6, marriage:'Polygamous',
    tree:{ grandparents:[{name:'Ochieng Otieno', nin:nin(911)},{name:'Auma Phoebe', nin:nin(912)}],
           parents:[{name:'Ochieng Samuel', nin:nin(211)},{name:'Nambozo Lydia', nin:nin(212)}],
           children:[{name:'Ochieng Peter', nin:nin(13)}] }
  },
  {
    id:7, head:'Asiimwe Bosco', nin:nin(213), clan:'Mamba', tribe:'Batoro', village:'Kabarole',  district:'Fort Portal',
    members:5, marriage:'Monogamous',
    tree:{ grandparents:[{name:'Asiimwe Erinayo', nin:nin(913)},{name:'Kabugho Margaret', nin:nin(914)}],
           parents:[{name:'Asiimwe Bosco', nin:nin(213)},{name:'Mbabazi Grace', nin:nin(214)}],
           children:[{name:'Asiimwe Joel', nin:nin(15)}] }
  },
  {
    id:8, head:'Kyambadde Paul', nin:nin(215), clan:'Ngeye', tribe:'Baganda', village:'Busega',  district:'Kampala',
    members:7, marriage:'Monogamous',
    tree:{ grandparents:[{name:'Kyambadde Erasmus', nin:nin(915)},{name:'Nakawunde Eve', nin:nin(916)}],
           parents:[{name:'Kyambadde Paul', nin:nin(215)},{name:'Namaganda Ruth', nin:nin(216)}],
           children:[{name:'Kyambadde Moses', nin:nin(9)},{name:'Namukasa Patricia', nin:nin(3)},{name:'Nalwoga Esther', nin:nin(12)}] }
  }
];

const INITIAL_AUDIT = [
  { id:1,  ts:'2026-06-05 09:12', action:'Edited',  module:'Students',  record:'Nakato Sarah',      by:'Florence Akello',  role:'Super Admin',        district:'Kampala' },
  { id:2,  ts:'2026-06-05 08:55', action:'Created', module:'Hospitals', record:'Wakiso HC IV',      by:'Patrick Mukasa',   role:'Ministry Officer',   district:'Kampala' },
  { id:3,  ts:'2026-06-04 16:40', action:'Viewed',  module:'Families',  record:'Okello Patrick',    by:'Grace Atim',       role:'District Registrar', district:'Gulu'    },
  { id:4,  ts:'2026-06-04 14:22', action:'Edited',  module:'Students',  record:'Okello Brian',      by:'Grace Atim',       role:'District Registrar', district:'Gulu'    },
  { id:5,  ts:'2026-06-04 11:08', action:'Created', module:'Students',  record:'Apio Florence',     by:'Florence Akello',  role:'Super Admin',        district:'Lira'    },
  { id:6,  ts:'2026-06-04 09:30', action:'Edited',  module:'Hospitals', record:'Mbarara Regional',  by:'Patrick Mukasa',   role:'Ministry Officer',   district:'Mbarara' },
  { id:7,  ts:'2026-06-03 17:14', action:'Deleted', module:'Students',  record:'Test Record',       by:'Florence Akello',  role:'Super Admin',        district:'Kampala' },
  { id:8,  ts:'2026-06-03 15:02', action:'Edited',  module:'Families',  record:'Tusiime Robert',    by:'Florence Akello',  role:'Super Admin',        district:'Mbarara' },
  { id:9,  ts:'2026-06-03 12:48', action:'Viewed',  module:'Students',  record:'Mugisha Allan',     by:'Patrick Mukasa',   role:'Ministry Officer',   district:'Mbarara' },
  { id:10, ts:'2026-06-03 10:20', action:'Created', module:'Families',  record:'Ochieng Samuel',    by:'Florence Akello',  role:'Super Admin',        district:'Mbale'   },
  { id:11, ts:'2026-06-02 16:55', action:'Edited',  module:'Hospitals', record:'Lacor Hospital',    by:'Patrick Mukasa',   role:'Ministry Officer',   district:'Gulu'    },
  { id:12, ts:'2026-06-02 14:30', action:'Edited',  module:'Students',  record:'Atim Joyce',        by:'Grace Atim',       role:'District Registrar', district:'Gulu'    },
  { id:13, ts:'2026-06-02 11:10', action:'Viewed',  module:'Audit',     record:'Audit Export',      by:'Florence Akello',  role:'Super Admin',        district:'Kampala' },
  { id:14, ts:'2026-06-01 17:42', action:'Edited',  module:'Hospitals', record:'Jinja Regional',    by:'Florence Akello',  role:'Super Admin',        district:'Jinja'   },
  { id:15, ts:'2026-06-01 14:18', action:'Created', module:'Students',  record:'Ochieng Peter',     by:'Patrick Mukasa',   role:'Ministry Officer',   district:'Mbale'   },
  { id:16, ts:'2026-06-01 10:05', action:'Edited',  module:'Families',  record:'Kyambadde Paul',    by:'Florence Akello',  role:'Super Admin',        district:'Kampala' },
  { id:17, ts:'2026-05-31 16:00', action:'Viewed',  module:'Hospitals', record:'Mulago National',   by:'Patrick Mukasa',   role:'Ministry Officer',   district:'Kampala' },
  { id:18, ts:'2026-05-31 12:25', action:'Created', module:'Hospitals', record:'Masaka HC III',     by:'Florence Akello',  role:'Super Admin',        district:'Masaka'  },
  { id:19, ts:'2026-05-30 15:40', action:'Edited',  module:'Students',  record:'Asiimwe Joel',      by:'Patrick Mukasa',   role:'Ministry Officer',   district:'Fort Portal' },
  { id:20, ts:'2026-05-30 09:12', action:'Edited',  module:'Roles',     record:'User: officer',     by:'Florence Akello',  role:'Super Admin',        district:'Kampala' },
  { id:21, ts:'2026-05-29 14:08', action:'Created', module:'Families',  record:'Asiimwe Bosco',     by:'Florence Akello',  role:'Super Admin',        district:'Fort Portal' },
  { id:22, ts:'2026-05-29 10:30', action:'Viewed',  module:'Students',  record:'Wasswa Isaac',      by:'Grace Atim',       role:'District Registrar', district:'Gulu'    }
];

const INITIAL_ADMINS = [
  { id:1, name:'Florence Akello',  username:'admin',     role:'Super Admin',        district:'Kampala', status:'Active' },
  { id:2, name:'Patrick Mukasa',   username:'officer',   role:'Ministry Officer',   district:'Kampala', status:'Active' },
  { id:3, name:'Grace Atim',       username:'registrar', role:'District Registrar', district:'Gulu',    status:'Active' },
  { id:4, name:'Samuel Wandera',   username:'swandera',  role:'District Registrar', district:'Mbale',   status:'Active' },
  { id:5, name:'Joan Nansubuga',   username:'jnansubuga',role:'Ministry Officer',   district:'Kampala', status:'Suspended' },
  { id:6, name:'Andrew Mugume',    username:'amugume',   role:'District Registrar', district:'Mbarara', status:'Active' }
];

const INITIAL_SYNC = DISTRICTS.map((d, i) => ({ district:d, status: i % 4 === 2 ? 'Syncing' : 'Synced', lastSync: `2026-06-05 ${String(7 + (i%6)).padStart(2,'0')}:${String(10 + i*4).padStart(2,'0')}` }));

/* ===========================================================
   Persistence (localStorage)
   =========================================================== */
const STORAGE_KEY = 'uinr:v1';
function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function savePersisted(snapshot) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)); } catch {}
}
function clearPersisted() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

/* ===========================================================
   Alerts computation (used by dashboard + notifications)
   =========================================================== */
function computeAlerts(state) {
  const out = [];
  state.hospitals.filter(h => h.stock === 'Critical').forEach(h => out.push({
    id: `critical-${h.id}`, kind:'critical', Icon:Syringe,
    title:`Critical drug stock — ${h.name}`,
    detail:`${h.district} · In-charge: ${h.inCharge}`,
    target:'hospitals', ts: h.lastInspection
  }));
  state.hospitals.filter(h => h.stock === 'Low').forEach(h => out.push({
    id: `low-${h.id}`, kind:'warn', Icon:Stethoscope,
    title:`Low drug stock — ${h.name}`,
    detail:`${h.district} · ${h.beds} beds`,
    target:'hospitals', ts: h.lastInspection
  }));
  state.sync.filter(s => s.status === 'Syncing').forEach(s => out.push({
    id: `sync-${s.district}`, kind:'warn', Icon:RefreshCcw,
    title:`${s.district} sync in progress`,
    detail:`Last sync ${s.lastSync}`,
    target:'overview', ts: s.lastSync
  }));
  state.students.filter(s => s.status === 'Dropped Out').forEach(s => out.push({
    id: `dropout-${s.id}`, kind:'warn', Icon:GraduationCap,
    title:`Dropout reported — ${s.name}`,
    detail:`${s.school}, ${s.district}`,
    target:'students', ts:'—'
  }));
  return out;
}

/* ===========================================================
   Toast system
   =========================================================== */
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, type, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts, push };
}

function ToastStack({ toasts }) {
  return (
    <div className="fixed bottom-5 right-5 z-[1000] flex flex-col gap-2">
      {toasts.map(t => {
        const style = t.type === 'success'
          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
          : t.type === 'error'
          ? 'bg-red-50 border-red-300 text-red-900'
          : 'bg-sky-50 border-sky-300 text-sky-900';
        const Icon = t.type === 'success' ? CheckCircle2 : t.type === 'error' ? AlertTriangle : Info;
        return (
          <div key={t.id} className={`flex items-center gap-2 border ${style} px-4 py-2.5 rounded-lg shadow-md min-w-[260px]`}>
            <Icon size={18} />
            <span className="text-sm font-medium">{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ===========================================================
   CSV export
   =========================================================== */
function exportCSV(filename, rows, columns) {
  const header = columns.map(c => `"${c.label}"`).join(',');
  const body = rows.map(r => columns.map(c => {
    const v = typeof c.value === 'function' ? c.value(r) : r[c.key];
    const s = v == null ? '' : String(v).replace(/"/g, '""');
    return `"${s}"`;
  }).join(',')).join('\n');
  const blob = new Blob([header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ===========================================================
   Modal primitive
   =========================================================== */
function Modal({ open, onClose, title, children, footer, wide=false }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[900] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-xl shadow-2xl w-full ${wide ? 'max-w-5xl' : 'max-w-2xl'} max-h-[90vh] flex flex-col`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-uinr">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 rounded-lg p-1 hover:bg-slate-100" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-auto flex-1">{children}</div>
        {footer && <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/* ===========================================================
   Status badge
   =========================================================== */
function Badge({ kind, children }) {
  const styles = {
    green:  'bg-emerald-100 text-emerald-800 border-emerald-200',
    amber:  'bg-amber-100 text-amber-800 border-amber-200',
    red:    'bg-red-100 text-red-800 border-red-200',
    blue:   'bg-sky-100 text-sky-800 border-sky-200',
    gray:   'bg-slate-100 text-slate-700 border-slate-200'
  };
  return <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 border rounded-full ${styles[kind]}`}>{children}</span>;
}

const statusKind = (s) => {
  if (['Enrolled','Active','Approved','Synced','Adequate','Graduated'].includes(s)) return 'green';
  if (['Pending','Syncing','Low'].includes(s)) return 'amber';
  if (['Critical','Suspended','Dropped Out'].includes(s)) return 'red';
  return 'gray';
};

/* ===========================================================
   Sortable table helper
   =========================================================== */
function useSorted(rows, defaultKey) {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState('asc');
  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av == null) return 1; if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return arr;
  }, [rows, sortKey, sortDir]);
  const headerClick = (k) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('asc'); }
  };
  const SortIcon = ({ k }) => sortKey !== k
    ? <span className="inline-block w-3" />
    : sortDir === 'asc' ? <ChevronUp size={14} className="inline" /> : <ChevronDown size={14} className="inline" />;
  return { sorted, sortKey, sortDir, headerClick, SortIcon };
}

/* ===========================================================
   Login screen
   =========================================================== */
function LoginScreen({ onLogin, pushToast }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('uinr2024');
  const [role, setRole] = useState('Super Admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const found = USERS.find(u => u.username === username.trim() && u.password === password && u.role === role);
      setLoading(false);
      if (!found) {
        setError('Invalid credentials or role mismatch. Check the demo credentials below.');
        pushToast('error', 'Login failed');
        return;
      }
      pushToast('success', `Welcome, ${found.name}`);
      onLogin(found);
    }, 600);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-uinr-dark via-uinr to-uinr-light">
      <div className="hidden lg:flex flex-1 items-center justify-center text-white p-12">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/15 backdrop-blur p-3 rounded-xl"><Shield size={32} /></div>
            <div>
              <div className="text-2xl font-bold tracking-tight">UINR</div>
              <div className="text-white/70 text-sm">Uganda Integrated National Registry</div>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">One Citizen. One Record. One Nation.</h1>
          <p className="text-white/80 leading-relaxed">
            UINR unifies education, health, and family records of every Ugandan citizen behind a single
            National Identification Number — empowering Ministries to plan, deliver, and govern with evidence.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold">8.4M</div>
              <div className="text-xs text-white/70">Students</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold">3,260</div>
              <div className="text-xs text-white/70">Health Facilities</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold">2.1M</div>
              <div className="text-xs text-white/70">Families</div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <div className="lg:hidden flex items-center gap-2 mb-6 text-uinr">
            <Shield size={28} />
            <div className="font-bold text-xl">UINR</div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Sign in</h2>
          <p className="text-slate-500 text-sm mb-6">Access the national registry admin portal</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
          <input value={username} onChange={e=>setUsername(e.target.value)}
                 className="w-full mb-4 px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uinr"
                 placeholder="e.g. admin" required />

          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                 className="w-full mb-4 px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uinr"
                 placeholder="••••••••" required />

          <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
          <select value={role} onChange={e=>setRole(e.target.value)}
                  className="w-full mb-6 px-3 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-uinr">
            <option>Super Admin</option>
            <option>Ministry Officer</option>
            <option>District Registrar</option>
          </select>

          <button type="submit" disabled={loading}
                  className="w-full bg-uinr text-white py-2.5 rounded-lg font-semibold hover:bg-uinr-dark flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <RefreshCcw size={18} className="animate-spin" /> : <LogIn size={18} />}
            {loading ? 'Authenticating…' : 'Sign in'}
          </button>

          <div className="mt-6 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            <div className="font-semibold text-slate-700 mb-1">Demo credentials</div>
            <div>admin / uinr2024 / Super Admin</div>
            <div>officer / uinr2024 / Ministry Officer</div>
            <div>registrar / uinr2024 / District Registrar</div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ===========================================================
   Sidebar
   =========================================================== */
function Sidebar({ section, setSection, user, onLogout, open, setOpen }) {
  const items = [
    { key:'overview',  label:'Overview',       Icon:LayoutDashboard },
    { key:'students',  label:'Students',       Icon:GraduationCap },
    { key:'hospitals', label:'Hospitals',      Icon:Hospital },
    { key:'families',  label:'Family Trees',   Icon:Users2 },
    { key:'reports',   label:'Reports',        Icon:FileText },
    { key:'audit',     label:'Audit Log',      Icon:FileClock },
    { key:'roles',     label:'Roles & Access', Icon:KeyRound, superAdminOnly:true },
    { key:'settings',  label:'Settings',       Icon:SettingsIcon }
  ];
  const visible = items.filter(i => !i.superAdminOnly || user.role === 'Super Admin');

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden no-print" onClick={()=>setOpen(false)} />}
      <aside className={`fixed lg:static z-40 inset-y-0 left-0 w-64 bg-uinr text-white flex flex-col transition-transform no-print ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="px-5 py-5 border-b border-white/10 flex items-center gap-3">
          <div className="bg-white/15 p-2 rounded-lg"><Shield size={22} /></div>
          <div>
            <div className="font-bold tracking-tight">UINR</div>
            <div className="text-xs text-white/70">National Registry</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visible.map(({key,label,Icon}) => (
            <button key={key}
              onClick={() => { setSection(key); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                section === key ? 'bg-white text-uinr shadow' : 'text-white/85 hover:bg-white/10'
              }`}>
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="px-3 py-2 text-xs text-white/70 mb-1">Signed in as</div>
          <div className="px-3 mb-3">
            <div className="font-semibold">{user.name}</div>
            <div className="text-xs text-white/70">{user.role} · {user.district}</div>
          </div>
          <button onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-sm py-2 rounded-lg">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

/* ===========================================================
   Top bar
   =========================================================== */
function Topbar({ title, subtitle, onMenu, user, onOpenPalette, onOpenNotif, unreadCount, dbConnected, dbLoading }) {
  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-20 no-print">
      <div className="px-4 lg:px-8 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onMenu} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"><Menu size={20} /></button>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-900 leading-tight truncate">{title}</div>
            <div className="text-xs text-slate-500 truncate">{subtitle}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onOpenPalette}
            className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-sm text-slate-600 min-w-[260px]">
            <Search size={14} />
            <span className="flex-1 text-left">Search records or jump to…</span>
            <kbd className="text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-500 flex items-center gap-0.5">
              <Command size={10} />K
            </kbd>
          </button>
          <button onClick={onOpenPalette} className="md:hidden p-2 hover:bg-slate-100 rounded-lg" aria-label="Search"><Search size={18} /></button>
          <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
            dbLoading ? 'bg-sky-50 text-sky-700 border-sky-200'
              : dbConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {dbLoading ? <Loader2 size={12} className="animate-spin" /> : dbConnected ? <Cloud size={12} /> : <CloudOff size={12} />}
            {dbLoading ? 'Loading…' : dbConnected ? 'Database' : 'Demo mode'}
          </div>
          <button onClick={onOpenNotif} className="relative p-2 hover:bg-slate-100 rounded-lg" aria-label="Notifications">
            <Bell size={18} className="text-slate-700" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <div className="hidden sm:flex items-center gap-3 ml-1">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-800">{user.name}</div>
              <div className="text-xs text-slate-500 flex items-center gap-1 justify-end"><MapPin size={12} />{user.district}</div>
            </div>
            <div className="w-9 h-9 bg-uinr text-white rounded-full flex items-center justify-center font-semibold">
              {user.name.split(' ').map(s=>s[0]).slice(0,2).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================
   Dashboard chart primitives (inline SVG)
   =========================================================== */
function AreaChart({ data, color='#1a3a5c', height=180 }) {
  const w = 480;
  const max = Math.max(...data.map(d=>d.y), 1);
  const padX = 36, padTop = 24, padBot = 26;
  const innerW = w - padX*2, innerH = height - padTop - padBot;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;
  const pts = data.map((d, i) => ({
    x: padX + i*stepX,
    y: padTop + innerH - (d.y/max)*innerH
  }));
  const line = pts.map((p, i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = pts.length ? `${line} L${pts[pts.length-1].x},${padTop+innerH} L${pts[0].x},${padTop+innerH} Z` : '';
  const gid = useMemo(() => 'g-' + Math.random().toString(36).slice(2, 8), []);
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0,0.25,0.5,0.75,1].map((t,i) => (
        <line key={i} x1={padX} y1={padTop+innerH*t} x2={w-padX} y2={padTop+innerH*t} stroke="#e2e8f0" strokeDasharray="3,4" />
      ))}
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={color} strokeWidth="2" />
          <text x={p.x} y={height-8} textAnchor="middle" fontSize="11" fill="#64748b">{data[i].x}</text>
          <text x={p.x} y={p.y-10} textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>{data[i].y}</text>
        </g>
      ))}
    </svg>
  );
}

function HBarChart({ data, color='#1a3a5c', valueSuffix='' }) {
  const max = Math.max(...data.map(d=>d.value), 1);
  return (
    <div className="space-y-2.5">
      {data.map(d => (
        <div key={d.label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-slate-700">{d.label}</span>
            <span className="text-slate-500 font-semibold">{d.value}{valueSuffix}</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width:`${(d.value/max)*100}%`, background: typeof color==='function' ? color(d) : color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Donut({ data, size=170 }) {
  const total = data.reduce((a,b)=>a+b.value, 0);
  const r = 62, cx = size/2, cy = size/2;
  let acc = 0;
  const segs = total === 0 ? [] : data.map(d => {
    const start = (acc/total) * 2*Math.PI - Math.PI/2;
    acc += d.value;
    const end = (acc/total) * 2*Math.PI - Math.PI/2;
    const large = end - start > Math.PI ? 1 : 0;
    const x1 = cx + r*Math.cos(start), y1 = cy + r*Math.sin(start);
    const x2 = cx + r*Math.cos(end),   y2 = cy + r*Math.sin(end);
    return { path:`M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large} 1 ${x2.toFixed(2)},${y2.toFixed(2)}`, ...d };
  });
  return (
    <div className="flex items-center gap-5">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="22" />
        {segs.map((s,i)=> <path key={i} d={s.path} stroke={s.color} strokeWidth="22" fill="none" strokeLinecap="butt" />)}
        <text x={cx} y={cy-4} textAnchor="middle" fontSize="22" fontWeight="700" fill="#1a3a5c">{total}</text>
        <text x={cx} y={cy+14} textAnchor="middle" fontSize="9" fill="#64748b" letterSpacing="1">FACILITIES</text>
      </svg>
      <ul className="space-y-2 text-sm flex-1">
        {data.map(d => (
          <li key={d.label} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm" style={{background:d.color}} />
              <span className="font-medium text-slate-700">{d.label}</span>
            </span>
            <span className="text-slate-500 font-semibold">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ===========================================================
   KPI tile
   =========================================================== */
function KpiCard({ label, value, trend, sub, Icon, color, onClick }) {
  const palette = {
    sky:    { wrap:'bg-sky-50 border-sky-200 text-sky-700' },
    emerald:{ wrap:'bg-emerald-50 border-emerald-200 text-emerald-700' },
    indigo: { wrap:'bg-indigo-50 border-indigo-200 text-indigo-700' },
    violet: { wrap:'bg-violet-50 border-violet-200 text-violet-700' },
    amber:  { wrap:'bg-amber-50 border-amber-200 text-amber-700' },
    rose:   { wrap:'bg-rose-50 border-rose-200 text-rose-700' }
  }[color] || { wrap:'bg-slate-50 border-slate-200 text-slate-700' };
  const up = trend >= 0;
  return (
    <button onClick={onClick} className="text-left bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-uinr/40 transition w-full">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg border ${palette.wrap}`}><Icon size={18} /></div>
        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {up ? '+' : ''}{trend.toFixed(1)}%
        </div>
      </div>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{sub}</div>
    </button>
  );
}

/* ===========================================================
   Overview page (Admin dashboard)
   =========================================================== */
function Overview({ students, hospitals, families, audit, sync, user, setSection }) {
  const enrolled  = students.filter(s => s.status === 'Enrolled').length;
  const dropouts  = students.filter(s => s.status === 'Dropped Out').length;
  const graduated = students.filter(s => s.status === 'Graduated').length;
  const critical  = hospitals.filter(h => h.stock === 'Critical').length;
  const lowStock  = hospitals.filter(h => h.stock === 'Low').length;
  const totalBeds = hospitals.reduce((a,h) => a + h.beds, 0);
  const totalVisits = hospitals.reduce((a,h) => a + h.visits, 0);
  const citizens  = families.reduce((a,f) => a + f.members, 0);
  const editsThisWeek = audit.filter(a => ['Edited','Created','Deleted'].includes(a.action)).length;
  const syncingCount  = sync.filter(s => s.status === 'Syncing').length;
  const alertsCount   = critical + dropouts + syncingCount;

  // Enrolment trend by year
  const yearGroups = {};
  students.forEach(s => { yearGroups[s.enrolmentYear] = (yearGroups[s.enrolmentYear] || 0) + 1; });
  const enrolmentSeries = Object.keys(yearGroups).sort().map(y => ({ x: y, y: yearGroups[y] }));

  // Students per district
  const distGroups = {};
  students.forEach(s => { distGroups[s.district] = (distGroups[s.district] || 0) + 1; });
  const studentsByDistrict = Object.entries(distGroups).sort((a,b) => b[1]-a[1]).map(([label,value]) => ({ label, value }));

  // Vaccination coverage per district
  const vacAcc = {};
  hospitals.forEach(h => {
    if (!vacAcc[h.district]) vacAcc[h.district] = { sum:0, n:0 };
    vacAcc[h.district].sum += h.vacCoverage;
    vacAcc[h.district].n   += 1;
  });
  const vacByDistrict = Object.entries(vacAcc).map(([label,v]) => ({ label, value: Math.round(v.sum/v.n) })).sort((a,b)=>b.value-a.value);
  const vacColor = (d) => d.value >= 85 ? '#10b981' : d.value >= 75 ? '#f59e0b' : '#ef4444';

  // Drug stock donut
  const stockCounts = { Adequate:0, Low:0, Critical:0 };
  hospitals.forEach(h => stockCounts[h.stock]++);
  const stockDonut = [
    { label:'Adequate', value:stockCounts.Adequate, color:'#10b981' },
    { label:'Low',      value:stockCounts.Low,      color:'#f59e0b' },
    { label:'Critical', value:stockCounts.Critical, color:'#ef4444' }
  ];

  // Top schools and facilities
  const schoolCounts = {};
  students.filter(s=>s.status==='Enrolled').forEach(s => { schoolCounts[s.school] = (schoolCounts[s.school]||0) + 1; });
  const topSchools = Object.entries(schoolCounts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,count])=>({name, count}));
  const topFacilities = [...hospitals].sort((a,b)=>b.visits - a.visits).slice(0,5);

  // Alerts
  const alerts = [
    ...hospitals.filter(h=>h.stock==='Critical').map(h => ({
      kind:'critical', Icon:Syringe, title:`Critical drug stock — ${h.name}`, detail:`${h.district} · ${h.inCharge}`, target:'hospitals'
    })),
    ...sync.filter(s=>s.status==='Syncing').map(s => ({
      kind:'warn', Icon:RefreshCcw, title:`${s.district} sync in progress`, detail:`Last sync ${s.lastSync}`, target:'overview'
    })),
    ...students.filter(s=>s.status==='Dropped Out').map(s => ({
      kind:'warn', Icon:GraduationCap, title:`Dropout reported — ${s.name}`, detail:`${s.school}, ${s.district}`, target:'students'
    }))
  ];

  const recent = audit.slice(0, 6).map(a => ({
    ...a, status: ['Edited','Created'].includes(a.action) ? 'Approved' : 'Pending'
  }));

  const kpis = [
    { label:'Students Enrolled',  value:enrolled.toLocaleString(),  trend:8.2,  sub:`${students.length} records · ${graduated} graduated`, Icon:GraduationCap, color:'sky',     target:'students'  },
    { label:'Health Facilities',  value:hospitals.length.toLocaleString(), trend:1.4, sub:`${totalBeds.toLocaleString()} beds · ${critical} critical`, Icon:Hospital, color:'emerald', target:'hospitals' },
    { label:'Families Registered',value:families.length.toLocaleString(), trend:4.6, sub:`${citizens} citizens linked`, Icon:Users2, color:'indigo', target:'families' },
    { label:'Citizens Linked',    value:citizens.toLocaleString(), trend:6.1,  sub:'multi-generational records', Icon:Sparkles, color:'violet', target:'families' },
    { label:'Edits This Week',    value:editsThisWeek.toLocaleString(), trend:12.0, sub:`${audit.length} audit entries`, Icon:Activity, color:'amber', target:'audit' },
    { label:'Open Alerts',        value:alertsCount.toLocaleString(), trend:-3.1, sub:`${critical} critical · ${dropouts} dropouts`, Icon:BellRing, color:'rose', target:'overview' }
  ];

  const quickActions = [
    { label:'Students',  Icon:GraduationCap, target:'students'  },
    { label:'Hospitals', Icon:Hospital,      target:'hospitals' },
    { label:'Families',  Icon:Users2,        target:'families'  },
    { label:'Audit Log', Icon:FileClock,     target:'audit'     }
  ];

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="bg-gradient-to-r from-uinr-dark via-uinr to-uinr-light text-white rounded-2xl p-6 shadow-lg flex flex-col lg:flex-row lg:items-center gap-5">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-white/70 text-xs uppercase tracking-wider"><Globe2 size={14} /> National overview</div>
          <h2 className="text-2xl font-bold mt-1">Good day, {user.name.split(' ')[0]}.</h2>
          <p className="text-white/80 text-sm mt-1">
            {enrolled.toLocaleString()} students enrolled across {Object.keys(distGroups).length} districts ·
            {' '}{totalVisits.toLocaleString()} patient visits this period ·
            {' '}<span className="text-amber-200 font-semibold">{alertsCount} open alerts</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map(a => (
            <button key={a.target} onClick={()=>setSection(a.target)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur px-3.5 py-2 rounded-lg text-sm font-medium transition">
              <a.Icon size={16} /> {a.label} <ArrowRight size={14} className="opacity-70" />
            </button>
          ))}
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((k, i) => (
          <KpiCard key={i} {...k} onClick={()=>setSection(k.target)} />
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-uinr" />
              <div>
                <div className="font-semibold text-slate-900">Enrolment trend</div>
                <div className="text-xs text-slate-500">Students by enrolment year</div>
              </div>
            </div>
            <Badge kind="blue">Education</Badge>
          </div>
          <div className="p-5">
            {enrolmentSeries.length > 0
              ? <AreaChart data={enrolmentSeries} color="#1a3a5c" />
              : <div className="text-sm text-slate-500 py-10 text-center">No enrolment data.</div>}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-uinr" />
              <div>
                <div className="font-semibold text-slate-900">Students by district</div>
                <div className="text-xs text-slate-500">Top {studentsByDistrict.length} districts</div>
              </div>
            </div>
          </div>
          <div className="p-5">
            <HBarChart data={studentsByDistrict} color="#1a3a5c" />
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Syringe size={18} className="text-emerald-600" />
              <div>
                <div className="font-semibold text-slate-900">Vaccination coverage by district</div>
                <div className="text-xs text-slate-500">Average across reporting facilities</div>
              </div>
            </div>
            <Badge kind="green">Health</Badge>
          </div>
          <div className="p-5">
            <HBarChart data={vacByDistrict} color={vacColor} valueSuffix="%" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
            <Stethoscope size={18} className="text-uinr" />
            <div>
              <div className="font-semibold text-slate-900">Drug stock distribution</div>
              <div className="text-xs text-slate-500">Across {hospitals.length} facilities</div>
            </div>
          </div>
          <div className="p-5">
            <Donut data={stockDonut} />
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900">Recent Record Edits</div>
              <div className="text-xs text-slate-500">Latest changes across the system</div>
            </div>
            <button onClick={()=>setSection('audit')} className="text-xs font-semibold text-uinr hover:underline flex items-center gap-1">
              Full audit log <ArrowRight size={12} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-5 py-2.5 font-medium">Name</th>
                  <th className="text-left px-5 py-2.5 font-medium">Module</th>
                  <th className="text-left px-5 py-2.5 font-medium">District</th>
                  <th className="text-left px-5 py-2.5 font-medium">Edited By</th>
                  <th className="text-left px-5 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(r => (
                  <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-2.5 font-medium text-slate-800">{r.record}</td>
                    <td className="px-5 py-2.5 text-slate-600">{r.module}</td>
                    <td className="px-5 py-2.5 text-slate-600">{r.district}</td>
                    <td className="px-5 py-2.5 text-slate-600">{r.by}</td>
                    <td className="px-5 py-2.5"><Badge kind={statusKind(r.status)}>{r.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing size={18} className="text-rose-600" />
              <div>
                <div className="font-semibold text-slate-900">Critical alerts</div>
                <div className="text-xs text-slate-500">{alerts.length} open</div>
              </div>
            </div>
          </div>
          <ul className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {alerts.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
                <CheckCircle2 size={28} className="text-emerald-500" /> All clear nationally.
              </li>
            )}
            {alerts.slice(0, 8).map((a, i) => {
              const Icon = a.Icon;
              return (
                <li key={i} className="px-5 py-3 flex items-start gap-3 hover:bg-slate-50 cursor-pointer" onClick={()=>setSection(a.target)}>
                  <div className={`p-1.5 rounded-lg ${a.kind === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{a.title}</div>
                    <div className="text-xs text-slate-500 truncate">{a.detail}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Top schools / facilities / sync row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
            <School size={18} className="text-uinr" />
            <div>
              <div className="font-semibold text-slate-900">Top schools by enrolment</div>
              <div className="text-xs text-slate-500">Active students</div>
            </div>
          </div>
          <ul className="divide-y divide-slate-100">
            {topSchools.map((s, i) => (
              <li key={s.name} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-uinr/10 text-uinr text-xs font-bold flex items-center justify-center">{i+1}</div>
                  <div className="text-sm font-medium text-slate-800">{s.name}</div>
                </div>
                <Badge kind="blue">{s.count}</Badge>
              </li>
            ))}
            {topSchools.length === 0 && <li className="px-5 py-6 text-center text-sm text-slate-500">No data.</li>}
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
            <Building2 size={18} className="text-emerald-600" />
            <div>
              <div className="font-semibold text-slate-900">Busiest facilities</div>
              <div className="text-xs text-slate-500">Recent patient visits</div>
            </div>
          </div>
          <ul className="divide-y divide-slate-100">
            {topFacilities.map((h, i) => (
              <li key={h.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">{i+1}</div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{h.name}</div>
                    <div className="text-xs text-slate-500">{h.district}</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-uinr ml-2">{h.visits.toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900">District Sync Status</div>
              <div className="text-xs text-slate-500">{sync.length} districts · {syncingCount} syncing</div>
            </div>
            <RefreshCcw size={16} className={`text-slate-400 ${syncingCount > 0 ? 'animate-spin' : ''}`} />
          </div>
          <ul className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {sync.map(s => (
              <li key={s.district} className="px-5 py-2.5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-800">{s.district}</div>
                  <div className="text-xs text-slate-500">Last sync {s.lastSync}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${s.status==='Synced' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                  <span className={`text-xs font-semibold ${s.status==='Synced' ? 'text-emerald-700' : 'text-amber-700'}`}>{s.status}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================
   Confirm dialog
   =========================================================== */
function Confirm({ open, title, message, onConfirm, onClose, danger=true }) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<>
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50">Cancel</button>
        <button onClick={onConfirm} className={`px-4 py-2 rounded-lg text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-uinr hover:bg-uinr-dark'}`}>Confirm</button>
      </>}>
      <p className="text-slate-700">{message}</p>
    </Modal>
  );
}

/* ===========================================================
   Student form
   =========================================================== */
function StudentForm({ initial, onSave, onClose, user }) {
  const [f, setF] = useState(initial || {
    name:'', nin:'', school:'', district: user.role==='District Registrar' ? user.district : 'Kampala',
    level:'S1', enrolmentYear: 2026, unebResults:'—', status:'Enrolled', guardianNin:''
  });
  const update = (k, v) => setF(s => ({ ...s, [k]: v }));
  const submit = (e) => { e.preventDefault(); onSave(f); };
  const lockedDistrict = user.role === 'District Registrar';

  return (
    <form onSubmit={submit} id="student-form" className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Full Name"><input className={inputCls} value={f.name} onChange={e=>update('name', e.target.value)} required /></Field>
      <Field label="NIN"><input className={inputCls} value={f.nin} onChange={e=>update('nin', e.target.value)} required /></Field>
      <Field label="School"><input className={inputCls} value={f.school} onChange={e=>update('school', e.target.value)} required /></Field>
      <Field label="District">
        <select className={inputCls} value={f.district} onChange={e=>update('district', e.target.value)} disabled={lockedDistrict}>
          {DISTRICTS.map(d => <option key={d}>{d}</option>)}
        </select>
      </Field>
      <Field label="Level">
        <select className={inputCls} value={f.level} onChange={e=>update('level', e.target.value)}>
          {LEVELS.map(l => <option key={l}>{l}</option>)}
        </select>
      </Field>
      <Field label="Enrolment Year">
        <input className={inputCls} type="number" value={f.enrolmentYear} onChange={e=>update('enrolmentYear', Number(e.target.value))} min={2000} max={2030} required />
      </Field>
      <Field label="UNEB Results"><input className={inputCls} value={f.unebResults} onChange={e=>update('unebResults', e.target.value)} /></Field>
      <Field label="Status">
        <select className={inputCls} value={f.status} onChange={e=>update('status', e.target.value)}>
          {STUDENT_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Guardian NIN"><input className={inputCls} value={f.guardianNin} onChange={e=>update('guardianNin', e.target.value)} /></Field>
    </form>
  );
}

/* ===========================================================
   Hospital form
   =========================================================== */
function HospitalForm({ initial, onSave, onClose, user }) {
  const [f, setF] = useState(initial || {
    name:'', level:'HC III', district: user.role==='District Registrar' ? user.district : 'Kampala',
    inCharge:'', beds:50, stock:'Adequate', lastInspection:'2026-06-01', visits:0, vacCoverage:80
  });
  const update = (k, v) => setF(s => ({ ...s, [k]: v }));
  const submit = (e) => { e.preventDefault(); onSave(f); };
  const lockedDistrict = user.role === 'District Registrar';

  return (
    <form onSubmit={submit} id="hospital-form" className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Facility Name"><input className={inputCls} value={f.name} onChange={e=>update('name', e.target.value)} required /></Field>
      <Field label="Level">
        <select className={inputCls} value={f.level} onChange={e=>update('level', e.target.value)}>
          {FACILITY_LEVELS.map(l => <option key={l}>{l}</option>)}
        </select>
      </Field>
      <Field label="District">
        <select className={inputCls} value={f.district} onChange={e=>update('district', e.target.value)} disabled={lockedDistrict}>
          {DISTRICTS.map(d => <option key={d}>{d}</option>)}
        </select>
      </Field>
      <Field label="In-charge Name"><input className={inputCls} value={f.inCharge} onChange={e=>update('inCharge', e.target.value)} required /></Field>
      <Field label="Bed Capacity"><input type="number" className={inputCls} value={f.beds} onChange={e=>update('beds', Number(e.target.value))} required /></Field>
      <Field label="Drug Stock Status">
        <select className={inputCls} value={f.stock} onChange={e=>update('stock', e.target.value)}>
          {STOCK_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Last Inspection"><input type="date" className={inputCls} value={f.lastInspection} onChange={e=>update('lastInspection', e.target.value)} /></Field>
      <Field label="Patient Visits (recent)"><input type="number" className={inputCls} value={f.visits} onChange={e=>update('visits', Number(e.target.value))} /></Field>
      <Field label="Vaccination Coverage (%)"><input type="number" min="0" max="100" className={inputCls} value={f.vacCoverage} onChange={e=>update('vacCoverage', Number(e.target.value))} /></Field>
    </form>
  );
}

/* ===========================================================
   Family form
   =========================================================== */
function FamilyForm({ initial, onSave, onClose, user }) {
  const [f, setF] = useState(initial || {
    head:'', nin:'', clan:CLANS[0], tribe:TRIBES[0], village:'',
    district: user.role==='District Registrar' ? user.district : 'Kampala',
    members:1, marriage:'Monogamous',
    tree:{ grandparents:[], parents:[], children:[] }
  });
  const update = (k, v) => setF(s => ({ ...s, [k]: v }));
  const lockedDistrict = user.role === 'District Registrar';
  const submit = (e) => { e.preventDefault(); onSave(f); };

  return (
    <form onSubmit={submit} id="family-form" className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Family Head Name"><input className={inputCls} value={f.head} onChange={e=>update('head', e.target.value)} required /></Field>
      <Field label="NIN"><input className={inputCls} value={f.nin} onChange={e=>update('nin', e.target.value)} required /></Field>
      <Field label="Clan">
        <select className={inputCls} value={f.clan} onChange={e=>update('clan', e.target.value)}>
          {CLANS.map(c => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Tribe">
        <select className={inputCls} value={f.tribe} onChange={e=>update('tribe', e.target.value)}>
          {TRIBES.map(t => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Village"><input className={inputCls} value={f.village} onChange={e=>update('village', e.target.value)} required /></Field>
      <Field label="District">
        <select className={inputCls} value={f.district} onChange={e=>update('district', e.target.value)} disabled={lockedDistrict}>
          {DISTRICTS.map(d => <option key={d}>{d}</option>)}
        </select>
      </Field>
      <Field label="Number of Members"><input type="number" min="1" className={inputCls} value={f.members} onChange={e=>update('members', Number(e.target.value))} /></Field>
      <Field label="Marriage Status">
        <select className={inputCls} value={f.marriage} onChange={e=>update('marriage', e.target.value)}>
          <option>Monogamous</option><option>Polygamous</option><option>Single</option><option>Widowed</option><option>Divorced</option>
        </select>
      </Field>
    </form>
  );
}

/* ===========================================================
   User form
   =========================================================== */
function UserForm({ initial, onSave }) {
  const [f, setF] = useState(initial || { name:'', username:'', role:'District Registrar', district:'Kampala', status:'Active' });
  const update = (k, v) => setF(s => ({ ...s, [k]: v }));
  const submit = (e) => { e.preventDefault(); onSave(f); };
  return (
    <form onSubmit={submit} id="user-form" className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Full Name"><input className={inputCls} value={f.name} onChange={e=>update('name', e.target.value)} required /></Field>
      <Field label="Username"><input className={inputCls} value={f.username} onChange={e=>update('username', e.target.value)} required /></Field>
      <Field label="Role">
        <select className={inputCls} value={f.role} onChange={e=>update('role', e.target.value)}>
          <option>Super Admin</option><option>Ministry Officer</option><option>District Registrar</option>
        </select>
      </Field>
      <Field label="District Assigned">
        <select className={inputCls} value={f.district} onChange={e=>update('district', e.target.value)}>
          {DISTRICTS.map(d => <option key={d}>{d}</option>)}
        </select>
      </Field>
      <Field label="Status">
        <select className={inputCls} value={f.status} onChange={e=>update('status', e.target.value)}>
          <option>Active</option><option>Suspended</option>
        </select>
      </Field>
    </form>
  );
}

const inputCls = 'w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uinr text-sm';
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  );
}

/* ===========================================================
   Permissions helper
   =========================================================== */
function permissions(user) {
  return {
    canEdit:   user.role !== 'Ministry Officer',
    canDelete: user.role === 'Super Admin',
    canCreate: user.role !== 'Ministry Officer',
    scopeDistrict: user.role === 'District Registrar' ? user.district : null
  };
}

/* ===========================================================
   Students page
   =========================================================== */
function StudentsPage({ students, dispatch, user, pushToast, audit, addAudit, openProfile }) {
  const perms = permissions(user);
  const scoped = perms.scopeDistrict ? students.filter(s => s.district === perms.scopeDistrict) : students;

  const [q, setQ] = useState('');
  const [fDist, setFDist] = useState('All');
  const [fLevel, setFLevel] = useState('All');
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  const filtered = scoped.filter(s =>
    (q === '' || s.name.toLowerCase().includes(q.toLowerCase()) || s.nin.toLowerCase().includes(q.toLowerCase())) &&
    (fDist === 'All' || s.district === fDist) &&
    (fLevel === 'All' || s.level === fLevel)
  );
  const { sorted, headerClick, SortIcon } = useSorted(filtered, 'name');

  const handleSave = async (rec) => {
    try {
      if (rec.id) {
        await dispatch({ type:'STUDENT_UPDATE', payload: rec });
        addAudit('Edited', 'Students', rec.name, user);
        pushToast('success', `Saved ${rec.name}`);
      } else {
        await dispatch({ type:'STUDENT_ADD', payload: rec });
        addAudit('Created', 'Students', rec.name, user);
        pushToast('success', `Added ${rec.name}`);
      }
      setEditing(null); setAdding(false);
    } catch {}
  };

  const handleDelete = async () => {
    const r = confirmDel;
    try {
      await dispatch({ type:'STUDENT_DELETE', payload: r.id });
      addAudit('Deleted', 'Students', r.name, user);
      pushToast('success', `Deleted ${r.name}`);
    } catch {}
    setConfirmDel(null);
  };

  const doExport = () => {
    exportCSV('students.csv', sorted, [
      { key:'name', label:'Name' }, { key:'nin', label:'NIN' }, { key:'school', label:'School' },
      { key:'district', label:'District' }, { key:'level', label:'Level' },
      { key:'enrolmentYear', label:'Enrolment Year' }, { key:'unebResults', label:'UNEB Results' },
      { key:'status', label:'Status' }, { key:'guardianNin', label:'Guardian NIN' }
    ]);
    pushToast('success', 'Exported students.csv');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by name or NIN…"
                 className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-uinr" />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Filter size={16} className="text-slate-400" />
          <select className={inputCls + ' w-auto'} value={fDist} onChange={e=>setFDist(e.target.value)} disabled={!!perms.scopeDistrict}>
            <option>All</option>
            {DISTRICTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <select className={inputCls + ' w-auto'} value={fLevel} onChange={e=>setFLevel(e.target.value)}>
            <option>All</option>
            {LEVELS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={doExport} className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">
            <Download size={16} /> Export CSV
          </button>
          <button disabled={!perms.canCreate} onClick={()=>setAdding(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white ${perms.canCreate ? 'bg-uinr hover:bg-uinr-dark' : 'bg-slate-300 cursor-not-allowed'}`}>
            <Plus size={16} /> Add Student
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {[
                  ['name','Name'],['nin','NIN'],['school','School'],['district','District'],
                  ['level','Level'],['enrolmentYear','Year'],['unebResults','UNEB'],['status','Status'],['guardianNin','Guardian NIN']
                ].map(([k,l]) => (
                  <th key={k} onClick={()=>headerClick(k)} className="text-left px-4 py-2.5 font-medium cursor-pointer select-none whitespace-nowrap">
                    {l} <SortIcon k={k} />
                  </th>
                ))}
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr><td colSpan="10" className="text-center py-8 text-slate-500">No students match your filters.</td></tr>
              )}
              {sorted.map(s => (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={()=>setEditing(s)}>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{s.name}</td>
                  <td className="px-4 py-2.5 text-slate-600 font-mono text-xs">{s.nin}</td>
                  <td className="px-4 py-2.5 text-slate-600">{s.school}</td>
                  <td className="px-4 py-2.5 text-slate-600">{s.district}</td>
                  <td className="px-4 py-2.5 text-slate-600">{s.level}</td>
                  <td className="px-4 py-2.5 text-slate-600">{s.enrolmentYear}</td>
                  <td className="px-4 py-2.5 text-slate-600">{s.unebResults}</td>
                  <td className="px-4 py-2.5"><Badge kind={statusKind(s.status)}>{s.status}</Badge></td>
                  <td className="px-4 py-2.5 text-slate-600 font-mono text-xs">{s.guardianNin}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap" onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>openProfile({ name:s.name, nin:s.nin })}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-uinr hover:bg-sky-50">
                      <Eye size={14} /> Profile
                    </button>
                    <button onClick={()=>setEditing(s)} disabled={!perms.canEdit}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ml-1 ${perms.canEdit ? 'text-uinr hover:bg-sky-50' : 'text-slate-400 cursor-not-allowed'}`}>
                      <Pencil size={14} /> Edit
                    </button>
                    <button onClick={()=>setConfirmDel(s)} disabled={!perms.canDelete}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ml-1 ${perms.canDelete ? 'text-red-600 hover:bg-red-50' : 'text-slate-400 cursor-not-allowed'}`}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!editing} onClose={()=>setEditing(null)} title={editing ? `Edit Student — ${editing.name}` : ''}
        footer={<>
          <button onClick={()=>setEditing(null)} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50">Cancel</button>
          <button form="student-form" type="submit" disabled={!perms.canEdit}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white ${perms.canEdit ? 'bg-uinr hover:bg-uinr-dark' : 'bg-slate-300 cursor-not-allowed'}`}>
            <Save size={16} /> Save Changes
          </button>
        </>}>
        {editing && <StudentForm initial={editing} onSave={handleSave} onClose={()=>setEditing(null)} user={user} />}
      </Modal>

      <Modal open={adding} onClose={()=>setAdding(false)} title="Add New Student"
        footer={<>
          <button onClick={()=>setAdding(false)} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50">Cancel</button>
          <button form="student-form" type="submit" className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-uinr hover:bg-uinr-dark">
            <Plus size={16} /> Add Student
          </button>
        </>}>
        <StudentForm onSave={handleSave} onClose={()=>setAdding(false)} user={user} />
      </Modal>

      <Confirm open={!!confirmDel} onClose={()=>setConfirmDel(null)} onConfirm={handleDelete}
        title="Delete student record?" message={confirmDel ? `This will permanently remove ${confirmDel.name} (${confirmDel.nin}). This action is logged in the audit trail.` : ''} />
    </div>
  );
}

/* ===========================================================
   Hospitals page
   =========================================================== */
function HospitalsPage({ hospitals, dispatch, user, pushToast, addAudit }) {
  const perms = permissions(user);
  const scoped = perms.scopeDistrict ? hospitals.filter(h => h.district === perms.scopeDistrict) : hospitals;

  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  const filtered = scoped.filter(h => q==='' || h.name.toLowerCase().includes(q.toLowerCase()) || h.district.toLowerCase().includes(q.toLowerCase()));
  const { sorted, headerClick, SortIcon } = useSorted(filtered, 'name');

  const handleSave = async (rec) => {
    try {
      if (rec.id) {
        await dispatch({ type:'HOSP_UPDATE', payload: rec });
        addAudit('Edited', 'Hospitals', rec.name, user);
        pushToast('success', `Saved ${rec.name}`);
      } else {
        await dispatch({ type:'HOSP_ADD', payload: rec });
        addAudit('Created', 'Hospitals', rec.name, user);
        pushToast('success', `Added ${rec.name}`);
      }
      setEditing(null); setAdding(false);
    } catch {}
  };

  const handleDelete = async () => {
    const r = confirmDel;
    try {
      await dispatch({ type:'HOSP_DELETE', payload:r.id });
      addAudit('Deleted', 'Hospitals', r.name, user);
      pushToast('success', `Deleted ${r.name}`);
    } catch {}
    setConfirmDel(null);
  };

  const districtCoverage = useMemo(() => {
    const byDist = {};
    scoped.forEach(h => {
      if (!byDist[h.district]) byDist[h.district] = { total: 0, sum: 0 };
      byDist[h.district].total += 1;
      byDist[h.district].sum += h.vacCoverage;
    });
    return Object.entries(byDist).map(([d, v]) => ({ district: d, pct: Math.round(v.sum / v.total) }));
  }, [scoped]);

  const doExport = () => {
    exportCSV('hospitals.csv', sorted, [
      { key:'name', label:'Facility' }, { key:'level', label:'Level' }, { key:'district', label:'District' },
      { key:'inCharge', label:'In-charge' }, { key:'beds', label:'Beds' }, { key:'stock', label:'Stock' },
      { key:'lastInspection', label:'Last Inspection' }, { key:'visits', label:'Visits' }, { key:'vacCoverage', label:'Vac Coverage %' }
    ]);
    pushToast('success', 'Exported hospitals.csv');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search facilities…"
                 className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-uinr" />
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={doExport} className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">
            <Download size={16} /> Export CSV
          </button>
          <button disabled={!perms.canCreate} onClick={()=>setAdding(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white ${perms.canCreate ? 'bg-uinr hover:bg-uinr-dark' : 'bg-slate-300 cursor-not-allowed'}`}>
            <Plus size={16} /> Add Facility
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {[['name','Facility'],['level','Level'],['district','District'],['inCharge','In-charge'],['beds','Beds'],['stock','Drug Stock'],['lastInspection','Last Inspection']].map(([k,l])=>(
                  <th key={k} onClick={()=>headerClick(k)} className="text-left px-4 py-2.5 font-medium cursor-pointer whitespace-nowrap">{l} <SortIcon k={k} /></th>
                ))}
                <th className="text-right px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr><td colSpan="8" className="text-center py-8 text-slate-500">No facilities found.</td></tr>
              )}
              {sorted.map(h => (
                <tr key={h.id} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={()=>setEditing(h)}>
                  <td className="px-4 py-2.5 font-medium text-slate-800 flex items-center gap-2"><Building2 size={14} className="text-uinr" />{h.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{h.level}</td>
                  <td className="px-4 py-2.5 text-slate-600">{h.district}</td>
                  <td className="px-4 py-2.5 text-slate-600">{h.inCharge}</td>
                  <td className="px-4 py-2.5 text-slate-600">{h.beds}</td>
                  <td className="px-4 py-2.5"><Badge kind={statusKind(h.stock)}>{h.stock}</Badge></td>
                  <td className="px-4 py-2.5 text-slate-600">{h.lastInspection}</td>
                  <td className="px-4 py-2.5 text-right" onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>setEditing(h)} disabled={!perms.canEdit}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${perms.canEdit ? 'text-uinr hover:bg-sky-50' : 'text-slate-400 cursor-not-allowed'}`}>
                      <Pencil size={14} /> Edit
                    </button>
                    <button onClick={()=>setConfirmDel(h)} disabled={!perms.canDelete}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ml-1 ${perms.canDelete ? 'text-red-600 hover:bg-red-50' : 'text-slate-400 cursor-not-allowed'}`}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
            <Activity size={18} className="text-uinr" />
            <div>
              <div className="font-semibold text-slate-900">Recent Patient Visits</div>
              <div className="text-xs text-slate-500">Latest visit counts per facility</div>
            </div>
          </div>
          <ul className="divide-y divide-slate-100">
            {sorted.slice(0, 8).map(h => (
              <li key={h.id} className="px-5 py-2.5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-800">{h.name}</div>
                  <div className="text-xs text-slate-500">{h.district} · {h.level}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-uinr">{h.visits.toLocaleString()}</div>
                  <div className="text-xs text-slate-500">visits</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
            <Syringe size={18} className="text-emerald-600" />
            <div>
              <div className="font-semibold text-slate-900">Vaccination Coverage</div>
              <div className="text-xs text-slate-500">Per district average</div>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {districtCoverage.map(d => (
              <div key={d.district}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">{d.district}</span>
                  <span className="text-slate-600">{d.pct}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${d.pct>=85?'bg-emerald-500':d.pct>=75?'bg-amber-500':'bg-red-500'}`} style={{ width: `${d.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={!!editing} onClose={()=>setEditing(null)} title={editing ? `Edit Facility — ${editing.name}` : ''}
        footer={<>
          <button onClick={()=>setEditing(null)} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50">Cancel</button>
          <button form="hospital-form" type="submit" disabled={!perms.canEdit}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white ${perms.canEdit ? 'bg-uinr hover:bg-uinr-dark' : 'bg-slate-300 cursor-not-allowed'}`}>
            <Save size={16} /> Save Changes
          </button>
        </>}>
        {editing && <HospitalForm initial={editing} onSave={handleSave} onClose={()=>setEditing(null)} user={user} />}
      </Modal>

      <Modal open={adding} onClose={()=>setAdding(false)} title="Add Facility"
        footer={<>
          <button onClick={()=>setAdding(false)} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50">Cancel</button>
          <button form="hospital-form" type="submit" className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-uinr hover:bg-uinr-dark">
            <Plus size={16} /> Add Facility
          </button>
        </>}>
        <HospitalForm onSave={handleSave} onClose={()=>setAdding(false)} user={user} />
      </Modal>

      <Confirm open={!!confirmDel} onClose={()=>setConfirmDel(null)} onConfirm={handleDelete}
        title="Delete facility?" message={confirmDel ? `${confirmDel.name} in ${confirmDel.district} will be removed.` : ''} />
    </div>
  );
}

/* ===========================================================
   Family tree SVG visualization
   =========================================================== */
function FamilyTreeSVG({ family, students, hospitals, onNodeClick }) {
  const { grandparents, parents, children } = family.tree;
  const width = 880, height = 460;
  const gpY = 60, pY = 220, cY = 380;

  const layout = (people, y) => {
    const gap = width / (people.length + 1);
    return people.map((p, i) => ({ ...p, x: gap * (i + 1), y }));
  };
  const gp = layout(grandparents, gpY);
  const pa = layout(parents, pY);
  const ch = layout(children, cY);

  const Node = ({ person }) => {
    const linkedStudent = students.find(s => s.nin === person.nin);
    const isStudent = !!linkedStudent;
    return (
      <g onClick={() => onNodeClick(person)} className="cursor-pointer">
        <rect x={person.x - 90} y={person.y - 26} width={180} height={52} rx={8}
              fill={isStudent ? '#e0f2fe' : '#ffffff'} stroke={isStudent ? '#0284c7' : '#1a3a5c'} strokeWidth={1.5} />
        <text x={person.x} y={person.y - 6} textAnchor="middle" fontSize="13" fontWeight="600" fill="#1a3a5c">{person.name}</text>
        <text x={person.x} y={person.y + 11} textAnchor="middle" fontSize="10" fontFamily="ui-monospace, monospace" fill="#475569">{person.nin}</text>
      </g>
    );
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 720 }}>
        {/* Connectors gp -> parents */}
        {pa.map((p, i) => gp.map((g, j) => (
          <line key={`gp-${i}-${j}`} x1={g.x} y1={g.y + 26} x2={p.x} y2={p.y - 26} stroke="#94a3b8" strokeWidth={1.2} />
        )))}
        {/* Connectors parents -> children */}
        {ch.map((c, i) => pa.map((p, j) => (
          <line key={`pc-${i}-${j}`} x1={p.x} y1={p.y + 26} x2={c.x} y2={c.y - 26} stroke="#94a3b8" strokeWidth={1.2} />
        )))}
        {/* Generation labels */}
        <text x={20} y={gpY + 4} fontSize="11" fontWeight="700" fill="#64748b">GRANDPARENTS</text>
        <text x={20} y={pY + 4} fontSize="11" fontWeight="700" fill="#64748b">PARENTS</text>
        <text x={20} y={cY + 4} fontSize="11" fontWeight="700" fill="#64748b">CHILDREN</text>
        {gp.map((p, i) => <Node key={`gp-n-${i}`} person={p} />)}
        {pa.map((p, i) => <Node key={`pa-n-${i}`} person={p} />)}
        {ch.map((p, i) => <Node key={`ch-n-${i}`} person={p} />)}
      </svg>
      <div className="px-4 py-2 text-xs text-slate-500 flex items-center gap-4">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-sky-100 border border-sky-500 rounded" /> Linked to student record</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-white border border-uinr rounded" /> Family member</span>
      </div>
    </div>
  );
}

/* ===========================================================
   Families page
   =========================================================== */
function FamiliesPage({ families, students, hospitals, dispatch, user, pushToast, addAudit, openProfile }) {
  const perms = permissions(user);
  const scoped = perms.scopeDistrict ? families.filter(f => f.district === perms.scopeDistrict) : families;

  const [q, setQ] = useState('');
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [addingMember, setAddingMember] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [personInfo, setPersonInfo] = useState(null);

  const filtered = scoped.filter(f => q==='' || f.head.toLowerCase().includes(q.toLowerCase()) || f.nin.toLowerCase().includes(q.toLowerCase()));
  const { sorted, headerClick, SortIcon } = useSorted(filtered, 'head');

  const handleSave = async (rec) => {
    try {
      if (rec.id) {
        await dispatch({ type:'FAM_UPDATE', payload: rec });
        addAudit('Edited', 'Families', rec.head, user);
        pushToast('success', `Saved ${rec.head}`);
      } else {
        const withTree = { ...rec, tree: rec.tree && rec.tree.parents.length ? rec.tree : { grandparents:[], parents:[{ name: rec.head, nin: rec.nin }], children:[] } };
        await dispatch({ type:'FAM_ADD', payload: withTree });
        addAudit('Created', 'Families', rec.head, user);
        pushToast('success', `Added ${rec.head}`);
      }
      setEditing(null); setAdding(false);
    } catch {}
  };

  const handleDelete = async () => {
    const r = confirmDel;
    try {
      await dispatch({ type:'FAM_DELETE', payload:r.id });
      addAudit('Deleted', 'Families', r.head, user);
      pushToast('success', `Deleted ${r.head}`);
    } catch {}
    setConfirmDel(null);
  };

  const addMember = async (gen, name, ninVal) => {
    const updated = JSON.parse(JSON.stringify(viewing));
    updated.tree[gen].push({ name, nin: ninVal });
    updated.members += 1;
    try {
      await dispatch({ type:'FAM_UPDATE', payload: updated });
      addAudit('Edited', 'Families', `${updated.head} (added ${gen} member ${name})`, user);
      pushToast('success', `Added ${name}`);
      setViewing(updated);
      setAddingMember(null);
    } catch {}
  };

  const doExport = () => {
    exportCSV('families.csv', sorted, [
      { key:'head', label:'Family Head' }, { key:'nin', label:'NIN' }, { key:'clan', label:'Clan' },
      { key:'tribe', label:'Tribe' }, { key:'village', label:'Village' }, { key:'district', label:'District' },
      { key:'members', label:'Members' }, { key:'marriage', label:'Marriage' }
    ]);
    pushToast('success', 'Exported families.csv');
  };

  const personDetails = (person) => {
    const student = students.find(s => s.nin === person.nin);
    const fam = families.find(f => f.nin === person.nin || f.tree.parents.some(p => p.nin === person.nin));
    const facilityVisitedNin = person.nin;
    const facility = hospitals.find(h => h.district === (fam?.district || ''));
    return { student, fam, facility };
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search families…"
                 className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-uinr" />
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={doExport} className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">
            <Download size={16} /> Export CSV
          </button>
          <button disabled={!perms.canCreate} onClick={()=>setAdding(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white ${perms.canCreate ? 'bg-uinr hover:bg-uinr-dark' : 'bg-slate-300 cursor-not-allowed'}`}>
            <Plus size={16} /> Add Family
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {[['head','Family Head'],['nin','NIN'],['clan','Clan'],['tribe','Tribe'],['village','Village'],['district','District'],['members','Members'],['marriage','Marriage']].map(([k,l])=>(
                  <th key={k} onClick={()=>headerClick(k)} className="text-left px-4 py-2.5 font-medium cursor-pointer whitespace-nowrap">{l} <SortIcon k={k} /></th>
                ))}
                <th className="text-right px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr><td colSpan="9" className="text-center py-8 text-slate-500">No families found.</td></tr>
              )}
              {sorted.map(f => (
                <tr key={f.id} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={()=>setViewing(f)}>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{f.head}</td>
                  <td className="px-4 py-2.5 text-slate-600 font-mono text-xs">{f.nin}</td>
                  <td className="px-4 py-2.5 text-slate-600">{f.clan}</td>
                  <td className="px-4 py-2.5 text-slate-600">{f.tribe}</td>
                  <td className="px-4 py-2.5 text-slate-600">{f.village}</td>
                  <td className="px-4 py-2.5 text-slate-600">{f.district}</td>
                  <td className="px-4 py-2.5 text-slate-600">{f.members}</td>
                  <td className="px-4 py-2.5 text-slate-600">{f.marriage}</td>
                  <td className="px-4 py-2.5 text-right" onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>setViewing(f)} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-uinr hover:bg-sky-50"><Eye size={14} /> View</button>
                    <button onClick={()=>setEditing(f)} disabled={!perms.canEdit}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ml-1 ${perms.canEdit ? 'text-uinr hover:bg-sky-50' : 'text-slate-400 cursor-not-allowed'}`}>
                      <Pencil size={14} /> Edit
                    </button>
                    <button onClick={()=>setConfirmDel(f)} disabled={!perms.canDelete}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ml-1 ${perms.canDelete ? 'text-red-600 hover:bg-red-50' : 'text-slate-400 cursor-not-allowed'}`}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!viewing} onClose={()=>setViewing(null)} wide
        title={viewing ? `Family of ${viewing.head} — ${viewing.clan} Clan, ${viewing.tribe}` : ''}
        footer={<>
          <button onClick={()=>setAddingMember({ gen:'children' })} disabled={!perms.canEdit}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white ${perms.canEdit ? 'bg-uinr hover:bg-uinr-dark' : 'bg-slate-300 cursor-not-allowed'}`}>
            <Plus size={16} /> Add Family Member
          </button>
          <button onClick={()=>setViewing(null)} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50">Close</button>
        </>}>
        {viewing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Stat label="Village" value={viewing.village} />
              <Stat label="District" value={viewing.district} />
              <Stat label="Members" value={viewing.members} />
              <Stat label="Marriage" value={viewing.marriage} />
            </div>
            <FamilyTreeSVG family={viewing} students={students} hospitals={hospitals} onNodeClick={(p)=>{ setViewing(null); openProfile(p); }} />
            <p className="text-xs text-slate-500">Click any person in the tree to open their full citizen profile (education, health, family, audit).</p>
          </div>
        )}
      </Modal>

      <Modal open={!!personInfo} onClose={()=>setPersonInfo(null)}
        title={personInfo ? `${personInfo.name} — Linked Records` : ''}>
        {personInfo && (() => {
          const d = personDetails(personInfo);
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Stat label="Name" value={personInfo.name} />
                <Stat label="NIN" value={personInfo.nin} mono />
              </div>
              <div className="border-t pt-3">
                <div className="font-semibold text-slate-800 mb-2 flex items-center gap-2"><GraduationCap size={16} className="text-uinr" /> Student Record</div>
                {d.student ? (
                  <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 grid grid-cols-2 gap-2 text-sm">
                    <Stat label="School" value={d.student.school} />
                    <Stat label="Level" value={d.student.level} />
                    <Stat label="District" value={d.student.district} />
                    <Stat label="Status" value={<Badge kind={statusKind(d.student.status)}>{d.student.status}</Badge>} />
                  </div>
                ) : <div className="text-sm text-slate-500 italic">No student record linked to this NIN.</div>}
              </div>
              <div className="border-t pt-3">
                <div className="font-semibold text-slate-800 mb-2 flex items-center gap-2"><Hospital size={16} className="text-emerald-600" /> Linked Health Facility (district)</div>
                {d.facility ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 grid grid-cols-2 gap-2 text-sm">
                    <Stat label="Facility" value={d.facility.name} />
                    <Stat label="Level" value={d.facility.level} />
                    <Stat label="In-charge" value={d.facility.inCharge} />
                    <Stat label="Drug Stock" value={<Badge kind={statusKind(d.facility.stock)}>{d.facility.stock}</Badge>} />
                  </div>
                ) : <div className="text-sm text-slate-500 italic">No district facility found.</div>}
              </div>
            </div>
          );
        })()}
      </Modal>

      <Modal open={!!addingMember} onClose={()=>setAddingMember(null)} title="Add Family Member"
        footer={<>
          <button onClick={()=>setAddingMember(null)} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50">Cancel</button>
          <button form="member-form" type="submit" className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-uinr hover:bg-uinr-dark"><Plus size={16} /> Add</button>
        </>}>
        <AddMemberForm onSubmit={(gen, n, nv) => addMember(gen, n, nv)} />
      </Modal>

      <Modal open={!!editing} onClose={()=>setEditing(null)} title={editing ? `Edit Family — ${editing.head}` : ''}
        footer={<>
          <button onClick={()=>setEditing(null)} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50">Cancel</button>
          <button form="family-form" type="submit" disabled={!perms.canEdit}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white ${perms.canEdit ? 'bg-uinr hover:bg-uinr-dark' : 'bg-slate-300 cursor-not-allowed'}`}>
            <Save size={16} /> Save Changes
          </button>
        </>}>
        {editing && <FamilyForm initial={editing} onSave={handleSave} onClose={()=>setEditing(null)} user={user} />}
      </Modal>

      <Modal open={adding} onClose={()=>setAdding(false)} title="Add Family"
        footer={<>
          <button onClick={()=>setAdding(false)} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50">Cancel</button>
          <button form="family-form" type="submit" className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-uinr hover:bg-uinr-dark">
            <Plus size={16} /> Add Family
          </button>
        </>}>
        <FamilyForm onSave={handleSave} onClose={()=>setAdding(false)} user={user} />
      </Modal>

      <Confirm open={!!confirmDel} onClose={()=>setConfirmDel(null)} onConfirm={handleDelete}
        title="Delete family?" message={confirmDel ? `Family of ${confirmDel.head} (${confirmDel.district}) will be removed.` : ''} />
    </div>
  );
}

function AddMemberForm({ onSubmit }) {
  const [gen, setGen] = useState('children');
  const [name, setName] = useState('');
  const [nin, setNin] = useState('');
  return (
    <form id="member-form" onSubmit={e=>{e.preventDefault(); onSubmit(gen, name, nin);}} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Generation">
        <select className={inputCls} value={gen} onChange={e=>setGen(e.target.value)}>
          <option value="grandparents">Grandparents</option>
          <option value="parents">Parents</option>
          <option value="children">Children</option>
        </select>
      </Field>
      <Field label="Name"><input className={inputCls} value={name} onChange={e=>setName(e.target.value)} required /></Field>
      <Field label="NIN"><input className={inputCls} value={nin} onChange={e=>setNin(e.target.value)} required /></Field>
    </form>
  );
}

function Stat({ label, value, mono }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{label}</div>
      <div className={`text-sm text-slate-800 mt-0.5 ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}

/* ===========================================================
   Audit Log page
   =========================================================== */
function AuditPage({ audit, user, pushToast }) {
  const [mod, setMod] = useState('All');
  const [role, setRole] = useState('All');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const scoped = useMemo(() => {
    if (user.role === 'Super Admin') return audit;
    if (user.role === 'Ministry Officer') return audit.filter(a => a.role !== 'District Registrar' || a.district === user.district);
    return audit.filter(a => a.district === user.district);
  }, [audit, user]);

  const filtered = scoped.filter(a =>
    (mod === 'All' || a.module === mod) &&
    (role === 'All' || a.role === role) &&
    (!from || a.ts.slice(0,10) >= from) &&
    (!to || a.ts.slice(0,10) <= to)
  );
  const { sorted, headerClick, SortIcon } = useSorted(filtered, 'ts');

  const doExport = () => {
    exportCSV('audit-log.csv', sorted, [
      { key:'ts', label:'Timestamp' }, { key:'action', label:'Action' }, { key:'module', label:'Module' },
      { key:'record', label:'Record' }, { key:'by', label:'Performed By' }, { key:'role', label:'Role' }, { key:'district', label:'District' }
    ]);
    pushToast('success', 'Exported audit-log.csv');
  };

  const modules = ['All','Students','Hospitals','Families','Audit','Roles'];
  const roles = ['All','Super Admin','Ministry Officer','District Registrar'];

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Module</span>
          <select className={inputCls + ' w-auto'} value={mod} onChange={e=>setMod(e.target.value)}>
            {modules.map(m => <option key={m}>{m}</option>)}
          </select>
          <span className="text-slate-500 ml-2">Role</span>
          <select className={inputCls + ' w-auto'} value={role} onChange={e=>setRole(e.target.value)}>
            {roles.map(r => <option key={r}>{r}</option>)}
          </select>
          <span className="text-slate-500 ml-2">From</span>
          <input type="date" className={inputCls + ' w-auto'} value={from} onChange={e=>setFrom(e.target.value)} />
          <span className="text-slate-500 ml-2">To</span>
          <input type="date" className={inputCls + ' w-auto'} value={to} onChange={e=>setTo(e.target.value)} />
        </div>
        <button onClick={doExport} className="ml-auto flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {[['ts','Timestamp'],['action','Action'],['module','Module'],['record','Record'],['by','Performed By'],['role','Role'],['district','District']].map(([k,l])=>(
                  <th key={k} onClick={()=>headerClick(k)} className="text-left px-4 py-2.5 font-medium cursor-pointer whitespace-nowrap">{l} <SortIcon k={k} /></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && <tr><td colSpan="7" className="text-center py-8 text-slate-500">No matching audit entries.</td></tr>}
              {sorted.map(a => (
                <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-slate-700 font-mono text-xs whitespace-nowrap">{a.ts}</td>
                  <td className="px-4 py-2.5">
                    <Badge kind={a.action==='Created' ? 'green' : a.action==='Deleted' ? 'red' : a.action==='Edited' ? 'amber' : 'gray'}>{a.action}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{a.module}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{a.record}</td>
                  <td className="px-4 py-2.5 text-slate-600">{a.by}</td>
                  <td className="px-4 py-2.5 text-slate-600">{a.role}</td>
                  <td className="px-4 py-2.5 text-slate-600">{a.district}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================
   Roles & Access page (Super Admin only)
   =========================================================== */
function RolesPage({ admins, dispatch, user, pushToast, addAudit }) {
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [confirmAct, setConfirmAct] = useState(null);

  const handleSave = async (rec) => {
    try {
      if (rec.id) {
        await dispatch({ type:'USER_UPDATE', payload: rec });
        addAudit('Edited', 'Roles', `User: ${rec.username}`, user);
        pushToast('success', `Saved ${rec.name}`);
      } else {
        await dispatch({ type:'USER_ADD', payload: rec });
        addAudit('Created', 'Roles', `User: ${rec.username}`, user);
        pushToast('success', `Added ${rec.name}`);
      }
      setEditing(null); setAdding(false);
    } catch {}
  };

  const toggle = async () => {
    const u = confirmAct;
    const next = { ...u, status: u.status === 'Active' ? 'Suspended' : 'Active' };
    try {
      await dispatch({ type:'USER_UPDATE', payload: next });
      addAudit('Edited', 'Roles', `User: ${u.username} → ${next.status}`, user);
      pushToast('success', `${u.name} is now ${next.status}`);
    } catch {}
    setConfirmAct(null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck size={22} className="text-uinr" />
          <div>
            <div className="font-semibold text-slate-900">Administrator accounts</div>
            <div className="text-xs text-slate-500">Manage who can access the registry and at what level</div>
          </div>
        </div>
        <button onClick={()=>setAdding(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-uinr text-white text-sm hover:bg-uinr-dark">
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {['Name','Username','Role','District','Status','Actions'].map(h =>
                  <th key={h} className="text-left px-4 py-2.5 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {admins.map(a => (
                <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-800">{a.name}</td>
                  <td className="px-4 py-2.5 text-slate-600 font-mono text-xs">{a.username}</td>
                  <td className="px-4 py-2.5"><Badge kind="blue">{a.role}</Badge></td>
                  <td className="px-4 py-2.5 text-slate-600">{a.district}</td>
                  <td className="px-4 py-2.5"><Badge kind={statusKind(a.status)}>{a.status}</Badge></td>
                  <td className="px-4 py-2.5">
                    <button onClick={()=>setEditing(a)} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-uinr hover:bg-sky-50">
                      <UserCog size={14} /> Edit Role
                    </button>
                    <button onClick={()=>setConfirmAct(a)} className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ml-1 ${a.status==='Active' ? 'text-red-600 hover:bg-red-50' : 'text-emerald-700 hover:bg-emerald-50'}`}>
                      {a.status === 'Active' ? <><ShieldAlert size={14} /> Suspend</> : <><ShieldCheck size={14} /> Activate</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
        <div className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><KeyRound size={18} className="text-uinr" /> Role descriptions</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(ROLE_DESCRIPTIONS).map(([role, desc]) => (
            <div key={role} className="border border-slate-200 rounded-lg p-4">
              <Badge kind="blue">{role}</Badge>
              <p className="text-sm text-slate-700 mt-2 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <Modal open={!!editing} onClose={()=>setEditing(null)} title={editing ? `Edit User — ${editing.name}` : ''}
        footer={<>
          <button onClick={()=>setEditing(null)} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50">Cancel</button>
          <button form="user-form" type="submit" className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-uinr hover:bg-uinr-dark"><Save size={16} /> Save</button>
        </>}>
        {editing && <UserForm initial={editing} onSave={handleSave} />}
      </Modal>

      <Modal open={adding} onClose={()=>setAdding(false)} title="Add User"
        footer={<>
          <button onClick={()=>setAdding(false)} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50">Cancel</button>
          <button form="user-form" type="submit" className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-uinr hover:bg-uinr-dark"><Plus size={16} /> Add</button>
        </>}>
        <UserForm onSave={handleSave} />
      </Modal>

      <Confirm open={!!confirmAct} onClose={()=>setConfirmAct(null)} onConfirm={toggle}
        danger={confirmAct?.status === 'Active'}
        title={confirmAct?.status === 'Active' ? 'Suspend user?' : 'Activate user?'}
        message={confirmAct ? `${confirmAct.name} will be ${confirmAct.status === 'Active' ? 'suspended' : 'reactivated'}. They will ${confirmAct.status === 'Active' ? 'lose' : 'regain'} access immediately.` : ''} />
    </div>
  );
}

/* ===========================================================
   Settings page
   =========================================================== */
function SettingsPage({ settings, setSettings, user, pushToast, students, hospitals, families, audit, resetDemoData, seedDemo, seeding, dbConnected, dbError }) {
  const [sysName, setSysName] = useState(settings.sysName);
  const [adminEmail, setAdminEmail] = useState(settings.adminEmail);
  const [offlineSync, setOfflineSync] = useState(settings.offlineSync);
  const [oldPw, setOldPw] = useState(''); const [newPw, setNewPw] = useState(''); const [confirmPw, setConfirmPw] = useState('');
  const [savingSys, setSavingSys] = useState(false);

  const saveSys = async (e) => {
    e.preventDefault();
    const next = { ...settings, sysName, adminEmail, offlineSync };
    setSavingSys(true);
    try {
      if (dbConnected) await api.settings.save(next);
      setSettings(next);
      pushToast('success', 'System settings saved');
    } catch (err) {
      pushToast('error', `Save failed: ${err.message}`);
    } finally {
      setSavingSys(false);
    }
  };
  const savePw = (e) => {
    e.preventDefault();
    if (newPw !== confirmPw) { pushToast('error', 'Passwords do not match'); return; }
    if (newPw.length < 8) { pushToast('error', 'Password must be at least 8 characters'); return; }
    setOldPw(''); setNewPw(''); setConfirmPw('');
    pushToast('success', 'Password updated');
  };

  const doExportAll = () => {
    exportCSV('uinr-students.csv', students, [
      { key:'name', label:'Name' }, { key:'nin', label:'NIN' }, { key:'school', label:'School' },
      { key:'district', label:'District' }, { key:'level', label:'Level' }, { key:'enrolmentYear', label:'Year' },
      { key:'status', label:'Status' }
    ]);
    pushToast('success', 'Exported uinr-students.csv');
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <form onSubmit={saveSys} className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 font-semibold text-slate-900 flex items-center gap-2"><SettingsIcon size={18} className="text-uinr" /> System configuration</div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="System Name"><input className={inputCls} value={sysName} onChange={e=>setSysName(e.target.value)} required /></Field>
          <Field label="Admin Contact Email"><input type="email" className={inputCls} value={adminEmail} onChange={e=>setAdminEmail(e.target.value)} required /></Field>
          <label className="flex items-center gap-3 mt-2">
            <input type="checkbox" className="w-4 h-4 accent-uinr" checked={offlineSync} onChange={e=>setOfflineSync(e.target.checked)} />
            <div>
              <div className="text-sm font-medium text-slate-800">Enable offline sync</div>
              <div className="text-xs text-slate-500">Allow district offices to operate offline and sync when connected.</div>
            </div>
          </label>
        </div>
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-2">
          <button type="button" onClick={doExportAll} className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-white"><Download size={16} /> Export student data (CSV)</button>
          <button type="submit" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-uinr text-white text-sm hover:bg-uinr-dark"><Save size={16} /> Save settings</button>
        </div>
      </form>

      <form onSubmit={savePw} className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 font-semibold text-slate-900 flex items-center gap-2"><Lock size={18} className="text-uinr" /> Change password</div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Current Password"><input type="password" className={inputCls} value={oldPw} onChange={e=>setOldPw(e.target.value)} required /></Field>
          <Field label="New Password"><input type="password" className={inputCls} value={newPw} onChange={e=>setNewPw(e.target.value)} required /></Field>
          <Field label="Confirm New Password"><input type="password" className={inputCls} value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} required /></Field>
        </div>
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end">
          <button type="submit" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-uinr text-white text-sm hover:bg-uinr-dark"><Save size={16} /> Update password</button>
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 text-sm text-slate-600">
        <div className="font-semibold text-slate-900 mb-2">System summary</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Students" value={students.length} />
          <Stat label="Hospitals" value={hospitals.length} />
          <Stat label="Families" value={families.length} />
          <Stat label="Audit entries" value={audit.length} />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 font-semibold text-slate-900 flex items-center gap-2">
          <Database size={18} className="text-uinr" /> Database
        </div>
        <div className="p-5 space-y-4">
          <div className={`flex items-start gap-3 p-4 rounded-lg border ${dbConnected ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
            {dbConnected
              ? <Cloud size={20} className="text-emerald-700 shrink-0 mt-0.5" />
              : <CloudOff size={20} className="text-amber-700 shrink-0 mt-0.5" />}
            <div className="flex-1">
              <div className={`text-sm font-semibold ${dbConnected ? 'text-emerald-900' : 'text-amber-900'}`}>
                {dbConnected ? 'Connected to Supabase' : 'Demo mode (local browser storage only)'}
              </div>
              <div className={`text-xs mt-0.5 ${dbConnected ? 'text-emerald-800' : 'text-amber-800'}`}>
                {dbConnected
                  ? 'All edits sync to the shared Postgres database. Every signed-in device sees the same data.'
                  : 'Edits are saved to this browser only. Other devices will not see them. See SUPABASE_SETUP.md to connect a real database.'}
              </div>
              {dbError && <div className="text-xs mt-1 text-rose-700">Last error: {dbError}</div>}
            </div>
          </div>

          {dbConnected && (
            <div className="flex flex-wrap gap-2">
              <button onClick={seedDemo} disabled={seeding}
                className="flex items-center gap-2 px-3 py-2 bg-uinr text-white rounded-lg text-sm hover:bg-uinr-dark disabled:opacity-60">
                {seeding ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Seed demo data
              </button>
              <button onClick={resetDemoData} disabled={seeding}
                className="flex items-center gap-2 px-3 py-2 bg-rose-600 text-white rounded-lg text-sm hover:bg-rose-700 disabled:opacity-60">
                <RotateCcw size={16} /> Wipe + re-seed
              </button>
            </div>
          )}

          {!dbConnected && (
            <button onClick={resetDemoData}
              className="flex items-center gap-2 px-3 py-2 bg-rose-600 text-white rounded-lg text-sm hover:bg-rose-700">
              <RotateCcw size={16} /> Reset local demo data
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===========================================================
   Command palette (Cmd+K / Ctrl+K)
   =========================================================== */
function CommandPalette({ open, onClose, state, setSection, openProfile, user }) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const perms = user ? permissions(user) : { scopeDistrict: null };

  useEffect(() => { if (open) { setQ(''); setIdx(0); } }, [open]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [
      { kind:'nav', label:'Go to Overview',       sub:'Dashboard', target:'overview',  Icon:LayoutDashboard },
      { kind:'nav', label:'Go to Students',       sub:'Education records', target:'students', Icon:GraduationCap },
      { kind:'nav', label:'Go to Hospitals',      sub:'Health facilities', target:'hospitals', Icon:Hospital },
      { kind:'nav', label:'Go to Family Trees',   sub:'Household registry', target:'families', Icon:Users2 },
      { kind:'nav', label:'Go to Audit Log',      sub:'Immutable history',  target:'audit',    Icon:FileClock },
      { kind:'nav', label:'Go to Reports',        sub:'Printable summaries', target:'reports', Icon:FileText }
    ];
    const out = [];
    const scopeMatch = (d) => !perms.scopeDistrict || d === perms.scopeDistrict;
    state.students.forEach(s => {
      if (scopeMatch(s.district) && (s.name.toLowerCase().includes(term) || s.nin.toLowerCase().includes(term))) {
        out.push({ kind:'student', label:s.name, sub:`Student · ${s.school} · ${s.district}`, person:{ name:s.name, nin:s.nin }, Icon:GraduationCap });
      }
    });
    state.hospitals.forEach(h => {
      if (scopeMatch(h.district) && (h.name.toLowerCase().includes(term) || h.district.toLowerCase().includes(term))) {
        out.push({ kind:'hospital', label:h.name, sub:`Facility · ${h.level} · ${h.district}`, target:'hospitals', Icon:Hospital });
      }
    });
    state.families.forEach(f => {
      if (scopeMatch(f.district) && (f.head.toLowerCase().includes(term) || f.nin.toLowerCase().includes(term))) {
        out.push({ kind:'family', label:f.head, sub:`Family · ${f.clan} clan · ${f.district}`, target:'families', Icon:Users2 });
      }
    });
    return out.slice(0, 12);
  }, [q, state, perms.scopeDistrict]);

  useEffect(() => { setIdx(0); }, [results.length]);

  const pick = (r) => {
    if (r.kind === 'nav') setSection(r.target);
    else if (r.kind === 'student') openProfile(r.person);
    else if (r.kind === 'hospital' || r.kind === 'family') setSection(r.target);
    onClose();
  };

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(results.length - 1, i + 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setIdx(i => Math.max(0, i - 1)); }
    if (e.key === 'Enter' && results[idx]) { e.preventDefault(); pick(results[idx]); }
    if (e.key === 'Escape') onClose();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[950] bg-black/40 flex items-start justify-center pt-24 px-4 no-print" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
          <Search size={18} className="text-slate-400" />
          <input autoFocus value={q} onChange={e=>setQ(e.target.value)} onKeyDown={onKey}
            placeholder="Search students, hospitals, families, or jump to a section…"
            className="flex-1 outline-none text-sm" />
          <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-100 border border-slate-200 rounded text-slate-500">ESC</kbd>
        </div>
        <ul className="max-h-[420px] overflow-y-auto">
          {results.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-slate-500">No matches for "{q}".</li>
          )}
          {results.map((r, i) => {
            const Icon = r.Icon;
            return (
              <li key={i}
                  onMouseEnter={()=>setIdx(i)}
                  onClick={()=>pick(r)}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer ${i === idx ? 'bg-uinr/5' : ''}`}>
                <div className={`p-1.5 rounded-md ${i===idx ? 'bg-uinr text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{r.label}</div>
                  <div className="text-xs text-slate-500 truncate">{r.sub}</div>
                </div>
                {i === idx && <ChevronRight size={14} className="text-uinr" />}
              </li>
            );
          })}
        </ul>
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">↑↓</kbd> navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">↵</kbd> select</span>
          </div>
          <span>Ctrl/Cmd + K to toggle</span>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================
   Notification bell + panel
   =========================================================== */
function NotificationPanel({ open, onClose, alerts, readAlerts, markRead, markAllRead, setSection, audit }) {
  if (!open) return null;
  const recentActivity = audit.slice(0, 6);
  return (
    <div className="fixed inset-0 z-[850] no-print" onClick={onClose}>
      <div className="absolute right-4 lg:right-8 top-16 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-uinr" />
            <span className="font-semibold text-slate-900">Notifications</span>
            {alerts.length > 0 && <Badge kind="blue">{alerts.length}</Badge>}
          </div>
          {alerts.length > 0 && (
            <button onClick={markAllRead} className="text-xs text-uinr hover:underline flex items-center gap-1">
              <CheckCheck size={12} /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50">Open alerts</div>
          {alerts.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
              <CheckCircle2 size={24} className="text-emerald-500" /> No open alerts.
            </div>
          )}
          {alerts.map(a => {
            const Icon = a.Icon;
            const read = readAlerts.has(a.id);
            return (
              <button key={a.id}
                onClick={() => { markRead(a.id); setSection(a.target); onClose(); }}
                className={`w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-slate-50 border-l-2 ${read ? 'border-transparent opacity-70' : a.kind === 'critical' ? 'border-rose-500' : 'border-amber-500'}`}>
                <div className={`p-1.5 rounded-lg ${a.kind === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{a.title}</div>
                  <div className="text-xs text-slate-500 truncate">{a.detail}</div>
                </div>
                {!read && <span className="w-2 h-2 rounded-full bg-uinr mt-1.5 shrink-0" />}
              </button>
            );
          })}
          <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50 border-t border-slate-200">Recent activity</div>
          {recentActivity.map(a => (
            <div key={a.id} className="px-4 py-2.5 border-b border-slate-100 flex items-start gap-3 last:border-0">
              <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600"><Clock size={14} /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-700"><span className="font-semibold">{a.by}</span> {a.action.toLowerCase()} <span className="font-medium">{a.record}</span></div>
                <div className="text-xs text-slate-500">{a.module} · {a.ts}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===========================================================
   Profile view
   =========================================================== */
function ProfileView({ person, state, setSection, openProfile, onBack }) {
  const student   = state.students.find(s => s.nin === person.nin);
  const family    = state.families.find(f => f.nin === person.nin || f.tree.parents.some(p => p.nin === person.nin) || f.tree.children.some(c => c.nin === person.nin) || f.tree.grandparents.some(g => g.nin === person.nin));
  const facility  = family ? state.hospitals.find(h => h.district === family.district) : null;
  const history   = state.audit.filter(a => a.record.toLowerCase().includes(person.name.toLowerCase())).slice(0, 8);
  const initials  = person.name.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase();

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="bg-gradient-to-r from-uinr-dark to-uinr-light text-white rounded-2xl p-6 shadow-lg flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-2xl font-bold">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-wider text-white/70 flex items-center gap-2">
            <UserIcon size={12} /> Citizen profile
          </div>
          <h2 className="text-2xl font-bold mt-1 truncate">{person.name}</h2>
          <div className="text-sm text-white/80 mt-1 flex flex-wrap items-center gap-3">
            <span className="font-mono">{person.nin}</span>
            {family && <span className="flex items-center gap-1"><MapPin size={12} /> {family.district}</span>}
            {family && <span>{family.clan} clan · {family.tribe}</span>}
          </div>
        </div>
        <div className="hidden md:flex flex-col items-end gap-2">
          {student && <Badge kind={statusKind(student.status)}>{student.status}</Badge>}
          {!student && <Badge kind="gray">No student record</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
            <BookOpen size={18} className="text-uinr" />
            <div>
              <div className="font-semibold text-slate-900">Education record</div>
              <div className="text-xs text-slate-500">From the Ministry of Education</div>
            </div>
          </div>
          {student ? (
            <div className="p-5 grid grid-cols-2 gap-3 text-sm">
              <Stat label="School" value={student.school} />
              <Stat label="Level" value={student.level} />
              <Stat label="District" value={student.district} />
              <Stat label="Enrolment year" value={student.enrolmentYear} />
              <Stat label="UNEB results" value={student.unebResults} />
              <Stat label="Status" value={<Badge kind={statusKind(student.status)}>{student.status}</Badge>} />
              <Stat label="Guardian NIN" value={<span className="font-mono">{student.guardianNin}</span>} />
              <div className="col-span-2">
                <button onClick={()=>setSection('students')} className="text-xs text-uinr hover:underline flex items-center gap-1">
                  Open in Students module <ArrowRight size={12} />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 text-sm text-slate-500 italic">No education record linked to this NIN.</div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
            <HeartPulse size={18} className="text-rose-600" />
            <div>
              <div className="font-semibold text-slate-900">Health record</div>
              <div className="text-xs text-slate-500">District-linked facility</div>
            </div>
          </div>
          {facility ? (
            <div className="p-5 grid grid-cols-2 gap-3 text-sm">
              <Stat label="Facility" value={facility.name} />
              <Stat label="Level" value={facility.level} />
              <Stat label="In-charge" value={facility.inCharge} />
              <Stat label="Bed capacity" value={facility.beds} />
              <Stat label="Drug stock" value={<Badge kind={statusKind(facility.stock)}>{facility.stock}</Badge>} />
              <Stat label="Last inspection" value={facility.lastInspection} />
              <Stat label="Vaccination coverage" value={`${facility.vacCoverage}%`} />
              <div className="col-span-2">
                <button onClick={()=>setSection('hospitals')} className="text-xs text-uinr hover:underline flex items-center gap-1">
                  Open in Hospitals module <ArrowRight size={12} />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 text-sm text-slate-500 italic">No facility found for this district.</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
            <Network size={18} className="text-indigo-600" />
            <div>
              <div className="font-semibold text-slate-900">Family</div>
              <div className="text-xs text-slate-500">{family ? `Head: ${family.head}` : 'No family link'}</div>
            </div>
          </div>
          {family ? (
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Stat label="Clan" value={family.clan} />
                <Stat label="Tribe" value={family.tribe} />
                <Stat label="Village" value={family.village} />
                <Stat label="Members" value={family.members} />
              </div>
              <div className="border-t pt-3">
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Linked members</div>
                <div className="flex flex-wrap gap-2">
                  {[...family.tree.grandparents, ...family.tree.parents, ...family.tree.children].map((p, i) => (
                    <button key={i} onClick={()=>openProfile(p)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition ${p.nin === person.nin ? 'bg-uinr text-white border-uinr' : 'bg-slate-50 hover:bg-uinr/10 text-slate-700 border-slate-200'}`}>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={()=>setSection('families')} className="text-xs text-uinr hover:underline flex items-center gap-1">
                Open in Family Trees <ArrowRight size={12} />
              </button>
            </div>
          ) : (
            <div className="p-5 text-sm text-slate-500 italic">No family registry entry contains this person.</div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
            <Clock size={18} className="text-uinr" />
            <div>
              <div className="font-semibold text-slate-900">Audit history</div>
              <div className="text-xs text-slate-500">Mentions of {person.name}</div>
            </div>
          </div>
          {history.length === 0 ? (
            <div className="p-5 text-sm text-slate-500 italic">No audit entries reference this person yet.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {history.map(a => (
                <li key={a.id} className="px-5 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge kind={a.action==='Created' ? 'green' : a.action==='Deleted' ? 'red' : a.action==='Edited' ? 'amber' : 'gray'}>{a.action}</Badge>
                    <span className="text-slate-600">{a.module}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">by {a.by} · {a.ts}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===========================================================
   Reports module
   =========================================================== */
const REPORT_TEMPLATES = [
  { key:'enrolment', title:'District Enrolment Report',     desc:'Student enrolment, status mix, level distribution by district.', Icon:GraduationCap, color:'sky' },
  { key:'health',    title:'Health Facility Audit',         desc:'Facility-level inspection, capacity, drug stock and patient visits.', Icon:Hospital, color:'emerald' },
  { key:'vaccine',   title:'Vaccination Coverage Summary',  desc:'District-level vaccination averages and outliers.', Icon:Syringe, color:'rose' },
  { key:'family',    title:'Family Registry Snapshot',      desc:'Households per district, clan distribution, citizens linked.', Icon:Users2, color:'indigo' }
];

function ReportsPage({ state, openReport }) {
  const palette = {
    sky:'bg-sky-50 text-sky-700 border-sky-200',
    emerald:'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose:'bg-rose-50 text-rose-700 border-rose-200',
    indigo:'bg-indigo-50 text-indigo-700 border-indigo-200'
  };
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-uinr-dark to-uinr-light text-white rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wider text-white/70 flex items-center gap-2"><FileText size={14} /> Ministry reports</div>
          <h2 className="text-2xl font-bold mt-1">Generate printable reports</h2>
          <p className="text-sm text-white/80 mt-1">All reports use live data from the registry. Print to A4 or export to CSV from any module.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORT_TEMPLATES.map(r => {
          const Icon = r.Icon;
          return (
            <button key={r.key} onClick={()=>openReport(r.key)}
              className="text-left bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-uinr/40 transition">
              <div className={`inline-flex p-2 rounded-lg border ${palette[r.color]}`}><Icon size={18} /></div>
              <div className="mt-3 font-semibold text-slate-900">{r.title}</div>
              <div className="text-sm text-slate-600 mt-1">{r.desc}</div>
              <div className="mt-3 flex items-center gap-2 text-xs text-uinr font-semibold">
                Generate report <ArrowRight size={12} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReportHeader({ title, subtitle, user, settings }) {
  return (
    <div className="border-b-2 border-uinr pb-4 mb-6 flex items-start justify-between">
      <div className="flex items-center gap-4">
        <div className="bg-uinr text-white p-3 rounded-lg"><Shield size={28} /></div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500">Government of Uganda</div>
          <div className="font-bold text-lg text-slate-900">{settings.sysName}</div>
          <div className="text-xs text-slate-600">{subtitle}</div>
        </div>
      </div>
      <div className="text-right text-xs text-slate-600">
        <div className="font-semibold text-slate-800">{title}</div>
        <div>Generated {new Date().toLocaleString()}</div>
        <div>By {user.name} ({user.role})</div>
        <div className="mt-1 inline-block px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] rounded-full font-semibold">OFFICIAL · UNCLASSIFIED</div>
      </div>
    </div>
  );
}

function ReportView({ reportKey, state, user, settings, onClose }) {
  const tpl = REPORT_TEMPLATES.find(r => r.key === reportKey);
  if (!tpl) return null;

  const Body = () => {
    if (reportKey === 'enrolment') {
      const byDistrict = {};
      state.students.forEach(s => {
        if (!byDistrict[s.district]) byDistrict[s.district] = { total:0, enrolled:0, graduated:0, dropouts:0, levels:{} };
        const d = byDistrict[s.district];
        d.total += 1;
        if (s.status === 'Enrolled')   d.enrolled  += 1;
        if (s.status === 'Graduated')  d.graduated += 1;
        if (s.status === 'Dropped Out') d.dropouts += 1;
        d.levels[s.level] = (d.levels[s.level] || 0) + 1;
      });
      const rows = Object.entries(byDistrict).sort((a,b)=>b[1].total - a[1].total);
      return (
        <>
          <div className="grid grid-cols-4 gap-3 mb-5">
            <Stat label="Total students"  value={state.students.length} />
            <Stat label="Currently enrolled" value={state.students.filter(s=>s.status==='Enrolled').length} />
            <Stat label="Graduated" value={state.students.filter(s=>s.status==='Graduated').length} />
            <Stat label="Dropouts" value={state.students.filter(s=>s.status==='Dropped Out').length} />
          </div>
          <table className="w-full text-sm border-collapse">
            <thead><tr className="bg-slate-100 text-left">
              <th className="px-3 py-2 border border-slate-200">District</th>
              <th className="px-3 py-2 border border-slate-200">Total</th>
              <th className="px-3 py-2 border border-slate-200">Enrolled</th>
              <th className="px-3 py-2 border border-slate-200">Graduated</th>
              <th className="px-3 py-2 border border-slate-200">Dropouts</th>
              <th className="px-3 py-2 border border-slate-200">Dominant level</th>
            </tr></thead>
            <tbody>
              {rows.map(([d, v]) => {
                const dom = Object.entries(v.levels).sort((a,b)=>b[1]-a[1])[0];
                return (
                  <tr key={d}>
                    <td className="px-3 py-2 border border-slate-200 font-medium">{d}</td>
                    <td className="px-3 py-2 border border-slate-200">{v.total}</td>
                    <td className="px-3 py-2 border border-slate-200">{v.enrolled}</td>
                    <td className="px-3 py-2 border border-slate-200">{v.graduated}</td>
                    <td className="px-3 py-2 border border-slate-200">{v.dropouts}</td>
                    <td className="px-3 py-2 border border-slate-200">{dom ? `${dom[0]} (${dom[1]})` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      );
    }
    if (reportKey === 'health') {
      return (
        <>
          <div className="grid grid-cols-4 gap-3 mb-5">
            <Stat label="Facilities" value={state.hospitals.length} />
            <Stat label="Total beds"  value={state.hospitals.reduce((a,h)=>a+h.beds,0).toLocaleString()} />
            <Stat label="Total visits" value={state.hospitals.reduce((a,h)=>a+h.visits,0).toLocaleString()} />
            <Stat label="Critical stock" value={state.hospitals.filter(h=>h.stock==='Critical').length} />
          </div>
          <table className="w-full text-sm border-collapse">
            <thead><tr className="bg-slate-100 text-left">
              <th className="px-3 py-2 border border-slate-200">Facility</th>
              <th className="px-3 py-2 border border-slate-200">Level</th>
              <th className="px-3 py-2 border border-slate-200">District</th>
              <th className="px-3 py-2 border border-slate-200">Beds</th>
              <th className="px-3 py-2 border border-slate-200">Visits</th>
              <th className="px-3 py-2 border border-slate-200">Stock</th>
              <th className="px-3 py-2 border border-slate-200">Last inspection</th>
            </tr></thead>
            <tbody>
              {state.hospitals.map(h => (
                <tr key={h.id}>
                  <td className="px-3 py-2 border border-slate-200 font-medium">{h.name}</td>
                  <td className="px-3 py-2 border border-slate-200">{h.level}</td>
                  <td className="px-3 py-2 border border-slate-200">{h.district}</td>
                  <td className="px-3 py-2 border border-slate-200">{h.beds}</td>
                  <td className="px-3 py-2 border border-slate-200">{h.visits.toLocaleString()}</td>
                  <td className="px-3 py-2 border border-slate-200">{h.stock}</td>
                  <td className="px-3 py-2 border border-slate-200">{h.lastInspection}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      );
    }
    if (reportKey === 'vaccine') {
      const acc = {};
      state.hospitals.forEach(h => {
        if (!acc[h.district]) acc[h.district] = { sum:0, n:0 };
        acc[h.district].sum += h.vacCoverage; acc[h.district].n += 1;
      });
      const rows = Object.entries(acc).map(([d,v]) => ({ d, pct: Math.round(v.sum/v.n), facilities:v.n })).sort((a,b)=>b.pct-a.pct);
      const nat = Math.round(rows.reduce((a,r)=>a+r.pct, 0) / rows.length);
      return (
        <>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <Stat label="National average" value={`${nat}%`} />
            <Stat label="Best district" value={`${rows[0].d} (${rows[0].pct}%)`} />
            <Stat label="Worst district" value={`${rows[rows.length-1].d} (${rows[rows.length-1].pct}%)`} />
          </div>
          <table className="w-full text-sm border-collapse">
            <thead><tr className="bg-slate-100 text-left">
              <th className="px-3 py-2 border border-slate-200">District</th>
              <th className="px-3 py-2 border border-slate-200">Facilities</th>
              <th className="px-3 py-2 border border-slate-200">Coverage</th>
              <th className="px-3 py-2 border border-slate-200">Vs national</th>
              <th className="px-3 py-2 border border-slate-200">Status</th>
            </tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.d}>
                  <td className="px-3 py-2 border border-slate-200 font-medium">{r.d}</td>
                  <td className="px-3 py-2 border border-slate-200">{r.facilities}</td>
                  <td className="px-3 py-2 border border-slate-200">{r.pct}%</td>
                  <td className="px-3 py-2 border border-slate-200">{(r.pct - nat) >= 0 ? '+' : ''}{r.pct - nat} pts</td>
                  <td className="px-3 py-2 border border-slate-200">{r.pct >= 85 ? 'On track' : r.pct >= 75 ? 'Watch' : 'Action required'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      );
    }
    if (reportKey === 'family') {
      const byDist = {};
      state.families.forEach(f => {
        if (!byDist[f.district]) byDist[f.district] = { families:0, members:0, clans:new Set() };
        byDist[f.district].families += 1;
        byDist[f.district].members  += f.members;
        byDist[f.district].clans.add(f.clan);
      });
      const rows = Object.entries(byDist).map(([d,v]) => ({ d, families:v.families, members:v.members, clans:v.clans.size }));
      return (
        <>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <Stat label="Families registered" value={state.families.length} />
            <Stat label="Citizens linked" value={state.families.reduce((a,f)=>a+f.members,0)} />
            <Stat label="Unique clans" value={new Set(state.families.map(f=>f.clan)).size} />
          </div>
          <table className="w-full text-sm border-collapse">
            <thead><tr className="bg-slate-100 text-left">
              <th className="px-3 py-2 border border-slate-200">District</th>
              <th className="px-3 py-2 border border-slate-200">Families</th>
              <th className="px-3 py-2 border border-slate-200">Members</th>
              <th className="px-3 py-2 border border-slate-200">Distinct clans</th>
              <th className="px-3 py-2 border border-slate-200">Avg household</th>
            </tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.d}>
                  <td className="px-3 py-2 border border-slate-200 font-medium">{r.d}</td>
                  <td className="px-3 py-2 border border-slate-200">{r.families}</td>
                  <td className="px-3 py-2 border border-slate-200">{r.members}</td>
                  <td className="px-3 py-2 border border-slate-200">{r.clans}</td>
                  <td className="px-3 py-2 border border-slate-200">{(r.members/r.families).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-[900] bg-slate-100 overflow-auto">
      <div className="no-print bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft size={16} /> Back to Reports
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>window.print()} className="flex items-center gap-2 px-3 py-2 bg-uinr text-white rounded-lg text-sm hover:bg-uinr-dark">
            <Printer size={16} /> Print / Save as PDF
          </button>
        </div>
      </div>

      <div className="print-area max-w-4xl mx-auto bg-white shadow-sm my-6 p-8 border border-slate-200 rounded-lg">
        <ReportHeader title={tpl.title} subtitle={tpl.desc} user={user} settings={settings} />
        <Body />
        <div className="mt-8 pt-4 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between">
          <div>{settings.sysName} · uinr.go.ug</div>
          <div>Page 1 of 1 · Distribution restricted to authorised officers</div>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================
   App-level reducer
   =========================================================== */
const initialState = {
  students: INITIAL_STUDENTS,
  hospitals: INITIAL_HOSPITALS,
  families: INITIAL_FAMILIES,
  audit: INITIAL_AUDIT,
  admins: INITIAL_ADMINS,
  sync: INITIAL_SYNC
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_ALL':        return { ...state, ...action.payload };
    case 'STUDENT_ADD':    return { ...state, students: [action.payload, ...state.students] };
    case 'STUDENT_UPDATE': return { ...state, students: state.students.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'STUDENT_DELETE': return { ...state, students: state.students.filter(s => s.id !== action.payload) };
    case 'HOSP_ADD':       return { ...state, hospitals: [action.payload, ...state.hospitals] };
    case 'HOSP_UPDATE':    return { ...state, hospitals: state.hospitals.map(h => h.id === action.payload.id ? action.payload : h) };
    case 'HOSP_DELETE':    return { ...state, hospitals: state.hospitals.filter(h => h.id !== action.payload) };
    case 'FAM_ADD':        return { ...state, families: [action.payload, ...state.families] };
    case 'FAM_UPDATE':     return { ...state, families: state.families.map(f => f.id === action.payload.id ? action.payload : f) };
    case 'FAM_DELETE':     return { ...state, families: state.families.filter(f => f.id !== action.payload) };
    case 'USER_ADD':       return { ...state, admins: [action.payload, ...state.admins] };
    case 'USER_UPDATE':    return { ...state, admins: state.admins.map(u => u.id === action.payload.id ? action.payload : u) };
    case 'AUDIT_ADD':      return { ...state, audit: [action.payload, ...state.audit] };
    default: return state;
  }
}

/* ===========================================================
   Root App
   =========================================================== */
const DEFAULT_SETTINGS = {
  sysName: 'Uganda Integrated National Registry',
  adminEmail: 'admin@uinr.go.ug',
  offlineSync: true
};

export default function App() {
  const persisted = useMemo(() => loadPersisted(), []);
  const { toasts, push } = useToasts();
  const [user, setUser] = useState(persisted?.user ?? null);
  const [section, setSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [state, dispatch] = useReducer(reducer, persisted?.state ?? initialState);
  const [settings, setSettings] = useState(persisted?.settings ?? DEFAULT_SETTINGS);
  const [readAlerts, setReadAlerts] = useState(() => new Set(persisted?.readAlerts ?? []));
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profilePerson, setProfilePerson] = useState(null);
  const [activeReport, setActiveReport] = useState(null);
  const [dbLoading, setDbLoading] = useState(supabaseConfigured);
  const [dbError, setDbError] = useState(null);
  const [seeding, setSeeding] = useState(false);

  // Persist on any change (only in local mode — DB mode trusts the server)
  useEffect(() => {
    if (supabaseConfigured) return;
    savePersisted({
      state, settings, user,
      readAlerts: Array.from(readAlerts)
    });
  }, [state, settings, user, readAlerts]);

  // Initial load from Supabase
  const loadFromDb = useCallback(async () => {
    if (!supabaseConfigured) return;
    setDbLoading(true); setDbError(null);
    try {
      const data = await loadAll();
      dispatch({ type:'SET_ALL', payload: {
        students:  data.students,
        hospitals: data.hospitals,
        families:  data.families,
        audit:     data.audit,
        admins:    data.admins,
        sync:      data.sync
      }});
      if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
    } catch (e) {
      setDbError(e.message);
      push('error', `Database load failed: ${e.message}`);
    } finally {
      setDbLoading(false);
    }
  }, [push]);

  useEffect(() => {
    if (supabaseConfigured && user) loadFromDb();
  }, [user, loadFromDb]);

  // Async dispatcher: intercepts CRUD actions and syncs to Supabase.
  // Returns a promise. In local mode it generates IDs and dispatches synchronously.
  const wdispatch = useCallback(async (action) => {
    if (!supabaseConfigured) {
      // Local mode — generate IDs for ADD actions
      if (['STUDENT_ADD','HOSP_ADD','FAM_ADD','USER_ADD','AUDIT_ADD'].includes(action.type) && !action.payload.id) {
        const idGen = Date.now() + Math.floor(Math.random() * 1000);
        dispatch({ ...action, payload: { ...action.payload, id: idGen } });
      } else {
        dispatch(action);
      }
      return;
    }
    try {
      let payload = action.payload;
      switch (action.type) {
        case 'STUDENT_ADD':    payload = await api.students.add(action.payload); break;
        case 'STUDENT_UPDATE': payload = await api.students.update(action.payload.id, action.payload); break;
        case 'STUDENT_DELETE': await api.students.remove(action.payload); break;
        case 'HOSP_ADD':       payload = await api.hospitals.add(action.payload); break;
        case 'HOSP_UPDATE':    payload = await api.hospitals.update(action.payload.id, action.payload); break;
        case 'HOSP_DELETE':    await api.hospitals.remove(action.payload); break;
        case 'FAM_ADD':        payload = await api.families.add(action.payload); break;
        case 'FAM_UPDATE':     payload = await api.families.update(action.payload.id, action.payload); break;
        case 'FAM_DELETE':     await api.families.remove(action.payload); break;
        case 'USER_ADD':       payload = await api.admins.add(action.payload); break;
        case 'USER_UPDATE':    payload = await api.admins.update(action.payload.id, action.payload); break;
        case 'AUDIT_ADD':      payload = await api.audit.add(action.payload); break;
        default: break;
      }
      dispatch({ ...action, payload });
    } catch (e) {
      push('error', `Database error: ${e.message}`);
      throw e;
    }
  }, [push]);

  // Seed demo data into Supabase (idempotent — only if DB empty)
  const seedDemo = useCallback(async () => {
    if (!supabaseConfigured) { push('error', 'Connect a database first.'); return; }
    setSeeding(true);
    try {
      const empty = await isEmpty();
      if (!empty) {
        push('info', 'Database already has records — refusing to duplicate. Reset first if you want a clean seed.');
        return;
      }
      await seedDemoData({
        students: INITIAL_STUDENTS,
        hospitals: INITIAL_HOSPITALS,
        families: INITIAL_FAMILIES,
        audit: INITIAL_AUDIT,
        admins: INITIAL_ADMINS
      });
      await loadFromDb();
      push('success', 'Demo data seeded to database');
    } catch (e) {
      push('error', `Seed failed: ${e.message}`);
    } finally {
      setSeeding(false);
    }
  }, [push, loadFromDb]);

  // Keyboard shortcut: Cmd+K / Ctrl+K opens palette
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setPaletteOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const resetDemoData = async () => {
    if (supabaseConfigured) {
      if (!window.confirm('This wipes every record from the database and re-seeds the demo. Continue?')) return;
      setSeeding(true);
      try {
        await wipeAll();
        await seedDemo();
      } catch (e) {
        push('error', `Reset failed: ${e.message}`);
        setSeeding(false);
      }
      return;
    }
    clearPersisted();
    window.location.reload();
  };

  const openProfile = (person) => {
    setProfilePerson(person);
    setSection('profile');
    setPaletteOpen(false);
    setNotifOpen(false);
  };

  const alerts = useMemo(() => computeAlerts(state), [state]);
  const unreadAlerts = alerts.filter(a => !readAlerts.has(a.id));
  const markRead = (id) => setReadAlerts(s => { const n = new Set(s); n.add(id); return n; });
  const markAllRead = () => setReadAlerts(new Set(alerts.map(a => a.id)));

  const addAudit = useCallback((action, module, record, who) => {
    const ts = new Date().toISOString().replace('T', ' ').slice(0, 16);
    // Fire and forget — audit failures shouldn't block the user
    wdispatch({
      type: 'AUDIT_ADD',
      payload: { ts, action, module, record, by: who.name, role: who.role, district: who.district }
    }).catch(() => {});
  }, [wdispatch]);

  if (!user) return (
    <>
      <LoginScreen onLogin={setUser} pushToast={push} />
      <ToastStack toasts={toasts} />
    </>
  );

  const sectionMeta = {
    overview:  { title:'Overview',           subtitle:'National registry at a glance' },
    students:  { title:'Students',           subtitle:'Education records linked by NIN' },
    hospitals: { title:'Hospitals',          subtitle:'Health facilities and capacity' },
    families:  { title:'Family Trees',       subtitle:'Multi-generational household records' },
    reports:   { title:'Reports',            subtitle:'Ministry-ready printable summaries' },
    audit:     { title:'Audit Log',          subtitle:'Immutable record of every action' },
    roles:     { title:'Roles & Access',     subtitle:'Administrator account management' },
    settings:  { title:'Settings',           subtitle:'System configuration and account' },
    profile:   { title:'Citizen profile',    subtitle:profilePerson ? `${profilePerson.name} · ${profilePerson.nin}` : '' }
  }[section] || { title:'Overview', subtitle:'' };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar section={section} setSection={(s)=>{ setSection(s); if (s !== 'profile') setProfilePerson(null); }} user={user}
               onLogout={() => { push('info', 'Signed out'); setUser(null); setSection('overview'); }}
               open={sidebarOpen} setOpen={setSidebarOpen} />
      <main className="flex-1 flex flex-col min-w-0">
        <Topbar title={sectionMeta.title} subtitle={sectionMeta.subtitle}
                onMenu={()=>setSidebarOpen(true)} user={user}
                onOpenPalette={()=>setPaletteOpen(true)}
                onOpenNotif={()=>setNotifOpen(true)}
                unreadCount={unreadAlerts.length}
                dbConnected={supabaseConfigured}
                dbLoading={dbLoading} />
        <div className="p-4 lg:p-8 flex-1 overflow-auto">
          {section === 'overview'  && <Overview students={state.students} hospitals={state.hospitals} families={state.families} audit={state.audit} sync={state.sync} user={user} setSection={setSection} />}
          {section === 'students'  && <StudentsPage students={state.students} dispatch={wdispatch} user={user} pushToast={push} audit={state.audit} addAudit={addAudit} openProfile={openProfile} />}
          {section === 'hospitals' && <HospitalsPage hospitals={state.hospitals} dispatch={wdispatch} user={user} pushToast={push} addAudit={addAudit} />}
          {section === 'families'  && <FamiliesPage families={state.families} students={state.students} hospitals={state.hospitals} dispatch={wdispatch} user={user} pushToast={push} addAudit={addAudit} openProfile={openProfile} />}
          {section === 'reports'   && <ReportsPage state={state} openReport={setActiveReport} />}
          {section === 'audit'     && <AuditPage audit={state.audit} user={user} pushToast={push} />}
          {section === 'roles' && user.role === 'Super Admin' && <RolesPage admins={state.admins} dispatch={wdispatch} user={user} pushToast={push} addAudit={addAudit} />}
          {section === 'settings'  && <SettingsPage settings={settings} setSettings={setSettings} user={user} pushToast={push} students={state.students} hospitals={state.hospitals} families={state.families} audit={state.audit} resetDemoData={resetDemoData} seedDemo={seedDemo} seeding={seeding} dbConnected={supabaseConfigured} dbError={dbError} />}
          {section === 'profile' && profilePerson && (
            <ProfileView person={profilePerson} state={state}
                         setSection={setSection} openProfile={openProfile}
                         onBack={()=>setSection('overview')} />
          )}
        </div>
        <div className="px-4 lg:px-8 py-3 border-t border-slate-200 bg-white text-xs text-slate-500 flex items-center justify-between no-print">
          <div>© {new Date().getFullYear()} Government of Uganda · UINR v1.0</div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /> All systems operational</div>
        </div>
      </main>

      <CommandPalette open={paletteOpen} onClose={()=>setPaletteOpen(false)}
                      state={state} setSection={setSection} openProfile={openProfile} user={user} />
      <NotificationPanel open={notifOpen} onClose={()=>setNotifOpen(false)}
                         alerts={alerts} readAlerts={readAlerts}
                         markRead={markRead} markAllRead={markAllRead}
                         setSection={setSection} audit={state.audit} />
      {activeReport && (
        <ReportView reportKey={activeReport} state={state}
                    user={user} settings={settings}
                    onClose={()=>setActiveReport(null)} />
      )}
      <ToastStack toasts={toasts} />
    </div>
  );
}
