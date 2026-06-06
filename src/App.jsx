import React, { useState, useEffect, useMemo, useReducer, useCallback, useRef } from 'react';
import { isConfigured as supabaseConfigured } from './lib/supabase';
import { api, loadAll, seedDemoData, isEmpty, wipeAll, loadSchools, addSchoolIfNew } from './lib/api';
import { signInWithEmail, signOut as authSignOut, restoreSession, onAuthChange,
         signUpOrganization, sendResetEmail, updatePassword, resendConfirmation } from './lib/auth';
import {
  Shield, LogIn, LayoutDashboard, GraduationCap, Hospital, Users2, FileClock,
  KeyRound, Settings as SettingsIcon, LogOut, Search, Plus, Pencil, Trash2,
  X, ChevronUp, ChevronDown, Download, CheckCircle2, AlertTriangle, Info,
  Menu, Building2, MapPin, Activity, Syringe, UserCog, Eye, Filter, ShieldCheck,
  ShieldAlert, RefreshCcw, Save, Lock, TrendingUp, TrendingDown, BellRing,
  Sparkles, ArrowRight, School, Stethoscope, BarChart3, Globe2,
  Command, Bell, FileText, Printer, ArrowLeft, BookOpen, HeartPulse, Network,
  Clock, User as UserIcon, ChevronRight, CheckCheck, RotateCcw,
  Database, WifiOff, Loader2, Cloud, CloudOff,
  CreditCard, Award, Accessibility, Zap, Check, Star, Phone, Mail,
  Building, Smartphone, Wallet, Send, UserPlus, Inbox, ArrowUp, ChevronsRight
} from 'lucide-react';

/* ===========================================================
   UINR — Uganda Integrated National Registry
   Single-file React app
   =========================================================== */

// All 146 districts of Uganda (sorted alphabetically)
const DISTRICTS = [
  'Abim','Adjumani','Agago','Alebtong','Amolatar','Amudat','Amuria','Amuru','Apac','Arua',
  'Budaka','Bududa','Bugiri','Bugweri','Buhweju','Buikwe','Bukedea','Bukomansimbi','Bukwo','Bulambuli',
  'Buliisa','Bundibugyo','Bunyangabu','Bushenyi','Busia','Butaleja','Butambala','Butebo','Buvuma','Buyende',
  'Dokolo','Fort Portal','Gomba','Gulu','Hoima','Ibanda','Iganga','Isingiro','Jinja','Kaabong',
  'Kabale','Kabarole','Kaberamaido','Kagadi','Kakumiro','Kalaki','Kalangala','Kaliro','Kalungu','Kampala',
  'Kamuli','Kamwenge','Kanungu','Kapchorwa','Kapelebyong','Karenga','Kasanda','Kasese','Katakwi','Kayunga',
  'Kazo','Kibaale','Kiboga','Kibuku','Kikuube','Kiruhura','Kiryandongo','Kisoro','Kitagwenda','Kitgum',
  'Koboko','Kole','Kotido','Kumi','Kwania','Kween','Kyankwanzi','Kyegegwa','Kyenjojo','Kyotera',
  'Lamwo','Lira','Luuka','Luwero','Lwengo','Lyantonde','Madi-Okollo','Manafwa','Maracha','Masaka',
  'Masindi','Mayuge','Mbale','Mbarara','Mitooma','Mityana','Moroto','Moyo','Mpigi','Mubende',
  'Mukono','Nabilatuk','Nakapiripirit','Nakaseke','Nakasongola','Namayingo','Namisindwa','Namutumba','Napak','Nebbi',
  'Ngora','Ntoroko','Ntungamo','Nwoya','Obongi','Omoro','Otuke','Oyam','Pader','Pakwach',
  'Pallisa','Rakai','Rubanda','Rubirizi','Rukiga','Rukungiri','Rwampara','Sembabule','Serere','Sheema',
  'Sironko','Soroti','Terego','Tororo','Wakiso','Yumbe','Zombo'
];
const LEVELS = ['P1','P2','P3','P4','P5','P6','P7','S1','S2','S3','S4','S5','S6','University'];
const STUDENT_STATUSES = ['Enrolled','Dropped Out','Graduated'];
const FACILITY_LEVELS = ['HC II','HC III','General Hospital','Regional Referral'];
const STOCK_STATUSES = ['Adequate','Low','Critical'];
const CLANS = ['Nkima','Ngabi','Ffumbe','Nte','Ngo','Ngonge','Mamba','Ngeye'];
const TRIBES = ['Baganda','Acholi','Banyankole','Basoga','Bagisu','Langi','Lugbara','Banyoro','Batoro'];
const RELIGIONS = [
  'Catholic','Anglican (Church of Uganda)','Pentecostal / Born Again','Muslim',
  'Seventh-Day Adventist','Orthodox','Other Christian','Hindu','Traditional','None / Prefer not to say'
];
const ORG_TYPES = ['Ministry','District Office','NGO','Hospital','School'];

const PLANS = [
  {
    key: 'Free Trial',
    name: 'Free Trial',
    price: 0,
    period: '30 days',
    tagline: 'Pilot the platform risk-free',
    features: ['1 district', 'Up to 3 users', 'All modules', 'Email support', '30-day trial'],
    badge: null,
    cta: 'Start Free Trial'
  },
  {
    key: 'District',
    name: 'District',
    price: 500000,
    period: '/month',
    tagline: 'For a single district office',
    features: ['1 district', 'Unlimited users', 'All modules', 'CSV export', 'Priority email support', 'Audit log retention'],
    badge: 'Most Popular',
    cta: 'Choose District'
  },
  {
    key: 'Ministry',
    name: 'Ministry',
    price: 3500000,
    period: '/month',
    tagline: 'Nationwide deployment',
    features: ['All districts', 'Unlimited users', 'Data export API', 'Dedicated account manager', '24/7 phone support', 'Custom branding', 'On-site training'],
    badge: 'Enterprise',
    cta: 'Contact Sales'
  }
];

const fmtUGX = (n) => n === 0 ? 'Free' : `UGX ${Number(n).toLocaleString()}`;
const fmtNum = (n) => {
  if (n == null) return '0';
  const v = Number(n);
  if (v >= 1_000_000) return (v/1_000_000).toFixed(v >= 10_000_000 ? 0 : 1).replace(/\.0$/, '') + 'M';
  if (v >= 1_000)     return (v/1_000).toFixed(v >= 10_000 ? 0 : 1).replace(/\.0$/, '') + 'K';
  return v.toLocaleString();
};

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
  { id:1,  name:'Nakato Sarah',       nin:nin(1),  school:'Gayaza High School',           district:'Wakiso',     level:'S4', enrolmentYear:2021, unebResults:'Div 1', status:'Enrolled',     guardianNin:nin(101), bursaryEligible:true,  specialNeeds:false },
  { id:2,  name:'Okello Brian',       nin:nin(2),  school:'Sir Samuel Baker',             district:'Gulu',       level:'S6', enrolmentYear:2019, unebResults:'Div 2', status:'Enrolled',     guardianNin:nin(102), bursaryEligible:true, specialNeeds:false },
  { id:3,  name:'Namukasa Patricia',  nin:nin(3),  school:'Kibuli SS',                     district:'Kampala',    level:'S2', enrolmentYear:2023, unebResults:'—',     status:'Enrolled',     guardianNin:nin(103), bursaryEligible:false, specialNeeds:false },
  { id:4,  name:'Ssali Daniel',       nin:nin(4),  school:'Makerere University',           district:'Kampala',    level:'University', enrolmentYear:2022, unebResults:'Div 1', status:'Enrolled', guardianNin:nin(104), bursaryEligible:false, specialNeeds:false },
  { id:5,  name:'Apio Florence',      nin:nin(5),  school:'Lira Town College',             district:'Lira',       level:'S3', enrolmentYear:2022, unebResults:'—',     status:'Enrolled',     guardianNin:nin(105), bursaryEligible:true, specialNeeds:true },
  { id:6,  name:'Tusiime Brenda',     nin:nin(6),  school:'Mbarara High School',           district:'Mbarara',    level:'S5', enrolmentYear:2020, unebResults:'Div 1', status:'Enrolled',     guardianNin:nin(106), bursaryEligible:false, specialNeeds:false },
  { id:7,  name:'Mugisha Allan',      nin:nin(7),  school:'Ntare School',                  district:'Mbarara',    level:'S6', enrolmentYear:2019, unebResults:'Div 1', status:'Graduated',    guardianNin:nin(107), bursaryEligible:false, specialNeeds:false },
  { id:8,  name:'Atim Joyce',         nin:nin(8),  school:'Gulu High School',              district:'Gulu',       level:'P7', enrolmentYear:2024, unebResults:'—',     status:'Enrolled',     guardianNin:nin(108), bursaryEligible:true, specialNeeds:false },
  { id:9,  name:'Kyambadde Moses',    nin:nin(9),  school:'Kings College Budo',            district:'Wakiso',     level:'S5', enrolmentYear:2020, unebResults:'Div 1', status:'Enrolled',     guardianNin:nin(109), bursaryEligible:false, specialNeeds:false },
  { id:10, name:'Namutebi Rebecca',   nin:nin(10), school:'Nabisunsa Girls',               district:'Kampala',    level:'S4', enrolmentYear:2021, unebResults:'Div 2', status:'Enrolled',     guardianNin:nin(110), bursaryEligible:false, specialNeeds:true },
  { id:11, name:'Wasswa Isaac',       nin:nin(11), school:'Jinja SS',                      district:'Jinja',      level:'S3', enrolmentYear:2022, unebResults:'—',     status:'Dropped Out',  guardianNin:nin(111), bursaryEligible:true, specialNeeds:false },
  { id:12, name:'Nalwoga Esther',     nin:nin(12), school:'Mt. St. Mary\'s Namagunga',     district:'Wakiso',     level:'S6', enrolmentYear:2019, unebResults:'Div 1', status:'Graduated',    guardianNin:nin(112), bursaryEligible:false, specialNeeds:false },
  { id:13, name:'Ochieng Peter',      nin:nin(13), school:'Mbale SS',                      district:'Mbale',      level:'S4', enrolmentYear:2021, unebResults:'Div 2', status:'Enrolled',     guardianNin:nin(113), bursaryEligible:false, specialNeeds:false },
  { id:14, name:'Mbabazi Diana',      nin:nin(14), school:'St. Mary\'s Kitende',           district:'Wakiso',     level:'P6', enrolmentYear:2024, unebResults:'—',     status:'Enrolled',     guardianNin:nin(114), bursaryEligible:true, specialNeeds:false },
  { id:15, name:'Asiimwe Joel',       nin:nin(15), school:'Fort Portal SS',                district:'Fort Portal',level:'S5', enrolmentYear:2020, unebResults:'Div 1', status:'Enrolled',     guardianNin:nin(115), bursaryEligible:false, specialNeeds:true },
  { id:16, name:'Okello Faith',       nin:nin(16), school:'Arua Public SS',                district:'Arua',       level:'S3', enrolmentYear:2022, unebResults:'—',     status:'Enrolled',     guardianNin:nin(116), bursaryEligible:false, specialNeeds:false },
  { id:17, name:'Mugisha Ronald',     nin:nin(17), school:'Masaka SS',                     district:'Masaka',     level:'S4', enrolmentYear:2021, unebResults:'Div 1', status:'Enrolled',     guardianNin:nin(117), bursaryEligible:true, specialNeeds:false }
];

