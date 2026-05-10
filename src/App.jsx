// MINI ATS - SUPABASE ONLINE

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://cocydftwrdshqwvauodb.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_un7LVevS6WPsvuhl2KBPVg_d_wjK9KD";
const supabase = createClient(supabaseUrl, supabaseKey);

const STATUSES = ["New", "Contacted", "Interested", "Interview", "Recommended", "Offer", "Rejected", "Hired"];

const STATUS_STYLES = {
  New: "bg-blue-700 text-white border-blue-900",
  Contacted: "bg-purple-700 text-white border-purple-900",
  Interested: "bg-fuchsia-700 text-white border-fuchsia-900",
  Interview: "bg-amber-600 text-white border-amber-800",
  Recommended: "bg-teal-600 text-white border-teal-800",
  Offer: "bg-cyan-700 text-white border-cyan-900",
  Rejected: "bg-red-700 text-white border-red-900",
  Hired: "bg-emerald-700 text-white border-emerald-900",
};

const STATUS_SOFT = {
  New: "bg-blue-50 text-blue-900 border-blue-300",
  Contacted: "bg-purple-50 text-purple-900 border-purple-300",
  Interested: "bg-fuchsia-50 text-fuchsia-900 border-fuchsia-300",
  Interview: "bg-amber-50 text-amber-900 border-amber-300",
  Recommended: "bg-teal-50 text-teal-900 border-teal-300",
  Offer: "bg-cyan-50 text-cyan-900 border-cyan-300",
  Rejected: "bg-red-50 text-red-900 border-red-300",
  Hired: "bg-emerald-50 text-emerald-900 border-emerald-300",
};

const STATUS_ACCENTS = {
  New: "from-blue-800 to-blue-400",
  Contacted: "from-purple-800 to-purple-400",
  Interested: "from-fuchsia-800 to-pink-400",
  Interview: "from-amber-700 to-orange-400",
  Recommended: "from-teal-700 to-cyan-400",
  Offer: "from-cyan-800 to-sky-400",
  Rejected: "from-red-800 to-rose-400",
  Hired: "from-emerald-800 to-green-400",
};

const DEFAULT_LANGUAGES = ["Java", "JavaScript", "TypeScript", "Python", "Go", "C#", "C++", "PHP", "Kotlin", "SQL"];
const DEFAULT_FRAMEWORKS = ["React", "Angular", "Vue", "Next.js", "Node.js", "Spring", "Django", "Flask", ".NET", "Laravel", "NestJS"];
const QUICK_CHIPS = ["Java", "React", "AI", "Remote", "Senior", "AWS", "Kubernetes", "Recommended", "Shortlist"];

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

function statusClass(status, soft = false) {
  return (soft ? STATUS_SOFT : STATUS_STYLES)[status] || (soft ? STATUS_SOFT.New : STATUS_STYLES.New);
}

