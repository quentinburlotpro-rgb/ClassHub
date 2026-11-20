import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth, signInAnonymously, onAuthStateChanged, setPersistence, browserLocalPersistence
} from 'firebase/auth';
import {
  getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc,
  collection, onSnapshot, query, where, serverTimestamp, arrayUnion, increment
} from 'firebase/firestore';
import { getMessaging, getToken, isSupported as messagingSupported } from 'firebase/messaging';
import {
  Calendar, Clock, BarChart, Trophy, Plus, X, Check, ChevronRight, ChevronLeft,
  User, Settings, Shield, Star, Award, Bell, LogOut, Edit2, Trash2, Pin,
  ThumbsUp, ThumbsDown, Users, MapPin, Download, RefreshCw, AlertTriangle,
  List, Grid, Sun, Moon, Search, ChevronDown, Crown, Copy, Smartphone
} from 'lucide-react';

/* =========================================================================
   1. CLES SECRETES ET CONSTANTES GLOBALES
   ========================================================================= */
const APP_VERSION_CODE = 81;
const APP_VERSION_STRING = "4.1.0";
const appId = 'classhub-mmi';
const DELEGATE_CODE = "IUT2026";
const SUPERADMIN_CODE = "ADMIN87K";
const VAPID_KEY = "BImmvCfd_BZQoxA5fdJFEtjElKTgg4mXOzy-dm-7IMBywFuaQfdEoCTQxe2f15aNYqP1xXr23bKVOnb1OVTaljk";

const userFirebaseConfig = {
  apiKey: "AIzaSyAJlaDcyO7fyrI28v2m1RC6yQ019-qk-78",
  authDomain: "classhub-fa9bf.firebaseapp.com",
  projectId: "classhub-fa9bf",
  storageBucket: "classhub-fa9bf.firebasestorage.app",
  messagingSenderId: "930925993041",
  appId: "1:930925993041:web:0439945a23ced4e752ec70"
};

const firebaseApp = initializeApp(userFirebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

/* =========================================================================
   2. ARCHITECTURE DES NIVEAUX ET GROUPES MMI
   ========================================================================= */
const APPS_SCRIPT_EDT_URL = 'https://script.google.com/macros/s/AKfycbx3_XIwqYQpJFK6HTP2tH4BFIAJxkN5OsKC5TKFj-p39GHcfPspzOsmjjUz1AJsalv_0w/exec';
const EDT_LEVEL_TO_SLUG = { MMI1: 'mmi1', MMI2: 'mmi2', MMI3: 'mmi3' };

const EDT_CODE_PREFIXES_BY_LEVEL = {
  MMI1: ['R1', 'R2'],
  MMI2: ['R3', 'R4'],
  MMI3: ['R5', 'R6']
};

function codeMatchesLevel(code = '', level) {
  const prefixes = EDT_CODE_PREFIXES_BY_LEVEL[level];
  if (!prefixes) return true;
  if (!/^R\d/i.test(code)) return true;
  return prefixes.some(p => code.toUpperCase().startsWith(p));
}

const GROUPS_BY_LEVEL = {
  MMI1: ['PROMO', 'TD1', 'TD2', 'G1', 'G2', 'G3', 'G4'],
  MMI2: ['PROMO', 'TD1', 'TD2', 'G1', 'G2', 'G3'],
  MMI3: ['PROMO', 'TD1', 'TD2', 'G1', 'G2', 'G3']
};

const TD_GROUP_MAP = {
  MMI1: { TD1: ['G1', 'G2'], TD2: ['G3', 'G4'] },
  MMI2: { TD1: ['G1', 'G2'], TD2: ['G3'] },
  MMI3: { TD1: ['G1', 'G2'] }
};

function getTdForGroup(level, group) {
  const map = TD_GROUP_MAP[level];
  if (!map) return 'TD1';
  for (const [td, groups] of Object.entries(map)) {
    if (groups.includes(group)) return td;
  }
  return 'TD1';
}

function groupBelongsToTD(level, group, td) {
  if (group === td) return true;
  return (TD_GROUP_MAP[level]?.[td] || []).includes(group);
}

/* =========================================================================
   3. MOTEUR HAPTIQUE & MICRO-INTERACTIONS & PWA FEATURES (SPÉCIAL APPLE)
   ========================================================================= */
const haptics = {
  tap: () => { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50); },
  success: () => { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([30, 60, 30]); }
};

function triggerConfetti(e) {
  if (!e) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  for (let i = 0; i < 12; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'fixed w-2 h-2 rounded-full pointer-events-none z-50';
    const colors = ['bg-indigo-500', 'bg-emerald-400', 'bg-amber-400', 'bg-pink-400', 'bg-blue-400'];
    confetti.classList.add(colors[Math.floor(Math.random() * colors.length)]);
    confetti.style.left = `${x}px`;
    confetti.style.top = `${y}px`;
    confetti.style.transition = 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
    document.body.appendChild(confetti);

    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 50;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;

    requestAnimationFrame(() => {
      confetti.style.transform = `translate(${tx}px, ${ty}px) scale(0)`;
      confetti.style.opacity = '0';
    });
    setTimeout(() => confetti.remove(), 500);
  }
}

function generateDynamicArtwork(code, room, timeLabel, colorObj = {}, theme = 'dark') {
  if (typeof document === 'undefined') return '/logo192.png';
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const isDark = theme === 'dark';

  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, isDark ? '#111827' : '#ffffff');
  gradient.addColorStop(1, isDark ? (colorObj.hexDark || '#1e3a8a') : (colorObj.hexLight || '#eff6ff'));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 50px sans-serif';
  ctx.fillStyle = isDark ? '#9ca3af' : '#6b7280';
  ctx.fillText(timeLabel, 256, 110);
  ctx.font = '900 130px sans-serif';
  ctx.fillStyle = isDark ? '#ffffff' : '#111827';
  ctx.fillText(room.toUpperCase(), 256, 260);
  ctx.font = 'bold 55px sans-serif';
  ctx.fillStyle = colorObj.hex || '#3b82f6';
  ctx.fillText(code, 256, 420);

  return canvas.toDataURL('image/png');
}

// 🛑 FINI LE DATA URI : Apple exige un vrai fichier distant/local
const SILENT_AUDIO_SRC = '/silence.mp3';
const silentAudio = typeof Audio !== 'undefined' ? new Audio(SILENT_AUDIO_SRC) : null;

if (silentAudio) {
  silentAudio.loop = true;
  silentAudio.volume = 1;
  silentAudio.setAttribute('playsinline', 'true');
  silentAudio.setAttribute('webkit-playsinline', 'true');
  silentAudio.preload = 'auto';

  if (typeof document !== 'undefined') {
    const attach = () => {
      if (!document.body.contains(silentAudio)) {
        silentAudio.style.position = 'absolute';
        silentAudio.style.width = '1px';
        silentAudio.style.height = '1px';
        silentAudio.style.opacity = '0';
        silentAudio.style.pointerEvents = 'none';
        document.body.appendChild(silentAudio);
      }
    };
    if (document.body) attach();
    else document.addEventListener('DOMContentLoaded', attach);
  }
}

function attemptAudioUnlock() {
  if (!silentAudio) return Promise.resolve(false);
  if (!silentAudio.src || silentAudio.src === window.location.href) {
    silentAudio.src = SILENT_AUDIO_SRC;
  }
  
  const playPromise = silentAudio.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      localStorage.setItem('classhub_audio_unlocked', 'true');
    }).catch(e => console.warn("Erreur unlock audio:", e));
  }
  return Promise.resolve(true); 
}

const pwaFeatures = {
  updateLiveActivity: async (title, subtitle, imageUrl, start, end) => {
    if (!('mediaSession' in navigator) || !silentAudio) return;

    // Anti-Pause
    navigator.mediaSession.setActionHandler('pause', () => silentAudio.play().catch(() => {}));
    navigator.mediaSession.setActionHandler('play', () => silentAudio.play().catch(() => {}));

    try {
      if (title && start && end) {
        if (silentAudio.paused) silentAudio.play().catch(() => {});

        navigator.mediaSession.metadata = new MediaMetadata({
          title: title,
          artist: subtitle || 'ClassHub',
          artwork: [{ src: imageUrl || '/logo192.png', sizes: '512x512', type: 'image/png' }]
        });

        navigator.mediaSession.playbackState = 'playing';

        if ('setPositionState' in navigator.mediaSession) {
          const duration = Math.max(1, (end.getTime() - start.getTime()) / 1000);
          let position = (Date.now() - start.getTime()) / 1000;
          position = Math.max(0, Math.min(position, duration));
          navigator.mediaSession.setPositionState({ duration, playbackRate: 1, position });
        }
      } else {
        // 🔄 LE NOUVEAU KILL SWITCH (MODE VEILLE)
        // Sur iOS, si on met `metadata = null`, l'OS affiche l'URL du site à la place.
        // On affiche un état "En attente" propre pour maintenir le widget actif en background.
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'ClassHub MMI',
          artist: 'En attente du prochain cours...',
          artwork: [{ src: '/logo192.png', sizes: '512x512', type: 'image/png' }]
        });
        navigator.mediaSession.playbackState = 'playing';
        
        // On vide la timeline puisqu'il n'y a pas de cours
        if ('setPositionState' in navigator.mediaSession) {
          navigator.mediaSession.setPositionState(null);
        }
      }
    } catch (_) {}
  },

  setBadge: (count) => {
    if ('setAppBadge' in navigator) {
      if (count > 0) navigator.setAppBadge(count).catch(() => {});
      else navigator.clearAppBadge().catch(() => {});
    }
  }
};

/* =========================================================================
   4. CONFIGURATIONS METIER & UI
   ========================================================================= */
const XP_BADGES = [
  { name: 'Spectateur', min: 0, icon: '👀' },
  { name: 'Débutant', min: 20, icon: '🌱' },
  { name: 'Connaisseur', min: 100, icon: '📘' },
  { name: 'Impliqué', min: 200, icon: '🔥' },
  { name: 'Vrai Chef', min: 600, icon: '👑' },
  { name: 'Goat', min: 1000, icon: '🐐' }
];

function getBadgeForXP(xp) {
  let current = XP_BADGES[0];
  for (const b of XP_BADGES) {
    if (xp >= b.min) current = b;
  }
  return current;
}

const EVENT_TYPES = {
  DEVOIR: { label: 'Devoir', color: 'blue', bg: 'bg-blue-500', text: 'text-blue-500 dark:text-blue-400', ring: 'ring-blue-500' },
  EVALUATION: { label: 'Évaluation', color: 'red', bg: 'bg-red-500', text: 'text-red-500 dark:text-red-400', ring: 'ring-red-500' },
  RENDU: { label: 'Rendu', color: 'orange', bg: 'bg-orange-500', text: 'text-orange-500 dark:text-orange-400', ring: 'ring-orange-500' },
  INFO: { label: 'Info', color: 'gray', bg: 'bg-gray-500', text: 'text-gray-500 dark:text-gray-400', ring: 'ring-gray-500' },
  SONDAGE: { label: 'Sondage', color: 'indigo', bg: 'bg-indigo-500', text: 'text-indigo-500 dark:text-indigo-400', ring: 'ring-indigo-500' }
};

const MMI_SUBJECTS = [
  { code: 'R213', name: 'Développement WEB' },
  { code: 'R214', name: 'Culture des Médias' },
  { code: 'R215', name: 'Anglais' },
  { code: 'SAE201', name: 'SAÉ - Projet Web' }
];

const AVATARS = ['👤','👽','🐶','🐱','🦊','🐼','🐸','🦁','🐯','🐨','🦄','🐙','🐧','🦉','🐺','🐰','🦖','🤖'];
const COMMON_ROOMS = ['R01', 'R02', 'R03', 'R04', 'R05', '101', '102', 'Montage'];

