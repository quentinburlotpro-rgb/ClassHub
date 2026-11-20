import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Plus, BookOpen, AlertCircle, CheckCircle, Circle,
  Users, Settings, Trash2, User, BarChart, Activity, Map, Coffee, PenTool, ShieldCheck, GraduationCap,
  X, ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown, Zap,
  Languages, MousePointer, Globe, Megaphone, MessageSquare, 
  Feather, Palette, Image as ImageIcon, Video, LayoutTemplate, Layers, Code, 
  Database, Server, Binary, Layout, Scale, Compass, HelpCircle, Check, History, Ghost, Crown, Shield, Sparkles, Award, Folder,
  Bell, BellRing, BellOff, RefreshCcw, Key, Edit, Pin, Eye, EyeOff, LogOut, Lock, Link2, Search, ExternalLink, Trophy, Download,
  CalendarDays, MapPin, Clock, Filter, Sun
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, getDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getMessaging, getToken } from "firebase/messaging";
import { log } from 'firebase/firestore/pipelines';

// =======================================================================
// ⚙️ CONFIGURATION FIREBASE & VERSIONNING
// =======================================================================
const APP_VERSION_CODE = 80; 
const APP_VERSION_STRING = "3.1"; 

const userFirebaseConfig = {
  apiKey: "AIzaSyAJlaDcyO7fyrI28v2m1RC6yQ019-qk-78",
  authDomain: "classhub-fa9bf.firebaseapp.com",
  projectId: "classhub-fa9bf",
  storageBucket: "classhub-fa9bf.firebasestorage.app",
  messagingSenderId: "930925993041",
  appId: "1:930925993041:web:0439945a23ced4e752ec70"
};

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : userFirebaseConfig;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'classhub-mmi';

let messaging = null;
if (typeof window !== "undefined" && 'serviceWorker' in navigator && 'Notification' in window) {
  try { messaging = getMessaging(app); } catch (e) { console.warn("Messaging non supporté", e); }
}

const getEventsPath = () => `artifacts/${appId}/public/data/events`;

const getUsersPath = () => `artifacts/${appId}/public/data/users`;

const getConfigPath = () => `artifacts/${appId}/public/data/config`;

const getLogsPath = () => `artifacts/${appId}/public/data/logs`;

// --- CONFIGURATION APP ---
const STORAGE_KEY = "classhub_v1_local"; 
const DELEGUE_CODE = "IUT2026"; 
const SUPERADMIN_CODE = "ADMIN87K"; 
const HIDE_THRESHOLD = -5;

const GROUPS_CONFIG = {
  'G1': { label: 'Groupe 1', parent: 'TD1', color: 'from-emerald-400 to-teal-500 shadow-emerald-200' },
  'G2': { label: 'Groupe 2', parent: 'TD1', color: 'from-blue-400 to-indigo-500 shadow-blue-200' },
  'G3': { label: 'Groupe 3', parent: 'TD2', color: 'from-purple-400 to-fuchsia-500 shadow-purple-200' },
  'G4': { label: 'Groupe 4', parent: 'TD2', color: 'from-orange-400 to-pink-500 shadow-orange-200' },
};

const COMMON_ROOMS = ['R01', 'R02', 'R03', 'R04', 'R05', 'R06', '101', '102', '103', '115', 'Montage'];

const ONBOARDING_COLORS = {
  1: { text: 'text-emerald-500', from: 'from-emerald-400', to: 'to-teal-500', blob: 'bg-emerald-400' },
  2: { text: 'text-blue-500', from: 'from-blue-400', to: 'to-indigo-500', blob: 'bg-blue-500' },
  3: { text: 'text-purple-500', from: 'from-purple-400', to: 'to-fuchsia-500', blob: 'bg-purple-500' },
  4: { text: 'text-orange-500', from: 'from-orange-400', to: 'to-pink-500', blob: 'bg-orange-500' }
};

const BADGES = [
  { min: 0, name: 'Touriste', icon: Map, color: 'text-slate-400 bg-slate-100' },
  { min: 20, name: 'Figurant', icon: Coffee, color: 'text-slate-400 bg-slate-100' },
  { min: 100, name: 'Preneur de notes', icon: PenTool, color: 'text-blue-500 bg-blue-50 border-blue-100' },
  { min: 200, name: 'Premier Rang', icon: ShieldCheck, color: 'text-emerald-500 bg-emerald-50 border-emerald-100' },
  { min: 600, name: 'Major de Promo', icon: GraduationCap, color: 'text-purple-500 bg-purple-50 border-purple-100' },
  { min: 1000, name: 'Dieu du CROUS', icon: Crown, color: 'text-amber-500 bg-amber-50 border-amber-100' },
];

const AVATARS = ['👤', '👽', '🐶', '🐵', '🐱', '🦊', '🐼', '🦁', '🐯', '🐸', '🦄', '👻', '🤖', '💩', '😎', '🤠', '🤡', '👾', '🦖'];

const MMI_SUBJECTS = [
  { code: 'AUTRE', name: 'Autre / Général', prof: '', icon: HelpCircle, color: 'text-slate-500' },
  { code: 'PORTFOLIO', name: 'Démarche portfolio', prof: 'Valérie LAVEFVE', icon: Folder, color: 'text-emerald-600' },
  { code: 'R201', name: 'Anglais', prof: 'Natacha ADAMCZYK', icon: Languages, color: 'text-blue-500' },
  { code: 'R202', name: 'Anglais renforcé', prof: 'Natacha ADAMCZYK', icon: Languages, color: 'text-blue-600' },
  { code: 'R203', name: 'Ergonomie et accessibilité', prof: 'Audrey MOUTAT', icon: MousePointer, color: 'text-amber-500' },
  { code: 'R204', name: 'Culture numérique', prof: 'Anaïs PINAUD', icon: Globe, color: 'text-indigo-500' },
  { code: 'R205', name: 'Stratégie de communication et marketing', prof: 'Audrey MOUTAT', icon: Megaphone, color: 'text-rose-500' },
  { code: 'R206', name: 'Expression communication et rhétorique', prof: 'Valérie LAVEFVE', icon: MessageSquare, color: 'text-pink-500' },
  { code: 'R207', name: 'Ecriture multimédia et narration', prof: 'Guillaume DEMAISON', icon: Feather, color: 'text-purple-500' },
  { code: 'R208', name: 'Production graphique', prof: 'Simon KABAB / Fabrice ADAM', icon: Palette, color: 'text-fuchsia-500' },
  { code: 'R209', name: 'Culture artistique', prof: 'Adrien AYMARD / Denis SPRINGINSFELD', icon: ImageIcon, color: 'text-violet-500' },
  { code: 'R210', name: 'Production audio et vidéo', prof: 'Guillaume DEMAISON', icon: Video, color: 'text-red-500' },
  { code: 'R211', name: 'Gestion de contenus', prof: 'Florian JOURDE', icon: LayoutTemplate, color: 'text-orange-500' },
  { code: 'R212', name: 'Intégration', prof: 'Denis SPRINGINSFELD', icon: Layers, color: 'text-cyan-500' },
  { code: 'R213', name: 'Développement WEB', prof: 'Frédéric MORA', icon: Code, color: 'text-sky-500' },
  { code: 'R214', name: "Système d'information", prof: 'Stéphane PAILLIER', icon: Database, color: 'text-slate-500' },
  { code: 'R215', name: 'Hébergement', prof: 'Réda GUEDIRA', icon: Server, color: 'text-emerald-500' },
  { code: 'R216', name: "Représentation et traitement de l'information", prof: 'Réda GUEDIRA / Philippe FEYDI', icon: Binary, color: 'text-teal-500' },
  { code: 'R217', name: 'Gestion de projet', prof: 'Pierre TURBELIN', icon: Layout, color: 'text-lime-600' },
  { code: 'R218', name: 'Economie et droit du numérique', prof: 'Bérénice GOUDARD', icon: Scale, color: 'text-red-400' },
  { code: 'R219', name: 'PPP', prof: 'Valérie LAVEFVE', icon: Compass, color: 'text-yellow-500' },
  { code: 'SAE201', name: 'Explorer les usages du numérique', prof: 'Audrey MOUTAT', icon: Compass, color: 'text-blue-400' },
  { code: 'SAE202', name: 'Concevoir un produit ou un service et sa communication', prof: 'Denis SPRINGINSFELD', icon: Layers, color: 'text-fuchsia-400' },
  { code: 'SAE203', name: 'Concevoir un site web avec une source de données', prof: 'Réda GUEDIRA', icon: Database, color: 'text-teal-400' },
  { code: 'SAE204', name: 'Construire sa présence en ligne', prof: 'Valérie LAVEFVE', icon: Globe, color: 'text-indigo-400' },
];

const EVENT_TYPES = {
  'DEVOIR': { label: 'Devoir', desc: 'Travail à faire', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: BookOpen },
  'EVAL': { label: 'Évaluation', desc: 'DS, Partiel, QCM', color: 'bg-rose-50 text-rose-600 border-rose-100', icon: AlertCircle },
  'RENDU': { label: 'A Rendre', desc: 'Livrable, SAÉ', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: CheckCircle },
  'INFO': { label: 'Info', desc: 'Salle, Absence...', color: 'bg-slate-50 text-slate-600 border-slate-100', icon: Users },
};

// Map de couleurs Tailwind pour les composants de l'emploi du temps
const subjectColorMap = {
    'text-slate-500': 'bg-slate-500',
    'text-emerald-600': 'bg-emerald-600',
    'text-blue-500': 'bg-blue-500',
    'text-blue-600': 'bg-blue-600',
    'text-amber-500': 'bg-amber-500',
    'text-indigo-500': 'bg-indigo-500',
    'text-rose-500': 'bg-rose-500',
    'text-pink-500': 'bg-pink-500',
    'text-purple-500': 'bg-purple-500',
    'text-fuchsia-500': 'bg-fuchsia-500',
    'text-violet-500': 'bg-violet-500',
    'text-red-500': 'bg-red-500',
    'text-orange-500': 'bg-orange-500',
    'text-cyan-500': 'bg-cyan-500',
    'text-sky-500': 'bg-sky-500',
    'text-teal-500': 'bg-teal-500',
    'text-lime-600': 'bg-lime-600',
    'text-red-400': 'bg-red-400',
    'text-blue-400': 'bg-blue-400',
    'text-fuchsia-400': 'bg-fuchsia-400',
    'text-teal-400': 'bg-teal-400',
    'text-indigo-400': 'bg-indigo-400',
};

// --- UTILS SÉCURISÉS ---
const getBadge = (xp) => BADGES.slice().reverse().find(b => xp >= b.min) || BADGES[0];
const getSubject = (code) => MMI_SUBJECTS.find(s => s.code === code) || MMI_SUBJECTS.find(s => s.code === 'AUTRE');
const getSubjectFromTitle = (title) => {
    const fullText = title.toUpperCase().replace(/[ÉÈÊË]/g, 'E');
    const normalizedText = fullText.replace(/[\s.\-]/g, '');
    const subject = MMI_SUBJECTS.find(s => {
        const normalizedCode = s.code.replace(/[\s.\-]/g, '');
        const normalizedName = s.name.toUpperCase().replace(/[ÉÈÊË]/g, 'E');
        return normalizedText.includes(normalizedCode) || fullText.includes(normalizedName);
    });
    return subject || MMI_SUBJECTS.find(s => s.code === 'AUTRE');
};

const getSubjectColorClasses = (colorClass) => {
    if(!colorClass || !colorClass.includes('-')) return { bg: 'bg-slate-100', text: 'text-slate-600' };
    const parts = colorClass.split('-');
    const color = parts[1]; 
    return { bg: `bg-${color}-100`, text: `text-${color}-600` };
};

const getReliabilityScore = (item) => item.votes ? Object.values(item.votes).reduce((a, b) => a + b, 0) : 0;

const formatDateString = (dateObj) => {
  if (!dateObj) return '';
  try {
    const d = new Date(dateObj);
    if (isNaN(d.getTime())) return '';
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  } catch(e) { return ''; }
};

const getRelativeDate = (d) => {
  if (!d) return "Date Inconnue";
  try {
    const diff = Math.ceil((new Date(d).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / (86400000));
    if (isNaN(diff)) return "Date Inconnue";
    return diff === 0 ? "Aujourd'hui" : diff === 1 ? "Demain" : diff < 0 ? "Passé" : `Dans ${diff} jours`;
  } catch(e) { return "Date Inconnue"; }
};

const formatShortDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  } catch(e) { return ''; }
};

const generateRecoveryCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
  let code = '';
  for(let i=0; i<6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code.slice(0,3) + '-' + code.slice(3);
};

// --- FONCTIONS EMPLOI DU TEMPS ---
function getMonday(d) {
    d = new Date(d);
    var day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function formatTime(dateObj) {
    return dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
}

function parseICSDate(dateStr) {
    const year = parseInt(dateStr.substr(0, 4), 10);
    const month = parseInt(dateStr.substr(4, 2), 10) - 1;
    const day = parseInt(dateStr.substr(6, 2), 10);
    if (dateStr.length <= 8) return new Date(year, month, day); 
    const hour = parseInt(dateStr.substr(9, 2), 10);
    const minute = parseInt(dateStr.substr(11, 2), 10);
    const second = parseInt(dateStr.substr(13, 2), 10);
    if (dateStr.endsWith('Z')) return new Date(Date.UTC(year, month, day, hour, minute, second));
    else return new Date(year, month, day, hour, minute, second);
}

function parseICS(icsString) {
    const events = [];
    // Réparation de la structure du texte pour éviter que les titres longs soient coupés
    const unfoldedIcs = icsString.replace(/\r?\n[ \t]/g, '');
    const eventBlocks = unfoldedIcs.split('BEGIN:VEVENT');
    eventBlocks.shift(); 
    eventBlocks.forEach(block => {
        const event = {};
        const lines = block.split(/\r?\n/);
        lines.forEach(line => {
            const match = line.match(/^([A-Z0-9-]+)(;[^:]+)?:(.*)$/);
            if (match) {
                const currentKey = match[1];
                let value = match[3].replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';');
                if (currentKey === 'SUMMARY') event.summary = value;
                if (currentKey === 'DESCRIPTION') event.description = value;
                if (currentKey === 'LOCATION') event.location = value;
                if (currentKey === 'DTSTART') {
                    event.start = parseICSDate(value);
                    event.isAllDay = value.length <= 8;
                }
                if (currentKey === 'DTEND') event.end = parseICSDate(value);
            }
        });
        if (event.start && event.end) {
            events.push({
                id: Math.random().toString(36).substr(2, 9),
                summary: event.summary || 'Sans titre',
                description: event.description || '',
                location: event.location || 'Salle à définir',
                start: { dateTime: event.start.toISOString() },
                end: { dateTime: event.end.toISOString() },
                isAllDay: event.isAllDay || false
            });
        }
    });
    return events;
}

/**
 * Extraction intelligente pour l'IUT de Limoges
 * Gère spécifiquement le cas complexe "R2.18 Devoir G1,G2 GOUDARD Bérénice, BUT1-G1.BUT1-G2.BUT1-G3.BUT1-G4"
 */
function extractEventDetails(event) {
    let rawSummary = event.summary || 'Sans titre';
    let descLines = (event.description || '').split('\n').map(l => l.trim()).filter(l => l);
    
    let prof = 'Professeur non renseigné';
    let cleanTitle = rawSummary;
    let fullText = `${rawSummary} ${event.description || ''}`.toUpperCase();

    // --- DEBUG CLASS HUB ---
    if (fullText.includes('BUT1-G4') || fullText.includes('R2.18')) {
        console.log("🔍 [DEBUG] Analyse du cours :", rawSummary);
        console.log("📝 [DEBUG] Texte complet analysé :", fullText);
    }

    // 1. Extraction UNIVERSELLE des groupes : on attrape tous les groupes mentionnés
    const groups = new Set();
    
    // Détection très large incluant spécifiquement les "BUT1-Gx" pour ne jamais les rater
    if (/\bG1\b/.test(fullText) || /GR1\b/.test(fullText) || fullText.includes('BUT1-G1')) groups.add('G1');
    if (/\bG2\b/.test(fullText) || /GR2\b/.test(fullText) || fullText.includes('BUT1-G2')) groups.add('G2');
    if (/\bG3\b/.test(fullText) || /GR3\b/.test(fullText) || fullText.includes('BUT1-G3')) groups.add('G3');
    if (/\bG4\b/.test(fullText) || /GR4\b/.test(fullText) || fullText.includes('BUT1-G4')) groups.add('G4');
    if (/\bTD1\b/.test(fullText) || /\bTD 1\b/.test(fullText) || fullText.includes('BUT1-TD1')) groups.add('TD1');
    if (/\bTD2\b/.test(fullText) || /\bTD 2\b/.test(fullText) || fullText.includes('BUT1-TD2')) groups.add('TD2');

    if (fullText.includes('BUT1-G4') || fullText.includes('R2.18')) {
        console.log("🎯 [DEBUG] Groupes détectés avant fusion :", Array.from(groups));
    }

    let audience = '';
    if (groups.size > 0) {
         let hasG1 = groups.has('G1'), hasG2 = groups.has('G2');
         let hasG3 = groups.has('G3'), hasG4 = groups.has('G4');
         let hasTD1 = groups.has('TD1'), hasTD2 = groups.has('TD2');

         // Regroupement G1 + G2 -> TD1
         if (hasG1 && hasG2 && !hasTD1) { hasTD1 = true; hasG1 = false; hasG2 = false; }
         // Regroupement G3 + G4 -> TD2
         if (hasG3 && hasG4 && !hasTD2) { hasTD2 = true; hasG3 = false; hasG4 = false; }
         
         const finalGroups = [];
         if (hasTD1 && hasTD2) {
             audience = 'PROMO';
         } else {
             if (hasTD1) finalGroups.push('TD1');
             if (hasTD2) finalGroups.push('TD2');
             if (hasG1) finalGroups.push('G1');
             if (hasG2) finalGroups.push('G2');
             if (hasG3) finalGroups.push('G3');
             if (hasG4) finalGroups.push('G4');
             audience = finalGroups.join(', ');
         }
    } else if (/\bCM\b/.test(fullText) || /\bPROMO\b/.test(fullText) || /\bAMPHI\b/.test(fullText)) {
         audience = 'PROMO';
    }

    if (fullText.includes('BUT1-G4') || fullText.includes('R2.18')) {
        console.log("📢 [DEBUG] Audience finale calculée :", audience);
    }

    // 2. Extraction du Prof (juste avant les BUT1- ou dans la description)
    const butMatchPos = rawSummary.search(/(?:,\s*)?BUT\d-[A-Z0-9.\-_]+/i);
    
    if (butMatchPos !== -1) {
        let titleWithoutGroups = rawSummary.substring(0, butMatchPos).trim();
        const words = titleWithoutGroups.split(' ');
        
        // Si le titre a au moins 3 mots, on extrait le prof (les 2 mots justes avant les groupes)
        if (words.length >= 3) { 
            prof = `${words[words.length - 2]} ${words[words.length - 1]}`;
            cleanTitle = words.slice(0, words.length - 2).join(' ').trim();
        } else {
            cleanTitle = titleWithoutGroups;
            if (descLines.length > 2) prof = descLines[descLines.length - 1]; 
            else if (descLines.length === 2) prof = descLines[1];
        }
    } else {
        if (descLines.length > 0) cleanTitle = descLines[0];
        if (descLines.length > 2) prof = descLines[descLines.length - 1]; 
        else if (descLines.length === 2) prof = descLines[1];
    }

    // 3. Nettoyage du titre
    cleanTitle = cleanTitle.replace(/^(R[1-6]\.\d{2}|SAE\s?\d{3}|SAÉ\s?\d{3})\s*/i, '');
    cleanTitle = cleanTitle.replace(/\[Devoir\]/gi, 'Devoir').replace(/\[Eval\]/gi, 'Évaluation').replace(/\[Éval\]/gi, 'Évaluation');
    cleanTitle = cleanTitle.replace(/\bG[1-4](,G[1-4])*\b/gi, '');
    cleanTitle = cleanTitle.replace(/\bTD[1-2](,TD[1-2])*\b/gi, '');
    cleanTitle = cleanTitle.replace(/^[,\-\s\[\]]+|[,\-\s]+$/g, '').replace(/\s{2,}/g, ' ').trim();

    if (!cleanTitle) {
        if (rawSummary.toLowerCase().includes('devoir')) cleanTitle = 'Devoir';
        else if (rawSummary.toLowerCase().includes('eval') || rawSummary.toLowerCase().includes('éval')) cleanTitle = 'Évaluation';
        else cleanTitle = 'Cours';
    }

    return { title: cleanTitle, audience, prof };
}

