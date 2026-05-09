// MINI ATS - SUPABASE ONLINE

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://cocydftwrdshqwvauodb.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_un7LVevS6WPsvuhl2KBPVg_d_wjK9KD";
const supabase = createClient(supabaseUrl, supabaseKey);

const STATUSES = ["New", "Contacted", "Interested", "Interview", "Recommended", "Offer", "Rejected", "Hired"];

const STATUS_STYLES = {
  New: "bg-blue-700 text-white border-blue-900 shadow-blue-200",
  Contacted: "bg-purple-700 text-white border-purple-900 shadow-purple-200",
  Interested: "bg-fuchsia-700 text-white border-fuchsia-900 shadow-fuchsia-200",
  Interview: "bg-amber-600 text-white border-amber-800 shadow-amber-200",
  Recommended: "bg-teal-600 text-white border-teal-800 shadow-teal-200",
  Offer: "bg-cyan-700 text-white border-cyan-900 shadow-cyan-200",
  Rejected: "bg-red-700 text-white border-red-900 shadow-red-200",
  Hired: "bg-emerald-700 text-white border-emerald-900 shadow-emerald-200",
};

const STATUS_SOFT_STYLES = {
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

function getStatusStyle(status) {
  return STATUS_STYLES[status] || STATUS_STYLES.New;
}

function getSoftStatusStyle(status) {
  return STATUS_SOFT_STYLES[status] || STATUS_SOFT_STYLES.New;
}

function getAccentStyle(status) {
  return STATUS_ACCENTS[status] || STATUS_ACCENTS.New;
}

function includesText(value, query) {
  return String(value || "").toLowerCase().includes(String(query || "").toLowerCase());
}

function projectName(project) {
  return project?.name || project?.nazwa || "Projekt bez nazwy";
}

function normalizeParsedCandidate(result = {}) {
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

function mergeDefinedFields(base, parsed) {
  return Object.fromEntries(Object.entries(base).map(([key, value]) => [key, parsed[key] || value || ""]));
}

function buildModalDraft(candidate) {
  return {
    details: {
      name: candidate?.name || "",
      email: candidate?.email || "",
      telefon: candidate?.telefon || "",
      linkedin: candidate?.linkedin || "",
      lokalizacja: candidate?.lokalizacja || "",
      doświadczenie: candidate?.doświadczenie || "",
      jezyk_programowania: candidate?.jezyk_programowania || "",
      framework: candidate?.framework || "",
      obszar: candidate?.obszar || "",
      tagi: candidate?.tagi || "",
      rating: candidate?.rating || 0,
      cv_url: candidate?.cv_url || "",
    },
    status: candidate?.status || "New",
    notatki: candidate?.notatki || "",
    projectRelations: Object.fromEntries(
      (candidate?.candidate_projects || []).map((relation) => [
        relation.id,
        {
          status: relation.status || "New",
          notes: relation.notes || "",
          interview_summary: relation.interview_summary || "",
          recruiter_notes: relation.recruiter_notes || "",
          recommended_to_client: Boolean(relation.recommended_to_client),
        },
      ])
    ),
  };
}

function StatusBadge({ status, compact = false }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border font-black shadow-sm ${compact ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm"} ${getStatusStyle(status)}`}>
      <span className="h-2 w-2 rounded-full bg-white/90" />
      {status || "New"}
    </span>
  );
}

export default function MiniATSApp() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [activeTab, setActiveTab] = useState("candidates");
  const [clientView, setClientView] = useState(false);
  const [clientProjectId, setClientProjectId] = useState("");

  const [candidates, setCandidates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyRecommended, setOnlyRecommended] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  const [candidateForm, setCandidateForm] = useState(emptyCandidate);
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
  const [projectDetailsOpen, setProjectDetailsOpen] = useState({});
  const [projectCandidatesOpen, setProjectCandidatesOpen] = useState({});
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [projectDrafts, setProjectDrafts] = useState({});
  const [savingProjectId, setSavingProjectId] = useState(null);
  const [projectFeedback, setProjectFeedback] = useState({});

  const [newClientName, setNewClientName] = useState("");
  const [newClientContact, setNewClientContact] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientNotes, setNewClientNotes] = useState("");
  const [clientSearch, setClientSearch] = useState("");

  const [openProjectSections, setOpenProjectSections] = useState({});
  const [activeCandidateId, setActiveCandidateId] = useState(null);
  const [enlargedCandidateId, setEnlargedCandidateId] = useState(null);
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

  const getClientName = (clientId) => clients.find((client) => client.id === clientId)?.name || "Bez klienta";
  const getProjectClientName = (project) => getClientName(project?.client_id);

  const clientProjectName = useMemo(() => {
    const project = projects.find((item) => item.id === clientProjectId);
    return projectName(project);
  }, [projects, clientProjectId]);

  const refreshAll = async () => {
    setLoading(true);
    const [candidateResult, projectResult, clientResult] = await Promise.all([
      supabase.from("candidates").select("*, candidate_projects(*, Projekty(*))").order("created_at", { ascending: false }),
      supabase.from("Projekty").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("*").order("created_at", { ascending: false }),
    ]);

    if (candidateResult.error) setMessage("Błąd pobierania kandydatów: " + candidateResult.error.message);
    if (projectResult.error) setMessage("Błąd pobierania projektów: " + projectResult.error.message);
    if (clientResult.error) setMessage("Błąd pobierania klientów: " + clientResult.error.message);

    setCandidates(candidateResult.data || []);
    setProjects(projectResult.data || []);
    setClients(clientResult.data || []);
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

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session || clientView) refreshAll();
  }, [session, clientView]);

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

  const updateCandidateForm = (field, value) => setCandidateForm((prev) => ({ ...prev, [field]: value }));

  const parseCvFile = async (file) => {
    const body = new FormData();
    body.append("file", file);
    body.append("source", "cv");
    const response = await fetch("/api/parse-cv", { method: "POST", body });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Nieznany błąd AI");
    return normalizeParsedCandidate(result);
  };

  const parseCv = async () => {
    if (!candidateForm.cv_file) return setMessage("Najpierw wybierz plik CV albo zdjęcie CV");
    setParsingCv(true);
    setMessage("AI przepisuje dane z CV...");
    try {
      const parsed = await parseCvFile(candidateForm.cv_file);
      setCandidateForm((prev) => ({ ...prev, ...mergeDefinedFields(prev, parsed) }));
      setMessage("Dane z CV uzupełnione. Sprawdź je przed zapisem.");
    } catch (error) {
      setMessage("Błąd AI CV: " + error.message);
    } finally {
      setParsingCv(false);
    }
  };

  const parseLinkedin = async () => {
    if (!candidateForm.linkedin_text.trim() && !candidateForm.linkedin.trim()) return setMessage("Wklej link LinkedIn albo tekst profilu LinkedIn");
    setParsingLinkedin(true);
    setMessage("AI przepisuje dane z LinkedIn...");
    try {
      const response = await fetch("/api/parse-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "linkedin", linkedinUrl: candidateForm.linkedin, linkedinText: candidateForm.linkedin_text }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Nieznany błąd AI");
      const parsed = normalizeParsedCandidate(result);
      setCandidateForm((prev) => ({ ...prev, ...mergeDefinedFields(prev, parsed) }));
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

  const saveCandidate = async () => {
    if (!candidateForm.name.trim()) return setMessage("Podaj imię i nazwisko kandydata");

    let cvUrl = candidateForm.cv_url.trim();
    try {
      if (candidateForm.cv_file) cvUrl = await uploadCvFile(candidateForm.cv_file);
    } catch (error) {
      setMessage("Błąd uploadu CV: " + error.message);
      return;
    }

    const payload = {
      name: candidateForm.name.trim(),
      status: candidateForm.status,
      email: candidateForm.email.trim(),
      telefon: candidateForm.telefon.trim(),
      linkedin: candidateForm.linkedin.trim(),
      lokalizacja: candidateForm.lokalizacja.trim(),
      doświadczenie: String(candidateForm.doświadczenie || "").trim(),
      notatki: candidateForm.notatki.trim(),
      tagi: candidateForm.tagi.trim(),
      jezyk_programowania: candidateForm.jezyk_programowania.trim(),
      framework: candidateForm.framework.trim(),
      obszar: candidateForm.obszar.trim(),
      rating: Number(candidateForm.rating) || 0,
      favorite: Boolean(candidateForm.favorite),
      cv_url: cvUrl,
    };

    let candidateId = editingId;
    if (editingId) {
      const { error } = await supabase.from("candidates").update(payload).eq("id", editingId);
      if (error) return setMessage("Nie udało się zapisać kandydata: " + error.message);
    } else {
      const { data, error } = await supabase.from("candidates").insert([payload]).select().single();
      if (error) return setMessage("Nie udało się dodać kandydata: " + error.message);
      candidateId = data.id;
    }

    if (!editingId && formProjectIds.length) {
      const rows = formProjectIds.map((projectId) => ({ candidate_id: candidateId, project_id: projectId, status: "New" }));
      const { error } = await supabase.from("candidate_projects").insert(rows);
      if (error) setMessage("Kandydat zapisany, ale nie udało się przypisać projektów: " + error.message);
    }

    setCandidateForm(emptyCandidate);
    if (cvInputRef.current) cvInputRef.current.value = "";
    setEditingId(null);
    setFormProjectIds([]);
    setActiveTab("candidates");
    setMessage(editingId ? "Kandydat zaktualizowany" : "Kandydat dodany");
    refreshAll();
  };

  const startEditCandidate = (candidate) => {
    setEditingId(candidate.id);
    setCandidateForm({ ...emptyCandidate, ...candidate, cv_file: null, linkedin_text: "" });
    setActiveTab("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteCandidate = async (candidate) => {
    if (!confirm(`Usunąć kandydata: ${candidate.name}?`)) return;
    await supabase.from("candidate_projects").delete().eq("candidate_id", candidate.id);
    const { error } = await supabase.from("candidates").delete().eq("id", candidate.id);
    if (error) setMessage("Nie udało się usunąć kandydata: " + error.message);
    else refreshAll();
  };

  const toggleFavorite = async (candidate) => {
    const next = !candidate.favorite;
    setCandidates((prev) => prev.map((item) => (item.id === candidate.id ? { ...item, favorite: next } : item)));
    const { error } = await supabase.from("candidates").update({ favorite: next }).eq("id", candidate.id);
    if (error) {
      setMessage("Błąd shortlisty: " + error.message);
      refreshAll();
    }
  };

  const updateCandidateStatus = async (candidate, status) => {
    setCandidates((prev) => prev.map((item) => (item.id === candidate.id ? { ...item, status } : item)));
    const { error } = await supabase.from("candidates").update({ status }).eq("id", candidate.id);
    if (error) setMessage("Nie udało się zmienić statusu: " + error.message);
    refreshAll();
  };

  const getRecommendationRelation = (candidate, relation = null) => {
    if (relation) return relation;
    const activeProject = clientView ? clientProjectId : projectFilter;
    if (activeProject) return candidate.candidate_projects?.find((item) => item.project_id === activeProject) || null;
    const relations = candidate.candidate_projects || [];
    return relations.length === 1 ? relations[0] : null;
  };

  const isCandidateRecommended = (candidate) => {
    const activeProject = clientView ? clientProjectId : projectFilter;
    return Boolean(candidate.candidate_projects?.some((item) => item.recommended_to_client && (!activeProject || item.project_id === activeProject)));
  };

  const toggleRecommendedToClient = async (candidate, relation = null) => {
    const target = getRecommendationRelation(candidate, relation);
    if (!target?.id) return setMessage("Wybierz projekt albo kliknij diament przy konkretnym projekcie kandydata.");
    const next = !target.recommended_to_client;
    setCandidates((prev) => prev.map((item) => item.id === candidate.id ? { ...item, candidate_projects: item.candidate_projects?.map((cp) => cp.id === target.id ? { ...cp, recommended_to_client: next } : cp) } : item));
    const { error } = await supabase.from("candidate_projects").update({ recommended_to_client: next }).eq("id", target.id);
    if (error) {
      setMessage("Błąd rekomendacji: " + error.message);
      refreshAll();
    }
  };

  const toggleProjectSection = (candidateId) => {
    preserveScroll(() => {
      setActiveCandidateId(candidateId);
      setOpenProjectSections((prev) => ({ ...prev, [candidateId]: !prev[candidateId] }));
    });
  };

  const openEnlargedCandidate = (candidateId) => preserveScroll(() => {
    setActiveCandidateId(candidateId);
    setEnlargedCandidateId(candidateId);
  });

  const closeEnlargedCandidate = () => preserveScroll(() => setEnlargedCandidateId(null));

  const assignProject = async (candidateId) => {
    const projectId = selectedProjects[candidateId];
    if (!projectId) return setMessage("Najpierw wybierz projekt");
    const candidate = candidates.find((item) => item.id === candidateId);
    if (candidate?.candidate_projects?.some((item) => item.project_id === projectId)) return setMessage("Ten projekt jest już przypisany");
    const { error } = await supabase.from("candidate_projects").insert([{ candidate_id: candidateId, project_id: projectId, status: "New" }]);
    if (error) setMessage("Błąd przypisania projektu: " + error.message);
    else {
      setSelectedProjects((prev) => ({ ...prev, [candidateId]: "" }));
      refreshAll();
    }
  };

  const removeCandidateFromProject = async (relationId) => {
    const { error } = await supabase.from("candidate_projects").delete().eq("id", relationId);
    if (error) setMessage("Błąd usuwania projektu z kandydata: " + error.message);
    else refreshAll();
  };

  const updateProjectRelation = async (relationId, field, value) => {
    const { error } = await supabase.from("candidate_projects").update({ [field]: value }).eq("id", relationId);
    if (error) setMessage("Błąd zapisu: " + error.message);
    else refreshAll();
  };

  const buildProjectDraft = (project) => ({
    project_notes: project?.project_notes || "",
    candidate_requirements: project?.candidate_requirements || "",
    ai_search_summary: project?.ai_search_summary || "",
  });

  const getProjectDraft = (project) => projectDrafts[project.id] || buildProjectDraft(project);

  const updateProjectDraft = (project, field, value) => {
    setProjectDrafts((prev) => ({
      ...prev,
      [project.id]: { ...(prev[project.id] || buildProjectDraft(project)), [field]: value },
    }));
  };

  const toggleProjectDetails = (project) => {
    preserveScroll(() => {
      setActiveProjectId(project.id);
      setProjectDetailsOpen((prev) => ({ ...prev, [project.id]: !prev[project.id] }));
      setProjectDrafts((prev) => (prev[project.id] ? prev : { ...prev, [project.id]: buildProjectDraft(project) }));
    });
  };

  const toggleProjectCandidates = (projectId) => {
    preserveScroll(() => {
      setActiveProjectId(projectId);
      setProjectCandidatesOpen((prev) => ({ ...prev, [projectId]: !prev[projectId] }));
    });
  };

  const saveProjectDetails = async (project) => {
    const draft = getProjectDraft(project);
    setSavingProjectId(project.id);
    setProjectFeedback((prev) => ({ ...prev, [project.id]: "" }));
    const { error } = await supabase.from("Projekty").update(draft).eq("id", project.id);
    setSavingProjectId(null);
    if (error) {
      const missing = ["project_notes", "candidate_requirements", "ai_search_summary"].some((field) => String(error.message || "").includes(field));
      setProjectFeedback((prev) => ({
        ...prev,
        [project.id]: missing ? "Brakuje kolumn w Supabase: project_notes, candidate_requirements, ai_search_summary." : "Nie udało się zapisać: " + error.message,
      }));
      return;
    }
    setProjects((prev) => prev.map((item) => item.id === project.id ? { ...item, ...draft } : item));
    setProjectFeedback((prev) => ({ ...prev, [project.id]: "Szczegóły projektu zapisane ✅" }));
  };

  const generateProjectAiSummary = (project) => {
    const draft = getProjectDraft(project);
    const generated = [
      `Project: ${projectName(project)}`,
      `Client: ${getProjectClientName(project)}`,
      draft.candidate_requirements ? `Candidate requirements: ${draft.candidate_requirements}` : "Candidate requirements: define must-have skills, seniority, English level and availability.",
      draft.project_notes ? `Process/context: ${draft.project_notes}` : "Process/context: add interview stages, work model, salary range and priorities.",
      "AI sourcing focus: prioritize candidates matching the must-have stack, seniority, work model and recent relevant experience.",
    ].join("\n");
    updateProjectDraft(project, "ai_search_summary", generated);
    setProjectDetailsOpen((prev) => ({ ...prev, [project.id]: true }));
    setActiveProjectId(project.id);
    setProjectFeedback((prev) => ({ ...prev, [project.id]: "Wygenerowano robocze podsumowanie AI. Zapisz, żeby trafiło do Supabase." }));
  };

  const addProject = async () => {
    if (!newProjectName.trim()) return setMessage("Podaj nazwę projektu");
    const payload = { name: newProjectName.trim() };
    if (newProjectClientId) payload.client_id = newProjectClientId;
    if (newProjectNotes.trim()) payload.project_notes = newProjectNotes.trim();
    if (newProjectRequirements.trim()) payload.candidate_requirements = newProjectRequirements.trim();
    if (newProjectAiSummary.trim()) payload.ai_search_summary = newProjectAiSummary.trim();

    let usedFallback = false;
    let { error } = await supabase.from("Projekty").insert([payload]);
    if (error && ["project_notes", "candidate_requirements", "ai_search_summary"].some((field) => String(error.message || "").includes(field))) {
      const fallback = { name: newProjectName.trim() };
      if (newProjectClientId) fallback.client_id = newProjectClientId;
      ({ error } = await supabase.from("Projekty").insert([fallback]));
      usedFallback = !error;
    }
    if (error) return setMessage("Błąd dodawania projektu: " + error.message);

    setNewProjectName("");
    setNewProjectClientId("");
    setNewProjectNotes("");
    setNewProjectRequirements("");
    setNewProjectAiSummary("");
    setProjectSearch("");
    setMessage(usedFallback ? "Projekt dodany, ale pola Project Details wymagają kolumn z supabase-project-details.sql." : "Projekt dodany ✅");
    refreshAll();
  };

  const updateProjectClient = async (projectId, clientId) => {
    const nextClientId = clientId || null;
    setProjects((prev) => prev.map((item) => item.id === projectId ? { ...item, client_id: nextClientId } : item));
    const { error } = await supabase.from("Projekty").update({ client_id: nextClientId }).eq("id", projectId);
    if (error) {
      setMessage("Nie udało się przypisać klienta: " + error.message);
      refreshAll();
    }
  };

  const openProjectCandidates = (projectId) => {
    setProjectFilter(projectId);
    setStatusFilter("");
    setActiveTab("candidates");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openClientDetails = (clientId) => {
    const client = clients.find((item) => item.id === clientId);
    setClientSearch(client?.name || "");
    setActiveTab("clients");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteProject = async (project) => {
    if (!confirm(`Usunąć projekt: ${projectName(project)}? Kandydaci zostaną tylko odpięci.`)) return;
    await supabase.from("candidate_projects").delete().eq("project_id", project.id);
    const { error } = await supabase.from("Projekty").delete().eq("id", project.id);
    if (error) setMessage("Nie udało się usunąć projektu: " + error.message);
    else refreshAll();
  };

  const addClient = async () => {
    if (!newClientName.trim()) return setMessage("Podaj nazwę klienta");
    const payload = {
      name: newClientName.trim(),
      osoba_do_kontaktu: newClientContact.trim(),
      email: newClientEmail.trim(),
      telefon: newClientPhone.trim(),
      notatki: newClientNotes.trim(),
    };
    const { error } = await supabase.from("clients").insert([payload]);
    if (error) return setMessage("Błąd dodawania klienta: " + error.message);
    setNewClientName("");
    setNewClientContact("");
    setNewClientEmail("");
    setNewClientPhone("");
    setNewClientNotes("");
    refreshAll();
  };

  const deleteClient = async (client) => {
    if (!confirm(`Usunąć klienta: ${client.name}? Projekty zostaną odpięte.`)) return;
    await supabase.from("Projekty").update({ client_id: null }).eq("client_id", client.id);
    const { error } = await supabase.from("clients").delete().eq("id", client.id);
    if (error) setMessage("Nie udało się usunąć klienta: " + error.message);
    else refreshAll();
  };

  const filteredCandidates = useMemo(() => {
    const activeProject = clientView ? clientProjectId : projectFilter;
    const result = candidates.filter((candidate) => {
      const text = [
        candidate.name,
        candidate.status,
        candidate.email,
        candidate.telefon,
        candidate.linkedin,
        candidate.lokalizacja,
        candidate.doświadczenie,
        candidate.notatki,
        candidate.tagi,
        candidate.jezyk_programowania,
        candidate.framework,
        candidate.obszar,
        ...(candidate.candidate_projects || []).map((relation) => [relation.status, relation.notes, relation.interview_summary, relation.recruiter_notes, projectName(relation.Projekty)].join(" ")),
      ].join(" ");
      const matchesProject = !activeProject || candidate.candidate_projects?.some((relation) => relation.project_id === activeProject);
      const matchesRecommended = !onlyRecommended || candidate.candidate_projects?.some((relation) => relation.recommended_to_client && (!activeProject || relation.project_id === activeProject));
      return (!query || includesText(text, query)) && (!statusFilter || candidate.status === statusFilter) && matchesProject && (!onlyFavorites || candidate.favorite) && matchesRecommended;
    });
    return result.sort((a, b) => {
      if (sortBy === "name") return String(a.name || "").localeCompare(String(b.name || ""), "pl");
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [candidates, query, statusFilter, projectFilter, onlyFavorites, onlyRecommended, sortBy, clientView, clientProjectId]);

  const filteredProjects = useMemo(() => projects.filter((project) => {
    const clientName = getProjectClientName(project);
    const text = [projectName(project), project.kategoria, project.lokalizacja, clientName, project.project_notes, project.candidate_requirements, project.ai_search_summary].join(" ");
    return includesText(text, projectSearch);
  }), [projects, clients, projectSearch]);

  const filteredClients = useMemo(() => clients.filter((client) => includesText([client.name, client.osoba_do_kontaktu, client.email, client.telefon, client.notatki].join(" "), clientSearch)), [clients, clientSearch]);

  const openCv = async (cvPath) => {
    if (!cvPath) return;
    if (String(cvPath).startsWith("http")) return window.open(cvPath, "_blank", "noopener,noreferrer");
    const { data, error } = await supabase.storage.from("CV").createSignedUrl(cvPath, 60);
    if (error) setMessage("Nie udało się otworzyć CV: " + error.message);
    else window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const enlargedCandidate = candidates.find((candidate) => candidate.id === enlargedCandidateId);

  const CandidateCard = ({ candidate }) => {
    const relationForDiamond = getRecommendationRelation(candidate);
    return (
      <article onDoubleClick={() => openEnlargedCandidate(candidate.id)} className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${activeCandidateId === candidate.id ? "border-cyan-300 ring-4 ring-cyan-50" : "border-slate-200"}`}>
        <div className={`h-2 bg-gradient-to-r ${getAccentStyle(candidate.status || "New")}`} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            {!clientView && <button type="button" onClick={() => toggleFavorite(candidate)} className={`text-2xl ${candidate.favorite ? "text-yellow-400" : "text-slate-300 hover:text-yellow-400"}`}>★</button>}
            {!clientView && <button type="button" onClick={() => toggleRecommendedToClient(candidate)} className={`text-2xl ${isCandidateRecommended(candidate) ? "text-cyan-500" : "text-slate-300 hover:text-cyan-500"}`} title={relationForDiamond ? "Rekomendowany do klienta" : "Wybierz projekt albo użyj diamentu przy projekcie"}>♦</button>}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-xl font-black text-slate-950">{candidate.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{candidate.email || candidate.telefon || candidate.lokalizacja || "Brak kontaktu"}</p>
            </div>
            <StatusBadge status={candidate.status || "New"} compact />
          </div>
          <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            {candidate.linkedin && <p><b>LinkedIn:</b> <a className="font-bold text-blue-700 hover:underline" href={candidate.linkedin} target="_blank" rel="noreferrer">Otwórz profil</a></p>}
            {candidate.doświadczenie && <p><b>Doświadczenie:</b> {candidate.doświadczenie}</p>}
            {candidate.jezyk_programowania && <p><b>Stack:</b> {candidate.jezyk_programowania} {candidate.framework && `/ ${candidate.framework}`}</p>}
            {candidate.notatki && <p className="rounded-xl bg-white p-3"><b>Notatki:</b> {candidate.notatki}</p>}
            {candidate.cv_url && <button type="button" onClick={() => openCv(candidate.cv_url)} className="text-left font-bold text-blue-700 hover:underline">Otwórz CV</button>}
          </div>
          {!clientView && (
            <div className="mt-4">
              <button type="button" onClick={() => toggleProjectSection(candidate.id)} className="flex w-full items-center justify-between rounded-2xl border bg-white p-3 text-left text-sm font-black text-slate-800">
                <span>Projekty kandydata / podsumowania rozmów</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{openProjectSections[candidate.id] ? "Zwiń" : "Rozwiń"}</span>
              </button>
              {openProjectSections[candidate.id] && <div className="mt-3 grid gap-2">
                {(candidate.candidate_projects || []).map((relation) => <div key={relation.id} className="rounded-2xl border bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2"><b>{projectName(relation.Projekty)}</b><button type="button" onClick={() => toggleRecommendedToClient(candidate, relation)} className={`text-xl ${relation.recommended_to_client ? "text-cyan-500" : "text-slate-300 hover:text-cyan-500"}`}>♦</button></div>
                  <select className={`mt-2 w-full rounded-xl border p-2 font-black ${getSoftStatusStyle(relation.status || "New")}`} value={relation.status || "New"} onChange={(event) => updateProjectRelation(relation.id, "status", event.target.value)}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
                  <textarea className="mt-2 min-h-24 w-full rounded-xl border p-2" defaultValue={relation.notes || ""} onBlur={(event) => updateProjectRelation(relation.id, "notes", event.target.value)} placeholder="Notatka projektowa" />
                  <button type="button" onClick={() => removeCandidateFromProject(relation.id)} className="mt-2 text-xs font-bold text-red-600 hover:underline">Usuń z projektu</button>
                </div>)}
                <div className="flex gap-2"><select className="w-full rounded-xl border p-2" value={selectedProjects[candidate.id] || ""} onChange={(event) => setSelectedProjects((prev) => ({ ...prev, [candidate.id]: event.target.value }))}><option value="">Wybierz projekt</option>{projects.map((project) => <option key={project.id} value={project.id}>{projectName(project)}</option>)}</select><button type="button" onClick={() => assignProject(candidate.id)} className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white">Przypisz</button></div>
              </div>}
            </div>
          )}
          {!clientView && <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => startEditCandidate(candidate)} className="rounded-2xl border bg-white px-4 py-2 text-sm font-bold hover:bg-slate-50">Edytuj</button><button type="button" onClick={() => openEnlargedCandidate(candidate.id)} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">Powiększ</button><button type="button" onClick={() => deleteCandidate(candidate)} className="rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50">Usuń</button></div>}
        </div>
      </article>
    );
  };

  const EditableCandidateModal = ({ candidate }) => {
    const [draft, setDraft] = useState(() => buildModalDraft(candidate));
    const [modalMessage, setModalMessage] = useState("");
    const [modalFile, setModalFile] = useState(null);
    const [modalParsing, setModalParsing] = useState(false);
    useEffect(() => setDraft(buildModalDraft(candidate)), [candidate.id]);
    const setDetail = (field, value) => setDraft((prev) => ({ ...prev, details: { ...prev.details, [field]: value } }));
    const setRelationDraft = (relationId, field, value) => setDraft((prev) => ({ ...prev, projectRelations: { ...prev.projectRelations, [relationId]: { ...prev.projectRelations[relationId], [field]: value } } }));
    const parseModalCv = async () => {
      if (!modalFile) return setModalMessage("Najpierw wybierz plik CV");
      setModalParsing(true);
      setModalMessage("AI przepisuje dane z CV...");
      try {
        const parsed = await parseCvFile(modalFile);
        setDraft((prev) => ({ ...prev, details: { ...prev.details, ...mergeDefinedFields(prev.details, parsed) }, notatki: parsed.notatki || prev.notatki }));
        setModalMessage("Dane z CV uzupełnione w modalu.");
      } catch (error) {
        setModalMessage("Błąd AI CV: " + error.message);
      } finally {
        setModalParsing(false);
      }
    };
    const saveModal = async () => {
      const candidatePayload = { ...draft.details, status: draft.status, notatki: draft.notatki, rating: Number(draft.details.rating) || 0 };
      const { error } = await supabase.from("candidates").update(candidatePayload).eq("id", candidate.id);
      if (error) return setModalMessage("Nie udało się zapisać kandydata: " + error.message);
      for (const [relationId, relationDraft] of Object.entries(draft.projectRelations)) {
        const { error: relationError } = await supabase.from("candidate_projects").update(relationDraft).eq("id", relationId);
        if (relationError) return setModalMessage("Nie udało się zapisać projektu: " + relationError.message);
      }
      setModalMessage("Saved successfully");
      refreshAll();
    };
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
        <div className="mx-auto my-6 max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 p-5 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-black text-slate-950">{candidate.name}</h2><p className="text-sm text-slate-500">Editable candidate profile</p></div><div className="flex gap-2"><button type="button" onClick={saveModal} className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white">Save changes</button><button type="button" onClick={closeEnlargedCandidate} className="rounded-xl border px-5 py-3 font-bold hover:bg-slate-50">Close</button></div></div>
            {modalMessage && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">{modalMessage}</p>}
          </div>
          <div className="grid gap-5 p-5">
            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><div className="grid gap-3 md:grid-cols-3"><input className="rounded-xl border p-3" value={draft.details.name} onChange={(event) => setDetail("name", event.target.value)} placeholder="Name" /><select className={`rounded-xl border p-3 font-black ${getSoftStatusStyle(draft.status)}`} value={draft.status} onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value }))}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select><input className="rounded-xl border p-3" value={draft.details.email} onChange={(event) => setDetail("email", event.target.value)} placeholder="Email" /><input className="rounded-xl border p-3" value={draft.details.telefon} onChange={(event) => setDetail("telefon", event.target.value)} placeholder="Phone" /><input className="rounded-xl border p-3" value={draft.details.linkedin} onChange={(event) => setDetail("linkedin", event.target.value)} placeholder="LinkedIn" /><input className="rounded-xl border p-3" value={draft.details.lokalizacja} onChange={(event) => setDetail("lokalizacja", event.target.value)} placeholder="Location" /><input className="rounded-xl border p-3" value={draft.details.doświadczenie} onChange={(event) => setDetail("doświadczenie", event.target.value)} placeholder="Experience" /><input className="rounded-xl border p-3" value={draft.details.jezyk_programowania} onChange={(event) => setDetail("jezyk_programowania", event.target.value)} placeholder="Tech stack" /><input className="rounded-xl border p-3" value={draft.details.framework} onChange={(event) => setDetail("framework", event.target.value)} placeholder="Framework" /><input className="rounded-xl border p-3" value={draft.details.obszar} onChange={(event) => setDetail("obszar", event.target.value)} placeholder="Area" /><input className="rounded-xl border p-3" value={draft.details.tagi} onChange={(event) => setDetail("tagi", event.target.value)} placeholder="Tags" /><input className="rounded-xl border p-3" value={draft.details.cv_url} onChange={(event) => setDetail("cv_url", event.target.value)} placeholder="CV URL/path" /><textarea className="min-h-36 rounded-xl border p-3 md:col-span-3" value={draft.notatki} onChange={(event) => setDraft((prev) => ({ ...prev, notatki: event.target.value }))} placeholder="Candidate notes" /></div></section>
            <section className="rounded-3xl border border-slate-200 bg-white p-5"><h3 className="text-lg font-black">AI CV parsing</h3><div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center"><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => setModalFile(event.target.files?.[0] || null)} /><button type="button" onClick={parseModalCv} disabled={modalParsing || !modalFile} className="rounded-xl bg-teal-600 px-4 py-2 font-black text-white disabled:bg-slate-300">{modalParsing ? "Parsing..." : "AI parse CV"}</button></div></section>
            <section className="grid gap-4">{candidate.candidate_projects?.length ? candidate.candidate_projects.map((relation) => { const relationDraft = draft.projectRelations[relation.id] || {}; return <div key={relation.id} className="rounded-3xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-black">{projectName(relation.Projekty)}</h3><div className="flex items-center gap-2"><button type="button" onClick={() => setRelationDraft(relation.id, "recommended_to_client", !relationDraft.recommended_to_client)} className={`text-2xl ${relationDraft.recommended_to_client ? "text-cyan-500" : "text-slate-300"}`}>♦</button><select className={`rounded-xl border p-2 font-black ${getSoftStatusStyle(relationDraft.status)}`} value={relationDraft.status || "New"} onChange={(event) => setRelationDraft(relation.id, "status", event.target.value)}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></div></div><div className="mt-4 grid gap-3 lg:grid-cols-3"><textarea className="min-h-36 rounded-xl border p-3" value={relationDraft.notes || ""} onChange={(event) => setRelationDraft(relation.id, "notes", event.target.value)} placeholder="Project notes" /><textarea className="min-h-36 rounded-xl border p-3" value={relationDraft.interview_summary || ""} onChange={(event) => setRelationDraft(relation.id, "interview_summary", event.target.value)} placeholder="Interview summary" /><textarea className="min-h-36 rounded-xl border p-3" value={relationDraft.recruiter_notes || ""} onChange={(event) => setRelationDraft(relation.id, "recruiter_notes", event.target.value)} placeholder="Recruiter notes" /></div></div>; }) : <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-slate-400">No projects assigned.</div>}</section>
          </div>
        </div>
      </div>
    );
  };

  const AddCandidateView = () => (
    <section className="rounded-3xl bg-white p-5 shadow-sm"><h2 className="text-xl font-black">{editingId ? "Edytuj kandydata" : "Dodaj kandydata"}</h2><div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3"><input className="rounded-xl border p-3" placeholder="Imię i nazwisko" value={candidateForm.name} onChange={(event) => updateCandidateForm("name", event.target.value)} /><select className={`rounded-xl border p-3 font-black ${getSoftStatusStyle(candidateForm.status)}`} value={candidateForm.status} onChange={(event) => updateCandidateForm("status", event.target.value)}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select><input className="rounded-xl border p-3" placeholder="Email" value={candidateForm.email} onChange={(event) => updateCandidateForm("email", event.target.value)} /><input className="rounded-xl border p-3" placeholder="Telefon" value={candidateForm.telefon} onChange={(event) => updateCandidateForm("telefon", event.target.value)} /><input className="rounded-xl border p-3" placeholder="LinkedIn" value={candidateForm.linkedin} onChange={(event) => updateCandidateForm("linkedin", event.target.value)} /><input className="rounded-xl border p-3" placeholder="Lokalizacja" value={candidateForm.lokalizacja} onChange={(event) => updateCandidateForm("lokalizacja", event.target.value)} /><input className="rounded-xl border p-3" placeholder="Doświadczenie" value={candidateForm.doświadczenie} onChange={(event) => updateCandidateForm("doświadczenie", event.target.value)} /><input className="rounded-xl border p-3" placeholder="Język programowania" value={candidateForm.jezyk_programowania} onChange={(event) => updateCandidateForm("jezyk_programowania", event.target.value)} /><input className="rounded-xl border p-3" placeholder="Framework" value={candidateForm.framework} onChange={(event) => updateCandidateForm("framework", event.target.value)} /><input className="rounded-xl border p-3" placeholder="Obszar" value={candidateForm.obszar} onChange={(event) => updateCandidateForm("obszar", event.target.value)} /><input className="rounded-xl border p-3" placeholder="Tagi" value={candidateForm.tagi} onChange={(event) => updateCandidateForm("tagi", event.target.value)} /><input className="rounded-xl border p-3" placeholder="CV URL / ścieżka" value={candidateForm.cv_url} onChange={(event) => updateCandidateForm("cv_url", event.target.value)} /><textarea className="min-h-28 rounded-xl border p-3 lg:col-span-3" placeholder="Notatki" value={candidateForm.notatki} onChange={(event) => updateCandidateForm("notatki", event.target.value)} /></div><div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-sm font-black text-slate-900">AI CV parsing</div><input ref={cvInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(event) => updateCandidateForm("cv_file", event.target.files?.[0] || null)} /><div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center"><button type="button" onClick={() => cvInputRef.current?.click()} className="rounded-xl border bg-white px-4 py-3 font-black text-slate-800 hover:bg-slate-50">Choose CV / image</button><span className="text-sm font-semibold text-slate-500">{candidateForm.cv_file ? candidateForm.cv_file.name : candidateForm.cv_url ? "Existing CV saved" : "No file selected"}</span></div><button type="button" onClick={parseCv} disabled={parsingCv || !candidateForm.cv_file} className="mt-3 rounded-xl bg-teal-600 px-4 py-2 font-black text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300">{parsingCv ? "Parsing CV..." : "AI parse CV"}</button></div><div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-sm font-black text-slate-900">AI LinkedIn parsing</div><textarea className="mt-3 min-h-24 w-full rounded-xl border bg-white p-3" placeholder="Paste LinkedIn profile text here..." value={candidateForm.linkedin_text} onChange={(event) => updateCandidateForm("linkedin_text", event.target.value)} /><button type="button" onClick={parseLinkedin} disabled={parsingLinkedin || (!candidateForm.linkedin_text.trim() && !candidateForm.linkedin.trim())} className="mt-3 rounded-xl bg-purple-600 px-4 py-2 font-black text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-slate-300">{parsingLinkedin ? "Parsing LinkedIn..." : "AI parse LinkedIn"}</button></div>{!editingId && <div className="mt-4 flex flex-wrap gap-2">{projects.map((project) => { const selected = formProjectIds.includes(project.id); return <button key={project.id} type="button" onClick={() => setFormProjectIds((prev) => selected ? prev.filter((id) => id !== project.id) : [...prev, project.id])} className={`rounded-full border px-3 py-1 text-sm font-bold ${selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>{projectName(project)}</button>; })}</div>}<div className="mt-5 flex gap-2"><button type="button" onClick={saveCandidate} className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-800">{editingId ? "Zapisz zmiany" : "Dodaj kandydata"}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setCandidateForm(emptyCandidate); if (cvInputRef.current) cvInputRef.current.value = ""; }} className="rounded-xl border px-5 py-3 font-bold hover:bg-slate-50">Anuluj</button>}</div></section>
  );

  const CandidatesView = () => (
    <><section className="mb-6 rounded-3xl bg-white p-5 shadow-sm"><h2 className="mb-4 text-xl font-black">Kandydaci</h2><div className="grid gap-3 md:grid-cols-4"><input className="rounded-xl border p-3 md:col-span-2" placeholder="Szukaj..." value={query} onChange={(event) => setQuery(event.target.value)} /><select className="rounded-xl border p-3" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Status: wszystkie</option>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select><select className="rounded-xl border p-3" value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}><option value="">Projekt: wszystkie</option>{projects.map((project) => <option key={project.id} value={project.id}>{projectName(project)}</option>)}</select><select className="rounded-xl border p-3" value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="newest">Najnowsi</option><option value="name">Nazwa A-Z</option><option value="rating">Ocena</option></select><button type="button" onClick={() => { setQuery(""); setStatusFilter(""); setProjectFilter(""); setOnlyFavorites(false); setOnlyRecommended(false); }} className="rounded-xl border px-4 py-3 font-bold hover:bg-slate-50">Wyczyść filtry</button></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-4"><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={onlyFavorites} onChange={(event) => setOnlyFavorites(event.target.checked)} /> Tylko shortlista ★</label><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={onlyRecommended} onChange={(event) => setOnlyRecommended(event.target.checked)} /> Tylko rekomendowani ♦</label></div><p className="text-sm text-slate-500">Znaleziono: <b>{filteredCandidates.length}</b></p></div></section>{loading && <div className="rounded-3xl bg-white p-6 text-center shadow-sm">Ładowanie...</div>}{!loading && filteredCandidates.length === 0 && <div className="rounded-3xl bg-white p-10 text-center shadow-sm">Brak kandydatów.</div>}<main className="grid gap-4 lg:grid-cols-2">{filteredCandidates.map((candidate) => <CandidateCard key={candidate.id} candidate={candidate} />)}</main></>
  );

  const ProjectsView = () => (
    <><section className="mb-6 rounded-3xl bg-white p-5 shadow-sm"><h2 className="mb-4 text-xl font-black">Projekty</h2><div className="grid gap-3 md:grid-cols-4"><input className="rounded-xl border p-3 md:col-span-2" placeholder="Nazwa projektu" value={newProjectName} onChange={(event) => setNewProjectName(event.target.value)} /><select className="rounded-xl border p-3" value={newProjectClientId} onChange={(event) => setNewProjectClientId(event.target.value)}><option value="">Bez klienta</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select><button type="button" onClick={addProject} className="rounded-xl bg-green-600 px-4 py-2 font-bold text-white hover:bg-green-700">Dodaj projekt</button><textarea className="min-h-24 rounded-xl border p-3 md:col-span-2" placeholder="Project notes: proces, stawka, tryb pracy, etapy rozmów..." value={newProjectNotes} onChange={(event) => setNewProjectNotes(event.target.value)} /><textarea className="min-h-24 rounded-xl border p-3" placeholder="Candidate requirements: stack, seniority, język, must-have..." value={newProjectRequirements} onChange={(event) => setNewProjectRequirements(event.target.value)} /><textarea className="min-h-24 rounded-xl border p-3" placeholder="AI search summary: krótkie podsumowanie dla AI matching" value={newProjectAiSummary} onChange={(event) => setNewProjectAiSummary(event.target.value)} /></div><input className="mt-4 w-full rounded-xl border p-3" placeholder="Szukaj projektu albo klienta..." value={projectSearch} onChange={(event) => setProjectSearch(event.target.value)} /></section><main className="grid gap-4 lg:grid-cols-2">{filteredProjects.map((project) => { const projectCandidates = candidates.map((candidate) => ({ candidate, relation: candidate.candidate_projects?.find((relation) => relation.project_id === project.id) })).filter(({ relation }) => Boolean(relation)); const clientName = getProjectClientName(project); const detailsOpen = Boolean(projectDetailsOpen[project.id]); const candidatesOpen = Boolean(projectCandidatesOpen[project.id]); const draft = getProjectDraft(project); const active = activeProjectId === project.id || detailsOpen || candidatesOpen; return <article key={project.id} className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition ${active ? "border-cyan-300 ring-4 ring-cyan-50" : "border-slate-200"}`}><div className={`h-2 bg-gradient-to-r ${active ? "from-cyan-600 to-blue-500" : "from-slate-300 to-slate-100"}`} /><div className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-xl font-black text-slate-950">{projectName(project)}</h3><p className="mt-1 text-sm text-slate-500">Klient: {project.client_id ? <button type="button" onClick={() => openClientDetails(project.client_id)} className="font-bold text-blue-700 hover:underline">{clientName}</button> : <b>{clientName}</b>}</p><p className="mt-1 text-sm text-slate-500">Kandydaci: <b>{projectCandidates.length}</b></p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => toggleProjectDetails(project)} className={`rounded-full px-3 py-1 text-sm font-bold ${detailsOpen ? "bg-slate-900 text-white" : "border bg-white text-slate-700 hover:bg-slate-50"}`}>{detailsOpen ? "Ukryj szczegóły" : "Project Details"}</button><button type="button" onClick={() => toggleProjectCandidates(project.id)} className={`rounded-full px-3 py-1 text-sm font-bold ${candidatesOpen ? "bg-cyan-600 text-white" : "border bg-white text-slate-700 hover:bg-slate-50"}`}>Kandydaci ({projectCandidates.length})</button><button type="button" onClick={() => openProjectCandidates(project.id)} className="rounded-full border bg-white px-3 py-1 text-sm font-bold text-slate-700 hover:bg-slate-50">Otwórz w bazie</button><button type="button" onClick={() => { const link = `${window.location.origin}?client=true&project=${project.id}`; navigator.clipboard.writeText(link); setMessage(`Link klienta do projektu „${projectName(project)}” skopiowany 📎`); }} className="rounded-full bg-blue-600 px-3 py-1 text-sm font-bold text-white hover:bg-blue-700">Link klienta</button><button type="button" onClick={() => deleteProject(project)} className="rounded-full border border-red-200 bg-white px-3 py-1 text-sm font-bold text-red-600 hover:bg-red-50">Usuń</button></div></div>{(detailsOpen || candidatesOpen) && <div className="sticky top-0 z-10 -mx-5 mt-4 border-y border-slate-200 bg-white/95 px-5 py-3 backdrop-blur"><div className="flex flex-wrap items-center justify-between gap-2 text-sm"><div className="font-black text-slate-900">{projectName(project)}</div><div className="flex flex-wrap gap-2 text-xs font-bold text-slate-500"><span className="rounded-full bg-slate-100 px-3 py-1">{clientName}</span><span className="rounded-full bg-cyan-50 px-3 py-1 text-cyan-700">{projectCandidates.length} kandydatów</span></div></div></div>}<div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3"><label className="mb-1 block text-sm font-bold text-slate-700">Klient projektu</label><select className="w-full rounded-xl border bg-white p-2" value={project.client_id || ""} onChange={(event) => updateProjectClient(project.id, event.target.value)}><option value="">Bez klienta</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></div><div className={`grid transition-[grid-template-rows] duration-300 ease-out ${detailsOpen ? "mt-4 grid-rows-[1fr]" : "grid-rows-[0fr]"}`}><div className="overflow-hidden"><section className="rounded-2xl border border-slate-200 bg-white p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h4 className="font-black text-slate-900">Project Details</h4><button type="button" onClick={() => generateProjectAiSummary(project)} className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-bold text-cyan-700 hover:bg-cyan-100">Generate AI sourcing summary</button></div><div className="grid gap-3"><label className="grid gap-1 text-sm font-bold text-slate-700">Project notes<textarea className="min-h-28 rounded-xl border p-3 font-normal text-slate-700" value={draft.project_notes} onChange={(event) => updateProjectDraft(project, "project_notes", event.target.value)} /></label><label className="grid gap-1 text-sm font-bold text-slate-700">Candidate requirements<textarea className="min-h-28 rounded-xl border p-3 font-normal text-slate-700" value={draft.candidate_requirements} onChange={(event) => updateProjectDraft(project, "candidate_requirements", event.target.value)} /></label><label className="grid gap-1 text-sm font-bold text-slate-700">AI Suggestions / AI search summary<textarea className="min-h-28 rounded-xl border p-3 font-normal text-slate-700" value={draft.ai_search_summary} onChange={(event) => updateProjectDraft(project, "ai_search_summary", event.target.value)} /></label></div><div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" onClick={() => saveProjectDetails(project)} disabled={savingProjectId === project.id} className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-800 disabled:bg-slate-300">{savingProjectId === project.id ? "Zapisuję..." : "SAVE"}</button>{projectFeedback[project.id] && <span className="text-sm font-semibold text-slate-600">{projectFeedback[project.id]}</span>}</div></section></div></div><div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3"><button type="button" onClick={() => toggleProjectCandidates(project.id)} className="flex w-full items-center justify-between gap-3 text-left"><span><span className="block text-sm font-black text-slate-800">Lista kandydatów</span><span className="text-xs font-semibold text-slate-500">{projectCandidates.length} przypisanych kandydatów</span></span><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 shadow-sm">{candidatesOpen ? "Zwiń" : "Rozwiń"}</span></button><div className={`grid transition-[grid-template-rows] duration-300 ease-out ${candidatesOpen ? "mt-3 grid-rows-[1fr]" : "grid-rows-[0fr]"}`}><div className="overflow-hidden"><div className="grid gap-2">{projectCandidates.length ? projectCandidates.map(({ candidate, relation }) => { const notesPreview = relation.notes || relation.interview_summary || relation.recruiter_notes || candidate.notatki || ""; return <button key={relation.id} type="button" onClick={() => openEnlargedCandidate(candidate.id)} className="rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="font-black text-slate-900">{candidate.name}</div><div className="mt-1 text-sm text-slate-500">{candidate.email || candidate.telefon || candidate.lokalizacja || "Brak kontaktu"}</div></div><StatusBadge status={relation.status || candidate.status || "New"} compact /></div><div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold">{candidate.favorite && <span className="rounded-full bg-yellow-50 px-3 py-1 text-yellow-700">★ Shortlist</span>}{relation.recommended_to_client && <span className="rounded-full bg-cyan-50 px-3 py-1 text-cyan-700">♦ Recommended</span>}{candidate.jezyk_programowania && <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{candidate.jezyk_programowania}</span>}{candidate.framework && <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-700">{candidate.framework}</span>}</div>{notesPreview && <p className="mt-3 rounded-xl bg-slate-50 p-2 text-sm text-slate-600">{notesPreview}</p>}</button>; }) : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-400">Brak kandydatów w projekcie</div>}</div></div></div></div></div></article>; })}</main></>
  );

  const ClientsView = () => (
    <><section className="mb-6 rounded-3xl bg-white p-5 shadow-sm"><h2 className="mb-4 text-xl font-black">Klienci</h2><div className="grid gap-3 md:grid-cols-5"><input className="rounded-xl border p-3" placeholder="Nazwa klienta" value={newClientName} onChange={(event) => setNewClientName(event.target.value)} /><input className="rounded-xl border p-3" placeholder="Osoba do kontaktu" value={newClientContact} onChange={(event) => setNewClientContact(event.target.value)} /><input className="rounded-xl border p-3" placeholder="Email" value={newClientEmail} onChange={(event) => setNewClientEmail(event.target.value)} /><input className="rounded-xl border p-3" placeholder="Telefon" value={newClientPhone} onChange={(event) => setNewClientPhone(event.target.value)} /><input className="rounded-xl border p-3" placeholder="Notatki" value={newClientNotes} onChange={(event) => setNewClientNotes(event.target.value)} /><button type="button" onClick={addClient} className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white hover:bg-slate-800">Dodaj klienta</button></div><input className="mt-4 w-full rounded-xl border p-3" placeholder="Szukaj klienta..." value={clientSearch} onChange={(event) => setClientSearch(event.target.value)} /></section><main className="grid gap-4 lg:grid-cols-2">{filteredClients.map((client) => { const clientProjects = projects.filter((project) => project.client_id === client.id); return <div key={client.id} className="rounded-3xl bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-black">{client.name}</h3><p className="text-sm text-slate-500">{client.osoba_do_kontaktu || "Brak osoby kontaktowej"}</p></div><button type="button" onClick={() => deleteClient(client)} className="rounded-full border border-red-200 px-3 py-1 text-sm font-bold text-red-600 hover:bg-red-50">Usuń</button></div>{client.email && <p className="mt-2 text-sm text-slate-500">Email: <b>{client.email}</b></p>}{client.telefon && <p className="text-sm text-slate-500">Telefon: <b>{client.telefon}</b></p>}{client.notatki && <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">{client.notatki}</p>}<div className="mt-4 grid gap-2"><div className="text-sm font-bold text-slate-700">Projekty klienta ({clientProjects.length})</div>{clientProjects.map((project) => <button key={project.id} type="button" onClick={() => { setProjectFilter(project.id); setActiveTab("candidates"); }} className="rounded-2xl border bg-slate-50 p-3 text-left font-bold hover:bg-blue-50">{projectName(project)}</button>)}</div></div>; })}</main></>
  );

  if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-slate-50">Ładowanie...</div>;

  if (!session && !clientView) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm"><h1 className="text-3xl font-black">Mini ATS</h1><p className="mt-2 text-slate-500">Zaloguj się, żeby zobaczyć bazę kandydatów.</p><div className="mt-6 grid gap-3"><input className="rounded-xl border p-3" placeholder="Email" type="email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} /><input className="rounded-xl border p-3" placeholder="Hasło" type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") login(); }} /><button type="button" onClick={login} className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-800">Zaloguj</button></div>{message && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}</div></div>;
  }

  if (clientView) {
    return <div className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8"><div className="mx-auto max-w-6xl"><header className="mb-8 rounded-3xl bg-white p-6 shadow-sm"><h1 className="text-3xl font-black">Mini ATS kandydatów</h1><p className="mt-2 text-slate-500">Shortlista kandydatów - {clientProjectName}</p></header><CandidatesView /></div>{enlargedCandidate && <EditableCandidateModal candidate={enlargedCandidate} />}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900"><div className="flex min-h-screen"><aside className="sticky top-0 hidden h-screen w-72 flex-col bg-slate-950 p-5 text-white md:flex"><div className="mb-8"><div className="text-2xl font-black">Mini ATS</div><div className="mt-1 text-sm text-slate-400">Kandydaci, projekty i klienci</div></div><nav className="grid gap-2"><button type="button" onClick={() => setActiveTab("add")} className={`rounded-2xl px-4 py-3 text-left font-bold ${activeTab === "add" ? "bg-white text-slate-900" : "text-slate-300 hover:bg-slate-800"}`}>Dodaj kandydata</button><button type="button" onClick={() => setActiveTab("candidates")} className={`rounded-2xl px-4 py-3 text-left font-bold ${activeTab === "candidates" ? "bg-white text-slate-900" : "text-slate-300 hover:bg-slate-800"}`}>Kandydaci</button><button type="button" onClick={() => setActiveTab("projects")} className={`rounded-2xl px-4 py-3 text-left font-bold ${activeTab === "projects" ? "bg-white text-slate-900" : "text-slate-300 hover:bg-slate-800"}`}>Projekty</button><button type="button" onClick={() => setActiveTab("clients")} className={`rounded-2xl px-4 py-3 text-left font-bold ${activeTab === "clients" ? "bg-white text-slate-900" : "text-slate-300 hover:bg-slate-800"}`}>Klienci</button></nav><div className="mt-auto grid gap-2"><button type="button" onClick={refreshAll} className="rounded-2xl border border-slate-700 px-4 py-3 font-bold text-slate-200 hover:bg-slate-800">Odśwież bazę</button><button type="button" onClick={logout} className="rounded-2xl border border-red-900 px-4 py-3 font-bold text-red-300 hover:bg-red-950">Wyloguj</button></div></aside><main className="w-full p-4 md:p-8"><div className="mx-auto max-w-6xl"><header className="mb-8 rounded-3xl bg-white p-6 shadow-sm"><h1 className="text-3xl font-black md:text-4xl">{activeTab === "add" && "Dodaj kandydata"}{activeTab === "candidates" && "Baza kandydatów"}{activeTab === "projects" && "Projekty"}{activeTab === "clients" && "Klienci"}</h1><p className="mt-2 text-slate-500">Dane zapisują się w Supabase.</p><div className="mt-4 grid grid-cols-2 gap-2 md:hidden"><button type="button" onClick={() => setActiveTab("add")} className="rounded-xl border p-2 font-bold">Dodaj</button><button type="button" onClick={() => setActiveTab("candidates")} className="rounded-xl border p-2 font-bold">Kandydaci</button><button type="button" onClick={() => setActiveTab("projects")} className="rounded-xl border p-2 font-bold">Projekty</button><button type="button" onClick={() => setActiveTab("clients")} className="rounded-xl border p-2 font-bold">Klienci</button></div></header>{message && <p className="mb-6 rounded-2xl bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm">{message}</p>}{activeTab === "add" && <AddCandidateView />}{activeTab === "candidates" && <CandidatesView />}{activeTab === "projects" && <ProjectsView />}{activeTab === "clients" && <ClientsView />}</div></main></div>{enlargedCandidate && <EditableCandidateModal candidate={enlargedCandidate} />}</div>
  );
}