const CODE_COLOR_PALETTE = [
  { text: 'text-blue-500', textDarker: 'text-blue-700', bg: 'bg-blue-500', light: 'bg-blue-100', darkText: 'dark:text-blue-300', darkBg: 'dark:bg-blue-900/40', hex: '#3b82f6', hexLight: '#eff6ff', hexDark: '#1e3a8a' },
  { text: 'text-purple-500', textDarker: 'text-purple-700', bg: 'bg-purple-500', light: 'bg-purple-100', darkText: 'dark:text-purple-300', darkBg: 'dark:bg-purple-900/40', hex: '#a855f7', hexLight: '#faf5ff', hexDark: '#581c87' },
  { text: 'text-pink-500', textDarker: 'text-pink-700', bg: 'bg-pink-500', light: 'bg-pink-100', darkText: 'dark:text-pink-300', darkBg: 'dark:bg-pink-900/40', hex: '#ec4899', hexLight: '#fdf2f8', hexDark: '#831843' },
  { text: 'text-teal-500', textDarker: 'text-teal-700', bg: 'bg-teal-500', light: 'bg-teal-100', darkText: 'dark:text-teal-300', darkBg: 'dark:bg-teal-900/40', hex: '#14b8a6', hexLight: '#f0fdfa', hexDark: '#134e4a' },
  { text: 'text-emerald-500', textDarker: 'text-emerald-700', bg: 'bg-emerald-500', light: 'bg-emerald-100', darkText: 'dark:text-emerald-300', darkBg: 'dark:bg-emerald-900/40', hex: '#10b981', hexLight: '#ecfdf5', hexDark: '#064e3b' },
  { text: 'text-cyan-500', textDarker: 'text-cyan-700', bg: 'bg-cyan-500', light: 'bg-cyan-100', darkText: 'dark:text-cyan-300', darkBg: 'dark:bg-cyan-900/40', hex: '#06b6d4', hexLight: '#ecfeff', hexDark: '#164e63' },
  { text: 'text-amber-500', textDarker: 'text-amber-700', bg: 'bg-amber-500', light: 'bg-amber-100', darkText: 'dark:text-amber-300', darkBg: 'dark:bg-amber-900/40', hex: '#f59e0b', hexLight: '#fffbeb', hexDark: '#78350f' },
];

function colorForCode(code = '') {
  let hash = 0;
  for (let i = 0; i < code.length; i++) hash = (hash * 31 + code.charCodeAt(i)) >>> 0;
  return CODE_COLOR_PALETTE[hash % CODE_COLOR_PALETTE.length];
}

function subjectFor(code) {
  const found = MMI_SUBJECTS.find(s => s.code === code);
  if (found) return { ...found, prof: 'Équipe pédago.', color: colorForCode(code) };
  return { code, name: code, prof: 'Équipe pédago.', color: colorForCode(code) };
}

/* =========================================================================
   5. HELPERS & FIRESTORE PATHS
   ========================================================================= */
function generateNewUID() {
  const rand = () => Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${rand()}-${rand()}`;
}

function saveLocalProfile(level, group, td) {
  localStorage.setItem('classhub_level', level || '');
  localStorage.setItem('classhub_group', group || '');
  localStorage.setItem('classhub_td', td || '');
}

function getLocalProfile() {
  return {
    level: localStorage.getItem('classhub_level') || '',
    group: localStorage.getItem('classhub_group') || '',
    td: localStorage.getItem('classhub_td') || ''
  };
}

function relativeDate(dateInput) {
  const d = new Date(dateInput);
  const now = new Date();
  const diffDays = Math.round((new Date(d.toDateString()) - new Date(now.toDateString())) / 86400000);
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Demain';
  if (diffDays === -1) return 'Hier';
  if (diffDays > 1 && diffDays < 7) return `Dans ${diffDays} jours`;
  if (diffDays < -1 && diffDays > -7) return `Il y a ${Math.abs(diffDays)} jours`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const paths = {
  events: () => collection(db, 'artifacts', appId, 'public', 'data', 'events'),
  event: (id) => doc(db, 'artifacts', appId, 'public', 'data', 'events', id),
  users: () => collection(db, 'artifacts', appId, 'public', 'data', 'users'),
  user: (uid) => doc(db, 'artifacts', appId, 'public', 'data', 'users', uid),
  config: (id) => doc(db, 'artifacts', appId, 'public', 'data', 'config', id),
  log: (uid) => doc(db, 'artifacts', appId, 'public', 'data', 'logs', uid)
};

async function logActivity(uid, message) {
  if (!uid) return;
  try {
    await setDoc(paths.log(uid), { activityLogs: arrayUnion({ message, at: new Date().toISOString() }) }, { merge: true });
  } catch (e) { console.error(e); }
}

async function addXP(userDoc, amount) {
  if (!userDoc?.uid || userDoc.isGuest) return;
  updateDoc(paths.user(userDoc.uid), { xp: (userDoc.xp || 0) + amount }).catch(console.error);
}

/* =========================================================================
   6. ICS PARSER (LOCAL)
   ========================================================================= */
function unfoldICS(raw) { return raw.replace(/\r\n[ \t]/g, '').split(/\r\n|\n|\r/); }

function parseICSDate(value) {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2})(\d{2})Z?)?$/);
  if (!m) return null;
  const [, y, mo, d, , h = '00', mi = '00', s = '00'] = m;
  if (value.endsWith('Z')) return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
  return new Date(+y, +mo - 1, +d, +h, +mi, +s);
}

function parseICS(icsText) {
  const lines = unfoldICS(icsText);
  const events = [];
  let current = null;
  for (const line of lines) {
    if (line.startsWith('BEGIN:VEVENT')) current = {};
    else if (line.startsWith('END:VEVENT')) { if (current) events.push(current); current = null; }
    else if (current) {
      const idx = line.indexOf(':');
      if (idx === -1) continue;
      const key = line.substring(0, idx).split(';')[0];
      const value = line.substring(idx + 1);
      if (key === 'SUMMARY') current.summary = value.replace(/\\,/g, ',').replace(/\\n/gi, ' ');
      else if (key === 'DTSTART') current.start = parseICSDate(value);
      else if (key === 'DTEND') current.end = parseICSDate(value);
      else if (key === 'LOCATION') current.location = value.replace(/\\,/g, ',').replace(/\\n/gi, ' ').trim();
      else if (key === 'DESCRIPTION') current.description = value.replace(/\\,/g, ',').replace(/\\n/gi, '\n').trim();
    }
  }
  return events.filter(e => e.start);
}

function enrichICSEvent(rawEvent) {
  const summary = rawEvent.summary || '';
  const description = rawEvent.description || '';

  // 1. On sépare le texte principal des groupes (grâce à la virgule)
  // Ex: ["R4.04 CM PORTAL Nicolas", "BUT2-G1.BUT2-G2.BUT2-G3"]
  const summaryParts = summary.split(',');
  const mainPart = summaryParts[0].trim();
  const groupsPart = summaryParts.slice(1).join(',').trim();

  // 2. Le code de la matière est toujours le premier mot
  const code = mainPart.split(' ')[0] || 'AUTRE';

  // 3. Le type de cours (CM, TD, TP...)
  const typeMatch = mainPart.match(/\b(CM|TD|TP|DS|EXAMEN|CC)\b/i);
  const sessionType = typeMatch ? typeMatch[1].toUpperCase() : '';

  // 4. Le professeur (c'est le texte principal auquel on retire le code et le type)
  let teacher = mainPart;
  teacher = teacher.replace(code, '').trim(); // Retire "R4.04"
  if (sessionType) {
    teacher = teacher.replace(new RegExp(`\\b${sessionType}\\b`, 'i'), '').trim(); // Retire "CM"
  }
  teacher = teacher.replace(/[.\s]+$/, ''); // Nettoyage de sécurité des points finaux

  // Fallback de sécurité (au cas où le prof ne soit pas dans le summary)
  if (!teacher) {
    const descTeacherMatch = description.match(/Enseignant\(s\)\s*:\s*([^\r\n]+)/i);
    if (descTeacherMatch) teacher = descTeacherMatch[1].trim().replace(/[.\s]+$/, '');
  }

  // 5. Les groupes
  let groups = [];
  if (groupsPart) {
    groups = groupsPart.split('.')
      .map(g => g.trim())
      .filter(Boolean)
      .map(g => (g.includes('-') ? g.split('-').pop() : g));
  }

  return {
    ...rawEvent,
    code,
    sessionType,
    teacher,
    room: (rawEvent.location || '').trim(),
    groups,
    color: colorForCode(code)
  };
}

function buildSubjectsFromEDT(icsEvents) {
  const map = new Map();
  for (const e of icsEvents || []) {
    if (!e.code) continue;
    if (!map.has(e.code)) {
      const known = subjectFor(e.code);
      map.set(e.code, {
        code: e.code,
        name: known && known.name !== e.code ? known.name : e.code,
        prof: e.teacher || '—',
        color: e.color || colorForCode(e.code),
        _teachers: new Set(e.teacher ? [e.teacher] : [])
      });
    } else if (e.teacher) {
      map.get(e.code)._teachers.add(e.teacher);
    }
  }
  for (const entry of map.values()) {
    let profArray = Array.from(entry._teachers).filter(Boolean);
    if (profArray.length > 2) {
      entry.prof = `${profArray.slice(0, 2).join(', ')} +${profArray.length - 2}`;
    } else if (profArray.length > 0) {
      entry.prof = profArray.join(', ');
    } else {
      entry.prof = 'Équipe pédago.';
    }
    delete entry._teachers;
  }
  return map;
}

async function fetchICSWithFallback(levelSlug) {
  try {
    const res = await fetch(`${APPS_SCRIPT_EDT_URL}?level=${encodeURIComponent(levelSlug)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text || !text.includes('BEGIN:VCALENDAR')) throw new Error('Invalid ICS');
    return parseICS(text).map(enrichICSEvent);
  } catch (err) {
    console.error("Erreur AppsScript EDT", err);
    throw err;
  }
}

/* =========================================================================
   7. UI ATOMS
   ========================================================================= */