function isEventVisibleForFilter(event, filter) {
    if (filter === 'ALL') return true;
    const { audience } = extractEventDetails(event);
    
    if (!audience) return true;
    if (audience === 'PROMO') return true;

    if (filter === 'G1') return audience.includes('G1') || audience.includes('TD1');
    if (filter === 'G2') return audience.includes('G2') || audience.includes('TD1');
    if (filter === 'G3') return audience.includes('G3') || audience.includes('TD2');
    if (filter === 'G4') return audience.includes('G4') || audience.includes('TD2');
    
    if (filter === 'TD1') return audience.includes('TD1') || audience.includes('G1') || audience.includes('G2');
    if (filter === 'TD2') return audience.includes('TD2') || audience.includes('G3') || audience.includes('G4');

    return true; 
}

function parseEventStyle(title) {
    const t = title.toLowerCase();
    if (t.includes('éval') || t.includes('eval') || t.includes('exam') || t.includes('ds') || t.includes('cc')) {
        return { type: 'EVAL', bg: 'bg-red-50/90', border: 'border-red-200', text: 'text-red-800', shadow: 'shadow-red-500/10' };
    }
    if (t.includes('devoir') || t.includes('rendu')) {
        return { type: 'DEVOIR', bg: 'bg-orange-50/90', border: 'border-orange-300 border-dashed', text: 'text-orange-900', shadow: 'shadow-orange-500/10' };
    }
    return { type: 'COURS', bg: 'bg-white/95', border: 'border-slate-200', text: 'text-slate-800', shadow: 'shadow-indigo-500/5' };
}

const joursSemaine = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const getDayName = (d) => ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][d.getDay()];

// --- COMPOSANTS UI STYLISÉS ---
const Card = ({ children, className = "", isPinned = false }) => (
  <div className={`bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all ${isPinned ? 'border-amber-200 ring-2 ring-amber-100 shadow-amber-500/5 bg-gradient-to-b from-amber-50/30 to-white' : 'border-white/50'} ${className}`}>
    {children}
  </div>
);

const Badge = ({ type }) => {
  const config = EVENT_TYPES[type] || EVENT_TYPES['INFO'];
  const Icon = config.icon || HelpCircle;
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit border ${config.color}`}>
      <Icon size={12} strokeWidth={3} />
      {config.label}
    </span>
  );
};

const UserBadge = ({ xp }) => {
  if (xp === 0 || xp === undefined) return <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-full w-fit"><Ghost size={12}/> Fantôme</span>;
  const badge = getBadge(xp);
  const BadgeIcon = badge.icon || HelpCircle;
  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border w-fit ${badge.color}`}>
      <BadgeIcon size={12} />
      {badge.name}
    </span>
  );
};