function accentClass(status) {
  return STATUS_ACCENTS[status] || STATUS_ACCENTS.New;
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function includesText(value, query) {
  return normalize(value).includes(normalize(query));
}

function splitTerms(value) {
  return String(value || "")
    .replace(/#/g, "")
    .split(/[,;/|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getProjectName(project) {
  return project?.name || project?.nazwa || "Projekt bez nazwy";
}

function getExperience(candidate) {
  const raw = candidate?.doświadczenie || candidate?.doswiadczenie || candidate?.experience || "";
  const match = String(raw).replace(",", ".").match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function getCandidateText(candidate) {
  const relationText = (candidate?.candidate_projects || [])
    .map((relation) => {
      const project = relation.Projekty || {};
      return [
        relation.status,
        relation.notes,
        relation.interview_summary,
        relation.recruiter_notes,
        relation.recommended_to_client ? "recommended sent client diamond" : "",
        project.name,
        project.nazwa,
        project.kategoria,
        project.lokalizacja,
        project.project_notes,
        project.candidate_requirements,
        project.ai_search_summary,
      ].join(" ");
    })
    .join(" ");

  return [
    candidate?.name,
    candidate?.status,
    candidate?.email,
    candidate?.telefon,
    candidate?.linkedin,
    candidate?.lokalizacja,
    candidate?.doświadczenie,
    candidate?.notatki,
    candidate?.tagi,
    candidate?.jezyk_programowania,
    candidate?.framework,
    candidate?.obszar,
    candidate?.english_level,
    candidate?.availability,
    candidate?.relocation ? "relocation" : "",
    candidate?.ai_summary,
    candidate?.candidate_vector_summary,
    relationText,
  ].join(" ");
}

function matchesBooleanQuery(text, query) {
  const q = String(query || "").trim();
  if (!q) return true;
  const source = normalize(text);
  const tokens = q.match(/"[^"]+"|\(|\)|\bAND\b|\bOR\b|\bNOT\b|[^\s()]+/gi) || [];
  if (tokens.length === 0) return true;

  let index = 0;
  const peek = () => tokens[index];
  const next = () => tokens[index++];
  const term = (token) => source.includes(normalize(String(token || "").replace(/^"|"$/g, "")));

  const parsePrimary = () => {
    const token = next();
    if (!token) return true;
    if (token.toUpperCase() === "NOT") return !parsePrimary();
    if (token === "(") {
      const value = parseOr();
      if (peek() === ")") next();
      return value;
    }
    return term(token);
  };

  const parseAnd = () => {
    let value = parsePrimary();
    while (peek() && peek() !== ")" && peek().toUpperCase() !== "OR") {
      if (peek().toUpperCase() === "AND") next();
      value = value && parsePrimary();
    }
    return value;
  };

  const parseOr = () => {
    let value = parseAnd();
    while (peek() && peek().toUpperCase() === "OR") {
      next();
      value = value || parseAnd();
    }
    return value;
  };

  try {
    return parseOr();
  } catch (_error) {
    return source.includes(normalize(q));
  }
}

function normalizedParsed(result = {}) {
  return {
    name: result.name || "",
    email: result.email || "",
    telefon: result.telefon || result.phone || "",
    linkedin: result.linkedin || "",
    lokalizacja: result.lokalizacja || result.location || "",
    doświadczenie: result.doświadczenie || result.doswiadczenie || result.experience || "",
    jezyk_programowania: result.jezyk_programowania || result.language || result.languages || result.tech_stack || "",
    framework: result.framework || result.frameworks || "",
    obszar: result.obszar || result.area || "",
    tagi: result.tagi || result.tags || "",
    notatki: result.notatki || result.notes || "",
  };
}

function mergeParsed(base, parsed) {
  const next = { ...base };
  Object.entries(parsed).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") next[key] = value;
  });
  return next;
}

function StatusBadge({ status, compact = false }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border font-black shadow-sm ${compact ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm"} ${statusClass(status)}`}>
      <span className="h-2 w-2 rounded-full bg-white/90" />
      {status || "New"}
    </span>
  );
}

function formatHistoryDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatHistoryValue(value) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function MiniATSApp() {
  const [authLoading, setAuthLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [clientView, setClientView] = useState(false);
  const [clientProjectId, setClientProjectId] = useState("");
  const [activeTab, setActiveTab] = useState("candidates");
  const [candidates, setCandidates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [advancedQuery, setAdvancedQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [globalStatusFilter, setGlobalStatusFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyRecommended, setOnlyRecommended] = useState(false);
  const [languageFilter, setLanguageFilter] = useState("");
  const [frameworkFilter, setFrameworkFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [minExperience, setMinExperience] = useState("");
  const [maxExperience, setMaxExperience] = useState("");
  const [compactMode, setCompactMode] = useState(false);

  const [form, setForm] = useState(emptyCandidate);
  const [editingId, setEditingId] = useState(null);
  const [formProjectIds, setFormProjectIds] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState({});
  const [parsingCv, setParsingCv] = useState(false);
  const [parsingLinkedin, setParsingLinkedin] = useState(false);

  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectClientId, setNewProjectClientId] = useState("");
  const [newProjectNotes, setNewProjectNotes] = useState("");
  const [newProjectRequirements, setNewProjectRequirements] = useState("");
  const [newProjectAiSummary, setNewProjectAiSummary] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [projectDrafts, setProjectDrafts] = useState({});
  const [projectDetailsOpen, setProjectDetailsOpen] = useState({});
  const [projectCandidatesOpen, setProjectCandidatesOpen] = useState({});
  const [activeProjectId, setActiveProjectId] = useState(null);

  const [newClientName, setNewClientName] = useState("");
  const [newClientContact, setNewClientContact] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientNotes, setNewClientNotes] = useState("");
  const [clientSearch, setClientSearch] = useState("");

  const [openProjectSections, setOpenProjectSections] = useState({});
  const [activeCandidateId, setActiveCandidateId] = useState(null);
  const [enlargedCandidateId, setEnlargedCandidateId] = useState(null);
  const [historyModal, setHistoryModal] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const restoreScrollYRef = useRef(null);
  const cvInputRef = useRef(null);

  const preserveScroll = (action) => {
    restoreScrollYRef.current = window.scrollY;
    action();
  };

  useLayoutEffect(() => {
    if (restoreScrollYRef.current === null) return;
    const scrollY = restoreScrollYRef.current;
    restoreScrollYRef.current = null;
    window.scrollTo({ top: scrollY, left: 0, behavior: "auto" });
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(advancedMode ? advancedQuery : query), 180);
    return () => clearTimeout(timer);
  }, [query, advancedQuery, advancedMode]);

  const refreshAll = async () => {
    setLoading(true);
    const [candidateResult, projectResult, clientResult, savedResult] = await Promise.all([
      supabase.from("candidates").select("*, candidate_projects(*, Projekty(*))").order("created_at", { ascending: false }),
      supabase.from("Projekty").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("*").order("created_at", { ascending: false }),
      supabase.from("saved_searches").select("*").order("created_at", { ascending: false }),
    ]);

    if (candidateResult.error) setMessage("Błąd pobierania kandydatów: " + candidateResult.error.message);
    setCandidates(candidateResult.data || []);
    setProjects(projectResult.data || []);
    setClients(clientResult.data || []);
    if (!savedResult.error) setSavedSearches(savedResult.data || []);
    setLoading(false);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("client") === "true") {
      setClientView(true);
      setClientProjectId(params.get("project") || "");
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session || clientView) refreshAll();
  }, [session, clientView]);

  const suggestions = useMemo(() => {
    const languages = new Set(DEFAULT_LANGUAGES);
    const frameworks = new Set(DEFAULT_FRAMEWORKS);
    const tags = new Set();
    candidates.forEach((candidate) => {
      splitTerms(candidate.jezyk_programowania).forEach((item) => languages.add(item));
      splitTerms(candidate.framework).forEach((item) => frameworks.add(item));
      splitTerms(candidate.tagi).forEach((item) => tags.add(item));
    });
    return { languages: [...languages].sort(), frameworks: [...frameworks].sort(), tags: [...tags].sort() };
  }, [candidates]);

  const clientProjectName = useMemo(() => getProjectName(projects.find((project) => project.id === clientProjectId)), [projects, clientProjectId]);
  const enlargedCandidate = candidates.find((candidate) => candidate.id === enlargedCandidateId);

  const getClientName = (clientId) => clients.find((client) => client.id === clientId)?.name || "Bez klienta";
  const getProjectClientName = (project) => getClientName(project?.client_id);

  const logActivity = async ({ entityType = "system", entityId = "system", actionType, actionLabel, oldValue = null, newValue = null, metadata = {} }) => {
    if (!actionType || !actionLabel) return;
    const row = { entity_type: entityType, entity_id: String(entityId || "system"), action_type: actionType, action_label: actionLabel, old_value: oldValue === undefined || oldValue === null ? null : formatHistoryValue(oldValue), new_value: newValue === undefined || newValue === null ? null : formatHistoryValue(newValue), metadata };
    const { error } = await supabase.from("activity_history").insert([row]);
    if (error && !["42P01", "PGRST116", "PGRST205"].includes(error.code)) console.warn("Activity history skipped:", error.message);
  };

  const openActivityHistory = async (entityType, entityId, title) => {
    preserveScroll(() => setHistoryModal({ entityType, entityId: String(entityId || "system"), title }));
    setHistoryLoading(true);
    const { data, error } = await supabase.from("activity_history").select("*").eq("entity_type", entityType).eq("entity_id", String(entityId || "system")).order("created_at", { ascending: false }).limit(80);
    setHistoryItems(error ? [] : data || []);
    setHistoryLoading(false);
  };

  const closeActivityHistory = () => preserveScroll(() => setHistoryModal(null));

  const getRelationContext = (relationId) => {
    for (const candidate of candidates) {
      const relation = candidate.candidate_projects?.find((item) => item.id === relationId);
      if (relation) return { candidate, relation, project: relation.Projekty || projects.find((item) => item.id === relation.project_id) || null };
    }
    return { candidate: null, relation: null, project: null };
  };

  const login = async () => {
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail.trim(), password: loginPassword });
    if (error) setMessage("Błąd logowania: " + error.message);
    else setLoginPassword("");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCandidates([]);
    setProjects([]);
    setClients([]);
  };

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const parseCvFile = async (file) => {
    const body = new FormData();
    body.append("file", file);
    body.append("source", "cv");
    const response = await fetch("/api/parse-cv", { method: "POST", body });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Nieznany błąd AI");
    return normalizedParsed(result);
  };

  const parseCv = async () => {
    if (!form.cv_file) return setMessage("Najpierw wybierz plik CV albo zdjęcie CV");
    setParsingCv(true);
    setMessage("AI przepisuje dane z CV...");
    try {
      const parsed = await parseCvFile(form.cv_file);
      setForm((prev) => mergeParsed(prev, parsed));
      await logActivity({ entityType: "system", entityId: "candidate-form", actionType: "cv_parsed", actionLabel: "CV parsed with AI", metadata: { file_name: form.cv_file?.name || "CV" } });
      setMessage("Dane z CV uzupełnione. Sprawdź je przed zapisem.");
    } catch (error) {
      setMessage("Błąd AI CV: " + error.message);
    } finally {
      setParsingCv(false);
    }
  };

  const parseLinkedin = async () => {
    if (!form.linkedin_text.trim() && !form.linkedin.trim()) return setMessage("Wklej link LinkedIn albo tekst profilu LinkedIn");
    setParsingLinkedin(true);
    setMessage("AI przepisuje dane z LinkedIn...");
    try {
      const response = await fetch("/api/parse-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "linkedin", linkedinUrl: form.linkedin, linkedinText: form.linkedin_text }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Nieznany błąd AI");
      setForm((prev) => mergeParsed(prev, normalizedParsed(result)));
      setMessage("Dane z LinkedIn uzupełnione. Sprawdź je przed zapisem.");
    } catch (error) {
      setMessage("Błąd AI LinkedIn: " + error.message);
    } finally {
      setParsingLinkedin(false);
    }
  };

  const uploadCvFile = async (file) => {
    if (!file) return "";
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `cv/${Date.now()}_${safeFileName}`;
    const { error } = await supabase.storage.from("CV").upload(fileName, file);
    if (error) throw new Error(error.message);
    return fileName;
  };

  const openCv = async (cvPath) => {
    if (!cvPath) return;
    if (String(cvPath).startsWith("http")) {
      window.open(cvPath, "_blank", "noopener,noreferrer");
      return;
    }
    const { data, error } = await supabase.storage.from("CV").createSignedUrl(cvPath, 60);
    if (error) return setMessage("Nie udało się otworzyć CV: " + error.message);
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const saveCandidate = async () => {
    if (!form.name.trim()) return setMessage("Podaj imie i nazwisko kandydata");
    const previousCandidate = editingId ? candidates.find((candidate) => candidate.id === editingId) : null;
    let cvUrl = String(form.cv_url || "").trim();
    let uploadedCvName = "";
    try {
      if (form.cv_file) { uploadedCvName = form.cv_file.name; cvUrl = await uploadCvFile(form.cv_file); }
    } catch (error) { return setMessage("Blad uploadu CV: " + error.message); }

    const payload = { name: form.name.trim(), status: form.status, email: form.email.trim(), telefon: form.telefon.trim(), linkedin: form.linkedin.trim(), lokalizacja: form.lokalizacja.trim(), doświadczenie: String(form.doświadczenie || form.doswiadczenie || "").trim(), notatki: form.notatki.trim(), tagi: form.tagi.trim(), jezyk_programowania: form.jezyk_programowania.trim(), framework: form.framework.trim(), obszar: form.obszar.trim(), rating: Number(form.rating) || 0, favorite: Boolean(form.favorite), cv_url: cvUrl };
    let savedId = editingId;
    if (editingId) {
      const { error } = await supabase.from("candidates").update(payload).eq("id", editingId);
      if (error) return setMessage("Nie udalo sie zapisac kandydata: " + error.message);
      await logActivity({ entityType: "candidate", entityId: editingId, actionType: "candidate_edited", actionLabel: "Candidate edited", metadata: { candidate_name: payload.name } });
      if (previousCandidate?.status !== payload.status) await logActivity({ entityType: "candidate", entityId: editingId, actionType: "status_changed", actionLabel: "Status changed", oldValue: previousCandidate?.status || "", newValue: payload.status, metadata: { candidate_name: payload.name } });
      if ((previousCandidate?.notatki || "") !== payload.notatki) await logActivity({ entityType: "candidate", entityId: editingId, actionType: "notes_changed", actionLabel: "Candidate notes changed", oldValue: previousCandidate?.notatki || "", newValue: payload.notatki, metadata: { candidate_name: payload.name } });
    } else {
      const { data, error } = await supabase.from("candidates").insert([payload]).select().single();
      if (error) return setMessage("Nie udalo sie dodac kandydata: " + error.message);
      savedId = data.id;
      await logActivity({ entityType: "candidate", entityId: savedId, actionType: "candidate_created", actionLabel: "Candidate created", newValue: payload.name, metadata: { candidate_name: payload.name } });
    }
    if (uploadedCvName) await logActivity({ entityType: "candidate", entityId: savedId, actionType: "cv_uploaded", actionLabel: "CV uploaded", newValue: uploadedCvName, metadata: { candidate_name: payload.name, cv_url: cvUrl } });
    if (!editingId && formProjectIds.length > 0) {
      const rows = formProjectIds.map((projectId) => ({ candidate_id: savedId, project_id: projectId, status: "New" }));
      const { error } = await supabase.from("candidate_projects").insert(rows);
      if (error) setMessage("Kandydat zapisany, ale nie udalo sie przypisac projektow: " + error.message);
      else await Promise.all(formProjectIds.map((projectId) => logActivity({ entityType: "candidate", entityId: savedId, actionType: "candidate_added_to_project", actionLabel: "Candidate added to project", newValue: getProjectName(projects.find((project) => project.id === projectId)), metadata: { candidate_name: payload.name, project_id: projectId } })));
    }
    setForm(emptyCandidate); setEditingId(null); setFormProjectIds([]); if (cvInputRef.current) cvInputRef.current.value = ""; setActiveTab("candidates"); setMessage(editingId ? "Kandydat zaktualizowany" : "Kandydat dodany"); refreshAll();
  };

  const startEditCandidate = (candidate) => {
    setEditingId(candidate.id);
    setForm({ ...emptyCandidate, ...candidate, cv_file: null, linkedin_text: "" });
    setActiveTab("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteCandidate = async (candidate) => {
    if (!confirm("Usunac kandydata: " + candidate.name + "?")) return;
    await supabase.from("candidate_projects").delete().eq("candidate_id", candidate.id);
    const { error } = await supabase.from("candidates").delete().eq("id", candidate.id);
    if (error) setMessage("Nie udalo sie usunac kandydata: " + error.message);
    else { await logActivity({ entityType: "candidate", entityId: candidate.id, actionType: "candidate_deleted", actionLabel: "Candidate deleted", oldValue: candidate.name, metadata: { candidate_name: candidate.name } }); refreshAll(); }
  };

  const toggleFavorite = async (candidate) => {
    const next = !candidate.favorite;
    setCandidates((prev) => prev.map((item) => (item.id === candidate.id ? { ...item, favorite: next } : item)));
    const { error } = await supabase.from("candidates").update({ favorite: next }).eq("id", candidate.id);
    if (error) { setMessage("Blad shortlisty: " + error.message); refreshAll(); }
    else await logActivity({ entityType: "candidate", entityId: candidate.id, actionType: next ? "shortlist_added" : "shortlist_removed", actionLabel: next ? "Shortlist added" : "Shortlist removed", oldValue: !next, newValue: next, metadata: { candidate_name: candidate.name } });
  };

  const updateCandidateStatus = async (candidate, status) => {
    const oldStatus = candidate.status || "New";
    setCandidates((prev) => prev.map((item) => (item.id === candidate.id ? { ...item, status } : item)));
    const { error } = await supabase.from("candidates").update({ status }).eq("id", candidate.id);
    if (error) setMessage("Nie udalo sie zmienic statusu: " + error.message);
    else { if (oldStatus !== status) await logActivity({ entityType: "candidate", entityId: candidate.id, actionType: "status_changed", actionLabel: "Status changed", oldValue: oldStatus, newValue: status, metadata: { candidate_name: candidate.name } }); refreshAll(); }
  };

  const recommendationRelation = (candidate, relation = null) => {
    if (relation) return relation;
    const activeProject = clientView ? clientProjectId : projectFilter;
    if (activeProject) return candidate.candidate_projects?.find((item) => item.project_id === activeProject) || null;
    const relations = candidate.candidate_projects || [];
    return relations.length === 1 ? relations[0] : null;
  };

  const isRecommended = (candidate) => {
    const activeProject = clientView ? clientProjectId : projectFilter;
    return Boolean(candidate.candidate_projects?.some((relation) => relation.recommended_to_client && (!activeProject || relation.project_id === activeProject)));
  };

  const toggleRecommended = async (candidate, relation = null) => {
    const target = recommendationRelation(candidate, relation);
    if (!target?.id) return setMessage("Wybierz projekt albo kliknij diament przy konkretnym projekcie kandydata.");
    const next = !target.recommended_to_client;
    const projectName = getProjectName(target.Projekty || projects.find((project) => project.id === target.project_id));
    setCandidates((prev) => prev.map((item) => item.id === candidate.id ? { ...item, candidate_projects: item.candidate_projects?.map((cp) => (cp.id === target.id ? { ...cp, recommended_to_client: next } : cp)) } : item));
    const { error } = await supabase.from("candidate_projects").update({ recommended_to_client: next }).eq("id", target.id);
    if (error) { setMessage("Blad rekomendacji: " + error.message); refreshAll(); }
    else await logActivity({ entityType: "candidate", entityId: candidate.id, actionType: next ? "recommended_added" : "recommended_removed", actionLabel: next ? "Candidate marked as recommended" : "Candidate recommendation removed", oldValue: !next, newValue: next, metadata: { candidate_name: candidate.name, project_id: target.project_id, project_name: projectName, relation_id: target.id } });
  };

  const assignProject = async (candidateId) => {
    const projectId = selectedProjects[candidateId]; if (!projectId) return setMessage("Najpierw wybierz projekt");
    const candidate = candidates.find((item) => item.id === candidateId);
    if (candidate?.candidate_projects?.some((relation) => relation.project_id === projectId)) return setMessage("Ten projekt jest juz przypisany");
    const projectName = getProjectName(projects.find((project) => project.id === projectId));
    const { error } = await supabase.from("candidate_projects").insert([{ candidate_id: candidateId, project_id: projectId, status: "New" }]);
    if (error) setMessage("Blad przypisania projektu: " + error.message);
    else { await logActivity({ entityType: "candidate", entityId: candidateId, actionType: "candidate_added_to_project", actionLabel: "Candidate added to project", newValue: projectName, metadata: { candidate_name: candidate?.name || "", project_id: projectId, project_name: projectName } }); setSelectedProjects((prev) => ({ ...prev, [candidateId]: "" })); refreshAll(); }
  };

  const removeCandidateFromProject = async (relationId) => {
    if (!confirm("Usunac projekt z kandydata?")) return;
    const context = getRelationContext(relationId); const projectName = getProjectName(context.project);
    const { error } = await supabase.from("candidate_projects").delete().eq("id", relationId);
    if (error) setMessage("Blad usuwania projektu z kandydata: " + error.message);
    else { if (context.candidate?.id) await logActivity({ entityType: "candidate", entityId: context.candidate.id, actionType: "candidate_removed_from_project", actionLabel: "Candidate removed from project", oldValue: projectName, metadata: { candidate_name: context.candidate.name, project_id: context.relation?.project_id, project_name: projectName, relation_id: relationId } }); refreshAll(); }
  };

  const updateProjectRelation = async (relationId, payload) => {
    const context = getRelationContext(relationId); const oldRelation = context.relation || {};
    const { error } = await supabase.from("candidate_projects").update(payload).eq("id", relationId);
    if (error) setMessage("Blad zapisu projektu kandydata: " + error.message);
    else {
      const meta = { candidate_name: context.candidate?.name || "", project_id: oldRelation.project_id, project_name: getProjectName(context.project), relation_id: relationId };
      if (Object.prototype.hasOwnProperty.call(payload, "status") && oldRelation.status !== payload.status) await logActivity({ entityType: "candidate", entityId: context.candidate?.id || relationId, actionType: "status_changed", actionLabel: "Project status changed", oldValue: oldRelation.status || "New", newValue: payload.status, metadata: meta });
      for (const field of ["notes", "interview_summary", "recruiter_notes"]) if (Object.prototype.hasOwnProperty.call(payload, field) && (oldRelation[field] || "") !== (payload[field] || "")) await logActivity({ entityType: "candidate", entityId: context.candidate?.id || relationId, actionType: "notes_changed", actionLabel: field.replace(/_/g, " ") + " changed", oldValue: oldRelation[field] || "", newValue: payload[field] || "", metadata: { ...meta, field } });
      refreshAll();
    }
  };

  const toggleProjectSection = (candidateId) => {
    preserveScroll(() => {
      setActiveCandidateId(candidateId);
      setOpenProjectSections((prev) => ({ ...prev, [candidateId]: !prev[candidateId] }));
    });
  };

  const openModal = (candidateId) => preserveScroll(() => {
    setActiveCandidateId(candidateId);
    setEnlargedCandidateId(candidateId);
  });

  const closeModal = () => preserveScroll(() => setEnlargedCandidateId(null));

  const addClient = async () => {
    if (!newClientName.trim()) return setMessage("Podaj nazwe klienta");
    const payload = { name: newClientName.trim(), osoba_do_kontaktu: newClientContact.trim(), email: newClientEmail.trim(), telefon: newClientPhone.trim(), notatki: newClientNotes.trim() };
    const { data, error } = await supabase.from("clients").insert([payload]).select().single();
    if (error) return setMessage("Blad dodawania klienta: " + error.message);
    await logActivity({ entityType: "client", entityId: data?.id || payload.name, actionType: "client_created", actionLabel: "Client created", newValue: payload.name, metadata: { client_name: payload.name } });
    setNewClientName(""); setNewClientContact(""); setNewClientEmail(""); setNewClientPhone(""); setNewClientNotes(""); setMessage("Klient dodany"); refreshAll();
  };

  const deleteClient = async (client) => {
    if (!confirm("Usunac klienta: " + client.name + "? Projekty zostana bez klienta.")) return;
    await supabase.from("Projekty").update({ client_id: null }).eq("client_id", client.id);
    const { error } = await supabase.from("clients").delete().eq("id", client.id);
    if (error) setMessage("Blad usuwania klienta: " + error.message);
    else { await logActivity({ entityType: "client", entityId: client.id, actionType: "client_deleted", actionLabel: "Client deleted", oldValue: client.name, metadata: { client_name: client.name } }); refreshAll(); }
  };

  const projectDraft = (project) =>
    projectDrafts[project.id] || {
      project_notes: project.project_notes || "",
      candidate_requirements: project.candidate_requirements || "",
      ai_search_summary: project.ai_search_summary || "",
    };

  const updateProjectDraft = (project, field, value) => {
    setProjectDrafts((prev) => ({ ...prev, [project.id]: { ...projectDraft(project), [field]: value } }));
  };

  const addProject = async () => {
    if (!newProjectName.trim()) return setMessage("Podaj nazwe projektu");
    const payload = { name: newProjectName.trim(), client_id: newProjectClientId || null, project_notes: newProjectNotes.trim(), candidate_requirements: newProjectRequirements.trim(), ai_search_summary: newProjectAiSummary.trim() };
    const { data, error } = await supabase.from("Projekty").insert([payload]).select().single();
    if (error) return setMessage("Blad dodawania projektu: " + error.message);
    await logActivity({ entityType: "project", entityId: data?.id || payload.name, actionType: "project_created", actionLabel: "Project created", newValue: payload.name, metadata: { project_name: payload.name, client_id: payload.client_id } });
    setNewProjectName(""); setNewProjectClientId(""); setNewProjectNotes(""); setNewProjectRequirements(""); setNewProjectAiSummary(""); setMessage("Projekt dodany"); refreshAll();
  };

  const updateProjectClient = async (projectId, clientId) => {
    const project = projects.find((item) => item.id === projectId); const oldClientName = getClientName(project?.client_id); const nextClientId = clientId || null; const newClientNameValue = getClientName(nextClientId);
    const { error } = await supabase.from("Projekty").update({ client_id: nextClientId }).eq("id", projectId);
    if (error) setMessage("Blad przypisania klienta: " + error.message);
    else { if ((project?.client_id || null) !== nextClientId) await logActivity({ entityType: "project", entityId: projectId, actionType: "project_client_changed", actionLabel: "Project client changed", oldValue: oldClientName, newValue: newClientNameValue, metadata: { project_name: getProjectName(project), old_client_id: project?.client_id || null, new_client_id: nextClientId } }); refreshAll(); }
  };

  const saveProjectDetails = async (project) => {
    const draft = projectDraft(project); const { error } = await supabase.from("Projekty").update(draft).eq("id", project.id);
    if (error) setMessage("Blad zapisu projektu: " + error.message);
    else { await logActivity({ entityType: "project", entityId: project.id, actionType: "project_edited", actionLabel: "Project edited", metadata: { project_name: getProjectName(project) } }); for (const field of ["project_notes", "candidate_requirements", "ai_search_summary"]) if ((project[field] || "") !== (draft[field] || "")) await logActivity({ entityType: "project", entityId: project.id, actionType: "notes_changed", actionLabel: field.replace(/_/g, " ") + " changed", oldValue: project[field] || "", newValue: draft[field] || "", metadata: { project_name: getProjectName(project), field } }); setMessage("Projekt zapisany"); refreshAll(); }
  };

  const deleteProject = async (project) => {
    if (!confirm("Usunac projekt: " + getProjectName(project) + "? Kandydaci nie zostana usunieci.")) return;
    await supabase.from("candidate_projects").delete().eq("project_id", project.id);
    const { error } = await supabase.from("Projekty").delete().eq("id", project.id);
    if (error) setMessage("Blad usuwania projektu: " + error.message);
    else { await logActivity({ entityType: "project", entityId: project.id, actionType: "project_deleted", actionLabel: "Project deleted", oldValue: getProjectName(project), metadata: { project_name: getProjectName(project) } }); refreshAll(); }
  };

  const toggleProjectDetails = (project) => {
    preserveScroll(() => {
      setActiveProjectId(project.id);
      setProjectDetailsOpen((prev) => ({ ...prev, [project.id]: !prev[project.id] }));
    });
  };

  const toggleProjectCandidates = (projectId) => {
    preserveScroll(() => {
      setActiveProjectId(projectId);
      setProjectCandidatesOpen((prev) => ({ ...prev, [projectId]: !prev[projectId] }));
    });
  };

  const generateProjectAiSummary = (project) => {
    const summary = "AI sourcing summary for " + getProjectName(project) + ": target stack, seniority, location, availability and must-have requirements should be matched against candidate notes, CV data, project history and recruiter feedback.";
    updateProjectDraft(project, "ai_search_summary", summary);
    void logActivity({ entityType: "project", entityId: project.id, actionType: "ai_summary_generated", actionLabel: "AI summary generated", newValue: summary, metadata: { project_name: getProjectName(project) } });
  };

  const applyChip = (chip) => {
    preserveScroll(() => {
      if (chip === "Recommended") setOnlyRecommended((prev) => !prev);
      else if (chip === "Shortlist") setOnlyFavorites((prev) => !prev);
      else setQuery((prev) => (prev ? `${prev} ${chip}` : chip));
    });
  };

  const filteredCandidates = useMemo(() => {
    const activeProject = clientView ? clientProjectId : projectFilter;
    const result = candidates.filter((candidate) => {
      const text = getCandidateText(candidate);
      const relations = candidate.candidate_projects || [];
      const matchesQuery = advancedMode ? matchesBooleanQuery(text, debouncedQuery) : includesText(text, debouncedQuery);
      const matchesStatus = !globalStatusFilter || candidate.status === globalStatusFilter || relations.some((relation) => relation.status === globalStatusFilter);
      const matchesProject = !activeProject || relations.some((relation) => relation.project_id === activeProject);
      const matchesFavorite = !onlyFavorites || candidate.favorite;
      const matchesRecommended = !onlyRecommended || relations.some((relation) => relation.recommended_to_client && (!activeProject || relation.project_id === activeProject));
      const matchesLanguage = splitTerms(languageFilter).every((term) => includesText(candidate.jezyk_programowania, term));
      const matchesFramework = splitTerms(frameworkFilter).every((term) => includesText(candidate.framework, term));
      const matchesTags = splitTerms(tagFilter).every((term) => includesText(candidate.tagi, term));
      const years = getExperience(candidate);
      const matchesMin = !minExperience || years >= Number(minExperience);
      const matchesMax = !maxExperience || years <= Number(maxExperience);
      return matchesQuery && matchesStatus && matchesProject && matchesFavorite && matchesRecommended && matchesLanguage && matchesFramework && matchesTags && matchesMin && matchesMax;
    });

    return result.sort((a, b) => {
      if (sortBy === "oldest") return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      if (sortBy === "name") return String(a.name || "").localeCompare(String(b.name || ""), "pl");
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "experience") return getExperience(b) - getExperience(a);
      if (sortBy === "recommended") return Number(isRecommended(b)) - Number(isRecommended(a));
      if (sortBy === "shortlist") return Number(b.favorite) - Number(a.favorite);
      if (sortBy === "projects") return (b.candidate_projects?.length || 0) - (a.candidate_projects?.length || 0);
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [candidates, debouncedQuery, advancedMode, globalStatusFilter, projectFilter, clientProjectId, clientView, onlyFavorites, onlyRecommended, languageFilter, frameworkFilter, tagFilter, minExperience, maxExperience, sortBy]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => includesText(`${getProjectName(project)} ${getProjectClientName(project)} ${project.kategoria || ""}`, projectSearch));
  }, [projects, clients, projectSearch]);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => includesText(`${client.name || ""} ${client.osoba_do_kontaktu || ""} ${client.email || ""} ${client.telefon || ""} ${client.notatki || ""}`, clientSearch));
  }, [clients, clientSearch]);

  const saveCurrentSearch = async () => {
    const name = prompt("Nazwa zapisanego wyszukiwania:");
    if (!name) return;
    const payload = { query, advancedMode, advancedQuery, globalStatusFilter, projectFilter, onlyFavorites, onlyRecommended, languageFilter, frameworkFilter, tagFilter, minExperience, maxExperience, sortBy };
    const { error } = await supabase.from("saved_searches").insert([{ name, payload }]);
    if (error) setMessage("Nie udało się zapisać wyszukiwania. Uruchom SQL dla tabeli saved_searches: " + error.message);
    else refreshAll();
  };

  const applySavedSearch = (saved) => {
    const payload = saved.payload || {};
    setQuery(payload.query || "");
    setAdvancedMode(Boolean(payload.advancedMode));
    setAdvancedQuery(payload.advancedQuery || "");
    setGlobalStatusFilter(payload.globalStatusFilter || "");
    setProjectFilter(payload.projectFilter || "");
    setOnlyFavorites(Boolean(payload.onlyFavorites));
    setOnlyRecommended(Boolean(payload.onlyRecommended));
    setLanguageFilter(payload.languageFilter || "");
    setFrameworkFilter(payload.frameworkFilter || "");
    setTagFilter(payload.tagFilter || "");
    setMinExperience(payload.minExperience || "");
    setMaxExperience(payload.maxExperience || "");
    setSortBy(payload.sortBy || "newest");
    setAdvancedOpen(true);
  };

  const candidateMatch = (candidate) => {
    const text = normalize(getCandidateText(candidate));
    const wanted = [...splitTerms(languageFilter), ...splitTerms(frameworkFilter), ...splitTerms(tagFilter), ...splitTerms(advancedMode ? advancedQuery : query)];
    if (wanted.length === 0) return isRecommended(candidate) ? 82 : candidate.favorite ? 76 : 64;
    const hits = wanted.filter((term) => text.includes(normalize(term))).length;
    return Math.min(99, 45 + Math.round((hits / wanted.length) * 50) + (isRecommended(candidate) ? 4 : 0));
  };

  const CandidateCard = ({ candidate }) => {
    const recommended = isRecommended(candidate);
    const active = activeCandidateId === candidate.id || enlargedCandidateId === candidate.id || openProjectSections[candidate.id];
    return (
      <article className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${active ? "border-teal-300 ring-4 ring-teal-100" : "border-slate-200"}`} onDoubleClick={() => openModal(candidate.id)}>
        <div className={`h-2 bg-gradient-to-r ${accentClass(candidate.status || "New")}`} />
        <div className={`${compactMode ? "p-4" : "p-5"}`}>
          <div className="flex items-start gap-4">
            {!clientView && (
              <div className="flex flex-col items-center gap-2">
                <button type="button" onClick={() => toggleFavorite(candidate)} className={`text-2xl ${candidate.favorite ? "text-yellow-400" : "text-slate-300 hover:text-yellow-400"}`} title="Shortlista">★</button>
                <button type="button" onClick={() => toggleRecommended(candidate)} className={`text-2xl ${recommended ? "text-teal-500" : "text-slate-300 hover:text-teal-500"}`} title="Rekomendowany do klienta">♦</button>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black text-slate-950">{candidate.name || "Kandydat bez nazwy"}</h3>
                  <p className="mt-1 text-sm text-slate-500">{candidate.lokalizacja || candidate.email || candidate.telefon || "Brak danych kontaktowych"}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={candidate.status || "New"} compact />
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-700">{candidateMatch(candidate)}% Match</span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                {candidate.linkedin && <p><b>LinkedIn:</b> <a className="font-bold text-blue-700 hover:underline" href={candidate.linkedin} target="_blank" rel="noreferrer">Otwórz profil</a></p>}
                {candidate.email && !compactMode && <p><b>Email:</b> {candidate.email}</p>}
                {candidate.telefon && !compactMode && <p><b>Telefon:</b> {candidate.telefon}</p>}
                {candidate.doświadczenie && <p><b>Doświadczenie:</b> {candidate.doświadczenie}</p>}
                {(candidate.jezyk_programowania || candidate.framework) && <p><b>Stack:</b> {candidate.jezyk_programowania}{candidate.framework ? ` / ${candidate.framework}` : ""}</p>}
                {!compactMode && candidate.notatki && <p className="mt-3 rounded-xl bg-white p-3"><b>Notatki:</b> {candidate.notatki}</p>}
                {candidate.cv_url && <button type="button" onClick={() => openCv(candidate.cv_url)} className="mt-3 font-bold text-blue-700 hover:underline">Otwórz CV</button>}
              </div>

              {!clientView && (
                <div className="mt-4 grid gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <select className={`rounded-xl border px-3 py-2 text-sm font-black ${statusClass(candidate.status || "New")}`} value={candidate.status || "New"} onChange={(event) => updateCandidateStatus(candidate, event.target.value)}>
                      {STATUSES.map((status) => <option key={status}>{status}</option>)}
                    </select>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => startEditCandidate(candidate)} className="rounded-xl border px-3 py-2 text-sm font-bold hover:bg-slate-50">Edytuj</button>
                      <button type="button" onClick={() => openModal(candidate.id)} className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800">Powiększ</button>
                      <button type="button" onClick={() => deleteCandidate(candidate)} className="rounded-xl border border-red-200 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50">Usuń</button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <button type="button" onClick={() => toggleProjectSection(candidate.id)} className="flex w-full items-center justify-between text-left text-sm font-black text-slate-800">
                      <span>Projekty kandydata / podsumowania rozmów</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{openProjectSections[candidate.id] ? "Zwiń" : "Rozwiń"}</span>
                    </button>
                    {openProjectSections[candidate.id] && <CandidateProjects candidate={candidate} />}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
    );
  };

  const CandidateProjects = ({ candidate }) => (
    <div className="mt-3 grid gap-3">
      {(candidate.candidate_projects || []).map((relation) => (
        <div key={relation.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={() => { setProjectFilter(relation.project_id); setActiveTab("candidates"); }} className="font-black text-slate-900 hover:text-blue-700 hover:underline">{getProjectName(relation.Projekty)}</button>
            <div className="flex gap-2">
              <button type="button" onClick={() => toggleRecommended(candidate, relation)} className={`rounded-full border px-3 py-1 text-sm font-black ${relation.recommended_to_client ? "border-teal-600 bg-teal-600 text-white" : "bg-white text-slate-400 hover:text-teal-700"}`}>♦</button>
              <button type="button" onClick={() => removeCandidateFromProject(relation.id)} className="rounded-full border border-red-200 bg-white px-3 py-1 text-sm font-black text-red-600">Usuń</button>
            </div>
          </div>
          <select className={`w-full rounded-xl border p-2 text-sm font-black ${statusClass(relation.status || "New")}`} value={relation.status || "New"} onChange={(event) => updateProjectRelation(relation.id, { status: event.target.value })}>
            {STATUSES.map((status) => <option key={status}>{status}</option>)}
          </select>
          <textarea className="mt-2 min-h-24 w-full rounded-xl border bg-white p-2 text-sm" defaultValue={relation.notes || ""} placeholder="Notatka projektowa" onBlur={(event) => updateProjectRelation(relation.id, { notes: event.target.value })} />
        </div>
      ))}
      {(candidate.candidate_projects || []).length === 0 && <p className="text-sm text-slate-400">Brak przypisanego projektu</p>}
      <div className="flex gap-2">
        <select className="w-full rounded-xl border p-2" value={selectedProjects[candidate.id] || ""} onChange={(event) => setSelectedProjects((prev) => ({ ...prev, [candidate.id]: event.target.value }))}>
          <option value="">Wybierz projekt</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{getProjectName(project)}</option>)}
        </select>
        <button type="button" onClick={() => assignProject(candidate.id)} className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700">Przypisz</button>
      </div>
    </div>
  );

  const EditableCandidateModal = ({ candidate }) => {
    const [draft, setDraft] = useState(() => ({
      details: { ...emptyCandidate, ...candidate, cv_file: null },
      projectRelations: Object.fromEntries((candidate.candidate_projects || []).map((relation) => [relation.id, { ...relation }])),
    }));
    const [feedback, setFeedback] = useState("");
    const [saving, setSaving] = useState(false);
    const [modalCvFile, setModalCvFile] = useState(null);
    const [modalParsing, setModalParsing] = useState(false);
    const modalCvInputRef = useRef(null);

    const setDetail = (field, value) => setDraft((prev) => ({ ...prev, details: { ...prev.details, [field]: value } }));
    const setRelation = (relationId, field, value) => setDraft((prev) => ({ ...prev, projectRelations: { ...prev.projectRelations, [relationId]: { ...prev.projectRelations[relationId], [field]: value } } }));

    const parseModalCv = async () => {
      if (!modalCvFile) return setFeedback("Choose a CV file first");
      setModalParsing(true);
      setFeedback("AI is reading the CV...");
      try {
        const parsed = await parseCvFile(modalCvFile);
        setDraft((prev) => ({ ...prev, details: mergeParsed(prev.details, parsed) }));
        await logActivity({ entityType: "candidate", entityId: candidate.id, actionType: "cv_parsed", actionLabel: "CV parsed with AI", metadata: { candidate_name: candidate.name, file_name: modalCvFile?.name || "CV" } });
        setFeedback("CV parsed. Review fields before saving.");
      } catch (error) {
        setFeedback("AI CV failed: " + error.message);
      } finally {
        setModalParsing(false);
      }
    };

    const saveModal = async () => {
      setSaving(true);
      setFeedback("");
      let cvUrl = draft.details.cv_url || "";
      try {
        if (modalCvFile) cvUrl = await uploadCvFile(modalCvFile);
      } catch (error) {
        setSaving(false);
        return setFeedback("CV upload failed: " + error.message);
      }

      const candidatePayload = {
        name: draft.details.name.trim(),
        status: draft.details.status,
        email: draft.details.email.trim(),
        telefon: draft.details.telefon.trim(),
        linkedin: draft.details.linkedin.trim(),
        lokalizacja: draft.details.lokalizacja.trim(),
        doświadczenie: String(draft.details.doświadczenie || "").trim(),
        notatki: draft.details.notatki.trim(),
        tagi: draft.details.tagi.trim(),
        jezyk_programowania: draft.details.jezyk_programowania.trim(),
        framework: draft.details.framework.trim(),
        obszar: draft.details.obszar.trim(),
        rating: Number(draft.details.rating) || 0,
        cv_url: cvUrl,
      };
      const { error: candidateError } = await supabase.from("candidates").update(candidatePayload).eq("id", candidate.id);
      if (candidateError) {
        setSaving(false);
        return setFeedback("Save failed: " + candidateError.message);
      }

      for (const [relationId, relation] of Object.entries(draft.projectRelations)) {
        const previousRelation = candidate.candidate_projects?.find((item) => item.id === relationId) || {};
        const { error } = await supabase
          .from("candidate_projects")
          .update({
            status: relation.status || "New",
            notes: relation.notes || "",
            interview_summary: relation.interview_summary || "",
            recruiter_notes: relation.recruiter_notes || "",
            recommended_to_client: Boolean(relation.recommended_to_client),
          })
          .eq("id", relationId);
        if (error) {
          setSaving(false);
          return setFeedback("Project save failed: " + error.message);
        }
        if ((previousRelation.status || "New") !== (relation.status || "New")) await logActivity({ entityType: "candidate", entityId: candidate.id, actionType: "status_changed", actionLabel: "Project status changed", oldValue: previousRelation.status || "New", newValue: relation.status || "New", metadata: { candidate_name: candidate.name, project_name: getProjectName(previousRelation.Projekty || relation.Projekty), relation_id: relationId, source: "modal" } });
        if (Boolean(previousRelation.recommended_to_client) !== Boolean(relation.recommended_to_client)) await logActivity({ entityType: "candidate", entityId: candidate.id, actionType: relation.recommended_to_client ? "recommended_added" : "recommended_removed", actionLabel: relation.recommended_to_client ? "Candidate marked as recommended" : "Candidate recommendation removed", oldValue: Boolean(previousRelation.recommended_to_client), newValue: Boolean(relation.recommended_to_client), metadata: { candidate_name: candidate.name, project_name: getProjectName(previousRelation.Projekty || relation.Projekty), relation_id: relationId, source: "modal" } });
      }
      setSaving(false);
      setFeedback("Saved successfully");
      await logActivity({ entityType: "candidate", entityId: candidate.id, actionType: "candidate_edited", actionLabel: "Candidate edited", metadata: { candidate_name: candidate.name, source: "modal" } });
      if ((candidate.status || "New") !== (draft.details.status || "New")) await logActivity({ entityType: "candidate", entityId: candidate.id, actionType: "status_changed", actionLabel: "Status changed", oldValue: candidate.status || "New", newValue: draft.details.status || "New", metadata: { candidate_name: candidate.name, source: "modal" } });
      if ((candidate.notatki || "") !== (draft.details.notatki || "")) await logActivity({ entityType: "candidate", entityId: candidate.id, actionType: "notes_changed", actionLabel: "Candidate notes changed", oldValue: candidate.notatki || "", newValue: draft.details.notatki || "", metadata: { candidate_name: candidate.name, source: "modal" } });
      if (modalCvFile) await logActivity({ entityType: "candidate", entityId: candidate.id, actionType: "cv_uploaded", actionLabel: "CV uploaded", newValue: modalCvFile.name, metadata: { candidate_name: candidate.name, cv_url: cvUrl, source: "modal" } });
      refreshAll();
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm">
        <div className="max-h-[94vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 p-5 backdrop-blur">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <div className="mb-3 flex flex-wrap gap-2"><StatusBadge status={draft.details.status || "New"} />{candidate.favorite && <span className="rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-black text-yellow-700">★ Shortlist</span>}{isRecommended(candidate) && <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-black text-teal-800">♦ Recommended</span>}</div>
                <h2 className="text-2xl font-black text-slate-950 md:text-4xl">{draft.details.name || "Kandydat bez nazwy"}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">Edit candidate details, AI-fill from CV and update project feedback.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                {feedback && <span className={`rounded-full px-3 py-2 text-xs font-black ${feedback.includes("failed") || feedback.includes("Choose") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{feedback}</span>}
                <button type="button" onClick={() => openActivityHistory("candidate", candidate.id, draft.details.name || candidate.name || "Kandydat")} className="rounded-2xl border bg-white px-4 py-3 text-sm font-black hover:bg-slate-50">Historia</button>
                <button type="button" onClick={saveModal} disabled={saving} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:bg-slate-300">{saving ? "Saving..." : "Save changes"}</button>
                <button type="button" onClick={closeModal} className="rounded-2xl border bg-white px-5 py-3 text-sm font-black hover:bg-slate-50">Close</button>
              </div>
            </div>
          </div>

          <div className="max-h-[calc(94vh-132px)] overflow-y-auto bg-slate-50 p-4 md:p-6">
            <div className="grid gap-5 lg:grid-cols-[0.95fr_1.35fr]">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">Candidate details</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <input className="rounded-xl border p-3" placeholder="Name" value={draft.details.name || ""} onChange={(event) => setDetail("name", event.target.value)} />
                  <input className="rounded-xl border p-3" placeholder="Email" value={draft.details.email || ""} onChange={(event) => setDetail("email", event.target.value)} />
                  <input className="rounded-xl border p-3" placeholder="Phone" value={draft.details.telefon || ""} onChange={(event) => setDetail("telefon", event.target.value)} />
                  <input className="rounded-xl border p-3" placeholder="LinkedIn" value={draft.details.linkedin || ""} onChange={(event) => setDetail("linkedin", event.target.value)} />
                  <input className="rounded-xl border p-3" placeholder="Location" value={draft.details.lokalizacja || ""} onChange={(event) => setDetail("lokalizacja", event.target.value)} />
                  <input className="rounded-xl border p-3" placeholder="Experience" value={draft.details.doświadczenie || ""} onChange={(event) => setDetail("doświadczenie", event.target.value)} />
                  <input className="rounded-xl border p-3" placeholder="Tech stack" value={draft.details.jezyk_programowania || ""} onChange={(event) => setDetail("jezyk_programowania", event.target.value)} />
                  <input className="rounded-xl border p-3" placeholder="Framework" value={draft.details.framework || ""} onChange={(event) => setDetail("framework", event.target.value)} />
                  <input className="rounded-xl border p-3" placeholder="Area" value={draft.details.obszar || ""} onChange={(event) => setDetail("obszar", event.target.value)} />
                  <input className="rounded-xl border p-3" placeholder="Tags" value={draft.details.tagi || ""} onChange={(event) => setDetail("tagi", event.target.value)} />
                  <input className="rounded-xl border p-3" placeholder="Rating" type="number" min="0" max="5" value={draft.details.rating || 0} onChange={(event) => setDetail("rating", event.target.value)} />
                  <input className="rounded-xl border p-3" placeholder="CV URL / path" value={draft.details.cv_url || ""} onChange={(event) => setDetail("cv_url", event.target.value)} />
                </div>
                <label className="mt-4 grid gap-2">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-400">Candidate status</span>
                  <select className={`rounded-2xl border p-3 font-black ${statusClass(draft.details.status || "New")}`} value={draft.details.status || "New"} onChange={(event) => setDetail("status", event.target.value)}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
                </label>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-black uppercase tracking-wide text-slate-400">AI CV parsing</div>
                  <input ref={modalCvInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(event) => setModalCvFile(event.target.files?.[0] || null)} />
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"><button type="button" onClick={() => modalCvInputRef.current?.click()} className="rounded-xl border bg-white px-4 py-3 text-sm font-black hover:bg-slate-50">Choose CV</button><span className="text-sm font-semibold text-slate-500">{modalCvFile ? modalCvFile.name : draft.details.cv_url ? "Existing CV saved" : "No file selected"}</span></div>
                  <button type="button" onClick={parseModalCv} disabled={modalParsing || !modalCvFile} className="mt-3 rounded-xl bg-teal-600 px-4 py-2 text-sm font-black text-white hover:bg-teal-700 disabled:bg-slate-300">{modalParsing ? "Parsing..." : "AI parse CV"}</button>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">Notes</h3>
                <textarea className="min-h-64 w-full rounded-2xl border bg-slate-50 p-4 text-sm leading-relaxed" value={draft.details.notatki || ""} onChange={(event) => setDetail("notatki", event.target.value)} placeholder="Candidate notes, context, risks, next steps..." />
              </section>
            </div>

            <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Projects and interview notes</h3>
              <div className="mt-4 grid gap-4">
                {(candidate.candidate_projects || []).map((relation) => {
                  const relationDraft = draft.projectRelations[relation.id] || relation;
                  return (
                    <div key={relation.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div><h4 className="font-black text-slate-950">{getProjectName(relation.Projekty)}</h4><p className="text-sm text-slate-500">{getProjectClientName(relation.Projekty)}</p></div>
                        <div className="flex flex-wrap gap-2"><select className={`rounded-xl border px-3 py-2 text-sm font-black ${statusClass(relationDraft.status || "New")}`} value={relationDraft.status || "New"} onChange={(event) => setRelation(relation.id, "status", event.target.value)}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select><button type="button" onClick={() => setRelation(relation.id, "recommended_to_client", !relationDraft.recommended_to_client)} className={`rounded-full border px-4 py-2 text-sm font-black ${relationDraft.recommended_to_client ? "border-teal-600 bg-teal-600 text-white" : "bg-white text-slate-500 hover:text-teal-700"}`}>♦ Recommended</button></div>
                      </div>
                      <div className="mt-4 grid gap-3 lg:grid-cols-3">
                        <textarea className="min-h-36 rounded-xl border bg-white p-3 text-sm" value={relationDraft.notes || ""} onChange={(event) => setRelation(relation.id, "notes", event.target.value)} placeholder="Project notes" />
                        <textarea className="min-h-36 rounded-xl border bg-white p-3 text-sm" value={relationDraft.interview_summary || ""} onChange={(event) => setRelation(relation.id, "interview_summary", event.target.value)} placeholder="Interview summary" />
                        <textarea className="min-h-36 rounded-xl border bg-white p-3 text-sm" value={relationDraft.recruiter_notes || ""} onChange={(event) => setRelation(relation.id, "recruiter_notes", event.target.value)} placeholder="Recruiter notes" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  };

  const ActivityHistoryModal = () => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm"><div className="max-h-[82vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"><div className="flex items-center justify-between gap-3 border-b border-slate-200 p-5"><div><h3 className="text-xl font-black text-slate-950">Historia</h3><p className="text-sm font-semibold text-slate-500">{historyModal?.title}</p></div><button type="button" onClick={closeActivityHistory} className="rounded-2xl border bg-white px-4 py-2 text-sm font-black hover:bg-slate-50">Zamknij</button></div><div className="max-h-[calc(82vh-92px)] overflow-y-auto p-5">{historyLoading && <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm font-bold text-slate-500">Ladowanie historii...</div>}{!historyLoading && historyItems.length === 0 && <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm font-bold text-slate-500">Brak zapisanej historii.</div>}{!historyLoading && historyItems.length > 0 && <div className="grid gap-2">{historyItems.map((item) => <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="text-xs font-black uppercase tracking-wide text-slate-400">{formatHistoryDate(item.created_at)}</div><div className="mt-1 text-sm font-black text-slate-900">{item.action_label}</div>{(item.old_value || item.new_value) && <div className="mt-1 text-sm text-slate-600">{item.old_value && <span>{item.old_value}</span>}{item.old_value && item.new_value && <span> -&gt; </span>}{item.new_value && <span>{item.new_value}</span>}</div>}</div>)}</div>}</div></div></div>
  );

  const AddCandidateView = () => (
    <section className="rounded-3xl bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-xl font-black">{editingId ? "Edytuj kandydata" : "Dodaj kandydata"}</h2>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <input className="rounded-xl border p-3" placeholder="Imię i nazwisko" value={form.name} onChange={(event) => setField("name", event.target.value)} />
        <select className="rounded-xl border p-3" value={form.status} onChange={(event) => setField("status", event.target.value)}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
        <input className="rounded-xl border p-3" placeholder="Email" value={form.email} onChange={(event) => setField("email", event.target.value)} />
        <input className="rounded-xl border p-3" placeholder="Telefon" value={form.telefon} onChange={(event) => setField("telefon", event.target.value)} />
        <input className="rounded-xl border p-3" placeholder="LinkedIn URL" value={form.linkedin} onChange={(event) => setField("linkedin", event.target.value)} />
        <input className="rounded-xl border p-3" placeholder="Lokalizacja" value={form.lokalizacja} onChange={(event) => setField("lokalizacja", event.target.value)} />
        <input className="rounded-xl border p-3" placeholder="Doświadczenie, np. 5 lat" value={form.doświadczenie} onChange={(event) => setField("doświadczenie", event.target.value)} />
        <input className="rounded-xl border p-3" placeholder="Język programowania" value={form.jezyk_programowania} onChange={(event) => setField("jezyk_programowania", event.target.value)} list="language-suggestions" />
        <datalist id="language-suggestions">{suggestions.languages.map((item) => <option key={item} value={item} />)}</datalist>
        <input className="rounded-xl border p-3" placeholder="Framework" value={form.framework} onChange={(event) => setField("framework", event.target.value)} list="framework-suggestions" />
        <datalist id="framework-suggestions">{suggestions.frameworks.map((item) => <option key={item} value={item} />)}</datalist>
        <input className="rounded-xl border p-3" placeholder="Obszar" value={form.obszar} onChange={(event) => setField("obszar", event.target.value)} />
        <input className="rounded-xl border p-3 lg:col-span-2" placeholder="Tagi" value={form.tagi} onChange={(event) => setField("tagi", event.target.value)} />
        <input className="rounded-xl border p-3" placeholder="CV URL / ścieżka" value={form.cv_url} onChange={(event) => setField("cv_url", event.target.value)} />
        <textarea className="min-h-28 rounded-xl border p-3 lg:col-span-3" placeholder="Notatki" value={form.notatki} onChange={(event) => setField("notatki", event.target.value)} />
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-sm font-black text-slate-900">AI CV parsing</div>
        <p className="mt-1 text-sm text-slate-500">Upload CV or CV screenshot, let AI fill the form, then edit manually before saving.</p>
        <input ref={cvInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(event) => setField("cv_file", event.target.files?.[0] || null)} />
        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center"><button type="button" onClick={() => cvInputRef.current?.click()} className="rounded-xl border bg-white px-4 py-3 font-black hover:bg-slate-50">Choose CV / image</button><span className="text-sm font-semibold text-slate-500">{form.cv_file ? form.cv_file.name : form.cv_url ? "Existing CV saved" : "No file selected"}</span></div>
        <button type="button" onClick={parseCv} disabled={parsingCv || !form.cv_file} className="mt-3 rounded-xl bg-teal-600 px-4 py-2 font-black text-white hover:bg-teal-700 disabled:bg-slate-300">{parsingCv ? "Parsing CV..." : "AI parse CV"}</button>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-sm font-black text-slate-900">AI LinkedIn parsing</div>
        <textarea className="mt-3 min-h-24 w-full rounded-xl border bg-white p-3" placeholder="Paste LinkedIn profile text here..." value={form.linkedin_text} onChange={(event) => setField("linkedin_text", event.target.value)} />
        <button type="button" onClick={parseLinkedin} disabled={parsingLinkedin || (!form.linkedin_text.trim() && !form.linkedin.trim())} className="mt-3 rounded-xl bg-purple-600 px-4 py-2 font-black text-white hover:bg-purple-700 disabled:bg-slate-300">{parsingLinkedin ? "Parsing LinkedIn..." : "AI parse LinkedIn"}</button>
      </div>

      {!editingId && <div className="mt-4 flex flex-wrap gap-2">{projects.map((project) => { const selected = formProjectIds.includes(project.id); return <button key={project.id} type="button" onClick={() => setFormProjectIds((prev) => selected ? prev.filter((id) => id !== project.id) : [...prev, project.id])} className={`rounded-full border px-3 py-1 text-sm font-bold ${selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>{getProjectName(project)}</button>; })}</div>}
      <div className="mt-5 flex gap-2"><button type="button" onClick={saveCandidate} className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-800">{editingId ? "Zapisz zmiany" : "Dodaj kandydata"}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyCandidate); }} className="rounded-xl border px-5 py-3 font-bold hover:bg-slate-50">Anuluj</button>}</div>
    </section>
  );

  const CandidatesView = () => (
    <>
      <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black">Kandydaci</h2><div className="flex gap-2"><button type="button" onClick={() => setAdvancedMode((prev) => !prev)} className={`rounded-xl px-3 py-2 text-sm font-black ${advancedMode ? "bg-slate-950 text-white" : "border bg-white"}`}>Boolean</button><button type="button" onClick={() => setAdvancedOpen((prev) => !prev)} className="rounded-xl border px-3 py-2 text-sm font-black hover:bg-slate-50">{advancedOpen ? "Hide advanced" : "Advanced filters"}</button></div></div>
        <div className="grid gap-3 md:grid-cols-4">
          <input className="rounded-xl border p-3 md:col-span-2" placeholder={advancedMode ? 'Boolean: (java OR kotlin) AND "spring boot" AND NOT frontend' : "Szukaj..."} value={advancedMode ? advancedQuery : query} onChange={(event) => advancedMode ? setAdvancedQuery(event.target.value) : setQuery(event.target.value)} />
          <select className="rounded-xl border p-3" value={globalStatusFilter} onChange={(event) => setGlobalStatusFilter(event.target.value)}><option value="">Status: wszystkie</option>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
          <select className="rounded-xl border p-3" value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}><option value="">Projekt: wszystkie</option>{projects.map((project) => <option key={project.id} value={project.id}>{getProjectName(project)}</option>)}</select>
          <input className="rounded-xl border p-3" placeholder="Języki" value={languageFilter} onChange={(event) => setLanguageFilter(event.target.value)} />
          <input className="rounded-xl border p-3" placeholder="Frameworki" value={frameworkFilter} onChange={(event) => setFrameworkFilter(event.target.value)} />
          <input className="rounded-xl border p-3" placeholder="Tagi" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} />
          <select className="rounded-xl border p-3" value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="newest">Najnowsi</option><option value="oldest">Najstarsi</option><option value="name">Nazwa A-Z</option><option value="rating">Najwyższa ocena</option><option value="experience">Największe doświadczenie</option><option value="recommended">Rekomendowani pierwsi</option><option value="shortlist">Shortlista pierwsza</option><option value="projects">Najwięcej projektów</option></select>
          <button type="button" onClick={() => { setQuery(""); setAdvancedQuery(""); setGlobalStatusFilter(""); setProjectFilter(""); setOnlyFavorites(false); setOnlyRecommended(false); setLanguageFilter(""); setFrameworkFilter(""); setTagFilter(""); setMinExperience(""); setMaxExperience(""); }} className="rounded-xl border px-4 py-3 font-bold hover:bg-slate-50">Wyczyść filtry</button>
        </div>

        {advancedOpen && <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="grid gap-3 md:grid-cols-4"><input className="rounded-xl border p-3" placeholder="Min years" type="number" value={minExperience} onChange={(event) => setMinExperience(event.target.value)} /><input className="rounded-xl border p-3" placeholder="Max years" type="number" value={maxExperience} onChange={(event) => setMaxExperience(event.target.value)} /><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={compactMode} onChange={(event) => setCompactMode(event.target.checked)} /> Compact sourcing mode</label><button type="button" onClick={saveCurrentSearch} className="rounded-xl bg-slate-950 px-4 py-3 font-bold text-white">Save search</button></div>{savedSearches.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{savedSearches.map((saved) => <button key={saved.id} type="button" onClick={() => applySavedSearch(saved)} className="rounded-full border bg-white px-3 py-1 text-sm font-bold hover:bg-slate-50">{saved.name}</button>)}</div>}</div>}

        <div className="mt-4 flex flex-wrap gap-2">{QUICK_CHIPS.map((chip) => <button key={chip} type="button" onClick={() => applyChip(chip)} className="rounded-full border bg-white px-3 py-1 text-xs font-black text-slate-600 hover:bg-slate-50">{chip}</button>)}</div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-4"><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={onlyFavorites} onChange={(event) => setOnlyFavorites(event.target.checked)} /> Tylko shortlista ★</label><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={onlyRecommended} onChange={(event) => setOnlyRecommended(event.target.checked)} /> Tylko rekomendowani ♦</label></div><p className="text-sm text-slate-500">Znaleziono: <b>{filteredCandidates.length}</b></p></div>
      </section>
      {loading && <div className="rounded-3xl bg-white p-6 text-center shadow-sm">Ładowanie...</div>}
      {!loading && filteredCandidates.length === 0 && <div className="rounded-3xl bg-white p-10 text-center shadow-sm">Brak kandydatów.</div>}
      <main className={`grid gap-4 ${compactMode ? "xl:grid-cols-3" : "lg:grid-cols-2"}`}>{filteredCandidates.map((candidate) => <CandidateCard key={candidate.id} candidate={candidate} />)}</main>
    </>
  );

  const ProjectsView = () => (
    <>
      <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm"><h2 className="mb-4 text-xl font-black">Projekty</h2><div className="grid gap-3 md:grid-cols-4"><input className="rounded-xl border p-3 md:col-span-2" placeholder="Nazwa projektu" value={newProjectName} onChange={(event) => setNewProjectName(event.target.value)} /><select className="rounded-xl border p-3" value={newProjectClientId} onChange={(event) => setNewProjectClientId(event.target.value)}><option value="">Bez klienta</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select><button type="button" onClick={addProject} className="rounded-xl bg-green-600 px-4 py-2 font-bold text-white hover:bg-green-700">Dodaj projekt</button><textarea className="min-h-24 rounded-xl border p-3 md:col-span-2" placeholder="Project notes" value={newProjectNotes} onChange={(event) => setNewProjectNotes(event.target.value)} /><textarea className="min-h-24 rounded-xl border p-3" placeholder="Candidate requirements" value={newProjectRequirements} onChange={(event) => setNewProjectRequirements(event.target.value)} /><textarea className="min-h-24 rounded-xl border p-3" placeholder="AI search summary" value={newProjectAiSummary} onChange={(event) => setNewProjectAiSummary(event.target.value)} /></div><input className="mt-4 w-full rounded-xl border p-3" placeholder="Szukaj projektu albo klienta..." value={projectSearch} onChange={(event) => setProjectSearch(event.target.value)} /></section>
      <main className="grid gap-4 lg:grid-cols-2">{filteredProjects.map((project) => { const projectCandidates = candidates.map((candidate) => ({ candidate, relation: candidate.candidate_projects?.find((relation) => relation.project_id === project.id) })).filter((item) => item.relation); const detailsOpen = Boolean(projectDetailsOpen[project.id]); const candidatesOpen = Boolean(projectCandidatesOpen[project.id]); const active = activeProjectId === project.id || detailsOpen || candidatesOpen; const draft = projectDraft(project); return <article key={project.id} className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition ${active ? "border-teal-300 ring-4 ring-teal-50" : "border-slate-200"}`}><div className={`h-2 bg-gradient-to-r ${active ? "from-teal-600 to-blue-500" : "from-slate-300 to-slate-100"}`} /><div className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-xl font-black text-slate-950">{getProjectName(project)}</h3><p className="mt-1 text-sm text-slate-500">Klient: <b>{getProjectClientName(project)}</b></p><p className="mt-1 text-sm text-slate-500">Kandydaci: <b>{projectCandidates.length}</b></p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => toggleProjectDetails(project)} className={`rounded-full px-3 py-1 text-sm font-bold ${detailsOpen ? "bg-slate-900 text-white" : "border bg-white hover:bg-slate-50"}`}>{detailsOpen ? "Ukryj szczegóły" : "Project Details"}</button><button type="button" onClick={() => toggleProjectCandidates(project.id)} className={`rounded-full px-3 py-1 text-sm font-bold ${candidatesOpen ? "bg-teal-600 text-white" : "border bg-white hover:bg-slate-50"}`}>Kandydaci ({projectCandidates.length})</button><button type="button" onClick={() => deleteProject(project)} className="rounded-full border border-red-200 bg-white px-3 py-1 text-sm font-bold text-red-600 hover:bg-red-50">Usuń</button></div></div><div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3"><label className="mb-1 block text-sm font-bold text-slate-700">Klient projektu</label><select className="w-full rounded-xl border bg-white p-2" value={project.client_id || ""} onChange={(event) => updateProjectClient(project.id, event.target.value)}><option value="">Bez klienta</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></div>{detailsOpen && <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap items-center gap-2"><h4 className="font-black">Project Details</h4><button type="button" onClick={() => openActivityHistory("project", project.id, getProjectName(project))} className="rounded-xl border bg-white px-3 py-2 text-sm font-bold hover:bg-slate-50">Historia</button></div><button type="button" onClick={() => generateProjectAiSummary(project)} className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-bold text-teal-700">Generate AI sourcing summary</button></div><div className="grid gap-3"><textarea className="min-h-28 rounded-xl border p-3" value={draft.project_notes} onChange={(event) => updateProjectDraft(project, "project_notes", event.target.value)} placeholder="Project notes" /><textarea className="min-h-28 rounded-xl border p-3" value={draft.candidate_requirements} onChange={(event) => updateProjectDraft(project, "candidate_requirements", event.target.value)} placeholder="Candidate requirements" /><textarea className="min-h-28 rounded-xl border p-3" value={draft.ai_search_summary} onChange={(event) => updateProjectDraft(project, "ai_search_summary", event.target.value)} placeholder="AI search summary" /></div><button type="button" onClick={() => saveProjectDetails(project)} className="mt-4 rounded-xl bg-slate-900 px-5 py-3 font-bold text-white">SAVE</button></section>}<div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3"><button type="button" onClick={() => toggleProjectCandidates(project.id)} className="flex w-full items-center justify-between text-left"><span><span className="block text-sm font-black">Lista kandydatów</span><span className="text-xs text-slate-500">{projectCandidates.length} przypisanych kandydatów</span></span><span className="rounded-full bg-white px-3 py-1 text-xs font-bold shadow-sm">{candidatesOpen ? "Zwiń" : "Rozwiń"}</span></button>{candidatesOpen && <div className="mt-3 grid gap-2">{projectCandidates.map(({ candidate, relation }) => <button key={relation.id} type="button" onClick={() => openModal(candidate.id)} className="flex items-center justify-between gap-3 rounded-xl border bg-white px-3 py-2 text-left shadow-sm hover:shadow-md"><span className="min-w-0 truncate font-black text-slate-900">{candidate.name || "Kandydat bez nazwy"}</span><StatusBadge status={relation.status || candidate.status || "New"} compact /></button>)}</div>}</div></div></article>; })}</main>
    </>
  );

  const ClientsView = () => (
    <>
      <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm"><h2 className="mb-4 text-xl font-black">Klienci</h2><div className="grid gap-3 md:grid-cols-5"><input className="rounded-xl border p-3" placeholder="Nazwa klienta" value={newClientName} onChange={(event) => setNewClientName(event.target.value)} /><input className="rounded-xl border p-3" placeholder="Osoba do kontaktu" value={newClientContact} onChange={(event) => setNewClientContact(event.target.value)} /><input className="rounded-xl border p-3" placeholder="Email" value={newClientEmail} onChange={(event) => setNewClientEmail(event.target.value)} /><input className="rounded-xl border p-3" placeholder="Telefon" value={newClientPhone} onChange={(event) => setNewClientPhone(event.target.value)} /><input className="rounded-xl border p-3" placeholder="Notatki" value={newClientNotes} onChange={(event) => setNewClientNotes(event.target.value)} /><button type="button" onClick={addClient} className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white">Dodaj klienta</button></div><input className="mt-4 w-full rounded-xl border p-3" placeholder="Szukaj klienta..." value={clientSearch} onChange={(event) => setClientSearch(event.target.value)} /></section>
      <main className="grid gap-4 lg:grid-cols-2">{filteredClients.map((client) => { const clientProjects = projects.filter((project) => project.client_id === client.id); return <article key={client.id} className="rounded-3xl bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-black">{client.name}</h3><p className="text-sm text-slate-500">{client.osoba_do_kontaktu || "Brak osoby kontaktowej"}</p></div><button type="button" onClick={() => deleteClient(client)} className="rounded-full border border-red-200 px-3 py-1 text-sm font-bold text-red-600 hover:bg-red-50">Usuń</button></div>{client.email && <p className="mt-2 text-sm text-slate-500">Email: <b>{client.email}</b></p>}{client.telefon && <p className="text-sm text-slate-500">Telefon: <b>{client.telefon}</b></p>}{client.notatki && <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">{client.notatki}</p>}<div className="mt-4 grid gap-2"><div className="text-sm font-bold text-slate-700">Projekty klienta ({clientProjects.length})</div>{clientProjects.map((project) => <button key={project.id} type="button" onClick={() => { setProjectFilter(project.id); setActiveTab("candidates"); }} className="rounded-2xl border bg-slate-50 p-3 text-left font-bold hover:bg-blue-50">{getProjectName(project)}</button>)}</div></article>; })}</main>
    </>
  );

  if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-slate-50">Ładowanie...</div>;

  if (!session && !clientView) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm"><h1 className="text-3xl font-black">Mini ATS</h1><p className="mt-2 text-slate-500">Zaloguj się, żeby zobaczyć bazę kandydatów.</p><div className="mt-6 grid gap-3"><input className="rounded-xl border p-3" placeholder="Email" type="email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} /><input className="rounded-xl border p-3" placeholder="Hasło" type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") login(); }} /><button type="button" onClick={login} className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-800">Zaloguj</button></div>{message && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}</div></div>;
  }

  if (clientView) {
    return <div className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8"><div className="mx-auto max-w-6xl"><header className="mb-8 rounded-3xl bg-white p-6 shadow-sm"><h1 className="text-3xl font-black">Mini ATS kandydatów</h1><p className="mt-2 text-slate-500">Shortlista kandydatów - {clientProjectName}</p></header>{CandidatesView()}</div>{enlargedCandidate && <EditableCandidateModal candidate={enlargedCandidate} />}{historyModal && <ActivityHistoryModal />}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-72 flex-col bg-slate-950 p-5 text-white md:flex"><div className="mb-8"><div className="text-2xl font-black">Mini ATS</div><div className="mt-1 text-sm text-slate-400">Kandydaci, projekty i klienci</div></div><nav className="grid gap-2"><button type="button" onClick={() => setActiveTab("add")} className={`rounded-2xl px-4 py-3 text-left font-bold ${activeTab === "add" ? "bg-white text-slate-900" : "text-slate-300 hover:bg-slate-800"}`}>Dodaj kandydata</button><button type="button" onClick={() => setActiveTab("candidates")} className={`rounded-2xl px-4 py-3 text-left font-bold ${activeTab === "candidates" ? "bg-white text-slate-900" : "text-slate-300 hover:bg-slate-800"}`}>Kandydaci</button><button type="button" onClick={() => setActiveTab("projects")} className={`rounded-2xl px-4 py-3 text-left font-bold ${activeTab === "projects" ? "bg-white text-slate-900" : "text-slate-300 hover:bg-slate-800"}`}>Projekty</button><button type="button" onClick={() => setActiveTab("clients")} className={`rounded-2xl px-4 py-3 text-left font-bold ${activeTab === "clients" ? "bg-white text-slate-900" : "text-slate-300 hover:bg-slate-800"}`}>Klienci</button></nav><div className="mt-auto grid gap-2"><button type="button" onClick={refreshAll} className="rounded-2xl border border-slate-700 px-4 py-3 font-bold text-slate-200 hover:bg-slate-800">Odśwież bazę</button><button type="button" onClick={logout} className="rounded-2xl border border-red-900 px-4 py-3 font-bold text-red-300 hover:bg-red-950">Wyloguj</button></div></aside>
        <main className="w-full p-4 md:p-8"><div className="mx-auto max-w-6xl"><header className="mb-8 rounded-3xl bg-white p-6 shadow-sm"><h1 className="text-3xl font-black md:text-4xl">{activeTab === "add" && "Dodaj kandydata"}{activeTab === "candidates" && "Baza kandydatów"}{activeTab === "projects" && "Projekty"}{activeTab === "clients" && "Klienci"}</h1><p className="mt-2 text-slate-500">Dane zapisują się w Supabase.</p><div className="mt-4 grid grid-cols-2 gap-2 md:hidden"><button type="button" onClick={() => setActiveTab("add")} className="rounded-xl border p-2 font-bold">Dodaj</button><button type="button" onClick={() => setActiveTab("candidates")} className="rounded-xl border p-2 font-bold">Kandydaci</button><button type="button" onClick={() => setActiveTab("projects")} className="rounded-xl border p-2 font-bold">Projekty</button><button type="button" onClick={() => setActiveTab("clients")} className="rounded-xl border p-2 font-bold">Klienci</button></div></header>{message && <p className="mb-6 rounded-2xl bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm">{message}</p>}{activeTab === "add" && AddCandidateView()}{activeTab === "candidates" && CandidatesView()}{activeTab === "projects" && ProjectsView()}{activeTab === "clients" && ClientsView()}</div></main>
      </div>
      {enlargedCandidate && <EditableCandidateModal candidate={enlargedCandidate} />}
      {historyModal && <ActivityHistoryModal />}
    </div>
  );
}