function Avatar({ emoji, size = 'md' }) {
  const sizes = { sm: 'w-8 h-8 text-lg', md: 'w-11 h-11 text-2xl', lg: 'w-20 h-20 text-4xl' };
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-indigo-100 to-purple-200 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center shrink-0 shadow-sm border border-white/20 dark:border-white/5`}>
      {emoji || '👤'}
    </div>
  );
}

function XPBadgeChip({ xp, isGuest }) {
  if (isGuest) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 px-2.5 py-1 rounded-full">
        👀 Spectateur
      </span>
    );
  }
  const badge = getBadgeForXP(xp || 0);
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full">
      {badge.icon} {badge.name} · {xp || 0} XP
    </span>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500 animate-in fade-in">
      <Icon size={40} className="mb-3 opacity-50" />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}

function SubjectDropdown({ options, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find(o => o.code === value) || options[0];

  return (
    <div className="relative mt-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-left flex items-center justify-between transition-colors hover:border-indigo-400 focus:border-indigo-500 outline-none"
      >
        <div>
          {selected?.smartLabel && <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-1 block">📍 Recommandé</span>}
          <p className="font-black text-gray-900 dark:text-gray-100 text-lg">{selected?.name || selected?.code}</p>
          <p className="text-xs font-semibold text-gray-500 mt-0.5">{selected?.code} • {selected?.prof}</p>
        </div>
        <ChevronDown size={20} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 top-full mt-2 left-0 right-0 max-h-60 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-2 space-y-1">
            {options.map(s => (
              <button
                key={s.code}
                type="button"
                onClick={() => { onChange(s.code); setIsOpen(false); }}
                className={`w-full text-left p-3 rounded-xl transition-colors ${value === s.code ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'}`}
              >
                {s.smartLabel && <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-1 block">📍 Recommandé</span>}
                <p className={`font-bold text-base ${value === s.code ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-200'}`}>{s.name || s.code}</p>
                <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.code} • {s.prof}</p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* =========================================================================
   ONBOARDING
   ========================================================================= */
function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [level, setLevel] = useState(null);

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6 animate-in fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">ClassHub</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">L'assistant ultime pour MMI</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
          {step === 1 && (
            <div className="animate-in slide-in-from-right duration-300">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 text-center">Choisis ton niveau</h2>
              <div className="space-y-3">
                {['MMI1', 'MMI2', 'MMI3'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => { setLevel(lvl); setStep(2); }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 hover:bg-indigo-50 dark:bg-indigo-900/30 border border-transparent hover:border-indigo-500 dark:hover:border-indigo-400 transition-all active:scale-95"
                  >
                    <span className="font-bold text-gray-800 dark:text-gray-100 text-lg">{lvl.replace('MMI', 'MMI ')}</span>
                    <ChevronRight size={20} className="text-indigo-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in slide-in-from-right duration-300">
              <button onClick={() => setStep(1)} className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-4 hover:text-indigo-500">
                <ChevronLeft size={16} /> Retour
              </button>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1 text-center">Dans quel groupe es-tu ?</h2>
              <p className="text-center text-xs text-indigo-500 mb-4 font-semibold">{level}</p>

              <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1 pb-2">
                {GROUPS_BY_LEVEL[level].filter(g => g.startsWith('G')).map((g) => (
                  <button
                    key={g}
                    onClick={() => onComplete(level, g)}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 hover:bg-indigo-50 border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 active:scale-95 transition-all"
                  >
                    <Users className="mb-2 text-gray-400 dark:text-gray-500" size={24} />
                    <span className="font-bold text-gray-800 dark:text-gray-100">{g}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   WIZARD DE CREATION
   ========================================================================= */
function CreateWizard({ profile, onClose, onPublish, subjectsMap, icsEvents }) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState('DEVOIR');
  const [subjectCode, setSubjectCode] = useState('');
  const [title, setTitle] = useState('');

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const [scope, setScope] = useState('PROMO');
  const [scopeValue, setScopeValue] = useState('');

  const weekEvents = useMemo(() => {
    if (!icsEvents) return [];
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 86400000);
    return icsEvents.filter(e => {
      if (e.start > nextWeek || e.start < new Date(now).setHours(0,0,0,0)) return false;
      if (e.groups?.length > 0) {
        if (profile.td) {
           const tdGroups = TD_GROUP_MAP[profile.level]?.[profile.td];
           if (e.groups.some(g => tdGroups?.includes(g) || g === profile.td)) return true;
        }
        return e.groups.includes(profile.group);
      }
      return true;
    });
  }, [icsEvents, profile]);

  const smartSubjectOptions = useMemo(() => {
    const all = Array.from(subjectsMap?.values() || []).sort((a, b) => a.code.localeCompare(b.code));
    all.push(subjectFor('AUTRE'));

    if (weekEvents.length === 0) return all;

    const now = new Date();
    let rec = weekEvents.find(e => now >= e.start && now <= (e.end || new Date(e.start.getTime() + 90 * 60000)));
    if (!rec) rec = weekEvents.filter(e => e.start < now).sort((a,b) => b.start - a.start)[0] || weekEvents.filter(e => e.start > now).sort((a,b) => a.start - b.start)[0];

    if (rec && rec.code) {
      const idx = all.findIndex(s => s.code === rec.code);
      if (idx !== -1) {
        const smartSubj = all.splice(idx, 1)[0];
        return [{ ...smartSubj, smartLabel: true, _sourceEvent: rec }, ...all];
      }
    }
    return all;
  }, [subjectsMap, weekEvents]);

  useEffect(() => {
    if (!subjectCode && smartSubjectOptions.length > 0) {
      setSubjectCode(smartSubjectOptions[0].code);
    }
  }, [smartSubjectOptions, subjectCode]);

  useEffect(() => {
    if (!subjectCode) return;
    const opt = smartSubjectOptions.find(o => o.code === subjectCode);
    const sourceEvt = opt?._sourceEvent || weekEvents.find(e => e.code === subjectCode);

    if (sourceEvt) {
      if (sourceEvt.groups?.length > 0) {
        const g = sourceEvt.groups[0];
        if (g.startsWith('TD')) { setScope('TD'); setScopeValue(g); }
        else { setScope('GROUPE'); setScopeValue(g); }
      } else {
        setScope('PROMO'); setScopeValue('');
      }

      const nextWeek = new Date(sourceEvt.start);
      nextWeek.setDate(nextWeek.getDate() + 7);
      setDate(nextWeek.toISOString().split('T')[0]);

      const hh = String(sourceEvt.start.getHours()).padStart(2, '0');
      const mm = String(sourceEvt.start.getMinutes()).padStart(2, '0');
      setTime(`${hh}:${mm}`);
    } else {
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      setDate(tmrw.toISOString().split('T')[0]);
      setTime('08:00');
      setScope('PROMO'); setScopeValue('');
    }
  }, [subjectCode, weekEvents, smartSubjectOptions]);

  const autoTitle = `${EVENT_TYPES[type].label} de ${subjectCode}`;

  function handlePublish() {
    let dueAtIso = null;
    try {
      if (date && time) dueAtIso = new Date(`${date}T${time}:00`).toISOString();
    } catch (err) { dueAtIso = null; }

    onPublish({
      type, level: profile.level, subjectCode,
      title: title.trim() || autoTitle,
      date, time, dueAt: dueAtIso,
      scope, scopeValue: scope === 'TD' || scope === 'GROUPE' ? scopeValue : null,
      authorId: profile.uid, authorPseudo: profile.pseudo, pinned: false,
      createdAt: new Date().toISOString(), votes: {}, reliability: 0
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg overflow-hidden animate-in slide-in-from-bottom duration-300 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <h3 className="font-bold text-gray-800 dark:text-gray-100">Ajouter un élément</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors rounded-full text-gray-500"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Type</label>
              <div className="grid grid-cols-2 gap-3">
                {['DEVOIR', 'EVALUATION', 'RENDU', 'INFO'].map(k => (
                  <button
                    key={k} onClick={() => setType(k)}
                    className={`p-3 rounded-xl border font-bold text-sm transition-all ${type === k ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    {EVENT_TYPES[k].label}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Matière & Titre</label>
                <SubjectDropdown options={smartSubjectOptions} value={subjectCode} onChange={setSubjectCode} />
                <input
                  autoFocus
                  value={title} onChange={e => setTitle(e.target.value)}
                  placeholder={autoTitle}
                  onKeyDown={e => e.key === 'Enter' && setStep(2)}
                  className="w-full mt-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 font-bold placeholder:font-medium placeholder:text-gray-400 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>
              <button onClick={() => setStep(2)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-xl font-bold mt-2 transition-colors">Suivant (Entrée)</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Date limite</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 font-medium focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Heure</label>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full mt-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 font-medium focus:border-indigo-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 block">Cible (Boutons rapides)</label>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => {setScope('PROMO'); setScopeValue('');}} className={`p-3 rounded-xl text-xs font-bold border transition-colors ${scope === 'PROMO' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Ma Promo</button>
                  <button onClick={() => {setScope('TD'); setScopeValue(profile.td);}} className={`p-3 rounded-xl text-xs font-bold border transition-colors ${scope === 'TD' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Mon TD<br/><span className="text-[9px] opacity-70">({profile.td})</span></button>
                  <button onClick={() => {setScope('GROUPE'); setScopeValue(profile.group);}} className={`p-3 rounded-xl text-xs font-bold border transition-colors ${scope === 'GROUPE' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Mon TP<br/><span className="text-[9px] opacity-70">({profile.group})</span></button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 p-3.5 rounded-xl font-bold transition-colors">Retour</button>
                <button autoFocus onKeyDown={e => e.key === 'Enter' && handlePublish()} onClick={handlePublish} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20">
                  Publier <span className="text-xs opacity-80 font-medium bg-black/10 px-1.5 py-0.5 rounded">+20 XP</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   CARTE EVENEMENT
   ========================================================================= */
function EventCard({ event, profile, canModerate, subjectsMap, onCheck, onVoteReliability, onDelete }) {
  const cfg = EVENT_TYPES[event.type] || EVENT_TYPES.INFO;
  const subject = subjectsMap?.get(event.subjectCode) || subjectFor(event.subjectCode);

  const votesMap = event.votes || {};
  const myVote = votesMap[profile.uid] || 0;
  const reliabilityScore = event.reliability || 0;

  return (
    <div className={`rounded-3xl p-5 mb-4 bg-white dark:bg-gray-800 shadow-sm border ${event.pinned ? 'border-amber-300 dark:border-amber-500/50 bg-amber-50/30 dark:bg-amber-900/10' : 'border-gray-100 dark:border-gray-700'} animate-in fade-in transition-colors`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 mb-1">
          {event.pinned && <Pin size={14} className="text-amber-500" />}
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full text-white uppercase tracking-wider ${cfg.bg}`}>{cfg.label}</span>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 font-bold">{event.dueAt ? relativeDate(event.dueAt) : ''} {event.time || ''}</span>
      </div>

      <p className={`text-[11px] font-black mt-3 uppercase tracking-widest ${subject.color.text}`}>{subject.name}</p>
      <h4 className="font-black text-gray-900 dark:text-gray-100 text-xl leading-tight mt-0.5">{event.title}</h4>

      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2.5 font-medium space-y-1">
        <p className="flex items-center gap-1.5"><User size={14} className="opacity-70"/> <span className="truncate">{subject.prof}</span></p>
        <p className="flex items-center gap-1.5"><Users size={14} className="opacity-70"/> <span>Cible : {event.scope} {event.scopeValue || ''}</span></p>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50 dark:border-gray-700/50">
        <button
          onClick={(e) => onCheck(event, e)}
          className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-90 ${event.checkedLocal ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        >
          <Check size={16} /> {event.checkedLocal ? 'Fait' : 'À faire'}
        </button>

        <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-1 border border-gray-100 dark:border-gray-700/50">
          <button onClick={() => {
            if (profile.isGuest) { alert("Crée ton compte dans Profil pour voter et gagner de l'XP !"); return; }
            onVoteReliability(event, 1);
          }} className={`p-1.5 rounded-lg transition-colors ${myVote === 1 ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600' : 'text-gray-400 hover:text-emerald-500'}`}>
            <ThumbsUp size={16} className={myVote === 1 ? "fill-current" : ""} />
          </button>
          <span className={`text-xs font-bold px-1 ${reliabilityScore > 0 ? 'text-emerald-500' : reliabilityScore < 0 ? 'text-red-500' : 'text-gray-500'}`}>{reliabilityScore}</span>
          <button onClick={() => {
            if (profile.isGuest) { alert("Crée ton compte dans Profil pour voter et gagner de l'XP !"); return; }
            onVoteReliability(event, -1);
          }} className={`p-1.5 rounded-lg transition-colors ${myVote === -1 ? 'bg-red-100 dark:bg-red-900/50 text-red-600' : 'text-gray-400 hover:text-red-500'}`}>
            <ThumbsDown size={16} className={myVote === -1 ? "fill-current" : ""} />
          </button>
        </div>
      </div>

      {canModerate(event) && !profile.isGuest && (
        <div className="flex justify-end mt-3">
          <button onClick={() => onDelete(event)} className="text-[10px] text-red-400 uppercase font-bold tracking-widest hover:underline">Supprimer</button>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   TAB: AGENDA
   ========================================================================= */
function AgendaTab({ events, profile, subjectsMap, saeConfig, onCheck, onVoteReliability, onDelete }) {
  const [dateFilter, setDateFilter] = useState('ALL');

  const visibleEvents = useMemo(() => {
    let filtered = (events || []).filter(e => {
      if (e.scope === 'PROMO') return true;
      if (e.scope === 'TD') return groupBelongsToTD(profile.level, profile.group, e.scopeValue);
      if (e.scope === 'GROUPE') return e.scopeValue === profile.group;
      return true;
    });

    const now = new Date();
    if (dateFilter === 'TODAY') {
      filtered = filtered.filter(e => e.dueAt && new Date(e.dueAt).toDateString() === now.toDateString());
    } else if (dateFilter === 'TOMORROW') {
      const tmrw = new Date(now); tmrw.setDate(now.getDate() + 1);
      filtered = filtered.filter(e => e.dueAt && new Date(e.dueAt).toDateString() === tmrw.toDateString());
    }

    return filtered.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(a.dueAt || 0) - new Date(b.dueAt || 0);
    });
  }, [events, profile, dateFilter]);

  const canModerate = useCallback((e) => {
    return e.authorId === profile.uid || profile.role === 'delegue' || profile.role === 'superadmin';
  }, [profile]);

  return (
    <div className="pb-24 md:pb-0">
      {saeConfig?.active && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-5 rounded-3xl mb-5 shadow-lg shadow-emerald-500/20 animate-in fade-in">
          <p className="font-black text-sm uppercase tracking-wide">🚀 Période SAÉ : {saeConfig.name}</p>
          <p className="text-xs font-medium opacity-90 mt-1">{saeConfig.startDate} → {saeConfig.endDate}</p>
          {(saeConfig.availableRooms || []).length > 0 && (
            <div className="flex gap-2 flex-wrap mt-3">
              {saeConfig.availableRooms.map(r => (
                <span key={r} className="text-xs font-bold bg-black/20 px-2.5 py-1 rounded-lg">{r}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 mb-5 overflow-x-auto pb-2 scrollbar-hide">
        {[{id:'ALL', label:'Tout'}, {id:'TODAY', label:"Aujourd'hui"}, {id:'TOMORROW', label:'Demain'}].map(f => (
          <button key={f.id} onClick={() => setDateFilter(f.id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${dateFilter === f.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {visibleEvents.length === 0
        ? <EmptyState icon={Calendar} text="Rien à signaler pour cette période ! 🎉" />
        : visibleEvents.map(e => <EventCard key={e.id} event={e} profile={profile} canModerate={canModerate} subjectsMap={subjectsMap} onCheck={onCheck} onVoteReliability={onVoteReliability} onDelete={onDelete} />)
      }
    </div>
  );
}

/* =========================================================================
   COMPOSANT CLASSIC TIMETABLE
   ========================================================================= */
function ClassicTimetable({ events, period, targetDate }) {
  const startHour = 8;
  const endHour = 19.5;
  const totalMins = (endHour - startHour) * 60;
  const now = new Date();

  const refDate = targetDate || now;

  let days = [];
  if (period === 'day') {
    days = [refDate];
  } else {
    const dayOfWeek = refDate.getDay() || 7;
    const monday = new Date(refDate);
    monday.setDate(refDate.getDate() - dayOfWeek + 1);
    for(let i=0; i<5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
  }

  const hourLines = [];
  for (let h = Math.ceil(startHour); h <= Math.floor(endHour); h++) {
    hourLines.push(h);
  }

  return (
    <div className="flex overflow-x-auto overflow-y-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 h-[65vh] min-h-[500px] text-gray-800 dark:text-gray-100 relative snap-x snap-mandatory">

      <div className="w-12 shrink-0 border-r border-gray-100 dark:border-gray-700/50 flex flex-col bg-gray-50 dark:bg-gray-900/20 z-10">
        {period === 'week' && <div className="h-10 border-b border-gray-100 dark:border-gray-700 shrink-0" />}
        <div className="flex-1 relative">
          {hourLines.map(h => {
            const topPct = ((h - startHour) * 60 / totalMins) * 100;
            return (
              <div key={h} className="absolute w-full text-right pr-2 text-[10px] text-gray-400 font-bold" style={{top: `${topPct}%`, transform: 'translateY(-50%)'}}>
                {h}h
              </div>
            );
          })}
        </div>
      </div>

      {days.map((day, idx) => {
        let dayEvents = events.filter(e => e.start.toDateString() === day.toDateString());
        
        // 🛠️ ALGORITHME ANTI-SUPERPOSITION
        // 1. Tri chronologique
        dayEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
        const columns = [];
        
        // 2. Répartition dans des colonnes virtuelles
        dayEvents.forEach(evt => {
          let placed = false;
          const evtStart = evt.start.getTime();
          for (let i = 0; i < columns.length; i++) {
            const lastEvt = columns[i][columns[i].length - 1];
            const lastEnd = lastEvt.end ? lastEvt.end.getTime() : lastEvt.start.getTime() + 90 * 60000;
            if (evtStart >= lastEnd) {
              columns[i].push(evt);
              evt._col = i;
              placed = true;
              break;
            }
          }
          if (!placed) {
            evt._col = columns.length;
            columns.push([evt]);
          }
        });

        // 3. Calcul du nombre maximum de conflits par groupe d'événements
        dayEvents.forEach(evt => {
          const evtStart = evt.start.getTime();
          const evtEnd = evt.end ? evt.end.getTime() : evtStart + 90 * 60000;
          let overlappingCols = new Set();
          dayEvents.forEach(other => {
            const otherStart = other.start.getTime();
            const otherEnd = other.end ? other.end.getTime() : otherStart + 90 * 60000;
            // Si les événements se chevauchent, on note la colonne occupée
            if (Math.max(evtStart, otherStart) < Math.min(evtEnd, otherEnd)) {
              overlappingCols.add(other._col);
            }
          });
          evt._maxCols = Math.max(...Array.from(overlappingCols)) + 1;
        });
        // --------------------------------------------

        const isToday = day.toDateString() === now.toDateString();
        const currentHourDec = now.getHours() + (now.getMinutes() / 60);
        const showLine = isToday && currentHourDec >= startHour && currentHourDec < endHour;

        return (
          <div key={idx} className="flex-1 min-w-[140px] snap-center flex flex-col border-r border-gray-100 dark:border-gray-700/30 last:border-r-0">

            {period === 'week' && (
              <div className={`h-10 flex items-center justify-center shrink-0 border-b border-gray-100 dark:border-gray-700 text-center text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-400'}`}>
                {day.toLocaleDateString('fr-FR', {weekday: 'short'})}
              </div>
            )}

            <div className="flex-1 relative">
              {hourLines.map(h => {
                const topPct = ((h - startHour) * 60 / totalMins) * 100;
                return (
                  <div key={h} className="absolute w-full border-b border-gray-50 dark:border-gray-700/20" style={{top: `${topPct}%`}} />
                );
              })}

              {dayEvents.map((e, i) => {
                const startMins = e.start.getHours() * 60 + e.start.getMinutes() - (startHour * 60);
                const endMins = e.end ? (e.end.getHours() * 60 + e.end.getMinutes() - (startHour * 60)) : startMins + 90;
                const duration = endMins - startMins;

                const top = (startMins / totalMins) * 100;
                const height = (duration / totalMins) * 100;

                // 🛠️ APPLICATION DES CALCULS DE LARGEUR
                const col = e._col || 0;
                const maxCols = e._maxCols || 1;
                const leftPct = (col / maxCols) * 100;
                const widthPct = 100 / maxCols;

                return (
                  <div 
                    key={i} 
                    // J'ai retiré 'left-1.5 right-1.5' et ajouté 'transition-all hover:z-50' pour mieux lire au survol
                    className={`absolute rounded-xl p-2 overflow-hidden shadow-sm border border-white/50 dark:border-white/5 z-10 flex flex-col transition-all hover:z-50 ${e.color.light} ${e.color.darkBg}`} 
                    style={{
                      top: `${top}%`, 
                      height: `${height}%`,
                      left: `calc(${leftPct}% + 4px)`,
                      width: `calc(${widthPct}% - 8px)`
                    }}
                  >
                    <div className={`w-1 absolute left-0 top-0 bottom-0 ${e.color.bg}`} />

                    <p className={`text-[10px] sm:text-xs font-black line-clamp-3 leading-tight ml-1.5 break-words ${e.color.textDarker} ${e.color.darkText}`}>
                      {e.code}{e.sessionType ? ` · ${e.sessionType}` : ''}
                    </p>

                    {duration >= 30 && (
                      <div className={`ml-1.5 flex flex-col opacity-80 leading-none ${e.color.textDarker} ${e.color.darkText}`}>
                        {e.room && <p className="text-[9px] sm:text-[10px] font-semibold mt-0.5 truncate">{e.room}</p>}
                        {e.teacher && (
                          <p className="text-[9px] sm:text-[10px] font-medium mt-0.5 line-clamp-2 break-words">
                            {e.teacher}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {showLine && (
                <div className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 pointer-events-none" style={{top: `${((currentHourDec - startHour) * 60 / totalMins) * 100}%`}}>
                  <div className="absolute -left-1 -top-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  );
}

/* =========================================================================
   TAB: EMPLOI DU TEMPS (EDT)
   ========================================================================= */
function EDTTab({ profile, icsEvents, events, loading, error, onReload }) {
  const [groupFilter, setGroupFilter] = useState(profile.group);
  const [period, setPeriod] = useState(() => localStorage.getItem('classhub_edt_period') || 'day');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('classhub_edt_view') || 'list');

  const [dateOffset, setDateOffset] = useState(0);

  const targetDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dateOffset);
    return d;
  }, [dateOffset]);

  const filteredByGroup = useMemo(() => {
    if (groupFilter === 'PROMO') return icsEvents;
    const subGroups = TD_GROUP_MAP[profile.level]?.[groupFilter];
    return (icsEvents || []).filter(e => {
      if (e.groups.length === 0) return true;
      if (subGroups) return e.groups.some(g => subGroups.includes(g));
      return e.groups.includes(groupFilter);
    });
  }, [icsEvents, groupFilter, profile.level]);

  const filteredByPeriodAndView = useMemo(() => {
    const now = new Date();

    const dayOfWeek = targetDate.getDay() || 7;
    const currentMonday = new Date(targetDate);
    currentMonday.setDate(targetDate.getDate() - dayOfWeek + 1);
    currentMonday.setHours(0, 0, 0, 0);

    const currentSunday = new Date(currentMonday);
    currentSunday.setDate(currentMonday.getDate() + 6);
    currentSunday.setHours(23, 59, 59, 999);

    return filteredByGroup.filter(e => {
      const endTime = e.end || new Date(e.start.getTime() + 90*60000);

      if (viewMode === 'list' && dateOffset === 0 && endTime < now) return false;

      if (period === 'day') {
        return e.start.toDateString() === targetDate.toDateString();
      } else {
        return e.start >= currentMonday && e.start <= currentSunday;
      }
    });
  }, [filteredByGroup, period, viewMode, targetDate, dateOffset]);

  const groupedListEvents = useMemo(() => {
    if (viewMode !== 'list') return [];
    const groups = {};
    filteredByPeriodAndView.forEach(e => {
      const dateStr = e.start.toDateString();
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(e);
    });
    return Object.entries(groups).sort((a,b) => new Date(a[0]) - new Date(b[0]));
  }, [filteredByPeriodAndView, viewMode]);

  const myTasks = useMemo(() => {
    return (events || []).filter(evt => {
      if (evt.scope === 'PROMO') return true;
      if (evt.scope === 'TD') return groupBelongsToTD(profile.level, profile.group, evt.scopeValue);
      if (evt.scope === 'GROUPE') return evt.scopeValue === profile.group;
      return true;
    });
  }, [events, profile]);

  return (
    <div className="pb-24 md:pb-0">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {GROUPS_BY_LEVEL[profile.level].filter(g => g.startsWith('G')).map(g => (
          <button
            key={g} onClick={() => setGroupFilter(g)}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${groupFilter === g ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >{g}</button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-5 flex-wrap gap-y-3">
        <div className="flex gap-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-1">
          <button onClick={() => { setPeriod('day'); localStorage.setItem('classhub_edt_period', 'day'); setDateOffset(0); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${period === 'day' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>Jour</button>
          <button onClick={() => { setPeriod('week'); localStorage.setItem('classhub_edt_period', 'week'); setDateOffset(0); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${period === 'week' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>Semaine</button>
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-1">
          <button onClick={() => setDateOffset(d => d - (period === 'week' ? 7 : 1))} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-indigo-500 transition-colors">
            <ChevronLeft size={16}/>
          </button>
          <button onClick={() => setDateOffset(0)} className={`w-12 text-center text-[10px] font-bold uppercase tracking-wider transition-colors ${dateOffset !== 0 ? 'text-indigo-500 hover:text-indigo-600' : 'text-gray-400'}`}>
            {dateOffset === 0 ? 'Auj.' : 'Retour'}
          </button>
          <button onClick={() => setDateOffset(d => d + (period === 'week' ? 7 : 1))} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-indigo-500 transition-colors">
            <ChevronRight size={16}/>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-1">
            <button onClick={() => { setViewMode('list'); localStorage.setItem('classhub_edt_view', 'list'); }} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}><List size={16}/></button>
            <button onClick={() => { setViewMode('grid'); localStorage.setItem('classhub_edt_view', 'grid'); }} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}><Grid size={16}/></button>
          </div>
          <button onClick={onReload} className="p-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-gray-500 hover:text-indigo-500 transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading && <div className="flex justify-center py-10"><RefreshCw className="animate-spin text-indigo-500" /></div>}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm p-4 rounded-3xl flex items-start gap-3 animate-in fade-in">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">{error}</p>
            <button onClick={onReload} className="text-xs mt-2 font-black uppercase tracking-wider hover:underline">Réessayer</button>
          </div>
        </div>
      )}

      {!loading && !error && filteredByPeriodAndView.length === 0 && <EmptyState icon={Clock} text={viewMode === 'list' ? "Plus de cours ! 🎉" : "Aucun cours."} />}

      {!loading && !error && viewMode === 'list' && (
        <div className="space-y-6">
          {groupedListEvents.map(([dateStr, dayEvents]) => (
            <div key={dateStr} className="space-y-3">
              {period === 'week' && (
                <h3 className="text-sm font-black text-gray-500 dark:text-gray-400 ml-2 capitalize tracking-wide">
                  {new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
              )}
              {dayEvents.map((e, i) => {
                const yyyy = e.start.getFullYear();
                const mm = String(e.start.getMonth() + 1).padStart(2, '0');
                const dd = String(e.start.getDate()).padStart(2, '0');
                const eventDateStr = `${yyyy}-${mm}-${dd}`;

                const pendingTasks = myTasks.filter(t => t.subjectCode === e.code && t.date === eventDateStr && !t.checkedLocal);

                return (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 animate-in fade-in transition-colors" style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
                    <div className={`w-1.5 h-12 rounded-full shrink-0 ${e.color.bg}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{e.code}{e.sessionType ? ` · ${e.sessionType}` : ''}</p>
                          {pendingTasks.length > 0 && (
                            <span className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                              <Calendar size={10} /> {pendingTasks.length} dev.
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] font-black tracking-wider shrink-0 uppercase ${e.color.textDarker} ${e.color.darkText}`}>{e.groups.length ? e.groups.join('/') : 'PROMO'}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                        {e.start.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} · {e.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        {e.end ? ` - ${e.end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        {e.teacher && <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1"><User size={12} /> {e.teacher}</span>}
                        {e.room && <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1"><MapPin size={12} /> {e.room}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {!loading && !error && viewMode === 'grid' && (
        <ClassicTimetable events={filteredByPeriodAndView} period={period} targetDate={targetDate} />
      )}
    </div>
  );
}

/* =========================================================================
   TAB: XP / LEADERBOARD
   ========================================================================= */
function LeaderboardTab({ users, profile }) {
  const [filter, setFilter] = useState('ALL');

  const ranked = useMemo(() => {
    return (users || [])
      .filter(u => u.level === profile.level && u.pseudo)
      .filter(u => filter === 'ALL' || u.group === filter)
      .sort((a, b) => (b.xp || 0) - (a.xp || 0));
  }, [users, profile.level, filter]);

  const medalColors = ['from-yellow-400 to-yellow-500', 'from-gray-300 to-gray-400', 'from-orange-400 to-orange-500'];

  return (
    <div className="pb-24 md:pb-0">
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {['ALL', ...GROUPS_BY_LEVEL[profile.level].filter(g => g.startsWith('G'))].map(g => (
          <button key={g} onClick={() => setFilter(g)} className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === g ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{g === 'ALL' ? 'Général' : g}</button>
        ))}
      </div>

      <div className="flex justify-center items-end gap-4 mb-8 mt-6">
        {[1, 0, 2].map(pos => {
          const u = ranked[pos];
          if (!u) return <div key={pos} className="w-20" />;
          const isFirst = pos === 0;
          return (
            <div key={pos} className={`flex flex-col items-center ${isFirst ? '-mt-6' : ''}`}>
              <div className={`rounded-full p-1 bg-gradient-to-br ${medalColors[pos]} shadow-lg`}>
                <Avatar emoji={u.avatar} size={isFirst ? 'lg' : 'md'} />
              </div>
              <p className="text-sm font-bold mt-2 text-gray-800 dark:text-gray-100 truncate max-w-[80px]">{u.pseudo}</p>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{u.xp || 0} XP</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        {ranked.slice(3).map((u, i) => (
          <div key={u.uid} className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-3xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
            <span className="text-sm font-black text-gray-300 dark:text-gray-600 w-6 text-center">{i + 4}</span>
            <Avatar emoji={u.avatar} size="sm" />
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{u.pseudo}</p>
              <div className="mt-1"><XPBadgeChip xp={u.xp} /></div>
            </div>
          </div>
        ))}
        {ranked.length === 0 && <EmptyState icon={Trophy} text="Aucun classement disponible." />}
      </div>
    </div>
  );
}

/* =========================================================================
   TAB: PROFIL & PARAMETRES (Le grand nettoyage)
   ========================================================================= */
// On ajoute liveWidgetEnabled et toggleLiveWidget dans les paramètres
function SettingsPanel({ profile, onCreateAccount, onUpdateProfile, onRestartOnboarding, onLoadAccount, wakeLockActive, toggleWakeLock, liveWidgetEnabled, toggleLiveWidget }) {
  const [isSettingsMode, setIsSettingsMode] = useState(false);
  const [pseudo, setPseudo] = useState(profile.pseudo || '');
  const [avatar, setAvatar] = useState(profile.avatar || AVATARS[0]);

  // Settings specific state
  const [defaultTab, setDefaultTab] = useState(localStorage.getItem('classhub_default_tab') || 'agenda');
  const [code, setCode] = useState('');
  // 1. On mémorise si l'étudiant les veut (localement) ET si le navigateur est d'accord
  const [notifEnabled, setNotifEnabled] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return localStorage.getItem('classhub_notifs') === 'true' && Notification.permission === 'granted';
    }
    return false;
  });

  // 2. Le vrai Toggle intelligent (unique point d'entrée pour activer/désactiver les push)
  async function togglePush() {
    if (notifEnabled) {
      localStorage.setItem('classhub_notifs', 'false');
      setNotifEnabled(false);
    } else {
      if (!('Notification' in window)) {
        alert("Les notifications ne sont pas supportées sur cet appareil.");
        return;
      }

      if (Notification.permission === 'denied') {
        alert("Les notifications sont bloquées par ton navigateur ! 🔒\n\n• Sur PC/Android : Clique sur le cadenas dans la barre d'adresse.\n• Sur iPhone/Mac : Vérifie les réglages de l'application ou du site.");
        return;
      }

      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          localStorage.setItem('classhub_notifs', 'true');
          setNotifEnabled(true);

          // Enregistrement sécurisé du Service Worker s'il existe
          if ('serviceWorker' in navigator) {
            try {
              const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
              const messaging = getMessaging(firebaseApp);
              const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
              if (token && !profile.isGuest) {
                await updateDoc(paths.user(profile.uid), { fcmTokens: arrayUnion(token) });
              }
            } catch (swErr) {
              console.warn("Service Worker non enregistré, mais permissions OK :", swErr);
            }
          }
        }
      } catch (e) {
        console.error("Erreur lors de l'activation des notifications :", e);
      }
    }
  }

  const [loadCode, setLoadCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // --- Autorisation du son silencieux (nécessaire pour le widget) ---
  const [audioUnlocked, setAudioUnlocked] = useState(() => {
    return typeof window !== 'undefined' && localStorage.getItem('classhub_audio_unlocked') === 'true';
  });

  // Bouton de secours (rarement nécessaire) : un seul tap, une seule fonction.
  async function handleUnlockAudio() {
    haptics.tap();
    const ok = await attemptAudioUnlock();
    if (ok) {
      setAudioUnlocked(true);
      haptics.success();
    } else {
      alert("Le son n'a pas pu être autorisé. Réessaie en appuyant à nouveau sur ce bouton.");
    }
  }

  // Un seul geste = activer le widget ET débloquer le son en même temps.
  // On tente le déblocage AVANT le toggle, dans le même clic, pour rester
  // dans la fenêtre de "vrai geste utilisateur" exigée par tous les navigateurs
  // (iOS Safari, Chrome Android, desktop). Ça évite d'avoir à faire deux
  // actions séparées : toggle, puis chercher un second bouton "Autoriser le son".
function handleToggleWidget() {
  if (!liveWidgetEnabled && !audioUnlocked) {
    attemptAudioUnlock(); // ✅ Appel synchrone
    setAudioUnlocked(true);
  }
  toggleLiveWidget();
}

  // --- Mode debug widget (caché) : 5 taps rapides sur le libellé pour toggle ---
  const [debugWidgetOn, setDebugWidgetOn] = useState(() => {
    return typeof window !== 'undefined' && localStorage.getItem('classhub_debug_widget') === 'true';
  });
  const debugTapCountRef = useRef(0);
  const debugTapTimerRef = useRef(null);

  function handleWidgetLabelTap() {
    debugTapCountRef.current += 1;
    if (debugTapTimerRef.current) clearTimeout(debugTapTimerRef.current);
    debugTapTimerRef.current = setTimeout(() => { debugTapCountRef.current = 0; }, 1500);

    if (debugTapCountRef.current >= 5) {
      debugTapCountRef.current = 0;
      const newVal = !debugWidgetOn;
      localStorage.setItem('classhub_debug_widget', newVal ? 'true' : 'false');
      setDebugWidgetOn(newVal);
      window.dispatchEvent(new Event('classhub-debug-toggle'));
      haptics.success();
      alert(newVal
        ? "🛠️ Mode debug widget ACTIVÉ — un faux cours 'TEST 101' va s'afficher sur l'écran de verrouillage."
        : "Mode debug widget désactivé — retour au vrai emploi du temps.");
    }
  }

  useEffect(() => {
    if (!profile.isGuest) {
      setPseudo(profile.pseudo || '');
      setAvatar(profile.avatar || AVATARS[0]);
    }
  }, [profile]);

  const handlePseudoBlur = () => {
    if (profile.isGuest) return;
    const trimmed = pseudo.trim();
    if (trimmed !== (profile.pseudo || '')) {
      onUpdateProfile({ pseudo: trimmed });
      setSaveStatus('Pseudo enregistré !');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  const handleAvatarSelect = (a) => {
    setAvatar(a);
    if (!profile.isGuest) {
      onUpdateProfile({ avatar: a });
      setSaveStatus('Avatar mis à jour !');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  async function tryUnlockAdmin() {
    if (profile.isGuest) { alert("Crée ton compte d'abord !"); return; }
    let role = null;
    if (code === SUPERADMIN_CODE) role = 'superadmin';
    else if (code === DELEGATE_CODE) role = 'delegue';

    if (role) {
      await updateDoc(paths.user(profile.uid), { role });
      onUpdateProfile({ role });
      alert("Mode Admin déverrouillé ! L'onglet Admin apparaît en bas.");
      setCode('');
    } else {
      alert('Code invalide.');
    }
  }

  function handleCopyUID() {
    navigator.clipboard.writeText(profile.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function forceUpdate() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) registration.update();
      });
    }
    window.location.href = window.location.pathname + '?refresh=' + new Date().getTime();
  }

  // --- VUE PARAMÈTRES (L'Espace Propre) ---
  if (isSettingsMode) {
    return (
      <div className="pb-24 md:pb-0 space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSettingsMode(false)} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-indigo-500 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">Paramètres</h2>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">Préférences de l'App</h3>

          <div className="space-y-6">
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Onglet au démarrage</p>
              <div className="flex gap-2 p-1 bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 rounded-2xl">
                <button
                  onClick={() => { setDefaultTab('agenda'); localStorage.setItem('classhub_default_tab', 'agenda'); }}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${defaultTab === 'agenda' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  Agenda
                </button>
                <button
                  onClick={() => { setDefaultTab('edt'); localStorage.setItem('classhub_default_tab', 'edt'); }}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${defaultTab === 'edt' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  Emploi du temps
                </button>
              </div>
            </div>

            <button onClick={toggleWakeLock} className="w-full flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl transition-all">
              <div className="flex items-center gap-4 text-left">
                <Sun size={24} className={wakeLockActive ? 'text-amber-500' : 'text-gray-400'} />
                <div>
                  <p className="font-bold text-sm text-gray-900 dark:text-gray-100">Mode Écran Actif</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">Empêche l'écran de s'éteindre tout seul</p>
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${wakeLockActive ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${wakeLockActive ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </button>

            <button onClick={togglePush} className="w-full flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl transition-all">
              <div className="flex items-center gap-4 text-left">
                <Bell size={24} className={notifEnabled ? 'text-emerald-500' : 'text-gray-400'} />
                <div>
                  <p className="font-bold text-sm text-gray-900 dark:text-gray-100">Notifications Push</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                    {notifEnabled ? 'Activées sur cet appareil' : 'Activer pour recevoir les alertes'}
                  </p>
                </div>
              </div>

              {/* Le switch animé qui utilise notifEnabled */}
              <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${notifEnabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${notifEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </button>

            <button onClick={handleToggleWidget} className="w-full flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl transition-all">
              <div className="flex items-center gap-4 text-left">
                <Clock size={24} className={liveWidgetEnabled ? 'text-indigo-500' : 'text-gray-400'} />
                <div>
                  {/* 5 taps rapides ici = toggle du mode debug widget (test sans vrai cours) */}
                  <p
                    onClick={(e) => { e.stopPropagation(); handleWidgetLabelTap(); }}
                    className="font-bold text-sm text-gray-900 dark:text-gray-100 select-none"
                  >
                    Widget Écran de Verrouillage{debugWidgetOn ? ' 🛠️' : ''}
                  </p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                    {debugWidgetOn ? 'Mode debug actif — faux cours de test affiché' : 'Dynamic Island et cours en direct'}
                  </p>
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${liveWidgetEnabled ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${liveWidgetEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </button>

            {/* Secours uniquement : normalement le tap sur le toggle ci-dessus suffit.
                Ce bouton n'apparaît que si le son n'a pas pu être débloqué automatiquement. */}
            {liveWidgetEnabled && !audioUnlocked && (
              <button onClick={handleUnlockAudio} className="w-full flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800/50 p-4 rounded-2xl transition-all">
                <div className="flex items-center gap-4 text-left">
                  <Bell size={24} className="text-amber-500" />
                  <div>
                    <p className="font-bold text-sm text-amber-900 dark:text-amber-100">Réactiver le son du widget</p>
                    <p className="text-xs font-medium text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                      Un tap suffit. Nécessaire pour garder l'écran de verrouillage à jour en direct.
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-amber-500 shrink-0" />
              </button>
            )}

            <div className="pt-2">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 block">Accès Délégué / Admin</label>
              <div className="flex gap-2">
                <input value={code} onChange={e => setCode(e.target.value)} type="password" placeholder="Code secret..." className="flex-1 p-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 font-medium focus:border-amber-500 outline-none transition-colors" />
                <button onClick={tryUnlockAdmin} className="bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white px-5 rounded-2xl font-bold transition-all active:scale-95">Go</button>
              </div>
            </div>
          </div>
        </div>

        <button onClick={forceUpdate} className="w-full flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800/50 p-4 rounded-3xl transition-all active:scale-[0.98]">
          <div className="flex items-center gap-4 text-left">
            <Download size={24} className="text-blue-600 dark:text-blue-400" />
            <div>
              <p className="font-bold text-sm text-blue-900 dark:text-blue-100">Forcer la mise à jour</p>
              <p className="text-xs font-medium text-blue-600/70 dark:text-blue-400/70 mt-0.5">Recharge l'application avec la dernière version</p>
            </div>
          </div>
          <RefreshCw size={18} className="text-blue-500" />
        </button>

        <p className="text-center text-xs font-bold text-gray-300 dark:text-gray-600 mt-8">ClassHub MMI · v{APP_VERSION_STRING}</p>
      </div>
    );
  }

  // --- VUE PROFIL (Spectateur / Création) ---
  if (profile.isGuest) {
    return (
      <div className="pb-24 md:pb-0 space-y-6 animate-in fade-in">
        <div className="flex justify-end">
          <button onClick={() => setIsSettingsMode(true)} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2.5 rounded-xl font-bold transition-colors">
            <Settings size={18} /> Paramètres
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-indigo-200 dark:border-indigo-800 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2.5 rounded-2xl text-indigo-600 dark:text-indigo-400">
              <User size={20} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Créer mon profil</h3>
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6">Tu es en mode <strong className="text-gray-700 dark:text-gray-300">Spectateur 👀</strong>. Choisis un pseudo pour obtenir un code de sauvegarde, gagner de l'XP et publier des devoirs !</p>

          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3 block">Choisir un Avatar</label>
              <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 sm:gap-3">
                {AVATARS.map(a => (
                  <button
                    key={a} onClick={() => handleAvatarSelect(a)}
                    className={`aspect-square flex items-center justify-center text-2xl sm:text-3xl rounded-2xl transition-all duration-200 ${avatar === a ? 'bg-indigo-100 dark:bg-indigo-900/60 ring-2 ring-indigo-500 scale-110 shadow-md z-10' : 'bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105 opacity-60 hover:opacity-100'}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 block">Pseudo</label>
              <input
                value={pseudo}
                onChange={e => setPseudo(e.target.value)}
                placeholder="Ton pseudo..."
                className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>

            <button disabled={!pseudo.trim()} onClick={() => onCreateAccount(pseudo.trim(), avatar)} className="w-full bg-indigo-600 disabled:bg-gray-300 disabled:dark:bg-gray-700 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]">
              Rejoindre ClassHub
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-4">J'ai déjà un compte</h3>
          <div>
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 block">Charger avec ton code</label>
            <div className="flex gap-2">
              <input value={loadCode} onChange={e => setLoadCode(e.target.value.toUpperCase())} placeholder="Ex: 233-K2P" maxLength={7} className="flex-1 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 font-mono font-bold uppercase tracking-widest focus:border-blue-500 outline-none transition-colors" />
              <button onClick={() => onLoadAccount(loadCode)} className="bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white px-6 rounded-2xl font-bold transition-all active:scale-95">OK</button>
            </div>
          </div>
        </div>

        <button onClick={onRestartOnboarding} className="w-full flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 py-4 rounded-2xl font-bold transition-all active:scale-[0.98]">
          Changer de classe / groupe
        </button>
      </div>
    );
  }

  // --- VUE PROFIL (Compte Actif) ---
  return (
    <div className="pb-24 md:pb-0 space-y-6 animate-in fade-in">

      <div className="flex justify-end">
        <button onClick={() => setIsSettingsMode(true)} className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-4 py-2.5 rounded-xl font-bold transition-colors">
          <Settings size={18} /> Paramètres
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2.5 rounded-2xl text-indigo-600 dark:text-indigo-400">
              <User size={20} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Mon Profil</h3>
          </div>
          {saveStatus && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg animate-in fade-in slide-in-from-right duration-300">
              {saveStatus}
            </span>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3 block">Choisir un Avatar</label>
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 sm:gap-3">
              {AVATARS.map(a => (
                <button
                  key={a}
                  onClick={() => handleAvatarSelect(a)}
                  className={`aspect-square flex items-center justify-center text-2xl sm:text-3xl rounded-2xl transition-all duration-200 ${avatar === a ? 'bg-indigo-100 dark:bg-indigo-900/60 ring-2 ring-indigo-500 scale-110 shadow-md z-10' : 'bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105 opacity-60 hover:opacity-100'}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 block">Pseudo</label>
            <input
              value={pseudo}
              onChange={e => setPseudo(e.target.value)}
              onBlur={handlePseudoBlur}
              onKeyDown={e => e.key === 'Enter' && e.target.blur()}
              placeholder="Ton pseudo..."
              className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mt-2 ml-1">Enregistrement auto (Entrée ou clic ailleurs).</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2.5 rounded-2xl text-emerald-600 dark:text-emerald-400">
            <Shield size={20} />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Sauvegarde & Transfert</h3>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 block">Ton code secret (Ne le perds pas)</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl flex items-center justify-center">
                <p className="font-mono font-black text-xl text-gray-800 dark:text-gray-100 tracking-[0.2em]">{profile.uid}</p>
              </div>
              <button onClick={handleCopyUID} className={`p-4 rounded-2xl transition-all shrink-0 ${copied ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                {copied ? <Check size={28} /> : <Copy size={28} />}
              </button>
            </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-700/50 w-full" />

          <div>
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 block">Charger un autre compte</label>
            <div className="flex gap-2">
              <input value={loadCode} onChange={e => setLoadCode(e.target.value.toUpperCase())} placeholder="Ex: 233-K2P" maxLength={7} className="flex-1 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 font-mono font-bold uppercase tracking-widest focus:border-emerald-500 outline-none transition-colors" />
              <button onClick={() => onLoadAccount(loadCode)} className="bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white px-6 rounded-2xl font-bold transition-all active:scale-95">OK</button>
            </div>
          </div>
        </div>
      </div>

      <button onClick={onRestartOnboarding} className="w-full flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 py-4 rounded-3xl font-bold transition-all active:scale-[0.98]">
        Changer de classe / groupe
      </button>

    </div>
  );
}

/* =========================================================================
   DASHBOARD ADMIN
   ========================================================================= */
function AdminDashboard({ role, users, events, onUpdateUser, onDeleteUser, onSaveSAE }) {
  const [tab, setTab] = useState('stats');
  const [logs, setLogs] = useState([]);
  const [saeForm, setSaeForm] = useState({ name: '', startDate: '', endDate: '', active: false, availableRooms: [] });

useEffect(() => {
    // 1. On pointe vers le bon chemin (le même que dans ta fonction logActivity)
    const logsCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'logs');

    const unsub = onSnapshot(logsCollectionRef, (snap) => {
      const entries = [];
      snap.forEach(d => { 
        (d.data().activityLogs || []).forEach(l => {
          // 2. Sécurisation du format de la date (gère les dates ISO et les anciens Timestamps Firestore)
          let dateObj = null;
          if (l.at) {
            dateObj = typeof l.at.toDate === 'function' ? l.at.toDate() : new Date(l.at);
          }
          entries.push({ uid: d.id, ...l, parsedDate: dateObj }); 
        }); 
      });
      
      // 3. Tri sécurisé
      entries.sort((a, b) => {
        const timeA = a.parsedDate ? a.parsedDate.getTime() : 0;
        const timeB = b.parsedDate ? b.parsedDate.getTime() : 0;
        return timeB - timeA;
      });
      setLogs(entries.slice(0, 50));
    });
    return () => unsub();
  }, []);

  const stats = useMemo(() => {
    const active7d = new Set(logs.filter(l => new Date(l.at).getTime() > Date.now() - 7 * 86400000).map(l => l.uid)).size;
    const checked = events.filter(e => e.checkedLocal).length;
    return { active7d, checked, totalEvents: events.length, totalUsers: users.length };
  }, [logs, events, users]);

  return (
    <div className="pb-24 md:pb-0 space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['stats', 'activite', 'comptes', 'sae'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-xl text-xs font-bold shrink-0 transition-colors ${tab === t ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{t.toUpperCase()}</button>
        ))}
      </div>

      <div>
        {tab === 'stats' && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { val: stats.active7d, label: 'Actifs (7j)', color: 'text-indigo-500' },
              { val: stats.checked, label: 'Devoirs cochés', color: 'text-emerald-500' },
              { val: stats.totalEvents, label: 'Éléments', color: 'text-purple-500' },
              { val: stats.totalUsers, label: 'Comptes', color: 'text-orange-500' }
            ].map((s, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                <p className={`text-4xl font-black ${s.color}`}>{s.val}</p>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-2 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        )}

{tab === 'activite' && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            {logs.length === 0 && <EmptyState icon={Users} text="Aucune activité." />}
            {logs.map((l, i) => {
              // On cherche l'utilisateur qui correspond à l'ID du log
              const user = users.find(u => u.uid === l.uid) || { pseudo: 'Compte supprimé', avatar: '👻' };

              return (
                <div key={i} className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-300 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                  <span className="font-mono text-xs font-bold text-gray-400 shrink-0">
                    {l.parsedDate instanceof Date && !isNaN(l.parsedDate) 
                      ? l.parsedDate.toLocaleString('fr-FR', {hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'}) 
                      : '--/-- --:--'}
                  </span> 
                  
                  {/* Badge de l'utilisateur */}
                  <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900/50 px-2 py-1 rounded-lg shrink-0 border border-gray-100 dark:border-gray-700">
                    <span className="text-sm">{user.avatar}</span>
                    <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200 truncate max-w-[80px]">{user.pseudo}</span>
                  </div>

                  <span className="truncate flex-1">{l.message}</span>
                </div>
              );
            })}
          </div>
        )}

        
        {tab === 'comptes' && (
          <div className="space-y-3">
            {(users || []).map(u => (
              <div key={u.uid} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <Avatar emoji={u.avatar} size="md" />
                  <div className="flex-1">
                    <p className="text-base font-bold text-gray-900 dark:text-gray-100">{u.pseudo || '(sans pseudo)'}</p>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{u.level} · {u.group} · {u.xp || 0} XP</p>
                  </div>
                  {role === 'superadmin' && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => { const xp = prompt('Nouveau XP', u.xp || 0); if (xp) onUpdateUser(u.uid, { xp: Number(xp) }); }} className="p-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-500 hover:text-indigo-500"><Edit2 size={18} /></button>
                      <button onClick={() => onDeleteUser(u.uid)} className="p-2.5 bg-red-50 dark:bg-red-900/30 rounded-xl text-red-500"><Trash2 size={18} /></button>
                    </div>
                  )}
                </div>
                
                {/* Nouvelles statistiques individuelles */}
                <div className="flex gap-2 mt-1 pt-3 border-t border-gray-50 dark:border-gray-700/50">
                  <span className="flex-1 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-xl text-[10px] font-bold text-gray-500 dark:text-gray-400 text-center">
                    <span className="block text-sm text-gray-800 dark:text-gray-200 mb-0.5">{u.totalMinutes || 0} min</span>
                    TEMPS TOTAL
                  </span>
                  <span className="flex-1 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-xl text-[10px] font-bold text-gray-500 dark:text-gray-400 text-center">
                    <span className="block text-sm text-gray-800 dark:text-gray-200 mb-0.5">{u.sessionCount || 0}</span>
                    SESSIONS
                  </span>
                  <span className="flex-1 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-xl text-[10px] font-bold text-gray-500 dark:text-gray-400 text-center truncate">
                    <span className="block text-xs text-gray-800 dark:text-gray-200 mb-0.5 mt-0.5">
                      {u.lastSeen ? (u.lastSeen.toDate ? u.lastSeen.toDate().toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit' }) : 'Récent') : 'Jamais'}
                    </span>
                    DERNIÈRE VUE
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'sae' && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-5">
            <input value={saeForm.name} onChange={e => setSaeForm(f => ({ ...f, name: e.target.value }))} placeholder="Nom de la SAÉ" className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-bold focus:border-indigo-500 outline-none" />
            <div className="flex gap-3">
              <input type="date" value={saeForm.startDate} onChange={e => setSaeForm(f => ({ ...f, startDate: e.target.value }))} className="flex-1 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-bold" />
              <input type="date" value={saeForm.endDate} onChange={e => setSaeForm(f => ({ ...f, endDate: e.target.value }))} className="flex-1 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-bold" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Salles dispo</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_ROOMS.map(r => (
                  <button key={r} onClick={() => setSaeForm(f => ({ ...f, availableRooms: f.availableRooms.includes(r) ? f.availableRooms.filter(x => x !== r) : [...f.availableRooms, r] }))} className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${saeForm.availableRooms.includes(r) ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300'}`}>{r}</button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-3 text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <input type="checkbox" checked={saeForm.active} onChange={e => setSaeForm(f => ({ ...f, active: e.target.checked }))} className="w-5 h-5 rounded text-indigo-600" /> Activer cette SAÉ pour tous les étudiants
            </label>
            <button onClick={() => onSaveSAE(saeForm)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20 mt-2">Enregistrer la configuration</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   APP PRINCIPALE & LAYOUT PC / MOBILE
   ========================================================================= */
export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  // Mémorise si l'étudiant veut le widget de cours ou non (Activé par défaut)
  const [liveWidgetEnabled, setLiveWidgetEnabled] = useState(() => {
    return localStorage.getItem('classhub_live_widget') !== 'false';
  });

  const handleToggleLiveWidget = () => {
    setLiveWidgetEnabled(prev => {
      const newVal = !prev;
      localStorage.setItem('classhub_live_widget', newVal);
      return newVal;
    });
  };

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    haptics.tap();
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  };

  const [profile, setProfile] = useState(() => {
    const uid = localStorage.getItem('classhub_local_uid');
    const local = getLocalProfile();
    const pseudo = localStorage.getItem('classhub_pseudo');
    return {
      uid: uid || null,
      pseudo: pseudo || '',
      avatar: localStorage.getItem('classhub_avatar') || AVATARS[0],
      xp: parseInt(localStorage.getItem('classhub_xp') || '0', 10),
      isGuest: !pseudo,
      ...local
    };
  });

  const [needsOnboarding, setNeedsOnboarding] = useState(!getLocalProfile().level);

  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [saeConfig, setSaeConfig] = useState(null);

  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [tab, setTab] = useState(() => localStorage.getItem('classhub_default_tab') || 'agenda');
  const [showWizard, setShowWizard] = useState(false);

  const checkedLocalRef = useRef(JSON.parse(localStorage.getItem('classhub_checked') || '{}'));

  // EDT State
  const [icsEvents, setIcsEvents] = useState([]);
  const [icsLoading, setIcsLoading] = useState(false);
  const [icsError, setIcsError] = useState(null);

  const loadEDT = useCallback(async () => {
    if (!profile?.level) return;
    setIcsLoading(true); setIcsError(null);
    try {
      const levelSlug = EDT_LEVEL_TO_SLUG[profile.level];
      const rawEvts = await fetchICSWithFallback(levelSlug);
      const evts = rawEvts.filter(e => codeMatchesLevel(e.code, profile.level));
      setIcsEvents(evts.sort((a, b) => a.start - b.start));
    } catch (e) {
      setIcsError("Impossible de charger l'emploi du temps.");
    } finally {
      setIcsLoading(false);
    }
  }, [profile?.level]);

  useEffect(() => { loadEDT(); }, [loadEDT]);

  const subjectsMap = useMemo(() => buildSubjectsFromEDT(icsEvents), [icsEvents]);

  // Se déclenche instantanément quand le mode debug widget est activé/désactivé
  // (5 taps dans Paramètres), au lieu d'attendre jusqu'à 60s le prochain tick du
  // timer. Sans ça, le test semblait "ne rien faire" pendant une bonne minute.
  const [debugTick, setDebugTick] = useState(0);
  useEffect(() => {
    const bump = () => setDebugTick(t => t + 1);
    window.addEventListener('classhub-debug-toggle', bump);
    return () => window.removeEventListener('classhub-debug-toggle', bump);
  }, []);

  // ⏱️ Horloge interne et détection du cours en direct
  const [currentTime, setCurrentTime] = useState(new Date());

useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    const handleAudioTime = () => {
      const now = new Date();
      setCurrentTime(prev => {
        if (now.getMinutes() !== prev.getMinutes()) return now;
        return prev;
      });
    };
    if (silentAudio) silentAudio.addEventListener('timeupdate', handleAudioTime);
    return () => {
      clearInterval(timer);
      if (silentAudio) silentAudio.removeEventListener('timeupdate', handleAudioTime);
    };
  }, []);


  const activeClass = useMemo(() => {
    if (!icsEvents || icsEvents.length === 0 || !profile) return null;

    const userEvents = icsEvents.filter(e => {
      if (e.groups.length === 0 || e.groups.includes('PROMO')) return true;
      if (e.groups.includes(profile.group)) return true;
      if (profile.td && e.groups.includes(profile.td)) return true;
      return false;
    });

    const nextEvt = userEvents.find(e => {
      const endTime = e.end || new Date(e.start.getTime() + 90 * 60000);
      return endTime > currentTime;
    });

    if (!nextEvt) return null;
    const diffMins = (nextEvt.start - currentTime) / 60000;
    if (diffMins <= 15) return nextEvt;

    return null;
  }, [icsEvents, profile, currentTime]);

  // Synchronise le lecteur MediaSession et sa barre de progression avec le vrai cours en cours/imminent
  useEffect(() => {
    // =========================================================================
    // 🛠️ MODE DEBUG WIDGET
    // Contrôlé par un flag localStorage (jamais codé en dur !) : on l'active
    // depuis Paramètres > "Widget Écran de Verrouillage" via 5 taps rapides sur
    // le titre "Widget Écran de Verrouillage" (voir SettingsPanel).
    // Quand actif, on simule un faux cours en cours pour tester le widget
    // sans attendre un vrai créneau. Il n'écrase JAMAIS activeClass en silence :
    // il ne s'active que si tu l'as explicitement demandé.
    const debugWidgetOn = typeof window !== 'undefined' && localStorage.getItem('classhub_debug_widget') === 'true';

    const debugClass = debugWidgetOn ? {
      code: 'R3.04',
      sessionType: 'CM',
      teacher: 'Q. Burlot',
      room: '101',
      start: new Date(Date.now() - 15 * 60000), // a commencé il y a 15 min
      end: new Date(Date.now() + 45 * 60000),   // finit dans 45 min
      color: { hex: '#ec4899', hexLight: '#fdf2f8', hexDark: '#831843' } // Rose, pour le repérer facilement
    } : null;

    const currentClass = debugClass || activeClass;
    // =========================================================================

    if (currentClass && liveWidgetEnabled) {
      const now = new Date();
      const isOngoing = now >= currentClass.start;
      const endTime = currentClass.end || new Date(currentClass.start.getTime() + 90 * 60000);

      let phaseStart, phaseEnd, subtitle;
      if (isOngoing) {
        phaseStart = currentClass.start;
        phaseEnd = endTime;
        subtitle = `En cours · ${currentClass.teacher || 'MMI'}`;
      } else {
        phaseStart = new Date(currentClass.start.getTime() - 15 * 60000);
        phaseEnd = currentClass.start;
        subtitle = `Débute bientôt · ${currentClass.teacher || 'MMI'}`;
      }

      const title = `${currentClass.code} · ${currentClass.room || 'Salle ?'}`;
      const startStr = currentClass.start.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
      const endStr = endTime.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});

      const dynamicArtwork = generateDynamicArtwork(
        currentClass.code,
        currentClass.room || 'À DÉFINIR',
        `${startStr} ➔ ${endStr}`,
        currentClass.color,
        theme
      );

      pwaFeatures.updateLiveActivity(title, subtitle, dynamicArtwork, phaseStart, phaseEnd);
    } else {
      pwaFeatures.updateLiveActivity(null);
    }
  }, [activeClass, currentTime, theme, liveWidgetEnabled, debugTick]);

  useEffect(() => {
    if (!eventsLoaded) return;
    const pendingCount = events.filter(e => !e.checkedLocal).length;
    pwaFeatures.setBadge(pendingCount);
  }, [events, eventsLoaded]);

  // Auth & Profile loading
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).then(() => {
      if (!auth.currentUser) {
        signInAnonymously(auth).catch(console.error);
      }
      const unsub = onAuthStateChanged(auth, async (u) => {
        if (!u) return;

        const uid = localStorage.getItem('classhub_local_uid');
        const localProfile = getLocalProfile();
        const oldPseudo = localStorage.getItem('classhub_pseudo');
        const oldAvatar = localStorage.getItem('classhub_avatar') || AVATARS[0];
        const oldXp = parseInt(localStorage.getItem('classhub_xp') || '0', 10);

        if (uid) {
          const snap = await getDoc(paths.user(uid));
          if (snap.exists()) {
            const data = snap.data();
            if (!data.td && data.group) {
               data.td = getTdForGroup(data.level, data.group);
               await updateDoc(paths.user(uid), { td: data.td });
            }
            if (!data.level && localProfile.level) {
              await updateDoc(paths.user(uid), { level: localProfile.level, group: localProfile.group, td: localProfile.td });
              setProfile({ uid, ...data, level: localProfile.level, group: localProfile.group, td: localProfile.td, isGuest: false });
            } else {
              setProfile({ uid, ...data, isGuest: false });
            }
            setNeedsOnboarding(!data.level);
          } else {
            if (localProfile.level) {
              if (oldPseudo) {
                await setDoc(paths.user(uid), { pseudo: oldPseudo, avatar: oldAvatar, xp: oldXp, level: localProfile.level, group: localProfile.group, td: localProfile.td, fcmTokens: [], lastSync: serverTimestamp() });
                setProfile({ uid, pseudo: oldPseudo, avatar: oldAvatar, xp: oldXp, level: localProfile.level, group: localProfile.group, td: localProfile.td, isGuest: false });
              } else {
                setProfile({ uid: null, level: localProfile.level, group: localProfile.group, td: localProfile.td, isGuest: true, xp: 0 });
              }
              setNeedsOnboarding(false);
            } else {
              setNeedsOnboarding(true);
            }
          }
        } else {
          if (localProfile.level) {
             setProfile({ uid: null, level: localProfile.level, group: localProfile.group, td: localProfile.td, isGuest: true, xp: 0 });
             setNeedsOnboarding(false);
          } else {
             setNeedsOnboarding(true);
          }
        }
      });
      return () => unsub();
    });
  }, []);

  // Realtime Listeners
  useEffect(() => {
    if (!profile?.level) return;
    const unsubEvents = onSnapshot(query(paths.events(), where('level', '==', profile.level)), (snap) => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data(), checkedLocal: !!checkedLocalRef.current[d.id] }));
      setEvents(list);
      setEventsLoaded(true);
    });
    const unsubUsers = onSnapshot(paths.users(), (snap) => {
      const list = [];
      snap.forEach(d => list.push({ uid: d.id, ...d.data() }));
      setUsers(list);
    });
    const unsubSae = onSnapshot(paths.config('sae'), (snap) => {
      if (snap.exists()) setSaeConfig(snap.data());
    });
    return () => { unsubEvents(); unsubUsers(); unsubSae(); };
  }, [profile?.level]);

  // 1. TRACKING DES SESSIONS (Durée & Ouvertures)
  useEffect(() => {
    if (profile?.isGuest || !profile?.uid) return;

    let sessionStart = Date.now();
    let isTracking = true;

    // On log l'ouverture initiale
    logActivity(profile.uid, "👋 Ouvre l'application");
    updateDoc(paths.user(profile.uid), { lastSeen: serverTimestamp() }).catch(() => {});

    const handleVisibilityChange = () => {
      if (!isTracking) return;

      if (document.visibilityState === 'hidden') {
        // L'utilisateur quitte ou réduit l'app : on calcule la durée
        const durationMins = Math.round((Date.now() - sessionStart) / 60000);
        if (durationMins > 0) {
          logActivity(profile.uid, `⏱️ Session terminée (${durationMins} min)`);
          // On met à jour les stats globales de l'utilisateur
          updateDoc(paths.user(profile.uid), {
            totalMinutes: increment(durationMins),
            sessionCount: increment(1),
            lastSeen: serverTimestamp()
          }).catch(() => {});
        }
      } else if (document.visibilityState === 'visible') {
        // L'utilisateur revient sur l'app
        sessionStart = Date.now();
        logActivity(profile.uid, "🔙 Revient sur l'application");
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      isTracking = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [profile?.uid]);

  // 2. TRACKING DE LA NAVIGATION (Onglets)
  const lastTabRef = useRef(tab);
  useEffect(() => {
    if (profile?.isGuest || !profile?.uid || !eventsLoaded) return;
    
    // Évite de spammer si l'onglet n'a pas vraiment changé
    if (lastTabRef.current === tab) return;
    lastTabRef.current = tab;

    const tabNames = { 
      agenda: 'Agenda', edt: 'Emploi du temps', 
      sondages: 'Classement XP', settings: 'Profil', admin: 'Admin' 
    };
    
    logActivity(profile.uid, `👀 Consulte : ${tabNames[tab] || tab}`);
  }, [tab, profile?.uid, eventsLoaded]);

  // Wake Lock Logic
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const wakeLockRef = useRef(null);
  const handleToggleWakeLock = async () => {
    if (!('wakeLock' in navigator)) {
      alert("Le mode écran actif n'est pas supporté par ce navigateur.");
      return;
    }
    try {
      if (!wakeLockActive) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        setWakeLockActive(true);
        wakeLockRef.current.addEventListener('release', () => setWakeLockActive(false));
      } else {
        await wakeLockRef.current?.release();
        wakeLockRef.current = null;
        setWakeLockActive(false);
      }
    } catch (_) {
      setWakeLockActive(false);
    }
  };

  function completeOnboarding(level, group) {
    const td = getTdForGroup(level, group);
    saveLocalProfile(level, group, td);
    setProfile(prev => ({ ...prev, level, group, td }));
    if (profile?.uid && !profile?.isGuest) {
      updateDoc(paths.user(profile.uid), { level, group, td }).catch(console.error);
    }
    setNeedsOnboarding(false);
  }

  async function handleCreateAccount(pseudo, avatar) {
    const newUid = generateNewUID();
    localStorage.setItem('classhub_local_uid', newUid);
    localStorage.setItem('classhub_pseudo', pseudo);
    localStorage.setItem('classhub_avatar', avatar);

    const newProfile = {
      pseudo, avatar, xp: 0,
      level: profile.level, group: profile.group, td: profile.td,
      fcmTokens: [], lastSync: serverTimestamp()
    };

    await setDoc(paths.user(newUid), newProfile);
    setProfile({ uid: newUid, ...newProfile, isGuest: false });
  }

  async function handleLoadAccountByCode(rawCode) {
    const code = (rawCode || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(code)) { alert('Format de code invalide. Exemple : 233-K2P'); return; }
    try {
      const snap = await getDoc(paths.user(code));
      if (!snap.exists()) { alert("Aucun compte trouvé avec ce code."); return; }
      const data = snap.data();
      localStorage.setItem('classhub_local_uid', code);
      if (data.level) saveLocalProfile(data.level, data.group || '', data.td || '');
      checkedLocalRef.current = JSON.parse(localStorage.getItem('classhub_checked') || '{}');
      setProfile({ uid: code, pseudo: '', avatar: AVATARS[0], xp: 0, ...data, isGuest: false });
      setNeedsOnboarding(!data.level);
    } catch (e) { alert("Erreur au chargement."); }
  }

  function handleUpdateProfile(patch) {
    if (profile.isGuest) return;
    if (patch.pseudo) localStorage.setItem('classhub_pseudo', patch.pseudo);
    if (patch.avatar) localStorage.setItem('classhub_avatar', patch.avatar);
    setProfile(p => ({ ...p, ...patch }));
    updateDoc(paths.user(profile.uid), patch).catch(console.error);
  }

  function handlePublishEvent(payload) {
    if (profile.isGuest) return;
    haptics.success();
    setDoc(doc(paths.events()), payload);
    setProfile(p => {
      const newXp = (p.xp || 0) + 20;
      localStorage.setItem('classhub_xp', newXp);
      return { ...p, xp: newXp };
    });
    addXP(profile, 20);
    logActivity(profile.uid, `${profile.pseudo || 'Étudiant'} a ajouté "${payload.title}"`);
  }

  function handleCheck(event, e = null) {
    if (!event.checkedLocal) {
      haptics.success();
      if (e) triggerConfetti(e);
    } else {
      haptics.tap();
    }
    const map = { ...checkedLocalRef.current, [event.id]: !event.checkedLocal };
    checkedLocalRef.current = map;
    localStorage.setItem('classhub_checked', JSON.stringify(map));
    setEvents(evts => evts.map(ev => ev.id === event.id ? { ...ev, checkedLocal: !ev.checkedLocal } : ev));
  }

  function handleVoteReliability(event, delta) {
    if (profile.isGuest) return;
    haptics.tap();
    const votes = event.votes || {};
    const currentVote = votes[profile.uid];
    const newVotes = { ...votes };

    let xpDelta = 0;
    if (currentVote === delta) {
      delete newVotes[profile.uid];
      xpDelta = -5;
    } else {
      if (!currentVote) xpDelta = 5;
      newVotes[profile.uid] = delta;
    }

    const newReliability = Object.values(newVotes).reduce((acc, val) => acc + val, 0);
    updateDoc(paths.event(event.id), { votes: newVotes, reliability: newReliability }).catch(console.error);

    if (xpDelta !== 0) {
      setProfile(p => {
        const newXp = (p.xp || 0) + xpDelta;
        localStorage.setItem('classhub_xp', newXp);
        return { ...p, xp: newXp };
      });
      addXP(profile, xpDelta);
    }
  }

  function handleDelete(event) {
    if (profile.isGuest) return;
    if (confirm('Supprimer définitivement ?')) deleteDoc(paths.event(event.id));
  }

  function handleUpdateUser(uid, patch) { updateDoc(paths.user(uid), patch); }
  function handleDeleteUser(uid) { if (confirm('Supprimer ?')) deleteDoc(paths.user(uid)); }
  function handleSaveSAE(form) { setDoc(paths.config('sae'), form, { merge: true }); }

  if (!profile) return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"><RefreshCw className="animate-spin text-indigo-500" /></div>;
  if (needsOnboarding) return <Onboarding onComplete={completeOnboarding} />;

  const TABS = [
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'edt', label: 'EDT', icon: Clock },
    { id: 'sondages', label: 'XP', icon: Trophy },
    { id: 'settings', label: 'Profil', icon: User }
  ];

  if (profile?.role === 'superadmin' || profile?.role === 'delegue') {
    TABS.push({ id: 'admin', label: 'Admin', icon: Shield });
  }

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200 flex flex-col md:flex-row">

        {/* HEADER MOBILE */}
        <header className="md:hidden sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setTab('settings')}>
            <Avatar emoji={profile.avatar} size="sm" />
            <div>
              <p className="text-sm font-black text-gray-900 dark:text-gray-100">{profile.isGuest ? 'Spectateur 👀' : profile.pseudo}</p>
              <p className="text-[10px] font-bold text-gray-500">{profile.level} · {profile.group}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleWakeLock}
              className={`p-2 rounded-xl transition-colors ${wakeLockActive ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' : 'text-gray-400 hover:text-amber-500'}`}
            >
              <Smartphone size={18} className={wakeLockActive ? 'animate-pulse' : ''} />
            </button>
            <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-indigo-500 transition-colors">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <XPBadgeChip xp={profile.xp} isGuest={profile.isGuest} />
          </div>
        </header>

        {/* SIDEBAR DESKTOP */}
        <aside className="hidden md:flex flex-col w-72 h-screen border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 shrink-0">
          <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex flex-col items-center cursor-pointer" onClick={() => setTab('settings')}>
            <Avatar emoji={profile.avatar} size="lg" />
            <h2 className="mt-4 font-black text-2xl text-center">{profile.isGuest ? 'Spectateur 👀' : profile.pseudo}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mb-4">{profile.level} · {profile.group}</p>
            <XPBadgeChip xp={profile.xp} isGuest={profile.isGuest} />
          </div>
          <nav className="flex-1 p-4 space-y-2 mt-2">
            {TABS.map(t => (
              <button
                key={t.id} onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold transition-all ${tab === t.id ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                <t.icon size={22} className={tab === t.id ? "stroke-[2.5px]" : ""} /> {t.label}
              </button>
            ))}
          </nav>
          <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <button onClick={handleToggleWakeLock} className={`flex items-center gap-2 text-sm font-bold transition-colors ${wakeLockActive ? 'text-amber-500' : 'text-gray-500 hover:text-amber-500'}`}>
              <Smartphone size={18} className={wakeLockActive ? 'animate-pulse' : ''} /> {wakeLockActive ? 'Écran actif' : 'Écran normal'}
            </button>
            <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-indigo-500 transition-colors">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8 relative">

          {/* BANDEAU COURS EN DIRECT */}
          {activeClass && (
            <div className={`mb-6 p-4 rounded-3xl text-white shadow-lg flex items-center justify-between animate-in slide-in-from-top-4 fade-in duration-500 ${activeClass.color.bg} ${activeClass.color.darkBg}`}>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-90">
                    {currentTime >= activeClass.start ? 'En cours' : `Dans ${Math.max(0, Math.round((activeClass.start - currentTime)/60000))} min`}
                  </p>
                  <p className="font-bold text-sm md:text-base leading-tight mt-0.5">{activeClass.code} {activeClass.sessionType ? `· ${activeClass.sessionType}` : ''}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold flex items-center justify-end gap-1.5"><MapPin size={14} className="opacity-80"/> {activeClass.room || 'À définir'}</p>
                <p className="text-[11px] font-medium opacity-90 flex items-center justify-end gap-1.5 mt-0.5"><User size={12} className="opacity-80"/> {activeClass.teacher || 'Équipe Pédago.'}</p>
              </div>
            </div>
          )}

          {tab === 'agenda' && (
            eventsLoaded ? (
              <AgendaTab events={events} profile={profile} subjectsMap={subjectsMap} saeConfig={saeConfig} onCheck={handleCheck} onVoteReliability={handleVoteReliability} onDelete={handleDelete} />
            ) : <div className="flex justify-center mt-10"><RefreshCw className="animate-spin text-indigo-500" /></div>
          )}
          {tab === 'edt' && (
            <EDTTab profile={profile} icsEvents={icsEvents} events={events} loading={icsLoading} error={icsError} onReload={loadEDT} />
          )}
          {tab === 'sondages' && (
            <LeaderboardTab users={users} profile={profile} />
          )}
          {tab === 'settings' && (
            <SettingsPanel
              profile={profile}
              onCreateAccount={handleCreateAccount}
              onUpdateProfile={handleUpdateProfile}
              onRestartOnboarding={() => setNeedsOnboarding(true)}
              onLoadAccount={handleLoadAccountByCode}
              wakeLockActive={wakeLockActive}
              toggleWakeLock={handleToggleWakeLock}
              liveWidgetEnabled={liveWidgetEnabled}
              toggleLiveWidget={handleToggleLiveWidget}
            />
          )}
          {tab === 'admin' && (
            <AdminDashboard role={profile.role} users={users} events={events} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} onSaveSAE={handleSaveSAE} />
          )}
        </main>

        {/* FAB CREATION BOUTON */}
        {tab === 'agenda' && (
          <button
            onClick={() => {
              if (profile.isGuest) {
                alert("Tu dois créer ton compte dans l'onglet Profil pour pouvoir publier un devoir !");
                setTab('settings');
              } else {
                setShowWizard(true);
              }
            }}
            className="fixed bottom-20 right-5 md:bottom-10 md:right-10 w-14 h-14 md:w-16 md:h-16 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/30 flex items-center justify-center active:scale-90 transition-all z-40"
          >
            <Plus size={28} />
          </button>
        )}

        {/* BOTTOM NAV MOBILE */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 flex justify-around py-2 z-30 pb-safe">
          {TABS.map(t => (
            <button
              key={t.id} onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${tab === t.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`}
            >
              <t.icon size={22} className={tab === t.id ? 'stroke-[2.5px]' : ''} />
              <span className="text-[10px] font-bold">{t.label}</span>
            </button>
          ))}
        </nav>

        {/* MODAL CREATION */}
        {showWizard && <CreateWizard profile={profile} subjectsMap={subjectsMap} icsEvents={icsEvents} onClose={() => setShowWizard(false)} onPublish={handlePublishEvent} />}
      </div>
    </div>
  );
}