const INITIAL_HOSPITALS = [
  { id:1, name:'Mulago National Referral Hospital', level:'Regional Referral', district:'Kampala',    inCharge:'Dr. Rosemary Byanyima', beds:1500, stock:'Adequate', lastInspection:'2026-04-12', visits:24130, vacCoverage:92, activePatients:57 },
  { id:2, name:'Butabika National Mental Hospital', level:'Regional Referral', district:'Kampala',    inCharge:'Dr. Juliet Nakku',      beds:550,  stock:'Adequate', lastInspection:'2026-03-28', visits:7820,  vacCoverage:88, activePatients:120 },
  { id:3, name:'Mbarara Regional Referral',          level:'Regional Referral', district:'Mbarara',    inCharge:'Dr. Henry Tumwesigye',  beds:600,  stock:'Low',      lastInspection:'2026-02-15', visits:13420, vacCoverage:85, activePatients:99 },
  { id:4, name:'Gulu Regional Referral',             level:'Regional Referral', district:'Gulu',       inCharge:'Dr. Nathan Onyachi',    beds:330,  stock:'Adequate', lastInspection:'2026-05-02', visits:9012,  vacCoverage:80, activePatients:64 },
  { id:5, name:'Lacor Hospital',                     level:'General Hospital',  district:'Gulu',       inCharge:'Dr. Cyprian Opira',     beds:482,  stock:'Adequate', lastInspection:'2026-04-22', visits:15680, vacCoverage:91, activePatients:50 },
  { id:6, name:'Jinja Regional Referral',            level:'Regional Referral', district:'Jinja',      inCharge:'Dr. Edward Nkurunziza', beds:610,  stock:'Critical', lastInspection:'2026-01-30', visits:11240, vacCoverage:78, activePatients:50 },
  { id:7, name:'Mbale Regional Referral',            level:'Regional Referral', district:'Mbale',      inCharge:'Dr. Emmanuel Tugaineyo',beds:400,  stock:'Low',      lastInspection:'2026-03-11', visits:8930,  vacCoverage:82, activePatients:78 },
  { id:8, name:'Wakiso HC IV',                       level:'HC III',            district:'Wakiso',     inCharge:'Sr. Margaret Naluyima', beds:60,   stock:'Adequate', lastInspection:'2026-05-18', visits:3420,  vacCoverage:87, activePatients:113 },
  { id:9, name:'Lira HC III',                        level:'HC III',            district:'Lira',       inCharge:'Mr. James Okumu',       beds:48,   stock:'Low',      lastInspection:'2026-04-05', visits:2810,  vacCoverage:75, activePatients:120 },
  { id:10,name:'Fort Portal Regional Referral',      level:'Regional Referral', district:'Fort Portal',inCharge:'Dr. Allan Muhwezi',     beds:380,  stock:'Adequate', lastInspection:'2026-05-09', visits:7610,  vacCoverage:84, activePatients:92 },
  { id:11,name:'Arua Regional Referral',             level:'Regional Referral', district:'Arua',       inCharge:'Dr. Pauline Adiru',     beds:340,  stock:'Adequate', lastInspection:'2026-04-30', visits:6940,  vacCoverage:79, activePatients:57 },
  { id:12,name:'Masaka HC III',                      level:'HC III',            district:'Masaka',     inCharge:'Sr. Joan Nakimuli',     beds:55,   stock:'Adequate', lastInspection:'2026-05-15', visits:3120,  vacCoverage:86, activePatients:106 }
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
const DEMO_EMAIL = 'florence.akello@uinr.go.ug';
const DEMO_PASSWORD = 'SuperAdmin2024!';

function LoginScreen({ onLogin, pushToast, goSignup, goLanding }) {
  const dbMode = supabaseConfigured;
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState(dbMode ? '' : 'uinr2024');
  const [role, setRole] = useState('Super Admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const [unconfirmed, setUnconfirmed] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setUnconfirmed(false);
    setLoading(true);
    try {
      if (dbMode) {
        const user = await signInWithEmail(email.trim(), password);
        pushToast('success', `Welcome, ${user.name}`);
        onLogin(user);
      } else {
        await new Promise(r => setTimeout(r, 500));
        const found = USERS.find(u => u.username === username.trim() && u.password === password && u.role === role);
        if (!found) throw new Error('Invalid credentials or role mismatch.');
        pushToast('success', `Welcome, ${found.name}`);
        onLogin(found);
      }
    } catch (err) {
      const msg = err.message || 'Login failed';
      const friendly = /invalid login credentials/i.test(msg) ? 'Wrong email or password. Please try again.'
                     : /email not confirmed/i.test(msg) ? "We sent a confirmation link to your email. Open it to activate your account, then come back here."
                     : msg;
      setError(friendly);
      if (/email not confirmed/i.test(msg)) setUnconfirmed(true);
      pushToast('error', 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await resendConfirmation(email.trim());
      pushToast('success', 'Confirmation link resent — check your inbox');
    } catch (err) {
      pushToast('error', err.message);
    }
  };

  const tryDemo = async () => {
    setError(''); setDemoLoading(true);
    try {
      if (dbMode) {
        const user = await signInWithEmail(DEMO_EMAIL, DEMO_PASSWORD);
        pushToast('success', `Demo session — signed in as ${user.name}`);
        onLogin(user);
      } else {
        const florence = USERS.find(u => u.role === 'Super Admin');
        pushToast('success', `Demo session — signed in as ${florence.name}`);
        onLogin(florence);
      }
    } catch (err) {
      setError(`Demo unavailable: ${err.message}`);
    } finally { setDemoLoading(false); }
  };

  const submitForgot = async (e) => {
    e.preventDefault(); setForgotLoading(true);
    try {
      if (dbMode) await sendResetEmail(forgotEmail.trim());
      else await new Promise(r => setTimeout(r, 500));
      setForgotSent(true);
      pushToast('success', 'Reset link sent');
    } catch (err) {
      setError(err.message);
      pushToast('error', err.message);
    } finally { setForgotLoading(false); }
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
        <div className="w-full max-w-md">
          {goLanding && (
            <button onClick={goLanding} className="text-sm text-white/80 hover:text-white flex items-center gap-1 mb-4 lg:hidden">
              <ArrowLeft size={14} /> Back to home
            </button>
          )}
        <form onSubmit={forgotOpen ? submitForgot : submit} className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="lg:hidden flex items-center gap-2 text-uinr">
              <Shield size={28} />
              <div className="font-bold text-xl">UINR</div>
            </div>
            {goLanding && (
              <button type="button" onClick={goLanding} className="hidden lg:inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
                <ArrowLeft size={12} /> Home
              </button>
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">{forgotOpen ? 'Reset your password' : 'Sign in'}</h2>
          <p className="text-slate-500 text-sm mb-6">
            {forgotOpen
              ? (forgotSent ? `We sent a reset link to ${forgotEmail}. Check your inbox.` : "Enter your email and we'll send a reset link.")
              : 'Access the national registry admin portal'}
          </p>

          {forgotOpen ? (
            <>
              {!forgotSent ? (
                <>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} required
                    className="w-full mb-4 px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uinr"
                    placeholder="you@uinr.go.ug" autoComplete="email" />
                  <button type="submit" disabled={forgotLoading}
                    className="w-full bg-uinr text-white py-2.5 rounded-lg font-semibold hover:bg-uinr-dark flex items-center justify-center gap-2 disabled:opacity-60">
                    {forgotLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    {forgotLoading ? 'Sending…' : 'Send Reset Link'}
                  </button>
                </>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-900 flex items-start gap-2">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold">Reset link sent to {forgotEmail}</div>
                    <div className="text-xs mt-0.5 text-emerald-800">Click the link in your inbox to set a new password. The link expires in 1 hour.</div>
                  </div>
                </div>
              )}
              <button type="button" onClick={()=>{ setForgotOpen(false); setForgotSent(false); setForgotEmail(''); }}
                className="mt-4 w-full text-sm text-slate-600 hover:text-slate-900">
                ← Back to sign in
              </button>
            </>
          ) : (
          <>

          {error && !forgotOpen && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <div className="flex-1">
                <div>{error}</div>
                {unconfirmed && (
                  <button type="button" onClick={resend}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:text-red-900 underline">
                    <Send size={12} /> Resend confirmation link
                  </button>
                )}
              </div>
            </div>
          )}

          {dbMode ? (
            <>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                     className="w-full mb-4 px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uinr"
                     placeholder="you@uinr.go.ug" required autoComplete="email" />
            </>
          ) : (
            <>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input value={username} onChange={e=>setUsername(e.target.value)}
                     className="w-full mb-4 px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uinr"
                     placeholder="e.g. admin" required />
            </>
          )}

          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <button type="button" onClick={()=>{ setForgotOpen(true); setForgotEmail(email); }} className="text-xs text-uinr hover:underline font-semibold">Forgot password?</button>
          </div>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                 className="w-full mb-4 px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uinr"
                 placeholder="••••••••" required autoComplete="current-password" />

          {!dbMode && (
            <>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select value={role} onChange={e=>setRole(e.target.value)}
                      className="w-full mb-6 px-3 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-uinr">
                <option>Super Admin</option>
                <option>Ministry Officer</option>
                <option>District Registrar</option>
              </select>
            </>
          )}
          {dbMode && <div className="mb-2" />}

          <button type="submit" disabled={loading}
                  className="w-full bg-uinr text-white py-2.5 rounded-lg font-semibold hover:bg-uinr-dark flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <RefreshCcw size={18} className="animate-spin" /> : <LogIn size={18} />}
            {loading ? 'Authenticating…' : 'Sign in'}
          </button>

          {dbMode ? (
            <div className="mt-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start gap-2">
              <Cloud size={14} className="mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold mb-0.5">Secure mode — Supabase Auth</div>
                <div>Use the email + password your administrator created for you. Role and district come from your assigned profile.</div>
              </div>
            </div>
          ) : (
            <div className="mt-6 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              <div className="font-semibold text-slate-700 mb-1">Demo credentials</div>
              <div>admin / uinr2024 / Super Admin</div>
              <div>officer / uinr2024 / Ministry Officer</div>
              <div>registrar / uinr2024 / District Registrar</div>
            </div>
          )}

          <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
            <div className="flex-1 h-px bg-slate-200" />
            <span>OR</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <button type="button" onClick={tryDemo} disabled={demoLoading}
            className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
            {demoLoading ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
            {demoLoading ? 'Loading demo…' : 'Try Demo (no account needed)'}
          </button>

          {goSignup && (
            <p className="mt-4 text-center text-sm text-slate-600">
              Don't have an account? <button type="button" onClick={()=>goSignup()} className="text-uinr font-semibold hover:underline">Sign up</button>
            </p>
          )}
          </>
          )}
        </form>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================
   Sidebar
   =========================================================== */
function Sidebar({ section, setSection, user, onLogout, open, setOpen }) {
  const sections = [
    { group:'Workspace', items:[
      { key:'overview',  label:'Overview',     Icon:LayoutDashboard }
    ]},
    { group:'Records', items:[
      { key:'students',  label:'Students',     Icon:GraduationCap },
      { key:'hospitals', label:'Hospitals',    Icon:Hospital },
      { key:'families',  label:'Family Trees', Icon:Users2 }
    ]},
    { group:'Insights', items:[
      { key:'reports',   label:'Reports',      Icon:FileText },
      { key:'audit',     label:'Audit Log',    Icon:FileClock }
    ]},
    { group:'Administration', items:[
      { key:'roles',     label:'User Management', Icon:KeyRound,    superAdminOnly:true },
      { key:'billing',   label:'Billing',         Icon:CreditCard,  superAdminOnly:true },
      { key:'settings',  label:'Settings',        Icon:SettingsIcon }
    ]}
  ];
  const initials = user.name.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase();

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden no-print" onClick={()=>setOpen(false)} />}
      <aside className={`fixed lg:static z-40 inset-y-0 left-0 w-64 bg-gradient-to-b from-uinr-dark to-uinr text-white flex flex-col transition-transform no-print ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="px-5 py-5 border-b border-white/10 flex items-center gap-3">
          <div className="bg-white/15 backdrop-blur p-2 rounded-xl shadow-inner"><Shield size={22} /></div>
          <div>
            <div className="font-bold tracking-tight text-[15px]">UINR</div>
            <div className="text-[10px] text-white/60 uppercase tracking-widest">National Registry</div>
          </div>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          {sections.map(group => {
            const items = group.items.filter(i => !i.superAdminOnly || user.role === 'Super Admin');
            if (!items.length) return null;
            return (
              <div key={group.group} className="mb-4">
                <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40">{group.group}</div>
                <div className="space-y-0.5">
                  {items.map(({key,label,Icon}) => (
                    <button key={key}
                      onClick={() => { setSection(key); setOpen(false); }}
                      className={`group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        section === key
                          ? 'bg-white text-uinr shadow-lg shadow-black/10'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}>
                      <Icon size={16} className={section === key ? '' : 'opacity-80 group-hover:opacity-100'} />
                      <span className="flex-1 text-left">{label}</span>
                      {section === key && <ChevronRight size={14} className="text-uinr/40" />}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-300 to-amber-500 text-uinr-dark rounded-full flex items-center justify-center font-bold text-sm shadow-md">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{user.name}</div>
              <div className="text-[10px] text-white/60 truncate">{user.role} · {user.district}</div>
            </div>
          </div>
          <button onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/15 border border-white/10 text-sm py-2 rounded-lg transition">
            <LogOut size={14} /> Sign out
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
function AreaChart({ data, color='#1a3a5c', height=240 }) {
  const w = 640;
  const max = Math.max(...data.map(d=>d.y), 1);
  const niceMax = Math.ceil(max * 1.15 / 10) * 10 || 10;
  const padLeft = 48, padRight = 24, padTop = 24, padBot = 32;
  const innerW = w - padLeft - padRight, innerH = height - padTop - padBot;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;
  const pts = data.map((d, i) => ({
    x: padLeft + i*stepX,
    y: padTop + innerH - (d.y/niceMax)*innerH,
    v: d.y, l: d.x
  }));
  // Smooth Catmull-Rom -> bezier
  const smooth = (points) => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };
  const line = smooth(pts);
  const area = pts.length ? `${line} L ${pts[pts.length-1].x} ${padTop+innerH} L ${pts[0].x} ${padTop+innerH} Z` : '';
  const gid = useMemo(() => 'g-' + Math.random().toString(36).slice(2, 8), []);
  const [hover, setHover] = useState(null);
  const yTicks = 4;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => Math.round(niceMax * (yTicks - i) / yTicks));
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor={color} stopOpacity="0.38" />
          <stop offset="55%" stopColor={color} stopOpacity="0.10" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Y-axis labels + grid */}
      {ticks.map((tval, i) => {
        const y = padTop + (innerH * i / yTicks);
        return (
          <g key={i}>
            <line x1={padLeft} y1={y} x2={w-padRight} y2={y} stroke="#e2e8f0" strokeDasharray={i === yTicks ? '0' : '3,4'} />
            <text x={padLeft - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#94a3b8">{fmtNum(tval)}</text>
          </g>
        );
      })}
      {/* Area */}
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Points */}
      {pts.map((p, i) => (
        <g key={i} onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(null)} style={{ cursor: 'pointer' }}>
          <circle cx={p.x} cy={padTop + innerH + 24} r="16" fill="transparent" />
          <circle cx={p.x} cy={p.y} r={hover === i ? 6 : 4} fill="white" stroke={color} strokeWidth={hover === i ? 3 : 2.5} style={{ transition: 'r 0.15s' }} />
          <text x={p.x} y={padTop + innerH + 22} textAnchor="middle" fontSize="11" fill={hover === i ? '#0f172a' : '#64748b'} fontWeight={hover === i ? '700' : '500'}>{p.l}</text>
        </g>
      ))}
      {/* Hover tooltip */}
      {hover !== null && (
        <g>
          <rect x={pts[hover].x - 30} y={pts[hover].y - 36} width="60" height="26" rx="6" fill={color} />
          <text x={pts[hover].x} y={pts[hover].y - 18} textAnchor="middle" fontSize="13" fontWeight="700" fill="white">{fmtNum(pts[hover].v)}</text>
        </g>
      )}
    </svg>
  );
}

function HBarChart({ data, color='#1a3a5c', valueSuffix='', max: maxOverride }) {
  const max = maxOverride ?? Math.max(...data.map(d=>d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const c = typeof color === 'function' ? color(d) : color;
        return (
          <div key={d.label} className="group">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-2">
                <span className="text-slate-400 text-[10px] font-mono">{String(i+1).padStart(2,'0')}</span>
                {d.label}
              </span>
              <span className="text-slate-900 font-bold tabular-nums">{fmtNum(d.value)}{valueSuffix}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
              <div className="h-full rounded-full transition-all duration-500 group-hover:brightness-110"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${c}, ${c}dd)`
                }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Donut({ data, size=200, centerLabel='FACILITIES' }) {
  const total = data.reduce((a,b)=>a+b.value, 0);
  const r = 78, cx = size/2, cy = size/2;
  let acc = 0;
  const segs = total === 0 ? [] : data.map(d => {
    const start = (acc/total) * 2*Math.PI - Math.PI/2;
    acc += d.value;
    const end = (acc/total) * 2*Math.PI - Math.PI/2;
    const large = end - start > Math.PI ? 1 : 0;
    const x1 = cx + r*Math.cos(start), y1 = cy + r*Math.sin(start);
    const x2 = cx + r*Math.cos(end),   y2 = cy + r*Math.sin(end);
    return { path:`M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large} 1 ${x2.toFixed(2)},${y2.toFixed(2)}`, pct: total ? Math.round(d.value/total*100) : 0, ...d };
  });
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="shrink-0 drop-shadow-sm">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="20" />
        {segs.map((s,i)=> (
          <path key={i} d={s.path} stroke={s.color} strokeWidth="20" fill="none" strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))' }} />
        ))}
        <text x={cx} y={cy-2} textAnchor="middle" fontSize="32" fontWeight="800" fill="#0f172a">{fmtNum(total)}</text>
        <text x={cx} y={cy+18} textAnchor="middle" fontSize="9" fill="#64748b" letterSpacing="2" fontWeight="600">{centerLabel}</text>
      </svg>
      <ul className="space-y-2.5 text-sm flex-1 w-full">
        {data.map(d => {
          const pct = total ? Math.round(d.value/total*100) : 0;
          return (
            <li key={d.label}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{background:d.color}} />
                  <span className="font-semibold text-slate-700">{d.label}</span>
                </span>
                <span className="text-slate-900 font-bold tabular-nums">{d.value} <span className="text-slate-400 font-medium">({pct}%)</span></span>
              </div>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width:`${pct}%`, background:d.color, opacity: 0.85 }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ===========================================================
   KPI tile
   =========================================================== */
function KpiCard({ label, value, trend, sub, Icon, color, onClick }) {
  const palette = {
    sky:    { icon:'bg-sky-100 text-sky-700',     ring:'ring-sky-100',    glow:'from-sky-50/50' },
    emerald:{ icon:'bg-emerald-100 text-emerald-700', ring:'ring-emerald-100', glow:'from-emerald-50/50' },
    indigo: { icon:'bg-indigo-100 text-indigo-700', ring:'ring-indigo-100', glow:'from-indigo-50/50' },
    violet: { icon:'bg-violet-100 text-violet-700', ring:'ring-violet-100', glow:'from-violet-50/50' },
    amber:  { icon:'bg-amber-100 text-amber-700',   ring:'ring-amber-100',  glow:'from-amber-50/50' },
    rose:   { icon:'bg-rose-100 text-rose-700',     ring:'ring-rose-100',   glow:'from-rose-50/50' }
  }[color] || { icon:'bg-slate-100 text-slate-700', ring:'ring-slate-100', glow:'from-slate-50/50' };
  const up = trend >= 0;
  return (
    <button onClick={onClick}
      className={`group relative text-left bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-uinr/30 hover:-translate-y-0.5 transition-all w-full overflow-hidden`}>
      {/* Subtle radial glow */}
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${palette.glow} to-transparent opacity-70 pointer-events-none`} />
      <div className="relative flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${palette.icon} ring-4 ${palette.ring}`}><Icon size={18} /></div>
        <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full ${up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {up ? '+' : ''}{trend.toFixed(1)}%
        </div>
      </div>
      <div className="relative">
        <div className="text-[10px] uppercase tracking-[0.08em] text-slate-500 font-semibold">{label}</div>
        <div className="text-[28px] font-extrabold text-slate-900 mt-1 leading-none tracking-tight tabular-nums">{value}</div>
        <div className="text-xs text-slate-500 mt-2">{sub}</div>
      </div>
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
  const studentsByDistrict = Object.entries(distGroups).sort((a,b) => b[1]-a[1]).slice(0, 10).map(([label,value]) => ({ label, value }));

  // Vaccination coverage per district
  const vacAcc = {};
  hospitals.forEach(h => {
    if (!vacAcc[h.district]) vacAcc[h.district] = { sum:0, n:0 };
    vacAcc[h.district].sum += h.vacCoverage;
    vacAcc[h.district].n   += 1;
  });
  const vacByDistrict = Object.entries(vacAcc).map(([label,v]) => ({ label, value: Math.round(v.sum/v.n) })).sort((a,b)=>b.value-a.value).slice(0, 10);
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
    { label:'Students Enrolled',  value:fmtNum(enrolled),  trend:8.2,  sub:`${fmtNum(students.length)} records · ${fmtNum(graduated)} graduated`, Icon:GraduationCap, color:'sky',     target:'students'  },
    { label:'Health Facilities',  value:fmtNum(hospitals.length), trend:1.4, sub:`${fmtNum(totalBeds)} beds · ${critical} critical`, Icon:Hospital, color:'emerald', target:'hospitals' },
    { label:'Families Registered',value:fmtNum(families.length), trend:4.6, sub:`${fmtNum(citizens)} citizens linked`, Icon:Users2, color:'indigo', target:'families' },
    { label:'Citizens Linked',    value:fmtNum(citizens), trend:6.1,  sub:'multi-generational records', Icon:Sparkles, color:'violet', target:'families' },
    { label:'Edits This Week',    value:fmtNum(editsThisWeek), trend:12.0, sub:`${fmtNum(audit.length)} audit entries`, Icon:Activity, color:'amber', target:'audit' },
    { label:'Open Alerts',        value:fmtNum(alertsCount), trend:-3.1, sub:`${critical} critical · ${dropouts} dropouts`, Icon:BellRing, color:'rose', target:'overview' }
  ];

  const quickActions = [
    { label:'Students',  Icon:GraduationCap, target:'students'  },
    { label:'Hospitals', Icon:Hospital,      target:'hospitals' },
    { label:'Families',  Icon:Users2,        target:'families'  },
    { label:'Audit Log', Icon:FileClock,     target:'audit'     }
  ];

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  const criticalFacilities = hospitals.filter(h => h.stock === 'Critical');

  return (
    <div className="space-y-6">
      {/* Critical drug stock alert banner */}
      {criticalFacilities.length > 0 && (
        <div className="bg-rose-50 border-l-4 border-rose-500 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-rose-900">{criticalFacilities.length} facility{criticalFacilities.length>1?'ies':''} reporting critical drug stock</div>
            <div className="text-sm text-rose-800 mt-0.5">
              {criticalFacilities.slice(0, 3).map(f => f.name).join(', ')}{criticalFacilities.length > 3 ? ` and ${criticalFacilities.length - 3} more` : ''} — review the Hospitals module immediately.
            </div>
          </div>
          <button onClick={()=>setSection('hospitals')} className="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-rose-700 whitespace-nowrap">Review now</button>
        </div>
      )}

      {/* Hero banner */}
      <div className="relative bg-gradient-to-br from-uinr-dark via-uinr to-uinr-light text-white rounded-3xl p-6 lg:p-8 shadow-2xl shadow-uinr/20 overflow-hidden">
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-300/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-white/70 text-[11px] uppercase tracking-[0.15em] font-semibold">
              <Globe2 size={12} /> {today}
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold mt-2 tracking-tight">{greet}, {user.name.split(' ')[0]}.</h2>
            <p className="text-white/80 text-sm mt-2 max-w-xl leading-relaxed">
              <span className="text-white font-semibold">{fmtNum(enrolled)}</span> students enrolled across
              <span className="text-white font-semibold"> {Object.keys(distGroups).length}</span> districts ·
              <span className="text-white font-semibold"> {fmtNum(totalVisits)}</span> patient visits this period ·
              <span className="text-amber-300 font-bold"> {alertsCount} open alerts</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickActions.map(a => (
              <button key={a.target} onClick={()=>setSection(a.target)}
                className="group flex items-center gap-2 bg-white/10 hover:bg-white/20 active:bg-white/25 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5">
                <a.Icon size={15} /> {a.label}
                <ArrowRight size={13} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((k, i) => (
          <KpiCard key={i} {...k} onClick={()=>setSection(k.target)} />
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-slate-200/70 rounded-2xl shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-sky-100 text-sky-700 p-2 rounded-lg"><BarChart3 size={16} /></div>
              <div>
                <div className="font-bold text-slate-900">Enrolment trend</div>
                <div className="text-xs text-slate-500">Students by enrolment year</div>
              </div>
            </div>
            <Badge kind="blue">Education</Badge>
          </div>
          <div className="p-6">
            {enrolmentSeries.length > 0
              ? <AreaChart data={enrolmentSeries} color="#1a3a5c" />
              : <div className="text-sm text-slate-500 py-10 text-center">No enrolment data.</div>}
          </div>
        </div>

        <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 text-indigo-700 p-2 rounded-lg"><MapPin size={16} /></div>
              <div>
                <div className="font-bold text-slate-900">Students by district</div>
                <div className="text-xs text-slate-500">Top {studentsByDistrict.length} districts</div>
              </div>
            </div>
          </div>
          <div className="p-6">
            <HBarChart data={studentsByDistrict} color="#1a3a5c" />
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-slate-200/70 rounded-2xl shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 text-emerald-700 p-2 rounded-lg"><Syringe size={16} /></div>
              <div>
                <div className="font-bold text-slate-900">Vaccination coverage</div>
                <div className="text-xs text-slate-500">Average per district · top {vacByDistrict.length}</div>
              </div>
            </div>
            <Badge kind="green">Health</Badge>
          </div>
          <div className="p-6">
            <HBarChart data={vacByDistrict} color={vacColor} valueSuffix="%" max={100} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
            <div className="bg-rose-100 text-rose-700 p-2 rounded-lg"><Stethoscope size={16} /></div>
            <div>
              <div className="font-bold text-slate-900">Drug stock</div>
              <div className="text-xs text-slate-500">Across {fmtNum(hospitals.length)} facilities</div>
            </div>
          </div>
          <div className="p-6">
            <Donut data={stockDonut} />
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-slate-200/70 rounded-2xl shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 text-amber-700 p-2 rounded-lg"><Clock size={16} /></div>
              <div>
                <div className="font-bold text-slate-900">Recent record edits</div>
                <div className="text-xs text-slate-500">Latest changes across the system</div>
              </div>
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

        <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-rose-100 text-rose-700 p-2 rounded-lg"><BellRing size={16} /></div>
              <div>
                <div className="font-bold text-slate-900">Critical alerts</div>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
            <div className="bg-sky-100 text-sky-700 p-2 rounded-lg"><School size={16} /></div>
            <div>
              <div className="font-bold text-slate-900">Top schools by enrolment</div>
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

        <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
            <div className="bg-emerald-100 text-emerald-700 p-2 rounded-lg"><Building2 size={16} /></div>
            <div>
              <div className="font-bold text-slate-900">Busiest facilities</div>
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

        <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-violet-100 text-violet-700 p-2 rounded-lg"><Globe2 size={16} /></div>
              <div>
                <div className="font-bold text-slate-900">District sync</div>
                <div className="text-xs text-slate-500">{sync.length} districts · {syncingCount} syncing</div>
              </div>
            </div>
            <RefreshCcw size={14} className={`text-slate-400 ${syncingCount > 0 ? 'animate-spin' : ''}`} />
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
function StudentForm({ initial, onSave, onClose, user, schools = [] }) {
  const [f, setF] = useState(initial || {
    name:'', nin:'', school:'', district: user.role==='District Registrar' ? user.district : 'Kampala',
    level:'S1', enrolmentYear: 2026, unebResults:'—', status:'Enrolled', guardianNin:'',
    bursaryEligible:false, specialNeeds:false, religion:''
  });
  const update = (k, v) => setF(s => ({ ...s, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    // If the school they typed isn't in the loaded schools list, add it so it shows up next time.
    const known = schools.some(s => s.name.toLowerCase() === (f.school || '').toLowerCase() && s.district === f.district);
    if (!known && f.school) {
      const level = ['P1','P2','P3','P4','P5','P6','P7'].includes(f.level) ? 'Primary'
                  : ['S1','S2','S3','S4','S5','S6'].includes(f.level) ? 'Secondary'
                  : f.level === 'University' ? 'University' : 'Primary';
      addSchoolIfNew({ name: f.school, district: f.district, level });
    }
    onSave(f);
  };
  const lockedDistrict = user.role === 'District Registrar';

  // School options scoped to the selected district (falls back to all if district has none).
  const schoolOptions = useMemo(() => {
    if (!schools.length) return [];
    const inDistrict = schools.filter(s => s.district === f.district).map(s => s.name);
    return inDistrict.length ? inDistrict : schools.map(s => s.name);
  }, [schools, f.district]);

  return (
    <form onSubmit={submit} id="student-form" className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Full Name"><input className={inputCls} value={f.name} onChange={e=>update('name', e.target.value)} required /></Field>
      <Field label="NIN (optional)">
        <input className={inputCls} value={f.nin} onChange={e=>update('nin', e.target.value)} placeholder="Leave blank if no ID card yet" />
      </Field>
      <Field label="School">
        {schoolOptions.length > 0
          ? <SearchableSelect value={f.school} onChange={(v)=>update('school', v)}
              options={schoolOptions} placeholder="Search schools in this district — or type a new one" allowFreeText />
          : <input className={inputCls} value={f.school} onChange={e=>update('school', e.target.value)} required placeholder="Type school name" />}
      </Field>
      <Field label="District">
        <SearchableSelect value={f.district} onChange={(v)=>update('district', v)}
          options={DISTRICTS} placeholder="Search districts…" disabled={lockedDistrict} />
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
      <Field label="Guardian NIN (optional)"><input className={inputCls} value={f.guardianNin} onChange={e=>update('guardianNin', e.target.value)} placeholder="Leave blank if guardian has no ID" /></Field>
      <Field label="Religion (optional)">
        <select className={inputCls} value={f.religion} onChange={e=>update('religion', e.target.value)}>
          <option value="">— Not stated —</option>
          {RELIGIONS.map(r => <option key={r}>{r}</option>)}
        </select>
      </Field>
      <div className="md:col-span-2 p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-900 flex items-start gap-2">
        <Info size={14} className="mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold">NIN is optional.</span> Many children, refugees, and adults in remote districts do not yet have NIRA identity cards. They should still be registered. You can add a NIN later when issued.
        </div>
      </div>
      <label className="flex items-center gap-2 mt-2">
        <input type="checkbox" className="w-4 h-4 accent-uinr" checked={!!f.bursaryEligible} onChange={e=>update('bursaryEligible', e.target.checked)} />
        <span className="text-sm text-slate-700 flex items-center gap-1"><Award size={14} className="text-amber-600" /> Bursary eligible</span>
      </label>
      <label className="flex items-center gap-2 mt-2">
        <input type="checkbox" className="w-4 h-4 accent-uinr" checked={!!f.specialNeeds} onChange={e=>update('specialNeeds', e.target.checked)} />
        <span className="text-sm text-slate-700 flex items-center gap-1"><Accessibility size={14} className="text-sky-600" /> Special needs support</span>
      </label>
    </form>
  );
}

/* ===========================================================
   Hospital form
   =========================================================== */
function HospitalForm({ initial, onSave, onClose, user }) {
  const [f, setF] = useState(initial || {
    name:'', level:'HC III', district: user.role==='District Registrar' ? user.district : 'Kampala',
    inCharge:'', beds:50, stock:'Adequate', lastInspection:'2026-06-01', visits:0, vacCoverage:80, activePatients:0
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
        <SearchableSelect value={f.district} onChange={(v)=>update('district', v)}
          options={DISTRICTS} placeholder="Search districts…" disabled={lockedDistrict} />
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
      <Field label="Active Patients (current)"><input type="number" min="0" className={inputCls} value={f.activePatients} onChange={e=>update('activePatients', Number(e.target.value))} /></Field>
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
    members:1, marriage:'Monogamous', religion:'',
    tree:{ grandparents:[], parents:[], children:[] }
  });
  const update = (k, v) => setF(s => ({ ...s, [k]: v }));
  const lockedDistrict = user.role === 'District Registrar';
  const submit = (e) => { e.preventDefault(); onSave(f); };

  return (
    <form onSubmit={submit} id="family-form" className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Family Head Name"><input className={inputCls} value={f.head} onChange={e=>update('head', e.target.value)} required /></Field>
      <Field label="Head's NIN (optional)"><input className={inputCls} value={f.nin} onChange={e=>update('nin', e.target.value)} placeholder="Leave blank if no ID yet" /></Field>
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
        <SearchableSelect value={f.district} onChange={(v)=>update('district', v)}
          options={DISTRICTS} placeholder="Search districts…" disabled={lockedDistrict} />
      </Field>
      <Field label="Number of Members"><input type="number" min="1" className={inputCls} value={f.members} onChange={e=>update('members', Number(e.target.value))} /></Field>
      <Field label="Marriage Status">
        <select className={inputCls} value={f.marriage} onChange={e=>update('marriage', e.target.value)}>
          <option>Monogamous</option><option>Polygamous</option><option>Single</option><option>Widowed</option><option>Divorced</option>
        </select>
      </Field>
      <Field label="Religion (optional)">
        <select className={inputCls} value={f.religion || ''} onChange={e=>update('religion', e.target.value)}>
          <option value="">— Not stated —</option>
          {RELIGIONS.map(r => <option key={r}>{r}</option>)}
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
        <SearchableSelect value={f.district} onChange={(v)=>update('district', v)}
          options={DISTRICTS} placeholder="Search districts…" />
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

/* Searchable select for long lists (districts, schools). */
function SearchableSelect({ value, onChange, options, placeholder='Search…', disabled=false, allowFreeText=false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return options.slice(0, 50);
    return options.filter(o => o.toLowerCase().includes(q)).slice(0, 50);
  }, [query, options]);
  const pick = (v) => { onChange(v); setOpen(false); setQuery(''); };
  return (
    <div ref={ref} className="relative">
      <button type="button" disabled={disabled} onClick={()=>setOpen(o=>!o)}
        className={`${inputCls} text-left flex items-center justify-between ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : 'cursor-pointer'}`}>
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>{value || placeholder}</span>
        <ChevronDown size={14} className="text-slate-400 ml-2 shrink-0" />
      </button>
      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-72 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder={placeholder}
                className="w-full pl-8 pr-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-uinr"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filtered[0]) { e.preventDefault(); pick(filtered[0]); }
                  if (e.key === 'Enter' && !filtered[0] && allowFreeText && query.trim()) { e.preventDefault(); pick(query.trim()); }
                  if (e.key === 'Escape') setOpen(false);
                }} />
            </div>
          </div>
          <ul className="overflow-y-auto flex-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-slate-500 italic">
                No matches{allowFreeText && query.trim() ? ' — press Enter to use "'+query.trim()+'"' : ''}.
              </li>
            )}
            {filtered.map(o => (
              <li key={o}
                onClick={()=>pick(o)}
                className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-uinr/5 ${o === value ? 'bg-uinr/10 font-semibold text-uinr' : 'text-slate-700'}`}>
                {o}
              </li>
            ))}
          </ul>
          <div className="px-3 py-1.5 text-[10px] text-slate-400 border-t border-slate-100">
            {filtered.length === 50 ? `Showing 50 of ${options.length} — refine search` : `${filtered.length} match${filtered.length===1?'':'es'}`}
          </div>
        </div>
      )}
    </div>
  );
}
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
function StudentsPage({ students, dispatch, user, pushToast, audit, addAudit, openProfile, schools }) {
  const perms = permissions(user);
  const scoped = perms.scopeDistrict ? students.filter(s => s.district === perms.scopeDistrict) : students;

  const [q, setQ] = useState('');
  const [fDist, setFDist] = useState('All');
  const [fLevel, setFLevel] = useState('All');
  const [fStatus, setFStatus] = useState('All');
  const [fBursary, setFBursary] = useState('All');
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  const filtered = scoped.filter(s =>
    (q === '' || s.name.toLowerCase().includes(q.toLowerCase()) || s.nin.toLowerCase().includes(q.toLowerCase())) &&
    (fDist === 'All' || s.district === fDist) &&
    (fLevel === 'All' || s.level === fLevel) &&
    (fStatus === 'All' || s.status === fStatus) &&
    (fBursary === 'All' || (fBursary === 'Yes' ? s.bursaryEligible : !s.bursaryEligible))
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
      { key:'status', label:'Status' }, { key:'religion', label:'Religion' },
      { key:'bursaryEligible', label:'Bursary Eligible', value:r => r.bursaryEligible ? 'Yes' : 'No' },
      { key:'specialNeeds',   label:'Special Needs',    value:r => r.specialNeeds ? 'Yes' : 'No' },
      { key:'guardianNin', label:'Guardian NIN' }
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
          <select className={inputCls + ' w-auto'} value={fStatus} onChange={e=>setFStatus(e.target.value)}>
            <option>All</option>
            {STUDENT_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className={inputCls + ' w-auto'} value={fBursary} onChange={e=>setFBursary(e.target.value)} title="Bursary eligible">
            <option value="All">Bursary: All</option>
            <option value="Yes">Bursary: Yes</option>
            <option value="No">Bursary: No</option>
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
                  ['level','Level'],['enrolmentYear','Year'],['unebResults','UNEB'],['status','Status'],
                  ['religion','Religion'],
                  ['bursaryEligible','Bursary'],['specialNeeds','Special Needs'],['guardianNin','Guardian NIN']
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
                  <td className="px-4 py-2.5 text-slate-600 font-mono text-xs">
                    {s.nin || <span className="text-slate-400 italic">No NIN yet</span>}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{s.school}</td>
                  <td className="px-4 py-2.5 text-slate-600">{s.district}</td>
                  <td className="px-4 py-2.5 text-slate-600">{s.level}</td>
                  <td className="px-4 py-2.5 text-slate-600">{s.enrolmentYear}</td>
                  <td className="px-4 py-2.5 text-slate-600">{s.unebResults}</td>
                  <td className="px-4 py-2.5"><Badge kind={statusKind(s.status)}>{s.status}</Badge></td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs">{s.religion || <span className="text-slate-400">—</span>}</td>
                  <td className="px-4 py-2.5">
                    {s.bursaryEligible
                      ? <span className="inline-flex items-center gap-1 text-xs text-amber-700"><Award size={12} /> Yes</span>
                      : <span className="text-xs text-slate-400">No</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    {s.specialNeeds
                      ? <span className="inline-flex items-center gap-1 text-xs text-sky-700"><Accessibility size={12} /> Yes</span>
                      : <span className="text-xs text-slate-400">No</span>}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 font-mono text-xs">
                    {s.guardianNin || <span className="text-slate-400 italic">—</span>}
                  </td>
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
        {editing && <StudentForm initial={editing} onSave={handleSave} onClose={()=>setEditing(null)} user={user} schools={schools} />}
      </Modal>

      <Modal open={adding} onClose={()=>setAdding(false)} title="Add New Student"
        footer={<>
          <button onClick={()=>setAdding(false)} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50">Cancel</button>
          <button form="student-form" type="submit" className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-uinr hover:bg-uinr-dark">
            <Plus size={16} /> Add Student
          </button>
        </>}>
        <StudentForm onSave={handleSave} onClose={()=>setAdding(false)} user={user} schools={schools} />
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

  const critical = scoped.filter(h => h.stock === 'Critical');

  return (
    <div className="space-y-4">
      {critical.length > 0 && (
        <div className="bg-rose-50 border-l-4 border-rose-500 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-rose-900">Drug stock critical at {critical.length} facility{critical.length>1?'ies':''}</div>
            <div className="text-sm text-rose-800 mt-0.5">{critical.map(f => `${f.name} (${f.district})`).join(' · ')}</div>
          </div>
        </div>
      )}
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
                {[['name','Facility'],['level','Level'],['district','District'],['inCharge','In-charge'],['beds','Beds'],['activePatients','Active Patients'],['stock','Drug Stock'],['lastInspection','Last Inspection']].map(([k,l])=>(
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
                  <td className="px-4 py-2.5 text-slate-700 font-semibold">{(h.activePatients || 0).toLocaleString()}</td>
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
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null); // { email, tempPw, name }

  const sendReset = async (u) => {
    try {
      if (supabaseConfigured) await sendResetEmail(u.username.includes('@') ? u.username : `${u.username}@uinr.go.ug`);
      pushToast('success', `Reset link sent — ${u.name}`);
      addAudit('Edited', 'Roles', `Sent reset link to ${u.username}`, user);
    } catch (e) { pushToast('error', e.message); }
  };

  const handleInvite = async ({ name, email, role, district }) => {
    try {
      let tempPw = null;
      if (supabaseConfigured) {
        // Generate a memorable temp password they'll change on first login
        tempPw = 'Uinr-' + Math.random().toString(36).slice(2, 8).toUpperCase() + '-' + Math.floor(Math.random()*100);
        await signUpOrganization({
          email, password: tempPw, name,
          organizationName: 'UINR', phone: '', district, orgType: 'District Office', plan: 'District',
          role
        });
        // Mark them so they must change password on first login
        try {
          await supabase.from('profiles').update({ role, district, must_change_password: true })
            .eq('id', (await supabase.from('profiles').select('id').eq('username', email.split('@')[0]).single()).data?.id);
        } catch {}
      }
      await dispatch({ type:'USER_ADD', payload: { name, username: email, role, district, status:'Active' } });
      addAudit('Created', 'Roles', `Invited ${email} as ${role}`, user);
      setInviting(false);
      setInviteResult({ email, tempPw, name, role });
    } catch (e) { pushToast('error', e.message); }
  };

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
        <div className="flex gap-2">
          <button onClick={()=>setInviting(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-uinr text-white text-sm hover:bg-uinr-dark">
            <Send size={16} /> Invite User
          </button>
          <button onClick={()=>setAdding(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm hover:bg-slate-50">
            <Plus size={16} /> Add Manually
          </button>
        </div>
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
                    <button onClick={()=>sendReset(a)} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs ml-1 text-slate-700 hover:bg-slate-100">
                      <Send size={14} /> Reset Link
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

      <InviteUserModal open={inviting} onClose={()=>setInviting(false)} onInvite={handleInvite} />
      <InviteResultModal result={inviteResult} onClose={()=>setInviteResult(null)} pushToast={pushToast} />
    </div>
  );
}

function InviteResultModal({ result, onClose, pushToast }) {
  if (!result) return null;
  const { email, tempPw, name, role } = result;
  const shareText = `You've been invited to join UINR — Uganda Integrated National Registry.

Email: ${email}
Temporary password: ${tempPw || '(set by your administrator)'}
Role: ${role}

Sign in at: ${window.location.origin}
You'll be asked to set a new password on first login.`;
  const copy = (text, label) => {
    navigator.clipboard.writeText(text);
    pushToast('success', `${label} copied to clipboard`);
  };
  return (
    <Modal open={!!result} onClose={onClose} title="Invite created"
      footer={<>
        <button onClick={()=>copy(shareText, 'Invite message')}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm">
          <FileText size={14} /> Copy message
        </button>
        <button onClick={onClose}
          className="px-4 py-2 rounded-lg bg-uinr text-white hover:bg-uinr-dark">Done</button>
      </>}>
      <div className="space-y-4">
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-900 flex items-start gap-2">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold">{name} has been added as {role}.</div>
            <div className="text-xs mt-0.5 text-emerald-800">Share the credentials below with them via a secure channel (WhatsApp, secure email, SMS).</div>
          </div>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">Login credentials</div>
          <div className="divide-y divide-slate-100">
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Email</div>
                <div className="font-mono text-sm text-slate-900 truncate">{email}</div>
              </div>
              <button onClick={()=>copy(email, 'Email')} className="text-xs font-semibold text-uinr hover:underline shrink-0">Copy</button>
            </div>
            {tempPw && (
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Temporary password</div>
                  <div className="font-mono text-sm text-slate-900 truncate">{tempPw}</div>
                </div>
                <button onClick={()=>copy(tempPw, 'Password')} className="text-xs font-semibold text-uinr hover:underline shrink-0">Copy</button>
              </div>
            )}
          </div>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">Important:</span> {name} will be forced to set a new password on first login. This temporary password is shown only once — copy it now if you haven't shared it yet.
          </div>
        </div>
      </div>
    </Modal>
  );
}

function InviteUserModal({ open, onClose, onInvite }) {
  const [f, setF] = useState({ name:'', email:'', role:'District Registrar', district:'Kampala' });
  const upd = (k, v) => setF(s => ({ ...s, [k]: v }));
  const submit = (e) => { e.preventDefault(); onInvite(f); };
  return (
    <Modal open={open} onClose={onClose} title="Invite a new user"
      footer={<>
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50">Cancel</button>
        <button form="invite-form" type="submit" className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-uinr hover:bg-uinr-dark">
          <Send size={16} /> Send invite
        </button>
      </>}>
      <form id="invite-form" onSubmit={submit} className="space-y-4">
        <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-900 flex items-start gap-2">
          <Info size={14} className="mt-0.5 shrink-0" />
          <div>
            The system will email them a sign-in link with a temporary password.
            On first login, they will be required to set a new password before accessing the registry.
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Full name"><input className={inputCls} value={f.name} onChange={e=>upd('name', e.target.value)} required placeholder="Patrick Mukasa" /></Field>
          <Field label="Email"><input type="email" className={inputCls} value={f.email} onChange={e=>upd('email', e.target.value)} required placeholder="patrick@uinr.go.ug" /></Field>
          <Field label="Role">
            <select className={inputCls} value={f.role} onChange={e=>upd('role', e.target.value)}>
              <option>Super Admin</option><option>Ministry Officer</option><option>District Registrar</option>
            </select>
          </Field>
          <Field label="District">
            <SearchableSelect value={f.district} onChange={(v)=>upd('district', v)}
              options={DISTRICTS} placeholder="Search districts…" />
          </Field>
        </div>
      </form>
    </Modal>
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
              <Stat label="Religion" value={student.religion || <span className="text-slate-400">—</span>} />
              <Stat label="Guardian NIN" value={<span className="font-mono">{student.guardianNin || '—'}</span>} />
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
   Landing page
   =========================================================== */
function LandingPage({ goLogin, goSignup, goDemo }) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-uinr text-white p-2 rounded-lg"><Shield size={18} /></div>
            <div>
              <div className="font-bold tracking-tight text-uinr">UINR</div>
              <div className="text-[10px] text-slate-500 -mt-0.5">National Registry</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <button onClick={()=>document.getElementById('how')?.scrollIntoView({behavior:'smooth'})} className="text-slate-600 hover:text-slate-900">How it works</button>
            <button onClick={()=>document.getElementById('benefits')?.scrollIntoView({behavior:'smooth'})} className="text-slate-600 hover:text-slate-900">Benefits</button>
            <button onClick={()=>document.getElementById('impact')?.scrollIntoView({behavior:'smooth'})} className="text-slate-600 hover:text-slate-900">Impact</button>
            <button onClick={()=>document.getElementById('pricing')?.scrollIntoView({behavior:'smooth'})} className="text-slate-600 hover:text-slate-900">Pricing</button>
            <button onClick={goLogin} className="text-uinr font-semibold hover:underline">Log in</button>
            <button onClick={()=>goSignup()} className="bg-uinr text-white px-4 py-2 rounded-lg hover:bg-uinr-dark text-sm font-semibold">Get Started</button>
          </div>
          <button onClick={goLogin} className="md:hidden text-sm font-semibold text-uinr">Log in</button>
        </div>
      </nav>

      <section className="bg-gradient-to-br from-uinr-dark via-uinr to-uinr-light text-white">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 pt-16 pb-24 lg:pt-24 lg:pb-32 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold mb-5">
              <Sparkles size={12} className="text-amber-300" /> Government of Uganda · Beta access open
            </div>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
              Uganda's First Unified <span className="text-amber-300">National Registry</span>
            </h1>
            <p className="mt-5 text-lg text-white/85 leading-relaxed">
              Track every student, hospital, and family in Uganda — from one dashboard.
              Built for government. Run by you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={()=>goSignup()} className="bg-white text-uinr font-semibold px-5 py-3 rounded-lg hover:bg-amber-50 flex items-center gap-2 shadow-lg">
                Get Started Free <ArrowRight size={16} />
              </button>
              <button onClick={goDemo} className="bg-white/10 backdrop-blur border border-white/20 text-white px-5 py-3 rounded-lg hover:bg-white/20 flex items-center gap-2 font-semibold">
                <Eye size={16} /> See a Demo
              </button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-white/70">
              <span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-300" /> No credit card required</span>
              <span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-300" /> 30-day free trial</span>
              <span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-300" /> Cancel anytime</span>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-5 shadow-2xl border border-white/15">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label:'Citizens linked', value:'8.4M',   Icon:Users2,        color:'bg-indigo-500/30' },
                  { label:'Facilities',      value:'3,260', Icon:Hospital,      color:'bg-emerald-500/30' },
                  { label:'Students',        value:'4.2M',  Icon:GraduationCap, color:'bg-sky-500/30' },
                  { label:'Districts live',  value:'10',    Icon:Globe2,        color:'bg-amber-500/30' }
                ].map((s,i) => (
                  <div key={i} className={`${s.color} backdrop-blur rounded-xl p-4`}>
                    <s.Icon size={20} className="mb-2 opacity-80" />
                    <div className="text-3xl font-bold">{s.value}</div>
                    <div className="text-xs text-white/80 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-widest text-uinr font-semibold mb-2">HOW IT WORKS</div>
            <h2 className="text-3xl lg:text-4xl font-bold">Go live in three steps</h2>
            <p className="mt-3 text-slate-600 max-w-2xl mx-auto">No developer required after setup. Your staff manages everything from the admin dashboard.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n:'01', title:'Your organisation signs up and chooses a plan', desc:'Pick the plan that fits — Free Trial for piloting, District for a single office, or Ministry for nationwide.', Icon:Building },
              { n:'02', title:'Assign roles to your staff — no developer needed', desc:'Invite users by email, set their role and district. They get access instantly.', Icon:UserPlus },
              { n:'03', title:'Start adding, editing, and tracking records from any browser', desc:'Works on Windows, Mac, and mobile. Real-time. Auditable. Offline-tolerant.', Icon:Zap }
            ].map((s,i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-uinr/10 text-uinr p-2.5 rounded-lg"><s.Icon size={20} /></div>
                  <div className="text-xs font-bold text-slate-400">{s.n}</div>
                </div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="benefits" className="py-20 lg:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-widest text-uinr font-semibold mb-2">WHO BENEFITS</div>
            <h2 className="text-3xl lg:text-4xl font-bold">Built for every Ugandan touchpoint</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { Icon:Globe2,    tone:'sky',     title:'For Government', desc:'Find any student or patient record in seconds. End paper files forever. Every ministry, one source of truth.' },
              { Icon:HeartPulse,tone:'emerald', title:'For Health',     desc:'Track drug stock, vaccination coverage, and outbreaks by district in real time. React before it spreads.' },
              { Icon:Users2,    tone:'indigo',  title:'For Families',   desc:'Every Ugandan family has a verified digital identity linked to health and education records.' }
            ].map((b,i) => {
              const palette = { sky:'bg-sky-100 text-sky-700', emerald:'bg-emerald-100 text-emerald-700', indigo:'bg-indigo-100 text-indigo-700' }[b.tone];
              return (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <div className={`inline-flex p-3 rounded-xl mb-4 ${palette}`}><b.Icon size={22} /></div>
                  <h3 className="font-bold text-xl mb-2">{b.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How UINR helps */}
      <section id="impact" className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-widest text-uinr font-semibold mb-2">REAL-WORLD IMPACT</div>
            <h2 className="text-3xl lg:text-4xl font-bold">What changes when UINR goes live</h2>
            <p className="mt-3 text-slate-600 max-w-2xl mx-auto">Concrete scenarios — not slogans. Replacing paper files in 146 districts and 12,700+ schools.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* For Citizens */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-indigo-100 text-indigo-700 p-2.5 rounded-lg"><Users2 size={20} /></div>
                <div>
                  <div className="font-bold text-xl">For citizens</div>
                  <div className="text-xs text-slate-500">47 million Ugandans, one identity</div>
                </div>
              </div>
              <ul className="space-y-3 text-sm">
                {[
                  { t:'A child moves districts', d:"Student record follows their NIN. New school sees their history, level, and UNEB results the same day — no re-enrolment paperwork." },
                  { t:'Bursary applications', d:'Eligibility flagged on the record. Funds tracked from ministry to school to family — no documents lost in transit.' },
                  { t:'Medical emergency', d:'NIN lookup pulls vaccination history, allergies, and district health card in seconds.' },
                  { t:'Lost certificates', d:"Reissued digitally from UINR records — no need to revisit UNEB or the school." },
                  { t:'Special-needs support', d:'Flag follows the student across institutions; districts must report progress.' },
                  { t:'Family verification', d:'Clan + parent + spouse links visible to the District Land Office and courts.' }
                ].map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">{s.t}</div>
                      <div className="text-slate-600">{s.d}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* For Government */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-emerald-100 text-emerald-700 p-2.5 rounded-lg"><Shield size={20} /></div>
                <div>
                  <div className="font-bold text-xl">For government</div>
                  <div className="text-xs text-slate-500">Every ministry, one source of truth</div>
                </div>
              </div>
              <ul className="space-y-3 text-sm">
                {[
                  { t:'End ghost-student fraud', d:'Every UPE-funded student has a NIN, school enrolment date, and audit trail. Auditors run one query.' },
                  { t:'Real-time drug stock-outs', d:'Critical stock alerts visible the same hour. Procurement responds before patients suffer.' },
                  { t:'Live vaccination coverage', d:'Per-district, per-facility, per-age-group. Outbreak hotspots visible before they spread.' },
                  { t:'No cross-ministry duplication', d:'Education, Health, and Local Government read from one record — no parallel systems.' },
                  { t:'Continuous demographics', d:'Population trends update as families register. No 10-year census blind spot.' },
                  { t:'Donor-grade reporting', d:'Instant exports for World Bank / UNICEF / Global Fund. Compliance in seconds.' },
                  { t:'Election-roll integrity', d:'Voter rolls cross-checked against UINR identities — no duplicate or fictitious voters.' },
                  { t:'Accountability by default', d:'Every edit signed by the official who made it. Roles cannot be exceeded. Audit trail is immutable.' }
                ].map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">{s.t}</div>
                      <div className="text-slate-600">{s.d}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { v:'146',    l:'Districts covered',          c:'bg-sky-50 text-sky-700 border-sky-200' },
              { v:'12,700+',l:'Government schools',         c:'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { v:'3,260',  l:'Health facilities',          c:'bg-rose-50 text-rose-700 border-rose-200' },
              { v:'47M',    l:'Citizens, one identity',     c:'bg-indigo-50 text-indigo-700 border-indigo-200' }
            ].map((s, i) => (
              <div key={i} className={`rounded-xl border p-5 text-center ${s.c}`}>
                <div className="text-3xl font-bold">{s.v}</div>
                <div className="text-xs uppercase tracking-wider font-semibold mt-1">{s.l}</div>
              </div>
            ))}
          </div>

          {/* Strategic case */}
          <div className="mt-10 bg-uinr-dark text-white rounded-2xl p-6 lg:p-8">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { t:'Once', d:'A citizen is registered once — at birth, or at first contact. Every ministry reads. No one re-collects.' },
                { t:'Everywhere', d:'Same record visible from Mulago to a HC II in Karamoja, on whatever device the officer has.' },
                { t:'Accountable', d:'Every edit signed by the official who made it. Roles cannot be exceeded. Replaces the missing audit trail.' }
              ].map((c, i) => (
                <div key={i}>
                  <div className="text-amber-300 text-xs uppercase tracking-widest font-bold mb-1">{c.t}</div>
                  <div className="text-white/90 leading-relaxed text-sm">{c.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 lg:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-widest text-uinr font-semibold mb-2">PRICING</div>
            <h2 className="text-3xl lg:text-4xl font-bold">Plans that scale with your scope</h2>
            <p className="mt-3 text-slate-600">All prices in Ugandan Shillings · Pay via MTN Mobile Money or Airtel Money.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map(p => {
              const featured = p.key === 'District';
              return (
                <div key={p.key} className={`relative rounded-2xl p-6 border ${featured ? 'border-uinr shadow-2xl bg-uinr text-white scale-[1.02]' : 'border-slate-200 bg-white'}`}>
                  {p.badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-bold ${featured ? 'bg-amber-400 text-uinr-dark' : 'bg-slate-200 text-slate-700'}`}>
                      {p.badge}
                    </div>
                  )}
                  <div className={`text-xs uppercase tracking-wider font-semibold ${featured ? 'text-amber-300' : 'text-slate-500'}`}>{p.name}</div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{p.price === 0 ? 'Free' : `UGX ${(p.price/1000).toFixed(0)}K`}</span>
                    <span className={`text-sm ${featured ? 'text-white/70' : 'text-slate-500'}`}>{p.period}</span>
                  </div>
                  <p className={`mt-2 text-sm ${featured ? 'text-white/80' : 'text-slate-600'}`}>{p.tagline}</p>
                  <ul className="mt-5 space-y-2 text-sm">
                    {p.features.map(f => (
                      <li key={f} className="flex items-start gap-2">
                        <Check size={16} className={featured ? 'text-amber-300 mt-0.5 shrink-0' : 'text-emerald-600 mt-0.5 shrink-0'} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={()=>goSignup(p.key)}
                    className={`mt-6 w-full py-3 rounded-lg font-semibold ${featured ? 'bg-white text-uinr hover:bg-amber-50' : 'bg-uinr text-white hover:bg-uinr-dark'}`}>
                    {p.cta}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="bg-uinr-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-white/15 p-2 rounded-lg"><Shield size={18} /></div>
              <div className="font-bold">UINR</div>
            </div>
            <p className="text-sm text-white/70">Uganda Integrated National Registry · Government SaaS platform.</p>
          </div>
          <div>
            <div className="font-semibold mb-3">Contact</div>
            <div className="space-y-2 text-sm text-white/80">
              <div className="flex items-center gap-2"><Mail size={14} /> uinr@gov.ug</div>
              <div className="flex items-center gap-2"><Phone size={14} /> +256 700 000 000</div>
            </div>
          </div>
          <div>
            <div className="font-semibold mb-3">Resources</div>
            <ul className="space-y-2 text-sm text-white/80">
              <li className="hover:underline cursor-pointer">Privacy Policy</li>
              <li className="hover:underline cursor-pointer">Terms of Service</li>
              <li className="hover:underline cursor-pointer">Documentation</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-3">Get started</div>
            <button onClick={()=>goSignup()} className="bg-white text-uinr px-4 py-2 rounded-lg font-semibold text-sm hover:bg-amber-50 mb-2 block">Create account</button>
            <button onClick={goLogin} className="text-white/80 hover:underline text-sm">Existing user? Log in</button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-5 lg:px-8 mt-10 pt-6 border-t border-white/10 text-center text-xs text-white/60">
          © {new Date().getFullYear()} Government of Uganda · UINR v2.0
        </div>
      </footer>
    </div>
  );
}

/* ===========================================================
   Signup screen
   =========================================================== */
function SignupScreen({ initialPlan, goLogin, goLanding, pushToast, onAutoLogin }) {
  const [step, setStep] = useState('form');
  const [f, setF] = useState({
    organizationName:'', name:'', email:'', phone:'',
    district:'Kampala', orgType:'District Office',
    plan: initialPlan || 'Free Trial',
    password:'', confirmPassword:''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const update = (k, v) => setF(s => ({ ...s, [k]: v }));

  const submit = async (e) => {
    e.preventDefault(); setError('');
    if (f.password !== f.confirmPassword) { setError('Passwords do not match.'); return; }
    if (f.password.length < 8 || !/\d/.test(f.password)) { setError('Password must be at least 8 characters with a number.'); return; }
    setLoading(true);
    try {
      if (supabaseConfigured) {
        const result = await signUpOrganization({
          email: f.email, password: f.password, name: f.name,
          organizationName: f.organizationName, phone: f.phone,
          district: f.district, orgType: f.orgType, plan: f.plan
        });
        if (result.profile && onAutoLogin) {
          // Email confirmation is off — drop them straight on the dashboard
          pushToast('success', `Welcome to UINR, ${result.profile.name.split(' ')[0]}!`);
          onAutoLogin(result.profile);
          return;
        }
        // Otherwise show "check your email"
      } else {
        await new Promise(r => setTimeout(r, 700));
      }
      setStep('success');
    } catch (err) {
      setError(err.message);
      pushToast('error', 'Sign up failed');
    } finally { setLoading(false); }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-uinr-dark via-uinr to-uinr-light flex items-center justify-center p-5">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Account created!</h2>
          <p className="mt-2 text-slate-600">
            {supabaseConfigured
              ? `Check your email at ${f.email} for your login confirmation link.`
              : `Your demo account is ready. In production we'd send a confirmation email to ${f.email}.`}
          </p>
          <button onClick={goLogin} className="mt-6 w-full bg-uinr text-white py-2.5 rounded-lg font-semibold hover:bg-uinr-dark flex items-center justify-center gap-2">
            Go to Login <ArrowRight size={16} />
          </button>
          <button onClick={goLanding} className="mt-3 text-sm text-slate-500 hover:underline">← Back to home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-uinr-dark via-uinr to-uinr-light text-white p-12 items-center justify-center">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/15 backdrop-blur p-2.5 rounded-xl"><Shield size={24} /></div>
            <div className="font-bold text-xl">UINR</div>
          </div>
          <h2 className="text-3xl font-bold mb-3">Start your 30-day free trial</h2>
          <p className="text-white/80 leading-relaxed">No credit card. Full access to every module. Invite up to 3 users to evaluate the platform across your district.</p>
          <div className="mt-8 space-y-3 text-sm">
            {['Real-time records across every device','MTN & Airtel Mobile Money billing','Audit-grade data trail','Cancel anytime'].map(t => (
              <div key={t} className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-300" /> {t}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-5 lg:p-8">
        <form onSubmit={submit} className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-7 lg:p-8">
          <button type="button" onClick={goLanding} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4">
            <ArrowLeft size={14} /> Back
          </button>
          <h2 className="text-2xl font-bold text-slate-900">Create your organisation account</h2>
          <p className="text-slate-500 text-sm mt-1">You'll be the Super Admin for this organisation.</p>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" /> <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            <Field label="Organisation name"><input className={inputCls} value={f.organizationName} onChange={e=>update('organizationName', e.target.value)} required placeholder="Ministry of Education" /></Field>
            <Field label="Organisation type">
              <select className={inputCls} value={f.orgType} onChange={e=>update('orgType', e.target.value)}>{ORG_TYPES.map(t => <option key={t}>{t}</option>)}</select>
            </Field>
            <Field label="Contact person"><input className={inputCls} value={f.name} onChange={e=>update('name', e.target.value)} required placeholder="Florence Akello" /></Field>
            <Field label="Phone"><input className={inputCls} value={f.phone} onChange={e=>update('phone', e.target.value)} required placeholder="+256 700 000 000" /></Field>
            <Field label="Email"><input type="email" className={inputCls} value={f.email} onChange={e=>update('email', e.target.value)} required placeholder="you@uinr.go.ug" autoComplete="email" /></Field>
            <Field label="District">
              <SearchableSelect value={f.district} onChange={(v)=>update('district', v)}
                options={DISTRICTS} placeholder="Search districts…" />
            </Field>
            <div className="sm:col-span-2">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Choose plan</span>
              <div className="grid grid-cols-3 gap-2">
                {PLANS.map(p => (
                  <button type="button" key={p.key} onClick={()=>update('plan', p.key)}
                    className={`text-left p-3 rounded-lg border-2 transition ${f.plan === p.key ? 'border-uinr bg-uinr/5' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="font-bold text-sm">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.price === 0 ? 'Free' : `UGX ${(p.price/1000).toFixed(0)}K`} {p.period}</div>
                  </button>
                ))}
              </div>
            </div>
            <Field label="Password"><input type="password" className={inputCls} value={f.password} onChange={e=>update('password', e.target.value)} required minLength={8} autoComplete="new-password" /></Field>
            <Field label="Confirm password"><input type="password" className={inputCls} value={f.confirmPassword} onChange={e=>update('confirmPassword', e.target.value)} required autoComplete="new-password" /></Field>
          </div>

          <button type="submit" disabled={loading} className="mt-6 w-full bg-uinr text-white py-3 rounded-lg font-semibold hover:bg-uinr-dark disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
            {loading ? 'Creating account…' : 'Create Account'}
          </button>

          <p className="mt-4 text-center text-sm text-slate-600">
            Already have an account? <button type="button" onClick={goLogin} className="text-uinr font-semibold hover:underline">Log in</button>
          </p>
        </form>
      </div>
    </div>
  );
}

/* ===========================================================
   Recovery (forgot-password link) password reset modal
   =========================================================== */
function RecoveryPasswordModal({ onComplete, pushToast }) {
  const [pw, setPw] = useState(''); const [c, setC] = useState('');
  const [loading, setLoading] = useState(false); const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (pw !== c) { setErr('Passwords do not match.'); return; }
    if (pw.length < 8 || !/\d/.test(pw)) { setErr('Password must be at least 8 characters with one number.'); return; }
    setLoading(true);
    try {
      await updatePassword(pw);
      pushToast('success', 'Password reset — you can now sign in');
      // Clean recovery params from URL
      try { window.history.replaceState({}, '', window.location.pathname); } catch {}
      onComplete();
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7">
        <div className="w-14 h-14 mx-auto bg-sky-100 text-sky-700 rounded-full flex items-center justify-center mb-4">
          <KeyRound size={24} />
        </div>
        <h2 className="text-xl font-bold text-center text-slate-900">Set a new password</h2>
        <p className="text-sm text-slate-600 text-center mt-1">You followed a password reset link. Choose a new password to continue.</p>
        {err && <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm flex items-start gap-2"><AlertTriangle size={16} className="mt-0.5 shrink-0" />{err}</div>}
        <div className="mt-5 space-y-3">
          <Field label="New password"><input type="password" className={inputCls} value={pw} onChange={e=>setPw(e.target.value)} required minLength={8} autoFocus /></Field>
          <Field label="Confirm new password"><input type="password" className={inputCls} value={c} onChange={e=>setC(e.target.value)} required /></Field>
          <div className="text-xs text-slate-500">At least 8 characters and one number.</div>
        </div>
        <button type="submit" disabled={loading} className="mt-5 w-full bg-uinr text-white py-2.5 rounded-lg font-semibold hover:bg-uinr-dark disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Set password and sign in
        </button>
      </form>
    </div>
  );
}

/* ===========================================================
   First-login password change modal
   =========================================================== */
function FirstLoginPasswordModal({ user, onComplete, pushToast }) {
  const [pw, setPw] = useState(''); const [c, setC] = useState('');
  const [loading, setLoading] = useState(false); const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (pw !== c) { setErr('Passwords do not match.'); return; }
    if (pw.length < 8 || !/\d/.test(pw)) { setErr('Password must be at least 8 characters with one number.'); return; }
    setLoading(true);
    try {
      if (supabaseConfigured) {
        await updatePassword(pw);
        await supabase.from('profiles').update({ must_change_password: false }).eq('id', user.id);
      }
      pushToast('success', 'Password updated');
      onComplete();
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7">
        <div className="w-14 h-14 mx-auto bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mb-4">
          <KeyRound size={24} />
        </div>
        <h2 className="text-xl font-bold text-center text-slate-900">Set your permanent password</h2>
        <p className="text-sm text-slate-600 text-center mt-1">For security, you must change your temporary password before accessing the registry.</p>
        {err && <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm flex items-start gap-2"><AlertTriangle size={16} className="mt-0.5 shrink-0" />{err}</div>}
        <div className="mt-5 space-y-3">
          <Field label="New password"><input type="password" className={inputCls} value={pw} onChange={e=>setPw(e.target.value)} required minLength={8} autoFocus /></Field>
          <Field label="Confirm new password"><input type="password" className={inputCls} value={c} onChange={e=>setC(e.target.value)} required /></Field>
          <div className="text-xs text-slate-500">At least 8 characters and one number.</div>
        </div>
        <button type="submit" disabled={loading} className="mt-5 w-full bg-uinr text-white py-2.5 rounded-lg font-semibold hover:bg-uinr-dark disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Update password
        </button>
      </form>
    </div>
  );
}

/* ===========================================================
   Subscription & Billing page
   =========================================================== */
function BillingPage({ settings, setSettings, billing, state, pushToast, addAudit, user }) {
  const currentPlan = PLANS.find(p => p.key === (settings.plan || 'District'));
  const renews = settings.planRenewsAt || (new Date(Date.now() + 30*24*3600*1000).toISOString());
  const renewsDate = new Date(renews);
  const daysLeft = Math.max(0, Math.ceil((renewsDate - new Date()) / (24*3600*1000)));

  const usage = {
    users:    state.admins.length,
    records:  state.audit.filter(a => ['Created','Edited'].includes(a.action)).length,
    storageMB: Math.round((state.students.length + state.hospitals.length + state.families.length) * 0.04 * 10) / 10
  };

  const changePlan = (planKey) => {
    if (planKey === settings.plan) return;
    setSettings({ ...settings, plan: planKey });
    addAudit('Edited', 'Billing', `Plan changed to ${planKey}`, user);
    pushToast('success', `Plan changed to ${planKey}`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-uinr-dark to-uinr-light text-white rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider text-white/70 flex items-center gap-2"><CreditCard size={14} /> Current plan</div>
            <h2 className="text-3xl font-bold mt-1">{currentPlan.name}</h2>
            <p className="text-white/80 text-sm mt-1">
              {currentPlan.price === 0 ? `${daysLeft} days remaining on free trial` : `Renews on ${renewsDate.toLocaleDateString()}`}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 min-w-[200px]">
            <div className="text-xs text-white/70 uppercase tracking-wider">Next charge</div>
            <div className="text-2xl font-bold mt-1">{fmtUGX(currentPlan.price)}</div>
            <div className="text-xs text-white/70">{currentPlan.period}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label:'Current users',      value:`${usage.users} / ${currentPlan.key === 'Free Trial' ? 3 : '∞'}`, Icon:Users2 },
          { label:'Records this month', value: usage.records.toLocaleString(), Icon:Activity },
          { label:'Storage used',       value:`${usage.storageMB} MB`, Icon:Database }
        ].map((k, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{k.label}</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{k.value}</div>
              </div>
              <k.Icon size={22} className="text-uinr" />
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Change your plan</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map(p => {
            const active = p.key === settings.plan;
            return (
              <div key={p.key} className={`relative bg-white rounded-2xl p-5 border-2 ${active ? 'border-uinr' : 'border-slate-200'}`}>
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-uinr-dark px-2.5 py-0.5 rounded-full text-[10px] font-bold">{p.badge}</div>
                )}
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{p.name}</div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-900">{p.price === 0 ? 'Free' : `UGX ${(p.price/1000).toFixed(0)}K`}</span>
                  <span className="text-xs text-slate-500">{p.period}</span>
                </div>
                <ul className="mt-3 space-y-1.5 text-xs">
                  {p.features.slice(0, 4).map(f => (
                    <li key={f} className="flex items-start gap-1.5"><Check size={12} className="text-emerald-600 mt-0.5 shrink-0" /><span className="text-slate-700">{f}</span></li>
                  ))}
                </ul>
                {active
                  ? <div className="mt-4 w-full text-center text-sm font-semibold text-uinr py-2 bg-uinr/10 rounded-lg">Current plan</div>
                  : p.key === 'Ministry'
                  ? <button onClick={()=>pushToast('info', 'Sales team will contact you within 24 hours')} className="mt-4 w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-semibold hover:bg-slate-700 flex items-center justify-center gap-1"><Phone size={14} /> Contact Sales</button>
                  : <button onClick={()=>changePlan(p.key)} className="mt-4 w-full bg-uinr text-white py-2 rounded-lg text-sm font-semibold hover:bg-uinr-dark flex items-center justify-center gap-1">
                      {PLANS.findIndex(x=>x.key===settings.plan) < PLANS.findIndex(x=>x.key===p.key) ? <ArrowUp size={14} /> : <ChevronsRight size={14} />}
                      {PLANS.findIndex(x=>x.key===settings.plan) < PLANS.findIndex(x=>x.key===p.key) ? 'Upgrade' : 'Switch'}
                    </button>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
          <FileClock size={18} className="text-uinr" />
          <div>
            <div className="font-semibold text-slate-900">Billing history</div>
            <div className="text-xs text-slate-500">{billing.length} transactions</div>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-5 py-2.5 font-medium">Date</th>
              <th className="text-left px-5 py-2.5 font-medium">Plan</th>
              <th className="text-left px-5 py-2.5 font-medium">Amount</th>
              <th className="text-left px-5 py-2.5 font-medium">Method</th>
              <th className="text-left px-5 py-2.5 font-medium">Reference</th>
              <th className="text-left px-5 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {billing.length === 0 && <tr><td colSpan="6" className="text-center py-8 text-slate-500">No billing records yet.</td></tr>}
            {billing.map(b => (
              <tr key={b.id} className="border-t border-slate-100">
                <td className="px-5 py-2.5 text-slate-700">{b.date}</td>
                <td className="px-5 py-2.5 font-medium text-slate-800">{b.plan}</td>
                <td className="px-5 py-2.5 text-slate-700">{fmtUGX(b.amount)}</td>
                <td className="px-5 py-2.5 text-slate-600">{b.method}</td>
                <td className="px-5 py-2.5 text-slate-600 font-mono text-xs">{b.reference}</td>
                <td className="px-5 py-2.5"><Badge kind={statusKind(b.status)}>{b.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Wallet size={18} className="text-uinr" />
          <div>
            <div className="font-semibold text-slate-900">Payment methods</div>
            <div className="text-xs text-slate-500">Pay in Ugandan Shillings via mobile money</div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <button onClick={()=>pushToast('success', 'MTN Mobile Money — prompt sent to your phone')}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold transition hover:opacity-90"
            style={{ background: '#FFCB05', color: '#1a1a1a' }}>
            <Smartphone size={18} /> Pay with MTN Mobile Money
          </button>
          <button onClick={()=>pushToast('success', 'Airtel Money — prompt sent to your phone')}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-white transition hover:opacity-90"
            style={{ background: '#E40000' }}>
            <Smartphone size={18} /> Pay with Airtel Money
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-3">You'll receive a prompt on your registered phone. Payment confirmation is automatic.</p>
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
  const [user, setUser] = useState(supabaseConfigured ? null : (persisted?.user ?? null));
  const [authReady, setAuthReady] = useState(!supabaseConfigured);
  // Screen routing: landing | login | signup | dashboard
  const [screen, setScreen] = useState(supabaseConfigured ? 'landing' : (persisted?.user ? 'dashboard' : 'landing'));
  const [signupPlan, setSignupPlan] = useState(null);
  const [billing, setBilling] = useState([]);
  const [schools, setSchools] = useState([]);
  const [mustChangeOpen, setMustChangeOpen] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
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
      if (data.billing) setBilling(data.billing);
      try {
        const s = await loadSchools();
        setSchools(s);
      } catch {}
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

  // Restore Supabase Auth session on mount + subscribe to auth changes
  useEffect(() => {
    if (!supabaseConfigured) return;
    let cancelled = false;
    (async () => {
      try {
        const restored = await restoreSession();
        if (!cancelled && restored) setUser(restored);
      } catch (e) {
        push('error', e.message);
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    })();
    const unsubscribe = onAuthChange(
      (u) => { if (!cancelled) setUser(u); },
      (_recoveryUser) => {
        if (!cancelled) {
          setRecoveryOpen(true);
          setAuthReady(true);
          push('info', 'You can set a new password now.');
        }
      }
    );
    return () => { cancelled = true; unsubscribe(); };
  }, [push]);

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

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-uinr-dark via-uinr to-uinr-light text-white">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-3" />
          <div className="text-sm text-white/80">Restoring secure session…</div>
        </div>
      </div>
    );
  }

  const handleLogin = (u) => {
    setUser(u);
    setScreen('dashboard');
    setSection('overview');
    if (u.mustChangePassword) setMustChangeOpen(true);
  };

  if (recoveryOpen) {
    return (<>
      <RecoveryPasswordModal pushToast={push}
        onComplete={async ()=>{
          setRecoveryOpen(false);
          // After resetting password the session is still active — pick up the profile.
          try {
            const restored = await restoreSession();
            if (restored) handleLogin(restored);
            else setScreen('login');
          } catch { setScreen('login'); }
        }} />
      <ToastStack toasts={toasts} />
    </>);
  }

  if (!user) {
    if (screen === 'landing') return (<>
      <LandingPage
        goLogin={()=>setScreen('login')}
        goSignup={(plan)=>{ setSignupPlan(plan || null); setScreen('signup'); }}
        goDemo={async ()=>{
          try {
            if (supabaseConfigured) {
              const u = await signInWithEmail(DEMO_EMAIL, DEMO_PASSWORD);
              push('success', `Demo session — signed in as ${u.name}`);
              handleLogin(u);
            } else {
              const florence = USERS.find(u => u.role === 'Super Admin');
              push('success', `Demo session — signed in as ${florence.name}`);
              handleLogin(florence);
            }
          } catch (e) {
            push('error', `Demo unavailable: ${e.message}`);
            setScreen('login');
          }
        }} />
      <ToastStack toasts={toasts} />
    </>);
    if (screen === 'signup') return (<>
      <SignupScreen
        initialPlan={signupPlan}
        goLogin={()=>setScreen('login')}
        goLanding={()=>setScreen('landing')}
        onAutoLogin={handleLogin}
        pushToast={push} />
      <ToastStack toasts={toasts} />
    </>);
    // default: login
    return (<>
      <LoginScreen
        onLogin={handleLogin}
        pushToast={push}
        goSignup={(plan)=>{ setSignupPlan(plan || null); setScreen('signup'); }}
        goLanding={()=>setScreen('landing')} />
      <ToastStack toasts={toasts} />
    </>);
  }

  const handleLogout = async () => {
    if (supabaseConfigured) {
      try { await authSignOut(); } catch {}
    }
    push('info', 'Signed out');
    setUser(null);
    setScreen('landing');
    setSection('overview');
  };

  const sectionMeta = {
    overview:  { title:'Overview',           subtitle:'National registry at a glance' },
    students:  { title:'Students',           subtitle:'Education records linked by NIN' },
    hospitals: { title:'Hospitals',          subtitle:'Health facilities and capacity' },
    families:  { title:'Family Trees',       subtitle:'Multi-generational household records' },
    reports:   { title:'Reports',            subtitle:'Ministry-ready printable summaries' },
    audit:     { title:'Audit Log',          subtitle:'Immutable record of every action' },
    roles:     { title:'User Management',    subtitle:'Invite, suspend, and assign roles' },
    billing:   { title:'Subscription & Billing', subtitle:'Plan, usage, and payment history' },
    settings:  { title:'Settings',           subtitle:'System configuration and account' },
    profile:   { title:'Citizen profile',    subtitle:profilePerson ? `${profilePerson.name} · ${profilePerson.nin}` : '' }
  }[section] || { title:'Overview', subtitle:'' };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-slate-50 to-sky-50/40">
      <Sidebar section={section} setSection={(s)=>{ setSection(s); if (s !== 'profile') setProfilePerson(null); }} user={user}
               onLogout={handleLogout}
               open={sidebarOpen} setOpen={setSidebarOpen} />
      <main className="flex-1 flex flex-col min-w-0">
        <Topbar title={sectionMeta.title} subtitle={sectionMeta.subtitle}
                onMenu={()=>setSidebarOpen(true)} user={user}
                onOpenPalette={()=>setPaletteOpen(true)}
                onOpenNotif={()=>setNotifOpen(true)}
                unreadCount={unreadAlerts.length}
                dbConnected={supabaseConfigured}
                dbLoading={dbLoading} />
        <div className="p-4 lg:p-8 xl:p-10 flex-1 overflow-auto max-w-[1600px] w-full mx-auto">
          {section === 'overview'  && <Overview students={state.students} hospitals={state.hospitals} families={state.families} audit={state.audit} sync={state.sync} user={user} setSection={setSection} />}
          {section === 'students'  && <StudentsPage students={state.students} dispatch={wdispatch} user={user} pushToast={push} audit={state.audit} addAudit={addAudit} openProfile={openProfile} schools={schools} />}
          {section === 'hospitals' && <HospitalsPage hospitals={state.hospitals} dispatch={wdispatch} user={user} pushToast={push} addAudit={addAudit} />}
          {section === 'families'  && <FamiliesPage families={state.families} students={state.students} hospitals={state.hospitals} dispatch={wdispatch} user={user} pushToast={push} addAudit={addAudit} openProfile={openProfile} />}
          {section === 'reports'   && <ReportsPage state={state} openReport={setActiveReport} />}
          {section === 'audit'     && <AuditPage audit={state.audit} user={user} pushToast={push} />}
          {section === 'roles' && user.role === 'Super Admin' && <RolesPage admins={state.admins} dispatch={wdispatch} user={user} pushToast={push} addAudit={addAudit} />}
          {section === 'billing' && user.role === 'Super Admin' && <BillingPage settings={settings} setSettings={setSettings} billing={billing} state={state} pushToast={push} addAudit={addAudit} user={user} />}
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
      {mustChangeOpen && (
        <FirstLoginPasswordModal user={user} pushToast={push}
          onComplete={()=>{ setMustChangeOpen(false); setUser({ ...user, mustChangePassword:false }); }} />
      )}
      <ToastStack toasts={toasts} />
    </div>
  );
}