const CustomCalendar = ({ startDate, endDate, onChangeRange }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let initialDate = today;
  if (startDate) {
     const parsed = new Date(startDate);
     if (!isNaN(parsed.getTime())) initialDate = parsed;
  }
  
  const [viewDate, setViewDate] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => {
    let day = new Date(y, m, 1).getDay();
    return day === 0 ? 6 : day - 1; 
  };

  const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const handleDateClick = (day) => {
    const clickedDateStr = formatDateString(new Date(year, month, day));

    if (!startDate || (startDate && endDate)) {
      onChangeRange(clickedDateStr, '');
    } else {
      if (new Date(clickedDateStr) > new Date(startDate)) {
        onChangeRange(startDate, clickedDateStr);
      } else if (clickedDateStr === startDate) {
        onChangeRange(startDate, '');
      } else {
        onChangeRange(clickedDateStr, '');
      }
    }
  };

  const daysArray = [];
  for (let i = 0; i < firstDay; i++) daysArray.push(null);
  for (let i = 1; i <= daysInMonth; i++) daysArray.push(i);

  return (
    <div className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4 px-2">
        <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ChevronLeft size={20} />
        </button>
        <span className="font-bold text-slate-800 text-lg capitalize">{moisNoms[month]} {year}</span>
        <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2 text-center">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <span key={i} className="text-xs font-black text-slate-400 py-1">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {daysArray.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="p-2"></div>;

          const currentDateStr = formatDateString(new Date(year, month, day));
          const isStart = startDate === currentDateStr;
          const isEnd = endDate === currentDateStr;
          const isBetween = startDate && endDate && new Date(currentDateStr) > new Date(startDate) && new Date(currentDateStr) < new Date(endDate);
          const isToday = formatDateString(today) === currentDateStr;

          return (
            <button 
              key={day}
              onClick={() => handleDateClick(day)}
              className={`
                aspect-square flex items-center justify-center text-sm font-bold transition-all relative
                ${(isStart || isEnd) ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105 z-10' : ''}
                ${(!isStart && !isEnd && isBetween) ? 'bg-indigo-50 text-indigo-700 rounded-none' : ''}
                ${(!isStart && !isEnd && !isBetween) ? 'hover:bg-slate-100 text-slate-700 rounded-xl' : ''}
                ${(isStart && !endDate) ? 'rounded-xl' : ''}
                ${(isStart && endDate) ? 'rounded-l-xl' : ''}
                ${isEnd ? 'rounded-r-xl' : ''}
                ${isToday && !isStart && !isEnd && !isBetween ? 'text-indigo-600 bg-indigo-50 ring-1 ring-indigo-200' : ''}
              `}
            >
              {day}
              {isToday && !isStart && !isEnd && !isBetween && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-600"></div>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function App() {
  const [userGroup, setUserGroup] = useState(null);
  const [userName, setUserName] = useState(''); 
  const [userAvatar, setUserAvatar] = useState('👤');
  const [userXp, setUserXp] = useState(0);
  const [userId, setUserId] = useState(''); 
  
  const [userRole, setUserRole] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(STORAGE_KEY + '_role') || 'USER';
    return 'USER';
  });
  
  const [activeTab, setActiveTab] = useState('PLANNING');
  const [view, setView] = useState('onboarding');
  const [leaderboardFilter, setLeaderboardFilter] = useState('ALL'); 
  const [showHistory, setShowHistory] = useState(false); 
  const [deferredPrompt, setDeferredPrompt] = useState(null); 
  const [showInstallTutorial, setShowInstallTutorial] = useState(false); 
  const [isStandalone, setIsStandalone] = useState(false); 
  
  const [tempGroup, setTempGroup] = useState(1);
  const groupScrollRef = useRef(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempPseudo, setTempPseudo] = useState('');
  const [tempAvatar, setTempAvatar] = useState('');
  const [showRecoveryCode, setShowRecoveryCode] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [items, setItems] = useState([]);
  const [allUsers, setAllUsers] = useState([]); 
  const [adminLogs, setAdminLogs] = useState([]); 
  const [adminEditUser, setAdminEditUser] = useState(null); 
  const [authUser, setAuthUser] = useState(null);

  const [saeConfig, setSaeConfig] = useState(null);
  const [isEditingSae, setIsEditingSae] = useState(false);
  const [saeWizardStep, setSaeWizardStep] = useState(1); 
  const [saeForm, setSaeForm] = useState({ active: false, title: 'Semaine SAÉ', startDate: '', weeks: 1 });
  
  const [isEditingRooms, setIsEditingRooms] = useState(false);
  const [roomWizardStep, setRoomWizardStep] = useState(1); 
  const [newRoomInput, setNewRoomInput] = useState('');
  const [newRoomTarget, setNewRoomTarget] = useState('PROMO');

  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false); 
  const [showAuthPrompt, setShowAuthPrompt] = useState(false); 
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [toast, setToast] = useState(null); 
  
  const [lastSeenAgenda, setLastSeenAgenda] = useState(() => parseInt(localStorage.getItem(STORAGE_KEY + '_lastAgenda')) || Date.now());
  const [lastSeenPolls, setLastSeenPolls] = useState(() => parseInt(localStorage.getItem(STORAGE_KEY + '_lastPolls')) || Date.now());
  const [expandedPolls, setExpandedPolls] = useState([]); 

  const [currentTimeTick, setCurrentTimeTick] = useState(0); 

  // --- VARIABLES EMPLOI DU TEMPS ---
  const [timetableEvents, setTimetableEvents] = useState([]);
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [timetableError, setTimetableError] = useState(false);
  const [timetableDate, setTimetableDate] = useState(new Date());
  const [timetableDayIndex, setTimetableDayIndex] = useState(() => {
      const d = new Date().getDay();
      return (d >= 1 && d <= 5) ? d - 1 : 0;
  });
  const [timetableFilter, setTimetableFilter] = useState(() => {
      if (typeof window !== 'undefined') return localStorage.getItem(STORAGE_KEY + '_group') || 'ALL';
      return 'ALL';
  });
  // Nouvelle variable pour gérer l'affichage : 1 Jour, 3 Jours ou Semaine
  const [timetableSpan, setTimetableSpan] = useState(() => {
      if (typeof window !== 'undefined') return localStorage.getItem(STORAGE_KEY + '_viewSpan') || '1D';
      return '1D';
  });
  const [now, setNow] = useState(new Date());

  const isInitialLoad = useRef(true);
  const notifsEnabledRef = useRef(false);
  const userNameRef = useRef('');
  const userIdRef = useRef('');
  const userAvatarRef = useRef('👤');
  const userXpRef = useRef(0);
  const userGroupRef = useRef(null);
  const avatarScrollRef = useRef(null);
  const notifiedItemsRef = useRef(new Set()); 

  const [wizardStep, setWizardStep] = useState(1);
  const [addMode, setAddMode] = useState('EVENT');
  const [editItemId, setEditItemId] = useState(null);
  const [formData, setFormData] = useState({ type: 'DEVOIR', subject: 'AUTRE', title: '', date: '', endDate: '', time: '', scope: 'PROMO', pollOptions: ['', ''], sharedWith: [], link: '' });
  const [userSearchQuery, setUserSearchQuery] = useState('');
  
  const [adminInput, setAdminInput] = useState('');
  const [pseudoInput, setPseudoInput] = useState('');
  const [recoveryInput, setRecoveryInput] = useState('');

  const todayRef = useRef(null);

  useEffect(() => { notifsEnabledRef.current = notificationsEnabled; }, [notificationsEnabled]);
  useEffect(() => { userNameRef.current = userName; }, [userName]);
  useEffect(() => { userIdRef.current = userId; }, [userId]);
  useEffect(() => { userAvatarRef.current = userAvatar; }, [userAvatar]);
  useEffect(() => { userXpRef.current = userXp; }, [userXp]);
  useEffect(() => { userGroupRef.current = userGroup; }, [userGroup]);

  // Initialiser le filtre d'emploi du temps avec le groupe de l'utilisateur
  useEffect(() => {
      if (userGroup) {
          setTimetableFilter(userGroup);
      }
  }, [userGroup]);

  // --- SYSTÈME DE TRACKING INTERNE & ANALYTICS ---
  const trackAction = (actionName, category, label) => {
    if (typeof window !== 'undefined' && window.gtag) {
      try { window.gtag('event', actionName, { 'event_category': category, 'event_label': label }); } catch (e) { console.warn("Tracking failed", e); }
    }
    const activeUserId = userId || localStorage.getItem(STORAGE_KEY + '_uid');
    if (activeUserId && authUser) {
      const logEntry = { action: actionName, label: label || '', timestamp: Date.now() };
      try {
        setDoc(doc(db, getLogsPath(), activeUserId), { activityLogs: arrayUnion(logEntry), lastAction: logEntry }, { merge: true }).catch(() => {});
      } catch (e) {}
    }
  };

  useEffect(() => {
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-Q2LGSJC389';
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-Q2LGSJC389');
    `;
    document.head.appendChild(script2);
  }, []);

  useEffect(() => {
    if (userId && authUser) {
      const now = new Date();
      const lastSyncStr = localStorage.getItem(STORAGE_KEY + '_lastDailySync');
      const lastSyncDate = lastSyncStr ? new Date(lastSyncStr) : new Date(0);
      if (now - lastSyncDate > 86400000) { 
         setDoc(doc(db, getUsersPath(), userId), { lastSync: now.toISOString() }, { merge: true }).catch(() => {});
         localStorage.setItem(STORAGE_KEY + '_lastDailySync', now.toISOString());
         trackAction('daily_app_open', 'engagement', 'user_active');
      }
    }
  }, [userId, authUser]);

  useEffect(() => {
    let metaViewport = document.querySelector('meta[name="viewport"]');
    if (!metaViewport) {
      metaViewport = document.createElement('meta');
      metaViewport.name = "viewport";
      document.head.appendChild(metaViewport);
    }
    metaViewport.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
  }, []);

  useEffect(() => {
    const checkStandalone = () => { setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone); };
    checkStandalone();
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    trackAction('install_click', 'system', 'pwa_prompt');
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        trackAction('install_accepted', 'system', 'pwa_installed');
        setDeferredPrompt(null);
        setToast({ title: "Super !", message: "ClassHub va s'installer sur ton appareil." });
      } else {
        trackAction('install_rejected', 'system', 'pwa_dismissed');
      }
    } else {
      setShowInstallTutorial(true);
      trackAction('install_tutorial_shown', 'system', 'ios_or_unsupported');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsSplashVisible(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTimeTick(t => t + 1), 60000); 
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
      const interval = setInterval(() => setNow(new Date()), 60000);
      return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!authUser) return;
    const saeRef = doc(db, getConfigPath(), 'sae');
    const unsubscribeSae = onSnapshot(saeRef, (docSnap) => {
      if (docSnap.exists()) setSaeConfig(docSnap.data());
      else setSaeConfig(null);
    });
    return () => unsubscribeSae();
  }, [authUser]);

  const VAPID_KEY = "BImmvCfd_BZQoxA5fdJFEtjElKTgg4mXOzy-dm-7IMBywFuaQfdEoCTQxe2f15aNYqP1xXr23bKVOnb1OVTaljk";

  useEffect(() => {
    if (notificationsEnabled && authUser && userId && messaging) {
      getToken(messaging, { vapidKey: VAPID_KEY }).then(currentToken => {
        if (currentToken) setDoc(doc(db, getUsersPath(), userId), { fcmTokens: arrayUnion(currentToken) }, { merge: true }).catch(() => {});
      }).catch(e => console.warn("FCM Push bloqué en auto-réparation:", e));
    }
  }, [notificationsEnabled, authUser, userId]);

  useEffect(() => {
    if (view !== 'list') return;
    const n = Date.now();
    if (activeTab === 'AGENDA') {
      setLastSeenAgenda(n);
      localStorage.setItem(STORAGE_KEY + '_lastAgenda', n.toString());
    } else if (activeTab === 'SONDAGES') {
      setLastSeenPolls(n);
      localStorage.setItem(STORAGE_KEY + '_lastPolls', n.toString());
    }
  }, [activeTab, view, items]);

  useEffect(() => {
    if (view === 'list' && !isSplashVisible && !notificationsEnabled) {
      const hasSeenPrompt = localStorage.getItem(STORAGE_KEY + '_notifPromptSeen');
      if (!hasSeenPrompt) {
        const timer = setTimeout(() => setShowNotifPrompt(true), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [view, isSplashVisible, notificationsEnabled]);

  const dismissNotifPrompt = () => {
    localStorage.setItem(STORAGE_KEY + '_notifPromptSeen', 'true');
    setShowNotifPrompt(false);
    trackAction('notif_prompt_dismiss', 'engagement', 'prompt_closed');
  };

  const acceptNotifPrompt = () => {
    localStorage.setItem(STORAGE_KEY + '_notifPromptSeen', 'true');
    setShowNotifPrompt(false);
    trackAction('notif_prompt_accept', 'engagement', 'prompt_accepted');
    toggleNotifications(); 
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      setNotificationsEnabled(true);
      localStorage.setItem(STORAGE_KEY + '_notifs', 'true');
      setToast({ title: "Système Actif", message: "Tu recevras les alertes dans l'application !" });
      trackAction('toggle_notif_on', 'system', 'notifications');

      if (typeof window !== "undefined" && "Notification" in window && messaging) {
        try {
          const permission = await Notification.requestPermission();
          if (permission === "granted" && userId) {
            const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
            if (currentToken) {
              await setDoc(doc(db, getUsersPath(), userId), { fcmTokens: arrayUnion(currentToken) }, { merge: true }).catch(() => {});
              setToast({ title: "Push OS Activé", message: "Cet appareil recevra désormais les alertes !" });
              trackAction('push_os_granted', 'system', 'notifications');
            }
          }
        } catch (error) { console.error("❌ Erreur Push OS:", error); }
      }
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem(STORAGE_KEY + '_notifs', 'false');
      trackAction('toggle_notif_off', 'system', 'notifications');
      
      if (userId && authUser && messaging) {
        try {
          const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
          if (currentToken) setDoc(doc(db, getUsersPath(), userId), { fcmTokens: arrayRemove(currentToken) }, { merge: true }).catch(() => {});
        } catch(e) { console.warn("Erreur retrait token:", e); }
      }
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleScrollAvatar = () => {
    if (!avatarScrollRef.current) return;
    const container = avatarScrollRef.current;
    const center = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0, minDistance = Infinity;

    Array.from(container.children).forEach((child, index) => {
      const childCenter = child.offsetLeft + child.clientWidth / 2;
      const distance = Math.abs(center - childCenter);
      if (distance < minDistance) { minDistance = distance; closestIndex = index; }
    });
    if (AVATARS[closestIndex] !== tempAvatar) setTempAvatar(AVATARS[closestIndex]);
  };

  useEffect(() => {
    if (isEditingProfile && avatarScrollRef.current) {
      setTimeout(() => { 
        if (!avatarScrollRef.current) return;
        const index = AVATARS.indexOf(tempAvatar);
        if (index !== -1) {
          const container = avatarScrollRef.current;
          const item = container.children[index];
          if (item) container.scrollTo({ left: item.offsetLeft - container.clientWidth / 2 + item.clientWidth / 2, behavior: 'instant' });
        }
      }, 50);
    }
  }, [isEditingProfile]);

  const handleScrollGroup = () => {
    if (!groupScrollRef.current) return;
    const container = groupScrollRef.current;
    const center = container.scrollTop + container.clientHeight / 2;
    let closestNum = 1, minDistance = Infinity;

    const children = Array.from(container.children[0].children);
    children.forEach((child, index) => {
      const childCenter = child.offsetTop + child.clientHeight / 2;
      const distance = Math.abs(center - childCenter);
      if (distance < minDistance) { minDistance = distance; closestNum = index + 1; }
    });
    if (closestNum !== tempGroup) setTempGroup(closestNum);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
        else await signInAnonymously(auth);
      } catch (e) { console.error("Erreur Auth:", e); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setAuthUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser) return;
    const configRef = doc(db, getConfigPath(), 'main');
    const unsubscribe = onSnapshot(configRef, (snap) => {
      if (snap.exists()) {
        const serverVersion = snap.data().versionCode || 0;
        if (serverVersion > APP_VERSION_CODE) setNeedsUpdate(true);
        else if (serverVersion < APP_VERSION_CODE) setDoc(configRef, { versionCode: APP_VERSION_CODE, versionString: APP_VERSION_STRING }, { merge: true });
      } else {
        setDoc(configRef, { versionCode: APP_VERSION_CODE, versionString: APP_VERSION_STRING }, { merge: true });
      }
    }, (error) => console.error("Erreur de versioning:", error));
    return () => unsubscribe();
  }, [authUser]);

  const handleForceUpdate = () => {
    if ('caches' in window) caches.keys().then((names) => { for (let name of names) caches.delete(name); });
    setTimeout(() => { window.location.reload(true); }, 500);
  };

  useEffect(() => {
    if (!authUser) return;
    const collRef = collection(db, getEventsPath());
    const unsubscribe = onSnapshot(collRef, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(fetchedItems);

      if (isInitialLoad.current) snapshot.docs.forEach(doc => notifiedItemsRef.current.add(doc.id));
      if (!isInitialLoad.current && notifsEnabledRef.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const docId = change.doc.id;
            
            if (!notifiedItemsRef.current.has(docId)) {
              notifiedItemsRef.current.add(docId);
              const currentUserGroup = userGroupRef.current || localStorage.getItem(STORAGE_KEY + '_group');
              const currentUserId = userIdRef.current || localStorage.getItem(STORAGE_KEY + '_uid');
              const config = GROUPS_CONFIG[currentUserGroup] || {};
              
              let isVisible = false;
              if (data.scope === 'PROMO') isVisible = true;
              else if (data.scope === 'GROUP') isVisible = Array.isArray(data.sharedWith) && data.sharedWith.includes(currentUserId);
              else if (data.scope === currentUserGroup || data.scope === config.parent) isVisible = true;
              else if (data.scope === currentUserId) isVisible = true;

              if (isVisible && data.authorId !== currentUserId) {
                const notifTitle = data.category === 'POLL' ? "📊 Nouveau Sondage" : "📚 Nouveau Devoir";
                const notifBody = `${data.author || "Quelqu'un"} a ajouté : ${data.title}`;
                setToast({ title: notifTitle, message: notifBody });
              }
            }
          }
        });
      }
      if (isInitialLoad.current) isInitialLoad.current = false;
    }, (error) => console.error("Erreur de synchronisation:", error));
    return () => unsubscribe();
  }, [authUser]);

  useEffect(() => {
    if (!authUser) return;
    const collRef = collection(db, getUsersPath());
    const unsubscribe = onSnapshot(collRef, (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllUsers(fetchedUsers);
    }, (error) => console.error("Erreur sync users:", error));
    return () => unsubscribe();
  }, [authUser]);

  useEffect(() => {
    if (!authUser || userRole !== 'ADMIN') return;
    const collRef = collection(db, getLogsPath());
    const unsubscribe = onSnapshot(collRef, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdminLogs(logs);
    }, (error) => {
      console.error("🔥 Firebase bloque la lecture des logs :", error);
      alert("Blocage Firebase ! Vérifie tes 'Domaines autorisés' dans Auth ou tes 'Règles' Firestore pour la collection 'logs'.");
    });
    return () => unsubscribe();
  }, [authUser, userRole]);

  // --- FETCH EMPLOI DU TEMPS ---
  useEffect(() => {
      let isMounted = true;
      const fetchICSData = async () => {
          setTimetableLoading(true);
          setTimetableError(false);
          try {
              const calendarId = '076ieipqcmpsbdoifl91sk27v0@group.calendar.google.com';
              const icsUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`;
              const icsUrlWithCacheBust = icsUrl + '?t=' + new Date().getTime();
              const proxies = [
                  `https://corsproxy.io/?${encodeURIComponent(icsUrlWithCacheBust)}`,
                  `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(icsUrlWithCacheBust)}`,
                  `https://api.allorigins.win/raw?url=${encodeURIComponent(icsUrlWithCacheBust)}`
              ];

              let icsData = null;
              let fetchSuccess = false;

              for (const proxyUrl of proxies) {
                  try {
                      const response = await fetch(proxyUrl);
                      if (response.ok) {
                          icsData = await response.text();
                          if (icsData && icsData.includes("BEGIN:VCALENDAR")) {
                              fetchSuccess = true;
                              break;
                          }
                      }
                  } catch (fetchErr) { console.warn(`Échec proxy ${proxyUrl}`); }
              }

              if (!fetchSuccess || !icsData) throw new Error("Tous les proxys ont échoué.");
              if (isMounted) {
                  const events = parseICS(icsData);
                  setTimetableEvents(events);
              }
          } catch (e) {
              console.error(e);
              if (isMounted) setTimetableError(true);
          } finally {
              if (isMounted) setTimetableLoading(false);
          }
      };
      if (authUser) {
          fetchICSData();
      }
      return () => { isMounted = false; };
  }, [authUser]);

  useEffect(() => {
    try {
      const storedGroup = localStorage.getItem(STORAGE_KEY + '_group');
      const storedName = localStorage.getItem(STORAGE_KEY + '_name');
      const storedAvatar = localStorage.getItem(STORAGE_KEY + '_avatar');
      const storedXp = localStorage.getItem(STORAGE_KEY + '_xp');
      let storedId = localStorage.getItem(STORAGE_KEY + '_uid');
      const storedNotifs = localStorage.getItem(STORAGE_KEY + '_notifs');

      if (storedGroup && GROUPS_CONFIG[storedGroup]) { 
        setUserGroup(storedGroup); 
        setView('list'); 
      } else {
        setView('onboarding'); 
      }

      if (storedName) { setUserName(storedName); setPseudoInput(storedName); }
      if (storedAvatar) setUserAvatar(storedAvatar);
      if (storedXp) setUserXp(parseInt(storedXp, 10));
      if (storedNotifs === 'true') setNotificationsEnabled(true);
      
      if (!storedId || storedId.startsWith('user-')) {
        storedId = generateRecoveryCode();
        localStorage.setItem(STORAGE_KEY + '_uid', storedId);
      }
      setUserId(storedId);

    } catch(e) {
      console.warn("Storage Reset");
      localStorage.clear();
    }
  }, []);
  
  useEffect(() => { 
    localStorage.setItem(STORAGE_KEY + '_xp', userXp); 
    localStorage.setItem(STORAGE_KEY + '_avatar', userAvatar);
  }, [userXp, userAvatar]);

  useEffect(() => {
    if (!userId || !authUser) return;
    const userRef = doc(db, getUsersPath(), userId);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.name && data.name !== userNameRef.current) {
          setUserName(data.name); setPseudoInput(data.name); localStorage.setItem(STORAGE_KEY + '_name', data.name);
        }
        if (data.avatar && data.avatar !== userAvatarRef.current) {
          setUserAvatar(data.avatar); localStorage.setItem(STORAGE_KEY + '_avatar', data.avatar);
        }
        if (data.xp !== undefined && data.xp !== userXpRef.current) {
          setUserXp(data.xp); localStorage.setItem(STORAGE_KEY + '_xp', data.xp);
        }
        if (data.group && data.group !== "" && data.group !== userGroupRef.current) {
          setUserGroup(data.group); localStorage.setItem(STORAGE_KEY + '_group', data.group);
        }
      } else {
        const localGroup = localStorage.getItem(STORAGE_KEY + '_group');
        if (localGroup) setDoc(userRef, { group: localGroup, xp: 0 }, { merge: true }).catch(() => {});
      }
    });
    return () => unsubscribe();
  }, [userId, authUser]);

  const handleOnboarding = (group) => { 
    setUserGroup(group); 
    localStorage.setItem(STORAGE_KEY + '_group', group);
    trackAction('onboarding_complete', 'engagement', group);
    setView('list'); 
    if (userId && authUser) setDoc(doc(db, getUsersPath(), userId), { group, lastSync: new Date().toISOString() }, { merge: true }).catch(() => {});
  };

  const handleSaveProfile = () => {
    if (pseudoInput.trim()) {
      const newName = pseudoInput.trim();
      setUserName(newName);
      localStorage.setItem(STORAGE_KEY + '_name', newName);
      trackAction('profile_created', 'engagement', 'new_user');
      if (userId && authUser) {
        setDoc(doc(db, getUsersPath(), userId), { name: newName, avatar: userAvatar, xp: userXp, group: userGroup || 'G1', lastSync: new Date().toISOString() }, { merge: true }).catch(() => {});
      }
    } else {
      setUserName(''); localStorage.removeItem(STORAGE_KEY + '_name');
    }
  };

  const handleUpdateProfile = () => {
    let updated = false;
    const updates = {};
    if (tempPseudo.trim() && tempPseudo.trim() !== userName) {
      const newName = tempPseudo.trim();
      setUserName(newName); localStorage.setItem(STORAGE_KEY + '_name', newName);
      updates.name = newName; updated = true;
    }
    if (tempAvatar && tempAvatar !== userAvatar) {
      setUserAvatar(tempAvatar); localStorage.setItem(STORAGE_KEY + '_avatar', tempAvatar);
      updates.avatar = tempAvatar; updated = true;
    }
    if (updated) {
      trackAction('profile_updated', 'engagement', 'edit_profile');
      setToast({ title: "Profil mis à jour", message: `Tes modifications ont bien été enregistrées.`});
      if (userId && authUser) setDoc(doc(db, getUsersPath(), userId), updates, { merge: true }).catch(() => {});
    }
    setIsEditingProfile(false);
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem(STORAGE_KEY + '_uid');
    localStorage.removeItem(STORAGE_KEY + '_name');
    localStorage.removeItem(STORAGE_KEY + '_avatar');
    localStorage.removeItem(STORAGE_KEY + '_xp');
    localStorage.removeItem(STORAGE_KEY + '_group');
    localStorage.removeItem(STORAGE_KEY + '_notifs');
    localStorage.removeItem(STORAGE_KEY + '_role');
    trackAction('logout', 'system', 'disconnect');
    window.location.reload();
  };

  const handleRecoverAccount = async () => {
    if (!recoveryInput || !authUser) return;
    const cleanCode = recoveryInput.toUpperCase().trim();
    try {
      const userRef = doc(db, getUsersPath(), cleanCode);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setUserId(cleanCode); setUserName(data.name); setUserAvatar(data.avatar || '👤'); setUserXp(data.xp); setUserGroup(data.group); setPseudoInput(data.name);
        
        localStorage.setItem(STORAGE_KEY + '_uid', cleanCode);
        localStorage.setItem(STORAGE_KEY + '_name', data.name);
        localStorage.setItem(STORAGE_KEY + '_avatar', data.avatar || '👤');
        localStorage.setItem(STORAGE_KEY + '_xp', data.xp);
        localStorage.setItem(STORAGE_KEY + '_group', data.group);
        
        trackAction('account_recovered', 'engagement', 'recover');
        setToast({ title: "✅ Compte Récupéré !", message: `Heureux de te revoir, ${data.name}.` });
        setView('list'); setRecoveryInput('');
      } else { alert("Ce code est introuvable. Vérifie les lettres et les tirets."); }
    } catch (e) { console.error("Erreur récup:", e); alert("Erreur réseau lors de la récupération."); }
  };

  const saveAdminEditUser = async () => {
    if (!adminEditUser) return;
    try {
      await setDoc(doc(db, getUsersPath(), adminEditUser.id), { name: adminEditUser.name, xp: adminEditUser.xp, group: adminEditUser.group }, { merge: true });
      setAdminEditUser(null);
      setToast({title: "Utilisateur modifié", message: "Mise à jour réussie."});
    } catch (e) { console.error("Erreur édition admin:", e); }
  };

  const deleteAdminUser = async (id) => {
    if (window.confirm("Es-tu sûr de vouloir supprimer définitivement cet utilisateur ?")) {
      try {
        await deleteDoc(doc(db, getUsersPath(), id));
        setToast({title: "Utilisateur supprimé", message: "Le compte a bien été effacé."});
      } catch (e) { console.error("Erreur suppression:", e); }
    }
  };

  const isSaeActive = () => {
    if (!saeConfig || !saeConfig.active || !saeConfig.startDate) return false;
    const today = new Date(); today.setHours(0,0,0,0);
    const start = new Date(saeConfig.startDate); start.setHours(0,0,0,0);
    const end = new Date(start); end.setDate(end.getDate() + ((saeConfig.weeks || 1) * 7) - 1); end.setHours(23,59,59,999);
    return today >= start && today <= end;
  };

  const getSaeEndDate = () => {
    if (!saeConfig || !saeConfig.startDate) return '';
    const start = new Date(saeConfig.startDate);
    const end = new Date(start); end.setDate(end.getDate() + ((saeConfig.weeks || 1) * 7) - 1);
    return formatShortDate(end);
  };

  const getSaeRoomsList = () => {
    if (!saeConfig || !saeConfig.rooms) return [];
    let roomsArray = saeConfig.rooms;
    if (!Array.isArray(roomsArray)) return []; 
    const myTd = GROUPS_CONFIG[userGroup]?.parent;
    return roomsArray.filter(r => r.target === 'PROMO' || r.target === myTd || r.target === userGroup);
  };

  const handleSaveSae = async () => {
    try {
      const now = new Date().toISOString();
      const updatedConfig = { ...(saeConfig || {}), ...saeForm, lastModified: now };
      if (!updatedConfig.rooms || !Array.isArray(updatedConfig.rooms)) updatedConfig.rooms = [];
      await setDoc(doc(db, getConfigPath(), 'sae'), updatedConfig);
      setToast({ title: "SAÉ Configurée", message: "La période de projet a bien été mise à jour." });
      setIsEditingSae(false);
    } catch (e) { console.error("Erreur sauvegarde SAÉ:", e); }
  };

  const handleSaveNewRoom = async () => {
    if (!newRoomInput.trim()) return;
    try {
      const now = new Date().toISOString();
      const currentRooms = Array.isArray(saeConfig?.rooms) ? saeConfig.rooms : [];
      const updatedConfig = { ...(saeConfig || {}), rooms: [...currentRooms, { room: newRoomInput.trim().toUpperCase(), target: newRoomTarget }], lastModified: now };
      await setDoc(doc(db, getConfigPath(), 'sae'), updatedConfig);
      setToast({ title: "Salle ajoutée", message: "La salle a bien été assignée." });
      setIsEditingRooms(false); setRoomWizardStep(1);
    } catch (e) { console.error("Erreur ajout salle:", e); }
  };

  const handleDeleteRoom = async (roomToDelete) => {
    if (!userName) { setShowAuthPrompt(true); return; } 
    if (!window.confirm(`Retirer la salle ${roomToDelete.room} ?`)) return;
    try {
      const now = new Date().toISOString();
      const currentRooms = Array.isArray(saeConfig?.rooms) ? saeConfig.rooms : [];
      const newRooms = currentRooms.filter(r => !(r.room === roomToDelete.room && r.target === roomToDelete.target));
      await setDoc(doc(db, getConfigPath(), 'sae'), { ...(saeConfig || {}), rooms: newRooms, lastModified: now });
      setToast({ title: "Salle retirée", message: "La salle a été supprimée des disponibilités." });
    } catch (e) { console.error("Erreur suppression salle:", e); }
  };

  const addXp = (amount) => { 
    if (userName && userId && authUser) {
      setUserXp(prev => {
        const newXp = prev + amount;
        setDoc(doc(db, getUsersPath(), userId), { xp: newXp }, { merge: true }).catch(() => {});
        return newXp;
      });
    } 
  };

  const resetWizard = () => {
    setWizardStep(1); setFormData({ type: 'DEVOIR', subject: 'AUTRE', title: '', date: '', endDate: '', time: '', scope: 'PROMO', pollOptions: ['', ''], sharedWith: [], link: '' });
    setAddMode('EVENT'); setEditItemId(null); setView('list'); setUserSearchQuery('');
  };

  const startWizard = (mode = 'EVENT') => { 
    setFormData({ type: 'DEVOIR', subject: 'AUTRE', title: '', date: '', endDate: '', time: '', scope: 'PROMO', pollOptions: ['', ''], sharedWith: [], link: '' });
    setEditItemId(null); setAddMode(mode); setWizardStep(1); setView('wizard'); 
  };
  
  const startEditWizard = (item) => {
    setEditItemId(item.id); setAddMode(item.category);
    setFormData({
      type: item.type || 'DEVOIR', subject: item.subjectCode || 'AUTRE', title: item.title || '', date: item.date || '', endDate: item.endDate || '', time: item.time || '', scope: item.scope || 'PROMO',
      pollOptions: item.category === 'POLL' ? ((item.options || []).map(o => o?.text || '')) : ['', ''], sharedWith: item.sharedWith || [], link: item.link || ''
    });
    setWizardStep(1); setView('wizard'); 
  };

  const handlePublish = async () => {
    if (!authUser) { alert("Connexion au serveur en cours, réessaie dans un instant."); return; }
    let finalTitle = formData.title?.trim() || "";
    if (!finalTitle && addMode === 'EVENT') {
       const subj = MMI_SUBJECTS.find(s => s.code === formData.subject);
       finalTitle = subj ? subj.name : 'Devoir';
    }
    if (!finalTitle) { alert("Il manque un titre ou une question !"); return; }
    const isEditing = !!editItemId;
    const uniqueId = isEditing ? editItemId : Date.now().toString();
    
    let newItem = { title: finalTitle, scope: formData.scope };

    if (isEditing) {
      const existingItem = items.find(i => i.id === editItemId);
      if (existingItem) newItem = { ...existingItem, ...newItem };
    } else {
      newItem.author = userRole === 'ADMIN' ? 'Super Admin' : (userRole === 'DELEGUE' ? 'Délégué' : (userName || 'Anonyme'));
      newItem.authorAvatar = userRole === 'ADMIN' ? '🛡️' : (userRole === 'DELEGUE' ? '👑' : (userName ? userAvatar : '👤'));
      newItem.authorXp = userRole !== 'USER' ? 9999 : (userName ? userXp : 0);
      newItem.authorId = userId;
      newItem.votes = {}; newItem.voters = []; newItem.xpAwarded = []; newItem.isPinned = false; newItem.createdAt = new Date().toISOString();
    }
    
    let finalSharedWith = formData.sharedWith || [];
    if (formData.scope === 'GROUP' && !finalSharedWith.includes(userId)) finalSharedWith = [...finalSharedWith, userId];

    if (addMode === 'EVENT') {
      if(!formData.date) { alert("Veuillez sélectionner une date dans le calendrier."); return; }
      newItem = { ...newItem, category: 'EVENT', type: formData.type, subjectCode: formData.subject, date: formData.date, endDate: formData.endDate || null, time: formData.time || '', sharedWith: finalSharedWith, link: formData.link, completedBy: isEditing ? (newItem.completedBy || []) : [] };
      trackAction(isEditing ? 'edit_event' : 'create_event', 'creation', 'devoir');
    } else {
      const validTexts = (formData.pollOptions || []).filter(o => o && typeof o === 'string' && o.trim() !== '');
      if (validTexts.length < 2) { alert("Il faut écrire au moins 2 options pour le sondage !"); return; }
      if (!isEditing) {
        newItem = { ...newItem, category: 'POLL', sharedWith: finalSharedWith, options: validTexts.map((text, idx) => ({ id: `opt-${Date.now()}-${idx}`, text, votes: 0, votersList: [] })) };
      } else {
        const existingOptions = newItem.options || [];
        newItem.options = validTexts.map((text, idx) => {
          if (existingOptions[idx]) return { ...existingOptions[idx], text }; 
          return { id: `opt-${Date.now()}-${idx}`, text, votes: 0, votersList: [] };
        });
        newItem.sharedWith = finalSharedWith;
      }
      trackAction(isEditing ? 'edit_poll' : 'create_poll', 'creation', 'sondage');
    }
    
    try {
      await setDoc(doc(db, getEventsPath(), uniqueId), newItem, { merge: true });
      if (!isEditing && formData.scope !== userId) addXp(20); 
      resetWizard();
    } catch (e) { console.error("Erreur lors de l'ajout/modification", e); alert("Erreur de connexion à la base de données. Vérifie ta connexion internet."); }
  };

  const handleTogglePin = async (id, currentStatus) => {
    if (!authUser || userRole === 'USER') return;
    try {
      await setDoc(doc(db, getEventsPath(), id.toString()), { pinned: !currentStatus }, { merge: true });
      trackAction('pin_item', 'moderation', !currentStatus ? 'pinned' : 'unpinned');
    } catch (e) { console.error("Erreur épinglage:", e); }
  };

  const toggleTaskCompletion = async (eventId) => {
    if (!userName) { setShowAuthPrompt(true); return; } 
    if (!authUser) return;
    const item = items.find(i => i.id === eventId);
    if (!item) return;

    let newCompletedBy = [...(item.completedBy || [])];
    if (newCompletedBy.includes(userId)) {
      newCompletedBy = newCompletedBy.filter(id => id !== userId);
      trackAction('uncomplete_task', 'engagement', 'task_uncheck');
    } else {
      newCompletedBy.push(userId);
      trackAction('complete_task', 'engagement', 'task_check');
    }

    try { await setDoc(doc(db, getEventsPath(), eventId.toString()), { completedBy: newCompletedBy }, { merge: true }); } catch (e) { console.error("Erreur completion:", e); }
  };

  const processItemsData = () => {
    if (!userGroup) return { past: [], future: [], hasNewAgenda: false, hasNewPolls: false };
    const config = GROUPS_CONFIG[userGroup];
    const visibleScopes = [userGroup, config?.parent, 'PROMO', userId];
    let hasNewAgenda = false, hasNewPolls = false;
    const agendaItems = [], pollItems = [];

    items.forEach(item => {
      const isSharedWithMe = item.scope === 'GROUP' && (item.sharedWith || []).includes(userId);
      if (!visibleScopes.includes(item.scope) && !isSharedWithMe) return;
      const itemTime = new Date(item.createdAt || 0).getTime();
      
      if (item.author !== userName) {
        if (item.category === 'EVENT' && itemTime > lastSeenAgenda) hasNewAgenda = true;
        if (item.category === 'POLL' && itemTime > lastSeenPolls) hasNewPolls = true;
      }
      if (item.category === 'EVENT') agendaItems.push(item);
      if (item.category === 'POLL') pollItems.push(item);
    });

    const currentList = activeTab === 'AGENDA' ? agendaItems : pollItems;
    currentList.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      if (activeTab === 'AGENDA') {
        const dateA = new Date((a.date || "1970-01-01") + (a.time ? `T${a.time}:00` : 'T00:00:00')).getTime();
        const dateB = new Date((b.date || "1970-01-01") + (b.time ? `T${b.time}:00` : 'T00:00:00')).getTime();
        return (dateA || 0) - (dateB || 0);
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    const today = new Date(); today.setHours(0,0,0,0);
    const past = [], future = [];

    currentList.forEach(item => {
      if (activeTab === 'SONDAGES') future.push(item);
      else {
        try {
          const compareDateStr = item.endDate || item.date || "1970-01-01";
          const compareDate = new Date(compareDateStr); 
          compareDate.setHours(0,0,0,0);
          if (compareDate < today) past.push(item); 
          else future.push(item);
        } catch(e) { future.push(item); }
      }
    });
    
    if (activeTab === 'AGENDA') {
      past.sort((a, b) => {
        const dateA = new Date((a.endDate || a.date || "1970-01-01") + (a.time ? `T${a.time}:00` : 'T08:00:00')).getTime();
        const dateB = new Date((b.endDate || b.date || "1970-01-01") + (b.time ? `T${b.time}:00` : 'T08:00:00')).getTime();
        return (dateB || 0) - (dateA || 0); 
      });
    }
    return { past, future, hasNewAgenda, hasNewPolls };
  };

  const { past, future, hasNewAgenda, hasNewPolls } = processItemsData();

  const doVoteEvent = async (eventId, val) => {
    if (!userName) { setShowAuthPrompt(true); return; } 
    if (!authUser) return;
    const item = items.find(i => i.id === eventId);
    if (!item) return;

    const newVotes = { ...(item.votes || {}) }; 
    const previousVote = newVotes[userId];
    let newVoters = [...(item.voters || [])];

    if (previousVote === val) {
      delete newVotes[userId]; 
      trackAction('remove_vote_event', 'engagement', val === 1 ? 'upvote' : 'downvote');
    } else { 
      newVotes[userId] = val; 
      trackAction('add_vote_event', 'engagement', val === 1 ? 'upvote' : 'downvote');
      if (!newVoters.includes(userId)) { addXp(5); newVoters.push(userId); }
    }
    try { await setDoc(doc(db, getEventsPath(), eventId.toString()), { ...item, votes: newVotes, voters: newVoters }); } catch (e) { console.error("Erreur vote:", e); }
  };

  const doVotePoll = async (pollId, optionId) => {
    if (!userName) { setShowAuthPrompt(true); return; } 
    if (!authUser) return;
    const item = items.find(i => i.id === pollId); 
    if (!item || (item.voters || []).includes(userId)) return alert("Déjà voté !");
    
    const updatedItem = { 
      ...item, voters: [...(item.voters || []), userId], 
      options: (item.options || []).map(opt => opt.id === optionId ? { ...opt, votes: (opt?.votes || 0) + 1, votersList: [...(opt?.votersList || []), userId] } : opt) 
    };

    try {
      await setDoc(doc(db, getEventsPath(), pollId.toString()), updatedItem);
      addXp(5); trackAction('vote_poll', 'engagement', 'sondage');
    } catch (e) { console.error("Erreur vote sondage:", e); }
  };

  const handleDelete = async (id) => { 
    if (!authUser) return;
    if (window.confirm("Supprimer définitivement pour tout le monde ?")) {
      try {
        await deleteDoc(doc(db, getEventsPath(), id.toString()));
        trackAction('delete_item', 'moderation', 'delete');
      } catch (e) { console.error("Erreur suppression:", e); }
    }
  };

  const renderItemCard = (item, isHistory) => {
    const score = getReliabilityScore(item);
    const isHidden = userRole === 'USER' && score <= HIDE_THRESHOLD;
    const isPersonal = item.scope === userId; 
    const isCompleted = (item.completedBy || []).includes(userId);
    const canEdit = userRole !== 'USER' || isPersonal || item.authorId === userId;
    
    const subject = item.category === 'EVENT' ? (getSubject(item.subjectCode) || getSubject('AUTRE')) : getSubject('AUTRE');
    const SubIcon = subject?.icon || HelpCircle;
    const subjectColor = subject?.color || 'text-slate-500';
    const subColors = getSubjectColorClasses(subjectColor);
    
    const showVoters = expandedPolls.includes(item.id);
    const toggleVoters = (e) => { e.stopPropagation(); setExpandedPolls(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]); };

    return (
      <Card key={item.id} className={`p-5 relative group transition-all duration-500 flex flex-col justify-between h-full ${isHistory ? 'opacity-60 grayscale' : 'hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10'} ${isHidden ? 'opacity-30 blur-[2px] grayscale' : ''} ${item.pinned && !isHistory ? 'border-amber-200 ring-2 ring-amber-100 shadow-amber-500/5 bg-gradient-to-b from-amber-50/30 to-white' : ''} ${isPersonal ? 'border-dashed border-2 border-slate-300 bg-slate-50/50' : item.scope === 'GROUP' ? 'border-purple-200 bg-purple-50/30' : 'border-white/50 bg-white/90'}`}>
        
        {canEdit && (
          <div className="absolute -top-3 -right-2 flex gap-2 z-10">
            {userRole !== 'USER' && <button onClick={(e) => { e.stopPropagation(); handleTogglePin(item.id, item.pinned); }} className={`${item.pinned ? 'bg-amber-500 shadow-amber-200' : 'bg-slate-700 shadow-slate-200'} text-white p-2.5 rounded-full shadow-md hover:scale-110 transition-transform`}><Pin size={14} fill={item.pinned ? "currentColor" : "none"} /></button>}
            <button onClick={(e) => { e.stopPropagation(); startEditWizard(item); }} className="bg-indigo-500 text-white p-2.5 rounded-full shadow-md hover:scale-110 transition-transform"><Edit size={14}/></button>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="bg-red-500 text-white p-2.5 rounded-full shadow-md hover:scale-110 transition-transform"><Trash2 size={14}/></button>
          </div>
        )}
        
        {item.category === 'EVENT' && (
          <div className="flex gap-4 items-start flex-1">
             {!isPersonal && (
               <div className="flex flex-col items-center gap-1 bg-slate-50/80 p-1.5 rounded-2xl border border-slate-100 shrink-0 shadow-inner">
                  <button onClick={() => doVoteEvent(item.id, 1)} className={`p-1.5 rounded-xl transition-all ${item.votes?.[userId] === 1 ? 'bg-green-100 text-green-600 shadow-sm' : 'text-slate-400 hover:bg-white'}`}><ThumbsUp size={18} /></button>
                  <span className={`font-black text-sm ${score > 0 ? 'text-green-600' : score < 0 ? 'text-red-500' : 'text-slate-400'}`}>{score > 0 ? '+' : ''}{score}</span>
                  <button onClick={() => doVoteEvent(item.id, -1)} className={`p-1.5 rounded-xl transition-all ${item.votes?.[userId] === -1 ? 'bg-red-100 text-red-500 shadow-sm' : 'text-slate-400 hover:bg-white'}`}><ThumbsDown size={18} /></button>
               </div>
             )}
             
             <div className="flex-1 min-w-0 flex flex-col h-full">
                <div className="flex justify-between items-center mb-3">
                   <div className="flex items-center gap-2">
                     <button onClick={(e) => { e.stopPropagation(); toggleTaskCompletion(item.id); }} className={`p-1 hover:scale-110 transition-transform ${isCompleted ? 'text-green-500' : 'text-slate-300 hover:text-indigo-500'}`} title="Marquer comme terminé">
                       {isCompleted ? <CheckCircle size={20} /> : <Circle size={20} />}
                     </button>
                     {item.pinned && <span className="bg-amber-100 text-amber-600 p-1.5 rounded-full" title="Épinglé"><Pin size={12} fill="currentColor" /></span>}
                     <Badge type={item.type} />
                   </div>
                   <div className="flex flex-col items-end gap-1 text-right">
                      {item.endDate ? (
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 whitespace-nowrap">
                          Du {formatShortDate(item.date)} au {formatShortDate(item.endDate)}
                        </span>
                      ) : (
                        <span className={`text-xs font-bold ${getRelativeDate(item.date)==='Demain'?'text-red-500 bg-red-50 px-2 py-1 rounded-lg':'text-slate-400'}`}>{getRelativeDate(item.date)}</span>
                      )}
                      {item.time && <span className="text-[10px] font-black bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-md border border-indigo-100 mt-1">{item.time}</span>}
                   </div>
                </div>
                <div className="flex items-start gap-2 mb-2">
                   <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${subColors.bg} ${subColors.text}`}>
                       <SubIcon size={16} />
                   </div>
                   <div className="flex flex-col min-w-0">
                       <span className="font-bold text-sm text-slate-700 leading-snug">{subject.code} : {subject.name}</span>
                       {subject.prof && <span className="text-[10px] text-slate-500 mt-0.5 font-medium">{subject.prof}</span>}
                   </div>
                </div>
                <p className={`text-base font-medium ml-1 leading-snug flex-1 mt-2 ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{item.title}</p>
                
                {item.link && (
                  <a href={item.link.startsWith('http') ? item.link : `https://${item.link}`} target="_blank" rel="noopener noreferrer" onClick={(e) => { e.stopPropagation(); trackAction('click_link', 'engagement', 'external_link'); }} className="mt-2 ml-1 flex items-center gap-1.5 text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg w-fit border border-blue-100 hover:bg-blue-100 transition-colors">
                    <ExternalLink size={12} /> Lien utile
                  </a>
                )}

                {item.scope === 'GROUP' && item.sharedWith && item.sharedWith.length > 0 && (
                  <div className="mt-3 ml-1 flex items-start gap-1.5 text-[11px] font-bold text-purple-600 bg-purple-50 px-2.5 py-1.5 rounded-lg w-fit border border-purple-100 max-w-full">
                    <Users size={14} className="shrink-0 mt-0.5" /> 
                    <span className="leading-tight">
                      Groupe : {item.sharedWith.map(id => allUsers.find(u => u.id === id)?.name || 'Anonyme').join(', ')}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center mt-4 border-t border-slate-50 pt-3">
                   <div className="flex items-center gap-2 opacity-80">
                      <div className="text-lg" title="Avatar">{item.authorAvatar || '👤'}</div>
                      {!isPersonal && <UserBadge xp={item.authorXp || 0} />}
                      <span className="text-[10px] text-slate-500 font-bold truncate max-w-[80px]" title={item.author}>{item.author}</span>
                   </div>
                   <span className={`text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 ${isPersonal ? 'bg-slate-800 text-white shadow-sm' : item.scope === 'GROUP' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'text-slate-500 bg-slate-100'}`}>
                     {isPersonal && <Lock size={10} />}
                     {item.scope === 'GROUP' && <Users size={10} />}
                     {isPersonal ? 'PERSO' : item.scope === 'GROUP' ? 'GROUPE' : item.scope}
                   </span>
                </div>
             </div>
          </div>
        )}
        {item.category === 'POLL' && (
          <div className="w-full flex flex-col h-full">
             <div className="flex items-center gap-2 mb-3 justify-between">
               <div className="flex items-center gap-2">
                 {item.pinned && <span className="bg-amber-100 text-amber-600 p-1.5 rounded-full" title="Épinglé"><Pin size={12} fill="currentColor" /></span>}
                 <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><BarChart size={12}/> Sondage</span>
               </div>
               {isPersonal && <span className="text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 bg-slate-800 text-white shadow-sm"><Lock size={10} /> PERSO</span>}
             </div>
             <h4 className="font-bold text-lg text-slate-800 mb-4 px-1 flex-1">{item.title}</h4>
             <div className="space-y-3">
               {(item.options || []).map((opt, idx) => {
                  const totalVotes = (item.options || []).reduce((acc, curr) => acc + (curr?.votes || 0), 0);
                  const percent = totalVotes === 0 ? 0 : Math.round(((opt?.votes || 0) / totalVotes) * 100);
                  const isVoted = (item.voters || []).includes(userId);
                  return (
                    <div key={opt?.id || idx} className="flex flex-col">
                      <button disabled={isVoted} onClick={() => doVotePoll(item.id, opt.id)} className={`w-full relative h-12 bg-slate-50 overflow-hidden border transition-all text-left group ${showVoters && (opt.votersList || []).length ? 'rounded-t-2xl border-slate-200 border-b-0' : 'rounded-2xl border-slate-100 hover:border-indigo-200'}`}>
                        <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-100 to-purple-50 transition-all duration-700 ease-out" style={{width: `${percent}%`}}></div>
                        <div className="absolute inset-0 flex justify-between items-center px-4">
                           <span className="text-sm font-bold z-10 text-slate-700 group-hover:text-indigo-900 transition-colors truncate pr-2">{opt?.text || ''}</span>
                           <span className="text-xs font-black z-10 text-indigo-600 shrink-0">{percent}% <span className="text-slate-400 font-normal ml-1">({opt?.votes || 0})</span></span>
                        </div>
                      </button>
                      {showVoters && (
                        <div className="flex flex-wrap gap-2 px-4 py-3 bg-slate-50 border-x border-b border-slate-200 rounded-b-2xl shadow-inner z-0 animate-in fade-in slide-in-from-top-2 duration-300">
                           {(opt.votersList || []).length > 0 ? (
                              (opt.votersList || []).map(vId => {
                                 const vUser = allUsers.find(u => u.id === vId);
                                 return (
                                   <div key={vId} className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm" title={vUser?.name || 'Anonyme'}>
                                     <span className="text-base leading-none">{vUser?.avatar || '👤'}</span>
                                     <span className="text-[11px] font-bold text-slate-700 truncate max-w-[80px]">{vUser?.name?.split(' ')[0] || 'Anonyme'}</span>
                                   </div>
                                 );
                              })
                           ) : (
                              <span className="text-[11px] text-slate-400 italic py-1">Aucun vote pour l'instant</span>
                           )}
                        </div>
                      )}
                    </div>
                  );
               })}
             </div>
             <div className="flex justify-between items-center mt-4 border-t border-slate-50 pt-3">
               <button onClick={toggleVoters} className="text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors flex items-center gap-1">
                 {showVoters ? <EyeOff size={14}/> : <Eye size={14}/>} {showVoters ? 'Masquer les votes' : 'Voir qui a voté'}
               </button>
               <span className="text-xs text-slate-400 font-medium">{(item.voters || []).length} participants</span>
             </div>
          </div>
        )}
      </Card>
    );
  };

  // --- RENDU EMPLOI DU TEMPS REVISITÉ POUR MULTI-JOURS ---
  const renderPlanningView = () => {
    const monday = getMonday(timetableDate);
    monday.setHours(0,0,0,0);

    const baseSelectedDate = new Date(monday);
    baseSelectedDate.setDate(baseSelectedDate.getDate() + timetableDayIndex);

    // Déterminer les jours à rendre en fonction de la vue (1D, WEEK)
    let daysToRender = [];
    if (timetableSpan === '1D') {
        daysToRender = [baseSelectedDate];
    } else { // WEEK
        daysToRender = [0, 1, 2, 3, 4].map(offset => {
            const d = new Date(monday);
            d.setDate(d.getDate() + offset);
            return d;
        });
    }

    // Filtrage des événements pour le groupe
    let visibleEvents = timetableEvents.filter(e => isEventVisibleForFilter(e, timetableFilter));

    // Répartition des événements par jour
    const eventsByDay = daysToRender.map(day => {
        return visibleEvents.filter(e => {
            const eDate = new Date(e.start.dateTime);
            return eDate.toDateString() === day.toDateString();
        }).sort((a, b) => new Date(a.start.dateTime) - new Date(b.start.dateTime));
    });

    // Séparation des événements "Toute la journée" (>= 8h) et des "Cours horaires"
    const allDayEventsByDay = eventsByDay.map(dayEvents => dayEvents.filter(e => {
        if (e.isAllDay) return true;
        const durationHours = (new Date(e.end.dateTime).getTime() - new Date(e.start.dateTime).getTime()) / 3600000;
        return durationHours >= 8;
    }));
    
    const timedEventsByDay = eventsByDay.map(dayEvents => dayEvents.filter(e => {
        if (e.isAllDay) return false;
        const durationHours = (new Date(e.end.dateTime).getTime() - new Date(e.start.dateTime).getTime()) / 3600000;
        return durationHours < 8;
    }));

    // Calcul des minHour et maxHour de manière globale pour les jours affichés
    let minHour = 24;
    let maxHour = 0;
    timedEventsByDay.flat().forEach(e => {
        const hStart = new Date(e.start.dateTime).getHours();
        const hEnd = new Date(e.end.dateTime).getHours() + (new Date(e.end.dateTime).getMinutes() > 0 ? 1 : 0);
        if (hStart < minHour) minHour = hStart;
        if (hEnd > maxHour) maxHour = hEnd;
    });

    if (minHour >= maxHour) {
        minHour = 8;
        maxHour = 18;
    } else {
        minHour = Math.max(0, minHour - 1); 
        maxHour = Math.min(24, maxHour + 1); 
    }

    const pxPerMinute = 2.5; 
    const topPadding = 15;
    const totalHeight = (maxHour - minHour) * 60 * pxPerMinute;

    const hasAnyEvent = eventsByDay.flat().length > 0;

    return (
        <div className="flex flex-col flex-1 w-full animate-in fade-in duration-500">
            {/* Contrôles de la semaine et Filtres */}
            <div className="w-full mt-2 mb-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-3 mb-4">
                    {/* Contrôle des semaines */}
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 w-full md:w-auto justify-between md:justify-center">
                        <button onClick={() => setTimetableDate(d => new Date(d.setDate(d.getDate() - 7)))} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 transition">
                            <ChevronLeft size={20} />
                        </button>
                        <span className="font-bold text-slate-700 text-sm min-w-[150px] text-center">
                            {monday.getDate()} {moisNoms[monday.getMonth()]} - {new Date(monday.getTime() + 4*86400000).getDate()} {moisNoms[new Date(monday.getTime() + 4*86400000).getMonth()]}
                        </span>
                        <button onClick={() => setTimetableDate(d => new Date(d.setDate(d.getDate() + 7)))} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 transition">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    
                    {/* Boutons Span (1J, Semaine) & Aujourd'hui */}
                    <div className="flex items-center gap-2 w-full md:w-auto justify-between">
                        <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200 w-full sm:w-auto justify-center">
                            {['1D', 'WEEK'].map(span => (
                                <button
                                    key={span}
                                    onClick={() => {
                                        setTimetableSpan(span);
                                        localStorage.setItem(STORAGE_KEY + '_viewSpan', span);
                                    }}
                                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${timetableSpan === span ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                                >
                                    {span === '1D' ? '1 Jour' : 'Semaine'}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => {
                            const n = new Date();
                            setTimetableDate(n);
                            let d = n.getDay();
                            setTimetableDayIndex((d >= 1 && d <= 5) ? d - 1 : 0);
                        }} className="p-2 sm:px-4 sm:py-2 text-indigo-600 hover:text-white hover:bg-indigo-600 transition bg-indigo-50 rounded-xl shadow-sm border border-indigo-100 flex items-center justify-center gap-2 shrink-0">
                            <Clock size={16} /> <span className="hidden sm:inline text-sm font-medium">Aujourd'hui</span>
                        </button>
                    </div>
                </div>

                {/* Barre de filtres de Groupes */}
                <div className="flex overflow-x-auto gap-2 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full mb-2">
                    {['ALL', 'TD1', 'TD2', 'G1', 'G2', 'G3', 'G4'].map(f => (
                      <button
                        key={f}
                        onClick={() => setTimetableFilter(f)}
                        className={`px-4 py-2 rounded-xl font-bold text-sm shrink-0 transition-all ${timetableFilter === f ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                      >
                        {f === 'ALL' ? 'Toute la Promo' : f}
                      </button>
                    ))}
                </div>

                {/* Onglets des jours (Affichés uniquement en mode 1J pour choisir le début) */}
                {timetableSpan === '1D' && (
                  <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 flex overflow-x-auto hide-scroll w-full mb-2">
                      {Array.from({length: 5}).map((_, i) => {
                          const dayDate = new Date(monday);
                          dayDate.setDate(dayDate.getDate() + i);
                          const isActive = (i === timetableDayIndex);
                          const isToday = (dayDate.toDateString() === new Date().toDateString());
                          
                          return (
                              <button key={i} onClick={() => setTimetableDayIndex(i)} 
                                  className={`flex-1 min-w-[100px] flex flex-col items-center justify-center py-2.5 px-4 rounded-xl transition-all duration-200 font-medium cursor-pointer text-sm gap-0.5 relative
                                  ${isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200/50 scale-[1.02] ring-1 ring-indigo-500' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                                  {isToday && !isActive && <div className="absolute top-2 right-3 w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>}
                                  <span className={`uppercase tracking-wider text-[10px] sm:text-xs ${isActive ? 'opacity-90' : 'opacity-70'}`}>{joursSemaine[i]}</span>
                                  <span className="font-bold text-base sm:text-lg leading-none">{dayDate.getDate()}</span>
                              </button>
                          );
                      })}
                  </div>
                )}
            </div>

            {/* Error or Loading State */}
            {timetableLoading && (
                <div className="flex flex-col items-center justify-center py-20 flex-1">
                    <RefreshCcw size={40} className="animate-spin text-indigo-500 mb-4" />
                    <p className="text-slate-500 font-medium mt-4">Lecture du calendrier officiel...</p>
                </div>
            )}
            
            {timetableError && (
                <div className="flex flex-col items-center justify-center py-10 bg-red-50 rounded-2xl border border-red-200 mb-6 shadow-sm">
                    <AlertCircle size={32} className="text-red-500 mb-3" />
                    <p className="text-red-700 font-bold">Impossible de charger l'emploi du temps.</p>
                </div>
            )}

            {/* Grid State Empty */}
            {!timetableLoading && !timetableError && !hasAnyEvent && (
                <div className="flex flex-col items-center justify-center h-full min-h-[350px] text-center p-8 bg-white/60 border border-slate-200 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-fade-in mt-2">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-5 border border-slate-100 shadow-inner">
                        <Coffee size={40} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Période libre</h3>
                    <p className="text-sm font-medium text-slate-400 max-w-xs leading-relaxed">
                        {timetableFilter !== 'ALL' ? `Aucun cours trouvé pour le filtre "${timetableFilter}".` : "Aucun cours n'est prévu sur cette période. Profites-en !"}
                    </p>
                </div>
            )}

            {/* Timeline Multi-Jours (Sans boite globale, complètement à plat) */}
            {!timetableLoading && !timetableError && hasAnyEvent && (
                <div className="flex flex-col w-full animate-in fade-in duration-500 relative mb-8 z-0">
                    <div className="flex w-full overflow-x-auto snap-x snap-mandatory scroll-pl-10 sm:scroll-pl-14 custom-scrollbar pb-8 pt-2">
                        
                        <div className="flex flex-col min-w-full w-max">
                            
                            {/* ROW 1: En-têtes et Événements "Toute la journée" */}
                            <div className="flex w-full relative z-20">
                                {/* Coin supérieur gauche (fixe) z-[60] pour recouvrir tout au scroll */}
                                <div className="w-10 sm:w-14 shrink-0 sticky left-0 top-0 z-[60] bg-[#F8FAFC] border-r border-b border-slate-200/50"></div>
                                
                                {daysToRender.map((day, dIdx) => {
                                    const dayAllDayEvents = allDayEventsByDay[dIdx];
                                    const isToday = day.toDateString() === now.toDateString();
                                    return (
                                        <div key={`header-${dIdx}`} className={`flex-1 flex flex-col min-w-[85vw] sm:min-w-[300px] border-r border-b border-slate-200/50 last:border-r-0 snap-start relative px-1 sm:px-2 ${timetableSpan === '1D' ? 'max-w-3xl mx-auto' : ''}`}>
                                            <div className={`h-14 flex flex-col items-center justify-center sticky top-0 z-[50] mb-3 bg-[#F8FAFC]/95 backdrop-blur-sm ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>
                                                <span className="text-[10px] font-bold uppercase">{getDayName(day)}</span>
                                                <span className="text-sm font-black">{day.getDate()}</span>
                                            </div>
                                            
                                            {/* Événements Journée Complète */}
                                            <div className="pb-3 flex flex-col gap-2 z-0 w-full flex-1">
                                                {dayAllDayEvents.map(e => {
                                                    const { title, audience, prof } = extractEventDetails(e);
                                                    const subject = getSubjectFromTitle((e.summary || '') + ' ' + (e.description || ''));
                                                    const SubIcon = subject?.icon || HelpCircle;
                                                    const subColors = getSubjectColorClasses(subject?.color);
                                                    const style = parseEventStyle(e.summary || title);

                                                    return (
                                                        <div key={e.id} className={`p-3 relative overflow-hidden flex flex-col h-auto rounded-xl border backdrop-blur-sm z-0 ${style.bg} ${style.border}`}>
                                                            <div className="flex justify-between items-start mb-1.5 gap-1">
                                                                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-100">
                                                                    <Sun size={10} strokeWidth={3} /> Journée
                                                                </span>
                                                                <div className="flex flex-col items-end gap-1">
                                                                    {style.type === 'DEVOIR' && <span className="text-[8px] font-black text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-md border border-orange-200 uppercase">Devoir</span>}
                                                                    {style.type === 'EVAL' && <span className="text-[8px] font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded-md border border-red-200 uppercase">Éval</span>}
                                                                    {audience && <span className="text-[8px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200 uppercase">{audience}</span>}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-start gap-2">
                                                                <div className={`p-1.5 rounded-lg mt-0.5 ${subColors.bg} ${subColors.text} shadow-sm border border-white/50`}>
                                                                    <SubIcon size={14} />
                                                                </div>
                                                                <div className="flex flex-col min-w-0 flex-1">
                                                                    <span className="font-bold text-[10px] text-slate-500 truncate">{subject.code} : {subject.name}</span>
                                                                    <span className={`font-bold text-xs leading-snug line-clamp-2 mt-0.5 ${style.text}`}>{title}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* ROW 2: Grille Horaires */}
                            <div className="flex w-full relative z-10" style={{minHeight: totalHeight + topPadding * 2}}>
                                
                                {/* Axe Heures (fixe à gauche, fond plein et z-[40] pour bloquer les cartes) */}
                                <div className="w-10 sm:w-14 shrink-0 sticky left-0 z-[40] bg-[#F8FAFC] border-r border-slate-200/50 flex flex-col shadow-[4px_0_15px_-3px_rgba(0,0,0,0.05)]">
                                    <div className="relative flex-1 w-full">
                                        {Array.from({length: maxHour - minHour + 1}).map((_, i) => (
                                            <div key={`hour-${i}`} className="absolute w-full text-right pr-2 text-[10px] font-bold text-slate-400" style={{top: i * 60 * pxPerMinute + topPadding, transform: 'translateY(-50%)'}}>
                                                {minHour + i}h
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Lignes Horizontales */}
                                <div className="absolute left-[2.5rem] sm:left-[3.5rem] right-0 top-0 bottom-0 pointer-events-none overflow-hidden z-0">
                                    {Array.from({length: maxHour - minHour + 1}).map((_, i) => (
                                        <div key={`global-line-${i}`} className="absolute w-full border-t border-slate-200/50" style={{top: i * 60 * pxPerMinute + topPadding, height: 1}}></div>
                                    ))}
                                </div>

                                {/* Colonnes Jours */}
                                {daysToRender.map((day, dIdx) => {
                                    const dayTimedEvents = timedEventsByDay[dIdx];
                                    const isToday = day.toDateString() === now.toDateString();
                                    
                                    // Logique des chevauchements (overlaps)
                                    const overlapGroups = [];
                                    let currentGroup = [];
                                    let currentGroupEnd = 0;
                                    
                                    dayTimedEvents.forEach(event => {
                                        const start = new Date(event.start.dateTime).getTime();
                                        const end = new Date(event.end.dateTime).getTime();
                                        if (currentGroup.length === 0) {
                                            currentGroup.push(event); currentGroupEnd = end;
                                        } else if (start < currentGroupEnd) {
                                            currentGroup.push(event); currentGroupEnd = Math.max(currentGroupEnd, end);
                                        } else {
                                            overlapGroups.push(currentGroup); currentGroup = [event]; currentGroupEnd = end;
                                        }
                                    });
                                    if (currentGroup.length > 0) overlapGroups.push(currentGroup);

                                    return (
                                        <div key={`grid-${dIdx}`} className={`flex-1 flex flex-col min-w-[85vw] sm:min-w-[300px] border-r border-slate-200/50 last:border-r-0 snap-start relative px-1 sm:px-2 ${timetableSpan === '1D' ? 'max-w-3xl mx-auto' : ''}`}>
                                            <div className="relative flex-1 w-full h-full z-10">
                                                
                                                {/* Ligne temps actuel */}
                                                {isToday && (() => {
                                                    const currentMinutes = (now.getHours() - minHour) * 60 + now.getMinutes();
                                                    if (currentMinutes >= 0 && currentMinutes <= (maxHour - minHour) * 60) {
                                                        const topPx = currentMinutes * pxPerMinute + topPadding;
                                                        return (
                                                            <div className="absolute w-full flex items-center z-20 pointer-events-none" style={{top: topPx, left: 0}}>
                                                                <div className="absolute -left-1 w-2 h-2 bg-red-500 rounded-full" style={{transform: 'translateY(-50%)'}}></div>
                                                                <div className="w-full border-t-2 border-red-500/50 border-dashed"></div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}

                                                {overlapGroups.flatMap((group) => {
                                                    return group.map((e, i) => {
                                                        const widthPercent = 100 / group.length;
                                                        const leftPercent = (100 / group.length) * i;
                                                        const startObj = new Date(e.start.dateTime);
                                                        const endObj = new Date(e.end.dateTime);
                                                        const startMinutes = (startObj.getHours() - minHour) * 60 + startObj.getMinutes();
                                                        const durationMinutes = (endObj.getTime() - startObj.getTime()) / 60000;
                                                        const topPx = startMinutes * pxPerMinute + topPadding;
                                                        const heightPx = Math.max(40, durationMinutes * pxPerMinute); // Hauteur minimale de 40px

                                                        const { title, audience, prof } = extractEventDetails(e);
                                                        const location = e.location ? e.location.split(',')[0] : '';
                                                        const subject = getSubjectFromTitle((e.summary || '') + ' ' + (e.description || ''));
                                                        const SubIcon = subject?.icon || HelpCircle;
                                                        const subColors = getSubjectColorClasses(subject?.color);
                                                        const style = parseEventStyle(e.summary || title);
                                                        const isOngoing = isToday && startObj <= now && endObj >= now;

                                                        return (
                                                            // z-10 max pour les cartes pour passer derrière z-[40] (l'axe)
                                                            <div key={e.id} className="absolute p-1 z-10 hover:z-30 transition-all"
                                                                 style={{top: topPx, left: `${leftPercent}%`, width: `${widthPercent}%`, height: heightPx}}>
                                                                 <div className={`h-full w-full rounded-2xl p-2 sm:p-3 flex flex-col overflow-hidden relative border backdrop-blur-sm ${style.bg} ${style.border} ${isOngoing ? 'ring-2 ring-indigo-400 shadow-md' : 'shadow-sm hover:shadow-md hover:border-indigo-300'}`}>
                                                                     <div className="flex justify-between items-start mb-1.5 gap-1">
                                                                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border ${isOngoing ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-white/60 text-slate-600 border-slate-200/60'}`}>
                                                                            <Clock size={10} strokeWidth={3} className={isOngoing ? 'animate-pulse text-indigo-500' : 'text-slate-400'} />
                                                                            {formatTime(startObj)} - {formatTime(endObj)}
                                                                        </span>
                                                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                                                            {style.type === 'DEVOIR' && <span className="text-[8px] font-black text-orange-600 bg-orange-100 px-1 py-0.5 rounded border border-orange-200 uppercase">Devoir</span>}
                                                                            {style.type === 'EVAL' && <span className="text-[8px] font-black text-red-600 bg-red-100 px-1 py-0.5 rounded border border-red-200 uppercase">Éval</span>}
                                                                            {audience && <span className="text-[8px] font-black text-slate-500 bg-slate-100 px-1 py-0.5 rounded border border-slate-200 uppercase">{audience}</span>}
                                                                        </div>
                                                                     </div>
                                                                     <div className="flex items-start gap-1.5 flex-1 min-h-0 overflow-hidden">
                                                                        <div className={`p-1.5 rounded-md mt-0.5 shrink-0 ${subColors.bg} ${subColors.text} shadow-sm border border-white/50`}>
                                                                            <SubIcon size={12} />
                                                                        </div>
                                                                        <div className="flex flex-col min-w-0 flex-1">
                                                                            <span className="font-bold text-[9px] text-slate-500 leading-tight truncate">{subject.code} : {subject.name}</span>
                                                                            <span className={`font-bold text-[11px] leading-snug line-clamp-2 mt-0.5 ${style.text}`}>{title}</span>
                                                                            {heightPx >= 60 && (location || prof) && (
                                                                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                                                    {location && <span className="text-[9px] text-slate-500 font-bold flex items-center gap-0.5 truncate"><MapPin size={8} className="text-indigo-400 shrink-0"/> {location}</span>}
                                                                                    {prof && prof !== 'Professeur non renseigné' && <span className="text-[9px] text-slate-500 font-medium flex items-center gap-0.5 truncate"><User size={8}/> {prof}</span>}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                     </div>
                                                                 </div>
                                                            </div>
                                                        );
                                                    });
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  };

  // --- ECRAN DE CHARGEMENT ---
  if (isSplashVisible) {
    return (
      <div className="h-screen w-full bg-[#F8FAFC] flex flex-col items-center justify-center relative font-sans">
        <div className="flex flex-col items-center animate-pulse">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[2rem] mb-6 shadow-2xl shadow-indigo-300 text-white transform -rotate-3">
            <Zap size={40} fill="currentColor"/>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Class Hub {APP_VERSION_STRING}</h1>
          <p className="text-slate-500 font-medium">L'agenda MMI</p>
        </div>
        <div className="absolute bottom-12 text-slate-400 font-medium tracking-[0.2em] text-[10px] uppercase flex flex-col items-center gap-1 animate-in fade-in duration-1000 delay-300">
          <span>Powered by</span>
          <span className="font-black text-slate-800 text-sm tracking-widest">87k Media</span>
        </div>
      </div>
    );
  }

  // --- ECRAN MISE À JOUR ---
  if (needsUpdate) {
    return (
      <div className="h-screen w-full bg-[#F8FAFC] flex flex-col items-center justify-center relative font-sans p-6 text-center">
         <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full animate-in zoom-in duration-300 border border-indigo-100">
           <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
             <RefreshCcw size={40} className="animate-spin" />
           </div>
           <h2 className="text-2xl font-black text-slate-800 mb-2">Mise à jour requise</h2>
           <p className="text-slate-500 mb-8 font-medium">Une nouvelle version de ClassHub est disponible. Mets à jour pour synchroniser les dernières nouveautés.</p>
           <button onClick={handleForceUpdate} className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2">
             <Zap size={20} fill="currentColor"/> Mettre à jour
           </button>
         </div>
      </div>
    );
  }

  // --- ECRAN ONBOARDING ---
  if (view === 'onboarding' || !userGroup) {
    const activeColors = ONBOARDING_COLORS[tempGroup] || ONBOARDING_COLORS[1];

    return (
      <div className={`min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center font-sans relative overflow-hidden py-10 px-4 transition-colors duration-700`}>
        <div className={`absolute top-0 w-full h-96 ${activeColors.blob || 'bg-indigo-500'} opacity-[0.08] blur-[100px] pointer-events-none transition-colors duration-700`}></div>
        <div className={`absolute bottom-0 w-full h-96 ${activeColors.blob || 'bg-purple-500'} opacity-[0.08] blur-[100px] pointer-events-none transition-colors duration-700`}></div>

        <div className="w-full max-w-lg mx-auto z-10 flex-1 flex flex-col">
          <div className="text-center animate-in zoom-in duration-500 mb-2 mt-auto">
            <div className={`inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br ${activeColors.from} ${activeColors.to} rounded-[1.8rem] mb-6 shadow-xl text-white transition-all duration-700`}>
              <Zap className="w-9 h-9 md:w-12 md:h-12" fill="currentColor"/>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-2 transition-colors duration-700">ClassHub</h1>
            <p className="text-slate-500 font-medium text-sm md:text-base">IUT Limoges • L'agenda MMI</p>
          </div>

          <div className="flex flex-col items-center justify-center w-full mb-auto mt-6">
            <span className="text-[10px] md:text-xs font-black tracking-[0.2em] text-slate-400 mb-2 uppercase">
              Choisis ton groupe
            </span>
            
            <div 
              className="relative w-full h-[220px] flex items-center justify-center animate-in slide-in-from-bottom-8 duration-700"
              style={{ 
                WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)',
                maskImage: 'linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)' 
              }}
            >
              <div 
                ref={groupScrollRef}
                onScroll={handleScrollGroup}
                className="h-full w-full overflow-y-auto snap-y snap-mandatory scroll-smooth relative z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-[70px]"
              >
                <div className="flex flex-col gap-6">
                  {[1, 2, 3, 4].map(num => {
                    const color = ONBOARDING_COLORS[num];
                    const isSelected = tempGroup === num;
                    return (
                      <button 
                        key={num} 
                        onClick={() => {
                          const container = groupScrollRef.current;
                          if (container && container.children[0].children[num - 1]) {
                            const item = container.children[0].children[num - 1];
                            container.scrollTo({ top: item.offsetTop - container.clientHeight / 2 + item.clientHeight / 2, behavior: 'smooth' });
                          }
                        }}
                        className="w-full h-[80px] shrink-0 snap-center flex items-center justify-center group outline-none"
                      >
                        <span className={`block text-[80px] md:text-[100px] leading-none font-black transition-all duration-300 ${isSelected ? `${color.text} scale-110 drop-shadow-xl` : 'text-slate-300 scale-90 opacity-40'}`}>
                          {num}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <button 
              onClick={() => {handleOnboarding(`G${tempGroup}`)}}
              className={`mt-6 w-[200px] py-4 bg-gradient-to-r ${activeColors.from} ${activeColors.to} text-white rounded-2xl font-black text-lg shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 animate-in zoom-in`}
            >
              C'est parti !
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans relative text-slate-900">
      
      {showNotifPrompt && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-inner ring-8 ring-indigo-50">
              <BellRing size={32} className="animate-bounce" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Ne manque aucun devoir !</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">Active les notifications pour être alerté instantanément quand un nouveau devoir ou sondage est ajouté à ton groupe.</p>
            <div className="w-full space-y-3">
              <button onClick={acceptNotifPrompt} className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2">
                <Bell size={18} fill="currentColor" /> Activer les alertes
              </button>
              <button onClick={dismissNotifPrompt} className="w-full py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuthPrompt && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <User size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Compte requis</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">Tu dois te créer un pseudo pour interagir avec l'agenda et gagner de l'XP !</p>
            <div className="w-full space-y-3">
              <button onClick={() => { setShowAuthPrompt(false); setView('settings'); }} className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2">
                <User size={18} fill="currentColor" /> Créer mon profil
              </button>
              <button onClick={() => setShowAuthPrompt(false)} className="w-full py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-xl border border-indigo-100 shadow-2xl rounded-2xl p-4 flex items-start gap-3 max-w-sm w-[90vw]">
            <div className="bg-indigo-100 text-indigo-600 p-2 rounded-full shrink-0 mt-0.5"><BellRing size={20} /></div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-800">{toast.title}</h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 shrink-0 p-1"><X size={16} /></button>
          </div>
        </div>
      )}

      <header className="px-4 md:px-8 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-30 flex justify-between items-center shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="font-black text-2xl tracking-tight text-slate-900 flex items-center gap-2">
              ClassHub <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-500 hidden sm:inline-block">{GROUPS_CONFIG[userGroup]?.label}</span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 mr-4 border-r border-slate-200 pr-6">
                <button onClick={() => { if(!userName) setShowAuthPrompt(true); else {startWizard('POLL'); trackAction('open_poll_wizard', 'navigation', 'poll')} }} className="px-4 py-2 bg-white text-indigo-600 rounded-xl shadow-sm border border-indigo-50 flex items-center gap-2 font-bold hover:bg-indigo-50 transition-colors">
                  <BarChart size={18} /> Sondage
                </button>
                <button onClick={() => { if(!userName) setShowAuthPrompt(true); else {startWizard('EVENT'); trackAction('open_event_wizard', 'navigation', 'event')} }} className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-md flex items-center gap-2 font-bold hover:scale-[1.02] transition-transform">
                  <Plus size={18} strokeWidth={3}/> Ajouter
                </button>
             </div>

             <button onClick={() => { trackAction('open_settings', 'navigation', 'settings'); setView('settings'); }} className="relative group p-1 flex items-center gap-2">
               {userName ? (
                 <>
                   <div className="flex flex-col items-end">
                     <UserBadge xp={userXp} />
                     <span className="text-[10px] text-indigo-600 font-black mt-0.5">{userXp} XP</span>
                   </div>
                   <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-xl shadow-sm border border-indigo-200 hover:scale-105 transition-transform bg-white/50 backdrop-blur-sm">
                     {userAvatar}
                   </div>
                 </>
               ) : (
                 <div className="bg-slate-100 p-2.5 rounded-full text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors"><User size={20}/></div>
               )}
             </button>
          </div>
        </div>
      </header>

      {/* OVERLAY DES WIZARDS */}
      {view === 'wizard' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:p-6 animate-in fade-in duration-200">
          <div className="flex flex-col w-full h-[90vh] sm:h-auto sm:max-h-[85vh] sm:max-w-2xl bg-slate-50 sm:rounded-3xl shadow-2xl overflow-hidden rounded-t-3xl animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
            <div className="px-6 py-5 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-20">
              <div className="flex items-center gap-3">
                {wizardStep > 1 && <button onClick={() => setWizardStep(s=>s-1)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors text-slate-700"><ChevronLeft size={20}/></button>}
                <h2 className="font-bold text-xl text-slate-800">{editItemId ? 'Modifier' : 'Ajouter'}</h2>
              </div>
              <button onClick={resetWizard} className="p-2 bg-slate-50 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex justify-center gap-2 mb-8">
                 {[1,2,3,4].map(s => (
                   <div key={s} className={`h-2 rounded-full transition-all duration-300 ${wizardStep >= s ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200'}`}></div>
                 ))}
              </div>

              {wizardStep === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">C'est quoi ? 🤔</h3>
                  {addMode === 'EVENT' ? Object.keys(EVENT_TYPES).map(t => {
                    const TypeIcon = EVENT_TYPES[t].icon || HelpCircle;
                    return (
                      <button key={t} onClick={() => { setFormData({...formData, type: t}); setWizardStep(2); }} className={`w-full p-5 rounded-2xl border-2 text-left flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-95 ${formData.type === t ? 'border-indigo-500 bg-indigo-50/50 shadow-md' : 'border-white bg-white shadow-sm hover:border-indigo-100'}`}>
                        <div className={`p-3 rounded-2xl ${EVENT_TYPES[t].color.replace('border-', '')} bg-opacity-20`}><div className={EVENT_TYPES[t].color.split(' ')[1]}><TypeIcon size={24} strokeWidth={2.5}/></div></div>
                        <div><span className="block font-bold text-slate-800 text-lg">{EVENT_TYPES[t].label}</span></div>
                      </button>
                    )
                  }) : (
                     <div className="space-y-4">
                       <input autoFocus value={formData.title} className="w-full p-6 text-xl font-bold rounded-2xl border border-slate-200 bg-white shadow-inner focus:ring-4 focus:ring-indigo-100 outline-none text-center" placeholder="Ta question..." onChange={e=>setFormData({...formData, title: e.target.value})} />
                       <button onClick={()=>setWizardStep(2)} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-transform">Suivant</button>
                     </div>
                  )}
                </div>
              )}

              {wizardStep === 2 && addMode === 'EVENT' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                    {MMI_SUBJECTS.map(subj => {
                      const Icon = subj.icon || HelpCircle;
                      return (
                        <button key={subj.code} onClick={() => setFormData({...formData, subject: subj.code})} className={`flex items-start gap-3 p-3 rounded-2xl border-2 text-left transition-all ${subj.code === 'AUTRE' ? 'sm:col-span-2' : ''} ${formData.subject === subj.code ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-transparent bg-white shadow-sm hover:bg-slate-50'}`}>
                          <div className={`p-2 rounded-xl bg-slate-100 ${subj.color} shrink-0 mt-0.5`}><Icon size={18}/></div>
                          <div className="flex-1 min-w-0"><span className="block text-[10px] font-black text-slate-400 uppercase">{subj.code}</span><span className="block text-sm font-bold text-slate-700 leading-snug mt-0.5">{subj.name}</span>{subj.prof && <span className="block text-[11px] text-slate-500 mt-1 font-medium">{subj.prof}</span>}</div>
                          {formData.subject===subj.code && <Check size={18} className="text-indigo-600 bg-indigo-100 rounded-full p-1 shrink-0 mt-1"/>}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="space-y-3">
                    <input type="text" value={formData.title} className="w-full p-4 rounded-xl border border-slate-200 bg-white shadow-inner focus:ring-2 ring-indigo-500 outline-none font-medium text-slate-800" placeholder="Précisions (ex: Ex 3 p.12)" onChange={e=>setFormData({...formData, title: e.target.value})} />
                    
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Link2 size={18} className="text-slate-400" />
                      </div>
                      <input type="url" value={formData.link} className="w-full pl-11 p-4 rounded-xl border border-slate-200 bg-white shadow-inner focus:ring-2 ring-indigo-500 outline-none font-medium text-slate-800" placeholder="Lien utile (ex: Moodle, Drive...)" onChange={e=>setFormData({...formData, link: e.target.value})} />
                    </div>
                  </div>

                  <button onClick={()=>setWizardStep(3)} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-all">Suivant</button>
                </div>
              )}

              {wizardStep === 2 && addMode === 'POLL' && (
                 <div className="space-y-3 animate-in fade-in slide-in-from-right-8 duration-300">
                    {formData.pollOptions.map((opt, idx) => (
                      <input key={idx} className="w-full p-4 rounded-xl border border-slate-200 bg-white shadow-inner focus:ring-2 ring-indigo-500 outline-none font-medium text-slate-800" placeholder={`Option ${idx+1}`} value={opt} onChange={e=>{const n=[...formData.pollOptions];n[idx]=e.target.value;setFormData({...formData, pollOptions:n})}} />
                    ))}
                    <button onClick={() => setFormData({...formData, pollOptions: [...formData.pollOptions, '']})} className="w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-500 rounded-xl font-bold hover:bg-indigo-50 transition-colors">+ Ajouter une option</button>
                    <button onClick={() => setWizardStep(4)} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold mt-4 shadow-lg hover:scale-[1.02]">Suivant</button>
                 </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300 text-center py-2">
                   <h3 className="text-2xl font-bold text-slate-800 mb-2">C'est pour quand ? 📅</h3>
                   
                   <CustomCalendar 
                     startDate={formData.date} 
                     endDate={formData.endDate} 
                     onChangeRange={(start, end) => setFormData({...formData, date: start, endDate: end})} 
                   />
                   
                   <p className="text-[10px] text-slate-400 font-medium mt-2">Clique 2 fois pour définir une période</p>

                   <div className="mt-4 flex flex-col items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 w-fit mx-auto">
                      <label className="text-xs font-bold text-slate-500">Heure de rendu (Optionnel) ⏰</label>
                      <input 
                        type="time" 
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white shadow-sm focus:ring-2 ring-indigo-500 outline-none font-bold text-slate-700 transition-all cursor-pointer text-sm"
                        value={formData.time || ''}
                        onChange={(e) => setFormData({...formData, time: e.target.value})}
                      />
                   </div>

                   <div className="flex gap-2 justify-center mt-4">
                      <button onClick={() => { const d = new Date(); d.setDate(d.getDate() + 1); setFormData({...formData, date: formatDateString(d), endDate: ''}); }} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-bold hover:bg-indigo-100 transition-colors">Demain</button>
                      <button onClick={() => { const d = new Date(); d.setDate(d.getDate() + 7); setFormData({...formData, date: formatDateString(d), endDate: ''}); }} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-bold hover:bg-indigo-100 transition-colors">Semaine pro</button>
                   </div>
                   <button disabled={!formData.date} onClick={()=>setWizardStep(4)} className={`w-full py-4 rounded-xl font-bold mt-6 shadow-lg transition-all ${formData.date ? 'bg-indigo-600 text-white hover:scale-[1.02]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>Suivant</button>
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
                  <h3 className="text-2xl font-bold text-slate-800 text-center mb-4">On partage avec qui ? 📢</h3>
                  <div className="space-y-3">
                   {[ 
                     {val: 'PROMO', l: 'Toute la Promo', i: Globe, c: 'text-indigo-700 bg-indigo-200'}, 
                     {val: GROUPS_CONFIG[userGroup]?.parent || 'TD', l: `Mon TD`, i: Users, c: 'text-blue-700 bg-blue-200'}, 
                     {val: userGroup, l: `Mon Groupe`, i: User, c: 'text-emerald-700 bg-emerald-200'},
                     {val: 'GROUP', l: 'Membres spécifiques', i: Users, c: 'text-purple-700 bg-purple-200'},
                     {val: userId, l: 'Moi uniquement', i: Lock, c: 'text-slate-700 bg-slate-200'} 
                   ].map(o => {
                     const Icon = o.i || HelpCircle;
                     return (
                       <button key={o.val || 'KEY_NULL'} onClick={() => setFormData({...formData, scope: o.val})} className={`w-full p-5 rounded-2xl border-2 text-left flex items-center gap-4 transition-all ${formData.scope===o.val ? 'border-indigo-500 bg-indigo-50 shadow-md ring-2 ring-indigo-200' : 'border-white bg-white shadow-sm hover:border-indigo-100'}`}>
                         <div className={`p-3 rounded-full ${formData.scope===o.val ? o.c : 'bg-slate-100 text-slate-500'}`}><Icon size={20}/></div>
                         <span className={`text-lg font-bold ${formData.scope===o.val ? 'text-indigo-900' : 'text-slate-600'}`}>{o.l}</span>
                       </button>
                     );
                   })}

                   {formData.scope === 'GROUP' && (
                     <div className="mt-4 p-4 bg-white rounded-2xl border border-purple-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Users size={16} className="text-purple-500"/> Choisis tes coéquipiers :</h4>
                        
                        <div className="relative mb-3">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder="Rechercher un étudiant..." 
                            className="w-full pl-9 p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-purple-300 focus:ring-2 ring-purple-100 bg-slate-50 transition-all"
                            value={userSearchQuery}
                            onChange={e => setUserSearchQuery(e.target.value)}
                          />
                        </div>

                        <div className="max-h-[200px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 pr-2 custom-scrollbar">
                           {allUsers.filter(u => u.id !== userId && u.name && u.name.toLowerCase().includes(userSearchQuery.toLowerCase())).map(u => (
                              <button 
                                 key={u.id}
                                 onClick={() => {
                                    const newShared = formData.sharedWith.includes(u.id) 
                                       ? formData.sharedWith.filter(id => id !== u.id)
                                       : [...formData.sharedWith, u.id];
                                    setFormData({...formData, sharedWith: newShared});
                                 }}
                                 className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${formData.sharedWith.includes(u.id) ? 'bg-purple-50 border-purple-300 ring-1 ring-purple-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'}`}
                              >
                                 <span className="text-xl bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm shrink-0">{u.avatar}</span>
                                 <div className="flex flex-col items-start min-w-0">
                                   <span className="text-sm font-bold text-slate-800 truncate w-full text-left leading-tight">{u.name}</span>
                                   <span className="text-[10px] font-black text-slate-400">{u.group}</span>
                                 </div>
                                 {formData.sharedWith.includes(u.id) && <Check size={16} className="text-purple-600 ml-auto shrink-0"/>}
                              </button>
                           ))}
                           {allUsers.filter(u => u.id !== userId && u.name && u.name.toLowerCase().includes(userSearchQuery.toLowerCase())).length === 0 && (
                              <div className="col-span-full text-center text-sm text-slate-500 py-4 font-medium">Aucun étudiant trouvé.</div>
                           )}
                        </div>
                     </div>
                   )}
                  </div>
                  <button onClick={handlePublish} className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold mt-8 shadow-xl hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2">
                    <Zap size={20} fill="currentColor"/> {editItemId ? 'Enregistrer' : 'Envoyer !'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TABS DE NAVIGATION (Modifié avec le Planning) */}
      {view === 'list' && (
        <div className="hidden md:block px-4 py-3 bg-white/80 backdrop-blur-md z-20 border-b border-slate-100 sticky top-[72px] sm:top-[76px]">
          <div className="max-w-xl mx-auto bg-slate-100 p-1 rounded-2xl flex relative overflow-x-auto hide-scroll">
             <div 
               className="absolute top-1 bottom-1 w-[calc(25%-2px)] bg-white rounded-xl shadow-sm transition-transform duration-300 ease-out z-0"
               style={{ transform: `translateX(${activeTab === 'PLANNING' ? '0%' : activeTab === 'AGENDA' ? '100%' : activeTab === 'SONDAGES' ? '200%' : '300%'})` }}
             ></div>
             
             <button onClick={() => { trackAction('tab_planning', 'navigation', 'planning'); setActiveTab('PLANNING'); }} className={`flex-1 min-w-[90px] py-2.5 text-sm font-bold flex items-center justify-center gap-2 rounded-xl relative z-10 transition-colors ${activeTab === 'PLANNING' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
               <CalendarDays size={16}/>
               <span className="hidden sm:inline">Planning</span>
             </button>

             <button onClick={() => { trackAction('tab_agenda', 'navigation', 'agenda'); setActiveTab('AGENDA'); }} className={`flex-1 min-w-[90px] py-2.5 text-sm font-bold flex items-center justify-center gap-2 rounded-xl relative z-10 transition-colors ${activeTab === 'AGENDA' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
               <div className="relative">
                 <BookOpen size={16}/>
                 {hasNewAgenda && activeTab !== 'AGENDA' && <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-white"></span>}
               </div>
               <span className="hidden sm:inline">Devoirs</span>
             </button>
             
             <button onClick={() => { if(!userName) setShowAuthPrompt(true); else { trackAction('tab_sondages', 'navigation', 'sondages'); setActiveTab('SONDAGES'); } }} className={`flex-1 min-w-[90px] py-2.5 text-sm font-bold flex items-center justify-center gap-2 rounded-xl relative z-10 transition-colors ${activeTab === 'SONDAGES' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
               <div className="relative">
                 <BarChart size={16}/>
                 {hasNewPolls && activeTab !== 'SONDAGES' && <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-white"></span>}
               </div>
               <span className="hidden sm:inline">Sondages</span>
             </button>

             <button onClick={() => { trackAction('tab_classement', 'navigation', 'classement'); setActiveTab('CLASSEMENT'); }} className={`flex-1 min-w-[90px] py-2.5 text-sm font-bold flex items-center justify-center gap-2 rounded-xl relative z-10 transition-colors ${activeTab === 'CLASSEMENT' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
               <Trophy size={16}/>
               <span className="hidden sm:inline">XP</span>
             </button>
          </div>
        </div>
      )}

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth w-full max-w-7xl mx-auto pb-32">
        
        {view === 'list' && activeTab === 'PLANNING' && renderPlanningView()}
        
        {view === 'settings' ? (
           <div className="max-w-lg mx-auto w-full space-y-6 animate-in slide-in-from-right-8 duration-300 mt-4 md:mt-10">
             <button onClick={() => setView('list')} className="text-sm font-bold flex items-center gap-1 text-slate-500 hover:text-slate-800 mb-2"><ChevronLeft size={18}/> Retour</button>
             
             {/* PROFIL CARD */}
             <Card className="p-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-2xl shadow-indigo-200/50 relative overflow-hidden">
               <div className="relative z-10">
                 <h3 className="font-bold flex items-center gap-2 text-indigo-100 text-sm mb-6"><Sparkles size={16}/> MON PROFIL</h3>
                 
                 {userName ? (
                   <div className="text-center py-2">
                     
                     {isEditingProfile ? (
                       <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                         
                         {/* SÉLECTEUR D'AVATAR SCROLLABLE */}
                         <div className="mb-8 relative w-full h-32 flex items-center justify-center">
                           <div className="absolute w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm z-10 shadow-inner"></div>
                           <div className="absolute w-24 h-24 rounded-full border-4 border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.3)] z-30 pointer-events-none"></div>
                           
                           <div className="absolute left-0 top-0 bottom-0 w-12 z-30 pointer-events-none"></div>
                           <div className="absolute right-0 top-0 bottom-0 w-12 z-30 pointer-events-none"></div>

                           <div 
                             ref={avatarScrollRef}
                             onScroll={handleScrollAvatar}
                             className="flex overflow-x-auto snap-x snap-mandatory w-full h-full items-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-[calc(50%-2.5rem)] relative z-20"
                           >
                             {AVATARS.map((emoji, index) => {
                               const isSelected = tempAvatar === emoji;
                               return (
                                 <div 
                                   key={emoji} 
                                   className={`w-20 h-20 shrink-0 snap-center flex items-center justify-center transition-all duration-200 cursor-pointer ${isSelected ? 'text-6xl opacity-100 drop-shadow-xl scale-110' : 'text-4xl opacity-40 hover:opacity-70 scale-90'}`}
                                   onClick={() => {
                                     const container = avatarScrollRef.current;
                                     if (container && container.children[index]) {
                                       const item = container.children[index];
                                       container.scrollTo({ left: item.offsetLeft - container.clientWidth / 2 + item.clientWidth / 2, behavior: 'smooth' });
                                     }
                                   }}
                                 >
                                   {emoji}
                                 </div>
                               );
                             })}
                           </div>
                         </div>
                         <p className="text-[10px] font-medium text-indigo-200 mb-5 -mt-4">Fais glisser pour choisir ton avatar</p>

                         {/* ÉDITION DU PSEUDO */}
                         <div className="flex items-center justify-center gap-2 mb-4">
                           <input autoFocus type="text" value={tempPseudo} onChange={e => setTempPseudo(e.target.value)} className="bg-black/20 text-white font-black text-2xl text-center rounded-xl p-2 outline-none border border-white/30 w-48 focus:border-white transition-colors" />
                           <button onClick={handleUpdateProfile} className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-md"><Check size={20}/></button>
                         </div>
                       </div>
                     ) : (
                       <div className="animate-in fade-in duration-300">
                         <div className="mb-6">
                           <div className="w-24 h-24 bg-white/20 rounded-full mx-auto flex items-center justify-center backdrop-blur-sm text-5xl shadow-inner border-4 border-white/30 transition-transform duration-300 hover:scale-105">
                             {userAvatar}
                           </div>
                         </div>
                         <div className="flex items-center justify-center gap-3 mb-4 group cursor-pointer" onClick={() => {setTempPseudo(userName); setTempAvatar(userAvatar); setIsEditingProfile(true);}}>
                           <h2 className="text-3xl font-black">{userName}</h2>
                           <button className="text-indigo-200 opacity-50 group-hover:opacity-100 transition-opacity bg-white/10 p-2 rounded-full"><Edit size={14}/></button>
                         </div>
                       </div>
                     )}

                     <div className="flex justify-center gap-2 mb-2">
                        <span className="px-4 py-1.5 bg-white/20 rounded-full text-sm font-bold flex items-center gap-1.5"><Award size={14}/> {getBadge(userXp).name}</span>
                        <span className="px-4 py-1.5 bg-white/20 rounded-full text-sm font-bold">{userXp} XP</span>
                     </div>
                   </div>
                 ) : (
                   <div className="space-y-5">
                     <p className="font-medium text-indigo-100 text-center">Choisis un pseudo pour gagner des badges en votant pour les devoirs !</p>
                     <div className="flex gap-2 bg-white/10 p-1.5 rounded-2xl">
                       <input type="text" placeholder="Ton pseudo (ex: Quentin B.)" className="flex-1 p-3 bg-transparent text-white placeholder:text-indigo-200 outline-none font-bold text-center" value={pseudoInput} onChange={e=>setPseudoInput(e.target.value)} />
                     </div>
                     <button onClick={handleSaveProfile} className="w-full bg-white text-indigo-600 py-4 rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-transform">C'est parti !</button>
                     
                     <div className="mt-6 pt-6 border-t border-white/20 text-center">
                       <p className="text-xs text-indigo-100 mb-3">Tu as déjà un compte sur un autre appareil ?</p>
                       <div className="flex items-center justify-center gap-2">
                          <input type="text" placeholder="Code (ex: A7B-X2M)" value={recoveryInput} onChange={e => setRecoveryInput(e.target.value)} className="flex-1 p-3 rounded-xl bg-white/10 text-white placeholder:text-indigo-200 text-sm font-bold text-center outline-none uppercase tracking-widest border border-white/20 focus:border-white focus:bg-white/20 transition-all" />
                          <button onClick={handleRecoverAccount} className="p-3 bg-white text-indigo-600 rounded-xl hover:scale-105 active:scale-95 transition-transform shadow-md">
                            <RefreshCcw size={18} />
                          </button>
                       </div>
                     </div>
                   </div>
                 )}

                 {/* BOUTON INSTALLATION PWA AVEC TUTO DE SECOURS */}
                 {!isStandalone && (
                    <div className="mt-8 pt-6 border-t border-white/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 text-sm font-medium text-white">
                          <Download size={20} className="text-blue-300" />
                          <span>Installer l'Application</span>
                        </div>
                        <button 
                          onClick={handleInstallClick}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg text-xs font-bold transition-colors shadow-md"
                        >
                          Installer
                        </button>
                      </div>
                      
                      {showInstallTutorial ? (
                        <div className="mt-3 bg-white/10 p-3 rounded-xl border border-blue-300/30 text-left animate-in fade-in slide-in-from-top-2">
                          <p className="text-[11px] text-white font-bold mb-1.5">Comment installer manuellement :</p>
                          <ul className="text-[10px] text-indigo-100 space-y-2 ml-3 list-disc">
                            <li><strong className="text-blue-200">Sur iPhone (Safari) :</strong> Touche l'icône de partage (le carré avec une flèche en bas) puis sélectionne <b>"Sur l'écran d'accueil"</b>.</li>
                            <li><strong className="text-blue-200">Sur Android :</strong> Touche les 3 petits points (en haut à droite) puis <b>"Ajouter à l'écran d'accueil"</b>.</li>
                          </ul>
                          <button onClick={() => setShowInstallTutorial(false)} className="mt-3 text-[10px] font-bold text-blue-300 hover:text-white underline">Cacher le tutoriel</button>
                        </div>
                      ) : (
                        <p className="text-[10px] text-indigo-200 text-left leading-relaxed">
                          Ajoute ClassHub sur ton écran d'accueil pour y accéder plus rapidement.
                        </p>
                      )}
                    </div>
                 )}

                 {/* CODE DE SAUVEGARDE SECRET */}
                 {userName && (
                    <div className="mt-8 pt-6 border-t border-white/20 text-center">
                      <div className="flex items-center justify-center gap-2 text-indigo-100 text-sm font-medium mb-3">
                        <Key size={16} /> Code de Sauvegarde
                      </div>
                      
                      <div className="flex justify-center items-center gap-3">
                          <div className="bg-black/20 py-3 px-4 rounded-xl font-mono text-xl tracking-widest font-black text-white border border-white/10 shadow-inner min-w-[160px] flex items-center justify-center select-all transition-all duration-300">
                            {showRecoveryCode ? userId : '••••••'}
                          </div>
                          <button onClick={() => setShowRecoveryCode(!showRecoveryCode)} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white shadow-sm">
                            {showRecoveryCode ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                      </div>
                      
                      <p className="text-[10px] text-indigo-200 mt-3 leading-relaxed max-w-[280px] mx-auto">
                        <span className="font-bold text-red-300">SECRET :</span> Ne partage ce code à personne. Il te permet de récupérer ton compte si tu changes d'appareil !
                      </p>
                    </div>
                 )}

                 {/* SWITCH NOTIFICATIONS */}
                 <div className="mt-8 pt-6 border-t border-white/20">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3 text-sm font-medium">
                       {notificationsEnabled ? <BellRing size={20} className="text-emerald-300" /> : <BellOff size={20} className="text-indigo-200" />}
                       <span>Alertes Nouveautés</span>
                     </div>
                     <button 
                       onClick={toggleNotifications}
                       className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${notificationsEnabled ? 'bg-emerald-400' : 'bg-white/20'}`}
                     >
                       <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                     </button>
                   </div>
                   <p className="text-[10px] text-indigo-200 mt-2 text-left leading-relaxed">
                     Reçois une alerte Push ou In-App quand un devoir/sondage est ajouté pour ton groupe de TD.
                   </p>
                 </div>

                  <div className="mt-6 pt-6 border-t border-white/20">
                   <button onClick={handleForceUpdate} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 border border-white/10 shadow-sm active:scale-95">
                     <RefreshCcw size={18} /> Forcer une mise à jour
                   </button>
                   <p className="text-[10px] text-indigo-200 mt-2 text-center leading-relaxed">
                     À utiliser si l'application bugue ou pour charger les dernières nouveautés.
                   </p>
                 </div>

                 {/* BOUTON DÉCONNEXION */}
                 {userName && (
                   showLogoutConfirm ? (
                     <div className="mt-6 pt-6 border-t border-white/20 animate-in fade-in zoom-in duration-200 text-center">
                       <p className="text-sm font-bold text-red-300 mb-1">As-tu noté ton code secret ?</p>
                       <p className="text-[10px] text-red-200 mb-4 leading-tight">Sans lui, tu perdras ton XP et tes badges. Impossible de revenir en arrière.</p>
                       <div className="flex gap-3">
                         <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors">Annuler</button>
                         <button onClick={handleLogoutConfirm} className="flex-1 py-2.5 bg-red-50 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-colors shadow-md">Oui, quitter</button>
                       </div>
                     </div>
                   ) : (
                     <div className="mt-6 pt-6 border-t border-white/20">
                       <button onClick={() => setShowLogoutConfirm(true)} className="w-full py-3 bg-red-500/20 hover:bg-red-500/40 text-red-100 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 border border-red-500/30 shadow-sm">
                         <LogOut size={18} /> Se déconnecter
                       </button>
                     </div>
                   )
                 )}
               </div>
             </Card>

             {/* GESTION DES ROLES (DÉLÉGUÉ / ADMIN) */}
             <Card className="p-6">
               {userRole === 'ADMIN' ? (
                 <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                   <div className="flex justify-between items-start mb-2 border-b border-slate-100 pb-4">
                     <div>
                       <h3 className="font-black text-slate-800 text-xl flex items-center gap-2"><Shield className="text-red-500"/> Tableau de Bord</h3>
                       <p className="text-xs text-slate-500 font-medium mt-1">Super Admin • Accès total</p>
                     </div>
                     <button onClick={() => { trackAction('admin_logout', 'system', 'admin'); setUserRole('USER'); localStorage.setItem(STORAGE_KEY + '_role', 'USER'); }} className="p-2 bg-red-50 text-red-500 rounded-xl font-bold hover:bg-red-100 transition-colors" title="Quitter"><LogOut size={16}/></button>
                   </div>

                   {/* NOUVELLE SECTION : ANALYTICS DÉTAILLÉES */}
                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-inner mb-2">
                      <h4 className="font-bold text-xs text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Activity size={14}/> Analytics
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                         <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
                           <span className="block text-xl font-black text-emerald-600">
                             {allUsers.filter(u => u.lastSync && (Date.now() - new Date(u.lastSync).getTime()) < 7 * 86400000).length}
                           </span>
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 block">Actifs (7j)</span>
                         </div>
                         <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
                           <span className="block text-xl font-black text-blue-600">
                             {items.reduce((acc, item) => acc + (item.completedBy?.length || 0), 0)}
                           </span>
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 block">Devoirs cochés</span>
                         </div>
                         <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center col-span-2">
                           <span className="block text-xl font-black text-indigo-600">
                             {items.reduce((acc, item) => acc + (item.voters?.length || 0) + (Object.keys(item.votes || {}).length), 0)}
                           </span>
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 block">Total des votes & intéractions</span>
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                     <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100 text-center shadow-inner">
                       <span className="block text-2xl font-black text-indigo-600">{allUsers.filter(u => u.name && u.name.trim() !== '').length}</span>
                       <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-1 block">Inscrits</span>
                     </div>
                     <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100 text-center shadow-inner">
                       <span className="block text-2xl font-black text-purple-600">{items.filter(i => i.category === 'EVENT').length}</span>
                       <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest mt-1 block">Devoirs</span>
                     </div>
                     <div className="bg-pink-50 p-3 rounded-2xl border border-pink-100 text-center shadow-inner">
                       <span className="block text-2xl font-black text-pink-600">{items.filter(i => i.category === 'POLL').length}</span>
                       <span className="text-[9px] font-black text-pink-400 uppercase tracking-widest mt-1 block">Sondages</span>
                     </div>
                     <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 text-center shadow-inner">
                       <span className="block text-2xl font-black text-amber-600">{allUsers.reduce((acc, u) => acc + (u.xp || 0), 0)}</span>
                       <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest mt-1 block">XP Total</span>
                     </div>
                   </div>

                   {/* --- NOUVEAU : FLUX D'ACTIVITÉ EN DIRECT --- */}
                   <div className="mt-6 border-t border-slate-100 pt-6">
                     <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Activity size={14}/> Historique des actions
                     </h4>
                     <div className="bg-slate-900 rounded-2xl p-4 h-[300px] overflow-y-auto font-mono text-[10px] space-y-2 shadow-inner custom-scrollbar">
                       {(() => {
                         if (!adminLogs || !Array.isArray(adminLogs)) return <span className="text-slate-500">Chargement...</span>;

                         const allLogs = [];
                         adminLogs.forEach(logDoc => {
                           const user = allUsers.find(u => u.id === logDoc.id) || {};
                           if (logDoc.activityLogs && Array.isArray(logDoc.activityLogs)) {
                             logDoc.activityLogs.forEach(log => {
                               if (log) allLogs.push({ ...log, userAvatar: user.avatar || '👤', userName: user.name || 'Anonyme' });
                             });
                           } else if (logDoc.lastAction) {
                             allLogs.push({ ...logDoc.lastAction, userAvatar: user.avatar || '👤', userName: user.name || 'Anonyme' });
                           }
                         });
                         
                         allLogs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

                         if (allLogs.length === 0) {
                           return <span className="text-slate-500">En attente d'activité... (Actualise ou navigue dans l'app)</span>;
                         }

                         const actionTranslations = {
                            'daily_app_open': 'a ouvert l\'application 🟢',
                            'open_settings': 'a ouvert les paramètres ⚙️',
                            'create_event': 'a ajouté un devoir 📚',
                            'create_poll': 'a créé un sondage 📊',
                            'edit_event': 'a modifié un devoir ✏️',
                            'edit_poll': 'a modifié un sondage ✏️',
                            'vote_poll': 'a voté à un sondage 🗳️',
                            'add_vote_event': 'a évalué un devoir 👍',
                            'remove_vote_event': 'a retiré son évaluation 👎',
                            'Salle ajoutée': 'a ajouté une salle 📍',
                            'Salle retirée': 'a retiré une salle 📍',
                            'complete_task': 'a terminé un devoir ✅',
                            'uncomplete_task': 'a décoché un devoir ❌',
                            'pin_item': 'a épinglé/désépinglé un élément 📌',
                            'delete_item': 'a supprimé un élément 🗑️',
                            'account_recovery_failed': 'a tenté de récupérer un compte sans succès ⚠️',
                            'profile_created': 'a créé son profil 👤',
                            'profile_updated': 'a modifié son profil 🛠️',
                            'install_click': 'a cliqué sur Installer 📱',
                            'install_accepted': 'a installé l\'app 📲',
                            'tab_planning': 'regarde le planning 📅',
                            'tab_agenda': 'regarde les devoirs 📖',
                            'filter_leaderboard': 'filtre le classement 🔍',
                            'tab_sondages': 'regarde les sondages 📊',
                            'tab_classement': 'regarde le classement 🏆',
                            'change_group': 'a changé de groupe de TD 🔄',
                            'admin_login': 's\'est connecté en Super Admin 🛡️',
                            'push_os_granted': 'a accepté les notifications 📬',
                            'delegue_login': 's\'est connecté en Délégué 🎓',
                            'admin_login_failed': 'a tenté de se connecter en Super Admin sans succès ⚠️',
                            'view_history': 'consulte l\'historique 🕰️',
                            'onboarding_complete': 'a terminé l\'onboarding 🎉',
                            'toggle_notif_off': 'a désactivé les notifications 🔕',
                            'toggle_notif_on': 'a activé les notifications 🔔',
                            'install_tutorial_shown': 'a affiché le tutoriel d\'installation 📖',
                            'open_event_wizard': 'ouvre la fenêtre de création de devoir 🧙‍♂️',
                            'open_poll_wizard': 'ouvre la fenêtre de création de sondage 🧙‍♀️',
                         };

                         return allLogs.slice(0, 100).map((log, index) => {
                           let timeStr = '--:--:--';
                           if (log.timestamp) {
                             try {
                               timeStr = new Date(log.timestamp).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit', second:'2-digit'});
                             } catch (e) {}
                           }
                           
                           const translatedAction = actionTranslations[log.action] || log.action;
                           const safeLabel = typeof log.label === 'string' || typeof log.label === 'number' ? log.label : '';
                           
                           return (
                             <div key={index} className="flex gap-2 items-start border-b border-slate-800 pb-2 mb-2 last:border-0 last:mb-0 last:pb-0">
                                <span className="text-emerald-400 shrink-0">[{timeStr}]</span>
                                <span className="text-indigo-300 font-bold shrink-0">{log.userAvatar} {log.userName}</span>
                                <span className="text-slate-300 break-words">{translatedAction} {safeLabel && <span className="text-slate-500">({safeLabel})</span>}</span>
                             </div>
                           );
                         });
                       })()}
                     </div>
                   </div>

                   <div className="mt-6 border-t border-slate-100 pt-6">
                     <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Users size={14}/> Gestion des Comptes
                     </h4>
                     <div className="max-h-[350px] overflow-y-auto pr-2 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                       {allUsers.sort((a,b) => (b.xp || 0) - (a.xp || 0)).map((u, i) => (
                         <div key={u.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 transition-colors">
                           {adminEditUser?.id === u.id ? (
                             <div className="flex flex-col gap-3 animate-in fade-in zoom-in duration-200">
                                <div className="flex gap-2">
                                  <input type="text" value={adminEditUser.name} onChange={e => setAdminEditUser({...adminEditUser, name: e.target.value})} className="flex-1 p-2 rounded-lg border border-slate-200 text-sm font-bold" placeholder="Pseudo"/>
                                  <input type="number" value={adminEditUser.xp} onChange={e => setAdminEditUser({...adminEditUser, xp: parseInt(e.target.value) || 0})} className="w-20 p-2 rounded-lg border border-slate-200 text-sm font-bold text-indigo-600" placeholder="XP"/>
                                  <select value={adminEditUser.group} onChange={e => setAdminEditUser({...adminEditUser, group: e.target.value})} className="w-20 p-2 rounded-lg border border-slate-200 text-sm font-bold">
                                    <option value="G1">G1</option><option value="G2">G2</option><option value="G3">G3</option><option value="G4">G4</option>
                                  </select>
                                </div>
                                <div className="flex justify-end gap-2">
                                   <button onClick={() => setAdminEditUser(null)} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-300">Annuler</button>
                                   <button onClick={saveAdminEditUser} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-emerald-600"><Check size={14}/> Enregistrer</button>
                                </div>
                             </div>
                           ) : (
                             <div className="flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                 <div className="w-5 font-black text-slate-300 text-center text-[10px]">#{i+1}</div>
                                 <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-lg border border-slate-100">{u.avatar || '👤'}</div>
                                 <div>
                                   <p className="font-bold text-sm text-slate-800 leading-none">{u.name}</p>
                                   <div className="flex items-center gap-2 mt-1.5">
                                     <span className="text-[9px] font-black text-slate-500 bg-slate-200/50 px-1.5 py-0.5 rounded">{u.group || '?'}</span>
                                     <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm ${u.fcmToken || (u.fcmTokens && u.fcmTokens.length > 0) ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
                                       {u.fcmToken || (u.fcmTokens && u.fcmTokens.length > 0) ? '🔔 ON' : '🔕 OFF'}
                                     </span>
                                     <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">{u.xp || 0} XP</span>
                                   </div>
                                 </div>
                               </div>
                               <div className="flex flex-col gap-1 items-end shrink-0">
                                 <div className="flex gap-1">
                                   <button onClick={() => setAdminEditUser(u)} className="p-1.5 bg-indigo-50 text-indigo-500 rounded-md hover:bg-indigo-100 transition-colors"><Edit size={12}/></button>
                                   <button onClick={() => deleteAdminUser(u.id)} className="p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100 transition-colors"><Trash2 size={12}/></button>
                                 </div>
                                 <span className="text-[8px] text-slate-300 font-mono mt-1" title={u.id}>{u.id?.substring(0,6)}</span>
                               </div>
                             </div>
                           )}
                         </div>
                       ))}
                     </div>
                   </div>

                   <div className="mt-6 pt-6 border-t border-slate-100">
                     <button onClick={() => {
                       setSaeForm({ active: saeConfig?.active || false, title: saeConfig?.title || 'SAÉ 203', startDate: saeConfig?.startDate || '', weeks: saeConfig?.weeks || 1 });
                       setSaeWizardStep(1);
                       setIsEditingSae(true);
                     }} className="w-full py-3 bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-600 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 border border-fuchsia-100 shadow-sm">
                       <LayoutTemplate size={18} /> Configurer la période SAÉ
                     </button>
                   </div>

                 </div>
               ) : userRole === 'DELEGUE' ? (
                 <div className="space-y-4 animate-in fade-in zoom-in duration-300 text-center py-2">
                    <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4"><Crown size={32} /></div>
                    <h3 className="font-black text-slate-800 text-xl">Mode Délégué Activé</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">Tu as l'autorisation d'ajouter des sondages, d'épingler des messages importants et de supprimer des devoirs.</p>
                    
                    <button onClick={() => {
                       setSaeForm({ active: saeConfig?.active || false, title: saeConfig?.title || 'SAÉ 203', startDate: saeConfig?.startDate || '', weeks: saeConfig?.weeks || 1 });
                       setSaeWizardStep(1);
                       setIsEditingSae(true);
                     }} className="w-full mt-2 py-3 bg-fuchsia-50 text-fuchsia-600 rounded-xl font-bold hover:bg-fuchsia-100 transition-colors flex items-center justify-center gap-2 border border-fuchsia-100">
                       <LayoutTemplate size={18} /> Configurer la période SAÉ
                    </button>

                    <button onClick={() => { trackAction('delegue_logout', 'system', 'delegue'); setUserRole('USER'); localStorage.setItem(STORAGE_KEY + '_role', 'USER'); }} className="w-full mt-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Quitter le mode Délégué</button>
                 </div>
               ) : (
                 <>
                   <h3 className="font-bold text-slate-800 mb-4 text-lg flex items-center gap-2"><Lock size={18} className="text-slate-400"/> Zone Privée</h3>
                   <div className="flex gap-2">
                     <input type="text" placeholder="Code secret" className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-600 outline-none focus:ring-2 ring-indigo-200 uppercase" value={adminInput} onChange={e=>setAdminInput(e.target.value)} />
                     <button onClick={() => {
                       if(adminInput.toUpperCase() === DELEGUE_CODE){ trackAction('admin_login', 'system', 'delegue'); setUserRole('DELEGUE'); localStorage.setItem(STORAGE_KEY + '_role', 'DELEGUE'); setToast({title:'Succès', message:'Mode Délégué activé'}); }
                       else if(adminInput.toUpperCase() === SUPERADMIN_CODE){ trackAction('admin_login', 'system', 'admin'); setUserRole('ADMIN'); localStorage.setItem(STORAGE_KEY + '_role', 'ADMIN'); setToast({title:'Succès', message:'Mode Super Admin activé'}); }
                       else { trackAction('admin_login_failed', 'system', 'failed'); alert('Code invalide'); }
                       setAdminInput('');
                     }} className="bg-slate-800 text-white px-6 rounded-xl font-bold hover:bg-slate-700 transition-colors">OK</button>
                   </div>
                 </>
               )}
             </Card>
             
             
             <button onClick={() => {
               trackAction('change_group', 'engagement', 'reset_group');
               setUserGroup(null); 
               localStorage.removeItem(STORAGE_KEY + '_group');
               setView('onboarding');
             }} className="w-full py-4 text-slate-500 font-bold hover:text-slate-800 transition-colors bg-white rounded-2xl shadow-sm border border-slate-100 mt-6">
               Changer de groupe de TD
             </button>            
           </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
             
             {items.length === 0 && !authUser && (
               <div className="text-center py-10 text-slate-400 font-bold flex flex-col items-center gap-3">
                 <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                 Connexion à la base de données...
               </div>
             )}

             {isSaeActive() && activeTab !== 'CLASSEMENT' && activeTab !== 'PLANNING' && (
               <div className="mb-6 bg-gradient-to-br from-fuchsia-600 to-violet-700 rounded-3xl p-5 text-white shadow-lg shadow-fuchsia-200/50 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10"><LayoutTemplate size={120} className="-rotate-12"/></div>
                 <div className="relative z-10">
                   <div className="flex items-center gap-2 mb-2">
                     <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">Période Projet</span>
                     <Sparkles size={16} className="text-fuchsia-200 animate-pulse"/>
                   </div>
                   <div className="flex justify-between items-start">
                     <div>
                       <h3 className="text-2xl font-black mb-1 leading-tight">{saeConfig?.title || ''}</h3>
                       <p className="text-sm font-medium text-fuchsia-100 mb-1">Du {formatShortDate(saeConfig?.startDate)} au {getSaeEndDate()} ({saeConfig?.weeks || 1} semaine{saeConfig?.weeks > 1 ? 's' : ''})</p>
                       {saeConfig?.lastModified && (
                         <p className="text-[10px] text-fuchsia-300 mb-5 font-medium flex items-center gap-1">
                           <History size={10}/> Modifié à {new Date(saeConfig.lastModified).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                         </p>
                       )}
                     </div>
                     {userRole !== 'USER' && (
                       <button onClick={() => { 
                         setSaeForm({ active: saeConfig?.active || false, title: saeConfig?.title || 'SAÉ 203', startDate: saeConfig?.startDate || '', weeks: saeConfig?.weeks || 1 });
                         setSaeWizardStep(1);
                         setIsEditingSae(true); 
                       }} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors shadow-sm shrink-0" title="Configurer la période">
                         <Settings size={18}/>
                       </button>
                     )}
                   </div>
                   
                   <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex flex-col justify-between items-start gap-3 relative mt-2">
                     <div className="flex items-center gap-3 w-full justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-white/20 rounded-xl"><Pin size={18} className="text-white"/></div>
                          <span className="text-sm font-bold text-fuchsia-50">Salles d'Autonomie Dispos</span>
                        </div>
                        <button onClick={() => { 
                          if (!userName) {
                            setShowAuthPrompt(true);
                          } else {
                            setNewRoomInput('');
                            setNewRoomTarget('PROMO');
                            setRoomWizardStep(1);
                            setIsEditingRooms(true); 
                          }
                        }} className="text-xs font-bold bg-white text-fuchsia-600 px-3 py-1.5 rounded-lg hover:scale-105 transition-transform shadow-sm flex items-center gap-1">
                          <Plus size={14}/> Ajouter
                        </button>
                     </div>
                     <div className="flex flex-wrap items-center gap-2 w-full mt-1">
                       {(saeConfig?.rooms && Array.isArray(saeConfig.rooms) && saeConfig.rooms.length > 0) ? (
                         getSaeRoomsList().length > 0 ? (
                           getSaeRoomsList().map((r, idx) => (
                             <span key={idx} className="text-sm font-black bg-white text-fuchsia-600 pl-3 pr-1.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 border border-fuchsia-100">
                               {r.room} 
                               {r.target !== 'PROMO' && <span className="text-[9px] bg-fuchsia-100 text-fuchsia-600 px-1.5 py-0.5 rounded leading-none">{r.target}</span>}
                               <button onClick={() => handleDeleteRoom(r)} className="text-fuchsia-200 hover:text-red-500 hover:bg-red-50 p-1 rounded-md transition-colors ml-1" title="Supprimer">
                                 <Trash2 size={14}/>
                               </button>
                             </span>
                           ))
                         ) : (
                           <span className="text-sm font-medium text-fuchsia-200 italic px-1">Aucune salle pour ton groupe</span>
                         )
                       ) : (
                         <span className="text-sm font-medium text-fuchsia-200 italic px-1">Aucune salle définie pour le moment</span>
                       )}
                     </div>
                   </div>
                 </div>
               </div>
             )}

             {activeTab !== 'CLASSEMENT' && activeTab !== 'PLANNING' && (
               <>
                 <div ref={todayRef} className="flex items-center gap-4 text-indigo-400 justify-center pt-2 pb-4">
                     <div className="h-px bg-indigo-100 flex-1"></div>
                     <span className="text-xs font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full border border-indigo-100 shadow-sm">À venir</span>
                     <div className="h-px bg-indigo-100 flex-1"></div>
                 </div>

                 {future.length === 0 ? (
                   <div className="text-center py-20 opacity-50 flex flex-col items-center">
                     <div className="bg-slate-100 p-6 rounded-full mb-4"><Calendar size={48} className="text-slate-300"/></div>
                     <p className="font-bold text-xl text-slate-400 mb-1">Rien à l'horizon !</p>
                     <p className="text-sm text-slate-400">Profite de ton temps libre à Angers 🎉</p>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                     {future.map(item => renderItemCard(item, false))}
                   </div>
                 )}

                 {past.length > 0 && activeTab === 'AGENDA' && (
                    <div className="space-y-4 mt-12 pt-8">
                       <div className="flex items-center gap-4 text-slate-300 justify-center mb-4">
                         <div className="h-px bg-slate-200 flex-1"></div>
                         <span className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5"><History size={14}/> Historique</span>
                         <div className="h-px bg-slate-200 flex-1"></div>
                       </div>
                       
                       {!showHistory ? (
                         <div className="flex justify-center">
                           <button onClick={() => { trackAction('view_history', 'engagement', 'history'); setShowHistory(true); }} className="px-6 py-3 bg-white border border-slate-200 shadow-sm rounded-xl text-sm font-bold text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all flex items-center gap-2">
                             <History size={18} /> Charger l'historique ({past.length})
                           </button>
                         </div>
                       ) : (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-in fade-in duration-500">
                           {past.map(item => renderItemCard(item, true))}
                         </div>
                       )}
                    </div>
                 )}
               </>
             )}

             {activeTab === 'CLASSEMENT' && (
               <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto">
                 <div className="flex items-center gap-4 text-indigo-400 justify-center pt-2 pb-4">
                    <div className="h-px bg-indigo-100 flex-1"></div>
                    <span className="text-xs font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full border border-indigo-100 shadow-sm flex items-center gap-1.5"><Trophy size={14}/> Classement XP</span>
                    <div className="h-px bg-indigo-100 flex-1"></div>
                 </div>

                 <div className="flex overflow-x-auto gap-2 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {['ALL', 'TD1', 'TD2', 'G1', 'G2', 'G3', 'G4'].map(f => (
                      <button
                        key={f}
                        onClick={() => { trackAction('filter_leaderboard', 'engagement', f); setLeaderboardFilter(f); }}
                        className={`px-5 py-2.5 rounded-xl font-bold text-sm shrink-0 transition-all ${leaderboardFilter === f ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                      >
                        {f === 'ALL' ? 'Toute la Promo' : f}
                      </button>
                    ))}
                 </div>

                 <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-10">
                   {allUsers
                     .filter(u => u.name && u.name.trim() !== '') 
                     .filter(u => {
                        if (leaderboardFilter === 'ALL') return true;
                        if (leaderboardFilter.startsWith('TD')) return GROUPS_CONFIG[u.group]?.parent === leaderboardFilter;
                        return u.group === leaderboardFilter;
                     })
                     .sort((a, b) => (b.xp || 0) - (a.xp || 0))
                     .map((u, idx) => (
                       <div key={u.id} className={`flex items-center gap-4 p-4 transition-colors border-b border-slate-50 last:border-0 ${u.id === userId ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}>
                          <div className={`w-8 h-8 shrink-0 flex items-center justify-center font-black text-sm rounded-full ${idx === 0 ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-200' : idx === 1 ? 'bg-slate-200 text-slate-600 ring-2 ring-slate-300' : idx === 2 ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-200' : 'text-slate-400 bg-slate-50'}`}>
                            #{idx + 1}
                          </div>
                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-2xl shadow-inner shrink-0 border border-slate-200 relative">
                            {u.avatar || '👤'}
                            {u.id === userId && <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">TOI</span>}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-slate-800 truncate text-base">{u.name}</h4>
                              <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{u.group || '?'}</span>
                            </div>
                            <UserBadge xp={u.xp || 0} />
                          </div>
                          <div className="text-right shrink-0 flex flex-col items-end">
                            <span className="block font-black text-indigo-600 text-lg leading-none">{u.xp || 0}</span>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">XP</span>
                          </div>
                       </div>
                   ))}
                   {allUsers
                     .filter(u => u.name && u.name.trim() !== '')
                     .filter(u => {
                        if (leaderboardFilter === 'ALL') return true;
                        if (leaderboardFilter.startsWith('TD')) return GROUPS_CONFIG[u.group]?.parent === leaderboardFilter;
                        return u.group === leaderboardFilter;
                   }).length === 0 && (
                      <div className="p-8 text-center text-slate-400 font-medium">Aucun utilisateur trouvé</div>
                   )}
                 </div>
               </div>
             )}

          </div>
        )}
      </main>

      {/* BOUTONS FLOTTANTS (MOBILE UNIQUEMENT) */}
      {view === 'list' && (
          <div className="md:hidden fixed bottom-[90px] right-5 flex flex-col items-end gap-4 z-40">
             <button onClick={() => {startWizard('POLL'), trackAction('open_poll_wizard', 'navigation', 'poll')}} className="w-12 h-12 bg-white text-indigo-600 rounded-2xl shadow-lg shadow-indigo-100 border border-indigo-50 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"><BarChart size={24} /></button>
             <button onClick={() => {startWizard('EVENT'), trackAction('open_event_wizard', 'navigation', 'event')}} className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[1.2rem] text-white shadow-2xl shadow-indigo-400 flex items-center justify-center hover:scale-105 active:scale-95 transition-all animate-in zoom-in duration-300 ring-4 ring-white"><Plus size={32} strokeWidth={3}/></button>
          </div>
      )}

      {/* TABS DE NAVIGATION (MOBILE UNIQUEMENT) */}
      {view === 'list' && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 z-50 pb-[env(safe-area-inset-bottom)] pt-1 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="flex justify-around items-center px-1 py-1">
            <button onClick={() => { trackAction('tab_planning', 'navigation', 'planning'); setActiveTab('PLANNING'); }} className={`flex flex-col items-center justify-center p-2 transition-all ${activeTab === 'PLANNING' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <CalendarDays size={24} strokeWidth={activeTab === 'PLANNING' ? 2.5 : 2} className={activeTab === 'PLANNING' ? 'animate-in zoom-in duration-300' : ''} />
              <span className="text-[10px] font-bold mt-1">Planning</span>
            </button>

            <button onClick={() => { trackAction('tab_agenda', 'navigation', 'agenda'); setActiveTab('AGENDA'); }} className={`flex flex-col items-center justify-center p-2 transition-all relative ${activeTab === 'AGENDA' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <div className="relative">
                <BookOpen size={24} strokeWidth={activeTab === 'AGENDA' ? 2.5 : 2} className={activeTab === 'AGENDA' ? 'animate-in zoom-in duration-300' : ''} />
                {hasNewAgenda && activeTab !== 'AGENDA' && <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>}
              </div>
              <span className="text-[10px] font-bold mt-1">Devoirs</span>
            </button>

            <button onClick={() => { if(!userName) setShowAuthPrompt(true); else { trackAction('tab_sondages', 'navigation', 'sondages'); setActiveTab('SONDAGES'); } }} className={`flex flex-col items-center justify-center p-2 transition-all relative ${activeTab === 'SONDAGES' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <div className="relative">
                <BarChart size={24} strokeWidth={activeTab === 'SONDAGES' ? 2.5 : 2} className={activeTab === 'SONDAGES' ? 'animate-in zoom-in duration-300' : ''} />
                {hasNewPolls && activeTab !== 'SONDAGES' && <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>}
              </div>
              <span className="text-[10px] font-bold mt-1">Sondages</span>
            </button>

            <button onClick={() => { trackAction('tab_classement', 'navigation', 'classement'); setActiveTab('CLASSEMENT'); }} className={`flex flex-col items-center justify-center p-2 transition-all ${activeTab === 'CLASSEMENT' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <Trophy size={24} strokeWidth={activeTab === 'CLASSEMENT' ? 2.5 : 2} className={activeTab === 'CLASSEMENT' ? 'animate-in zoom-in duration-300' : ''} />
              <span className="text-[10px] font-bold mt-1">XP</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}