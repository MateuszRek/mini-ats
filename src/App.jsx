// MINI ATS — SUPABASE ONLINE

import React, { useMemo, useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://cocydftwrdshqwvauodb.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_un7LVevS6WPsvuhl2KBPVg_d_wjK9KD";
const supabase = createClient(supabaseUrl, supabaseKey);

const STATUSES = ["New", "Contacted", "Interested", "Interview", "Offer", "Rejected", "Hired"];

const STATUS_STYLES = {
  New: "bg-slate-100 text-slate-700 border-slate-200",
  Contacted: "bg-blue-100 text-blue-700 border-blue-200",
  Interested: "bg-violet-100 text-violet-700 border-violet-200",
  Interview: "bg-amber-100 text-amber-800 border-amber-200",
  Offer: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-100 text-red-700 border-red-200",
  Hired: "bg-green-100 text-green-700 border-green-200",
};

const STATUS_ACCENTS = {
  New: "from-slate-500 to-slate-300",
  Contacted: "from-blue-600 to-cyan-400",
  Interested: "from-violet-600 to-fuchsia-400",
  Interview: "from-amber-500 to-orange-300",
  Offer: "from-emerald-600 to-teal-400",
  Rejected: "from-red-600 to-rose-400",
  Hired: "from-green-600 to-lime-400",
};

const DEFAULT_LANGUAGES = ["Java", "JavaScript", "TypeScript", "Python", "Go", "C#", "C++", "PHP", "Ruby", "Kotlin", "Swift", "SQL"];
const DEFAULT_FRAMEWORKS = ["React", "Angular", "Vue", "Next.js", "Node.js", "Express", "Spring", "Django", "Flask", ".NET", "Laravel", "Symfony", "NestJS"];

const emptyCandidate = {
  favorite: false,
  name: "",
  status: "New",
  email: "",
  telefon: "",
  linkedin: "",
  lokalizacja: "",
  doświadczenie: "",
  notatki: "",
  tagi: "",
  jezyk_programowania: "",
  framework: "",
  obszar: "",
  rating: 0,
  cv_file: null,
  cv_url: "",
  linkedin_text: "",
};

function getAccentStyle(status) {
  return STATUS_ACCENTS[status] || STATUS_ACCENTS.New;
}

function getStatusStyle(status) {
  return STATUS_STYLES[status] || STATUS_STYLES.New;
}

function includesIgnoreCase(value, query) {
  return String(value || "").toLowerCase().includes(query.toLowerCase());
}

function Icon({ children }) {
  return <span className="inline-flex h-5 w-5 items-center justify-center text-sm">{children}</span>;
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl px-4 py-3 text-left font-bold transition ${
        active ? "bg-white text-slate-900 shadow-sm" : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export default function MiniATSApp() {
  const [activeTab, setActiveTab] = useState("add");
  const [clientView, setClientView] = useState(false);
  const [clientProjectId, setClientProjectId] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [query, setQuery] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [form, setForm] = useState(emptyCandidate);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formProjects, setFormProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState({});
  const [newProjectName, setNewProjectName] = useState("");
