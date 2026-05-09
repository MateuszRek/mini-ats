// MINI ATS - SUPABASE ONLINE

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://cocydftwrdshqwvauodb.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_un7LVevS6WPsvuhl2KBPVg_d_wjK9KD";
const supabase = createClient(supabaseUrl, supabaseKey);

const STATUSES = ["New", "Contacted", "Interested", "Interview", "Recommended", "Offer", "Rejected", "Hired"];

const STATUS_STYLES = {
  New: "bg-blue-600 text-white border-blue-800 shadow-blue-200",
  Contacted: "bg-purple-600 text-white border-purple-800 shadow-purple-200",
  Interested: "bg-indigo-600 text-white border-indigo-800 shadow-indigo-200",
  Interview: "bg-orange-500 text-white border-orange-700 shadow-orange-200",
  Recommended: "bg-cyan-600 text-white border-cyan-800 shadow-cyan-200",
  Offer: "bg-cyan-600 text-white border-cyan-800 shadow-cyan-200",
  Rejected: "bg-red-600 text-white border-red-800 shadow-red-200",
  Hired: "bg-green-600 text-white border-green-800 shadow-green-200",
};

const STATUS_SOFT_STYLES = {
  New: "bg-blue-50 text-blue-800 border-blue-200",
  Contacted: "bg-purple-50 text-purple-800 border-purple-200",
  Interested: "bg-indigo-50 text-indigo-800 border-indigo-200",
  Interview: "bg-orange-50 text-orange-800 border-orange-200",
  Recommended: "bg-cyan-50 text-cyan-800 border-cyan-200",
  Offer: "bg-cyan-50 text-cyan-800 border-cyan-200",
  Rejected: "bg-red-50 text-red-800 border-red-200",
  Hired: "bg-green-50 text-green-800 border-green-200",
};

const STATUS_ACCENTS = {
  New: "from-blue-700 to-blue-400",
  Contacted: "from-purple-700 to-fuchsia-500",
  Interested: "from-indigo-700 to-violet-500",
  Interview: "from-orange-600 to-amber-400",
  Recommended: "from-cyan-700 to-teal-400",
  Offer: "from-cyan-700 to-teal-400",
  Rejected: "from-red-700 to-rose-500",
  Hired: "from-green-700 to-emerald-400",
};

const emptyCandidate = {
  favorite: false,
  name: "",
  status: "New",
  email: "",
  telefon: "",
  linkedin: "",
  lokalizacja: "",
  "doświadczenie": "",
  notatki: "",
  tagi: "",
  jezyk_programowania: "",
  framework: "",
  obszar: "",
  rating: 0,
  cv_url: "",
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

function splitTags(value) {
  return String(value || "")
    .replace(/#/g, "")
    .split(/[,;/|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildModalDraft(candidate) {
  return {
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

function FieldValue({ label, value, children }) {
  if (!value && !children) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-2 break-words text-sm font-semibold leading-relaxed text-slate-800">{children || value}</div>
    </div>
  );
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

  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectClientId, setNewProjectClientId] = useState("");
  const [projectSearch, setProjectSearch] = useState("");

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
      supabase
        .from("candidates")
        .select("*, candidate_projects(*, Projekty(*))")
        .order("created_at", { ascending: false }),
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

  const saveCandidate = async () => {
    if (!candidateForm.name.trim()) {
      setMessage("Podaj imię i nazwisko kandydata");
      return;
    }

    const payload = {
      name: candidateForm.name.trim(),
      status: candidateForm.status,
      email: candidateForm.email.trim(),
      telefon: candidateForm.telefon.trim(),
      linkedin: candidateForm.linkedin.trim(),
      lokalizacja: candidateForm.lokalizacja.trim(),
      "doświadczenie": String(candidateForm["doświadczenie"] || "").trim(),
      notatki: candidateForm.notatki.trim(),
      tagi: candidateForm.tagi.trim(),
      jezyk_programowania: candidateForm.jezyk_programowania.trim(),
      framework: candidateForm.framework.trim(),
      obszar: candidateForm.obszar.trim(),
      rating: Number(candidateForm.rating) || 0,
      favorite: Boolean(candidateForm.favorite),
      cv_url: candidateForm.cv_url.trim(),
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
    setEditingId(null);
    setFormProjectIds([]);
    setActiveTab("candidates");
    setMessage(editingId ? "Kandydat zaktualizowany" : "Kandydat dodany");
    refreshAll();
  };

  const startEditCandidate = (candidate) => {
    setEditingId(candidate.id);
    setCandidateForm({ ...emptyCandidate, ...candidate });
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
    const activeProjectId = clientView ? clientProjectId : projectFilter;
    if (activeProjectId) return candidate.candidate_projects?.find((item) => item.project_id === activeProjectId) || null;
    const relations = candidate.candidate_projects || [];
    return relations.length === 1 ? relations[0] : null;
  };

  const isCandidateRecommended = (candidate) => {
    const activeProjectId = clientView ? clientProjectId : projectFilter;
    return Boolean(candidate.candidate_projects?.some((item) => item.recommended_to_client && (!activeProjectId || item.project_id === activeProjectId)));
  };

  const toggleRecommendedToClient = async (candidate, relation = null) => {
    const target = getRecommendationRelation(candidate, relation);
    if (!target?.id) {
      setMessage("Wybierz projekt albo kliknij diament przy konkretnym projekcie kandydata.");
      return;
    }

    const next = !target.recommended_to_client;
    setCandidates((prev) =>
      prev.map((item) =>
        item.id === candidate.id
          ? { ...item, candidate_projects: item.candidate_projects?.map((cp) => (cp.id === target.id ? { ...cp, recommended_to_client: next } : cp)) }
          : item
      )
    );

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

  const addProject = async () => {
    if (!newProjectName.trim()) return setMessage("Podaj nazwę projektu");
    const payload = { name: newProjectName.trim() };
    if (newProjectClientId) payload.client_id = newProjectClientId;
    const { error } = await supabase.from("Projekty").insert([payload]);
    if (error) setMessage("Błąd dodawania projektu: " + error.message);
    else {
      setNewProjectName("");
      setNewProjectClientId("");
      refreshAll();
    }
  };

  const updateProjectClient = async (projectId, clientId) => {
    const nextClientId = clientId || null;
    const { error } = await supabase.from("Projekty").update({ client_id: nextClientId }).eq("id", projectId);
    if (error) setMessage("Nie udało się przypisać klienta: " + error.message);
    else refreshAll();
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
    };
    if (newClientNotes.trim()) payload.notatki = newClientNotes.trim();

    const { error } = await supabase.from("clients").insert([payload]);
    if (error) setMessage("Błąd dodawania klienta: " + error.message);
    else {
      setNewClientName("");
      setNewClientContact("");
      setNewClientEmail("");
      setNewClientPhone("");
      setNewClientNotes("");
      refreshAll();
    }
  };

  const deleteClient = async (client) => {
    if (!confirm(`Usunąć klienta: ${client.name}? Projekty zostaną odpięte.`)) return;
    await supabase.from("Projekty").update({ client_id: null }).eq("client_id", client.id);
    const { error } = await supabase.from("clients").delete().eq("id", client.id);
    if (error) setMessage("Nie udało się usunąć klienta: " + error.message);
    else refreshAll();
  };

  const filteredCandidates = useMemo(() => {
    const activeProjectId = clientView ? clientProjectId : projectFilter;
    const rows = candidates.filter((candidate) => {
      const relationText = (candidate.candidate_projects || [])
        .map((cp) => [cp.status, cp.notes, cp.interview_summary, cp.recruiter_notes, projectName(cp.Projekty)].join(" "))
        .join(" ");
      const searchable = [
        candidate.name,
        candidate.email,
        candidate.telefon,
        candidate.linkedin,
        candidate.lokalizacja,
        candidate["doświadczenie"],
        candidate.notatki,
        candidate.tagi,
        candidate.jezyk_programowania,
        candidate.framework,
        candidate.obszar,
        relationText,
      ].join(" ");
      const matchesQuery = !query || includesText(searchable, query);
      const matchesStatus = !statusFilter || candidate.status === statusFilter;
      const matchesProject = !activeProjectId || candidate.candidate_projects?.some((cp) => cp.project_id === activeProjectId);
      const matchesFavorite = !onlyFavorites || candidate.favorite;
      const matchesRecommended = !onlyRecommended || candidate.candidate_projects?.some((cp) => cp.recommended_to_client && (!activeProjectId || cp.project_id === activeProjectId));
      return matchesQuery && matchesStatus && matchesProject && matchesFavorite && matchesRecommended;
    });

    return rows.sort((a, b) => {
      if (sortBy === "name") return String(a.name || "").localeCompare(String(b.name || ""), "pl");
      if (sortBy === "rating") return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [candidates, query, statusFilter, projectFilter, onlyFavorites, onlyRecommended, sortBy, clientView, clientProjectId]);

  const filteredProjects = useMemo(() => projects.filter((project) => includesText(projectName(project), projectSearch)), [projects, projectSearch]);
  const filteredClients = useMemo(
    () => clients.filter((client) => includesText([client.name, client.osoba_do_kontaktu, client.email, client.telefon, client.notatki].join(" "), clientSearch)),
    [clients, clientSearch]
  );
  const enlargedCandidate = candidates.find((candidate) => candidate.id === enlargedCandidateId);

  const CandidateProjects = ({ candidate }) => (
    <div className="mt-4 grid gap-3">
      {candidate.candidate_projects?.length ? (
        candidate.candidate_projects.map((relation) => (
          <div key={relation.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <button type="button" onClick={() => setProjectFilter(relation.project_id)} className="text-left font-black text-slate-900 hover:text-blue-700 hover:underline">
                  {projectName(relation.Projekty)}
                </button>
                <p className="mt-1 text-xs font-semibold text-slate-500">Klient: {getProjectClientName(relation.Projekty)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleRecommendedToClient(candidate, relation)}
                  className={`rounded-full border px-3 py-1 text-sm font-black ${relation.recommended_to_client ? "border-cyan-500 bg-cyan-500 text-white" : "border-slate-200 bg-white text-slate-400 hover:text-cyan-600"}`}
                  title="Rekomendowany do klienta"
                >
                  ♦
                </button>
                <button type="button" onClick={() => removeCandidateFromProject(relation.id)} className="rounded-full border border-red-200 bg-white px-3 py-1 text-sm font-bold text-red-600 hover:bg-red-50">
                  Usuń
                </button>
              </div>
            </div>
            <select
              className={`mt-4 w-full rounded-xl border p-3 text-sm font-black shadow-sm ${getStatusStyle(relation.status || "New")}`}
              value={relation.status || "New"}
              onChange={(event) => updateProjectRelation(relation.id, "status", event.target.value)}
            >
              {STATUSES.map((status) => <option key={status}>{status}</option>)}
            </select>
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              <textarea className="min-h-28 rounded-xl border border-slate-200 bg-white p-3 text-sm" defaultValue={relation.notes || ""} onBlur={(event) => updateProjectRelation(relation.id, "notes", event.target.value)} placeholder="Project notes / next step" />
              <textarea className="min-h-28 rounded-xl border border-slate-200 bg-white p-3 text-sm" defaultValue={relation.interview_summary || ""} onBlur={(event) => updateProjectRelation(relation.id, "interview_summary", event.target.value)} placeholder="Interview summary" />
              <textarea className="min-h-28 rounded-xl border border-slate-200 bg-white p-3 text-sm" defaultValue={relation.recruiter_notes || ""} onBlur={(event) => updateProjectRelation(relation.id, "recruiter_notes", event.target.value)} placeholder="Recruiter notes" />
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-center text-sm font-semibold text-slate-400">Brak przypisanego projektu</div>
      )}
      <div className="flex gap-2">
        <select className="w-full rounded-xl border p-2" value={selectedProjects[candidate.id] || ""} onChange={(event) => setSelectedProjects((prev) => ({ ...prev, [candidate.id]: event.target.value }))}>
          <option value="">Wybierz projekt</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{projectName(project)}</option>)}
        </select>
        <button type="button" onClick={() => assignProject(candidate.id)} className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700">Przypisz</button>
      </div>
    </div>
  );

  const CandidateCard = ({ candidate }) => {
    const active = activeCandidateId === candidate.id;
    const recommended = isCandidateRecommended(candidate);
    return (
      <div
        className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:shadow-lg ${active ? "border-cyan-300 ring-4 ring-cyan-100" : "border-slate-200"}`}
        onDoubleClick={() => openEnlargedCandidate(candidate.id)}
      >
        <div className={`h-2 bg-gradient-to-r ${getAccentStyle(candidate.status || "New")}`} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            {!clientView && (
              <div className="flex flex-col items-center gap-2">
                <button type="button" onClick={() => toggleFavorite(candidate)} className={`text-2xl ${candidate.favorite ? "text-yellow-400" : "text-slate-300 hover:text-yellow-400"}`} title="Shortlista">★</button>
                <button type="button" onClick={() => toggleRecommendedToClient(candidate)} className={`text-2xl ${recommended ? "text-cyan-500" : "text-slate-300 hover:text-cyan-500"}`} title="Rekomendowany do klienta">♦</button>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-black tracking-tight text-slate-950">{candidate.name || "Kandydat bez nazwy"}</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{candidate.email || candidate.telefon || candidate.lokalizacja || "Brak danych kontaktowych"}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                {candidate.jezyk_programowania && <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{candidate.jezyk_programowania}</span>}
                {candidate.framework && <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-700">{candidate.framework}</span>}
                {candidate.rating > 0 && <span className="rounded-full bg-yellow-50 px-3 py-1 text-yellow-700">{"★".repeat(candidate.rating)}</span>}
                {splitTags(candidate.tagi).map((tag) => <span key={tag} className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">#{tag}</span>)}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={candidate.status || "New"} compact />
              {recommended && <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-800">♦ Recommended</span>}
              <button type="button" onClick={() => openEnlargedCandidate(candidate.id)} className="rounded-xl border px-3 py-1.5 text-xs font-bold hover:bg-slate-50">Powiększ</button>
            </div>
          </div>

          {!clientView && (
            <div className="mt-4 grid gap-3">
              <select className={`rounded-xl border p-3 font-black shadow-sm ${getStatusStyle(candidate.status || "New")}`} value={candidate.status || "New"} onChange={(event) => updateCandidateStatus(candidate, event.target.value)}>
                {STATUSES.map((status) => <option key={status}>{status}</option>)}
              </select>
              {candidate.notatki && <p className="rounded-2xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">{candidate.notatki}</p>}
              <div className="rounded-2xl border border-slate-200 p-4">
                <button type="button" onClick={() => toggleProjectSection(candidate.id)} className="flex w-full items-center justify-between text-left text-sm font-bold text-slate-800">
                  <span>Projekty kandydata / podsumowania rozmów</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{openProjectSections[candidate.id] ? "Zwiń" : "Rozwiń"}</span>
                </button>
                {openProjectSections[candidate.id] && <CandidateProjects candidate={candidate} />}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => openEnlargedCandidate(candidate.id)} className="rounded-xl border px-4 py-2 text-sm font-bold hover:bg-slate-50">Powiększ</button>
                <button type="button" onClick={() => startEditCandidate(candidate)} className="rounded-xl border px-4 py-2 text-sm font-bold hover:bg-slate-50">Edytuj</button>
                <button type="button" onClick={() => deleteCandidate(candidate)} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50">Usuń</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const EditableCandidateModal = ({ candidate }) => {
    const [draft, setDraft] = useState(() => buildModalDraft(candidate));
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
      setDraft(buildModalDraft(candidate));
      setFeedback("");
    }, [candidate.id]);

    const setRelationDraft = (relationId, field, value) => {
      setDraft((prev) => ({
        ...prev,
        projectRelations: {
          ...prev.projectRelations,
          [relationId]: {
            ...(prev.projectRelations[relationId] || {}),
            [field]: value,
          },
        },
      }));
    };

    const saveModalChanges = async () => {
      setSaving(true);
      setFeedback("");

      const { error: candidateError } = await supabase
        .from("candidates")
        .update({ status: draft.status, notatki: draft.notatki })
        .eq("id", candidate.id);

      if (candidateError) {
        setSaving(false);
        setFeedback("Save failed: " + candidateError.message);
        return;
      }

      const updates = Object.entries(draft.projectRelations).map(([relationId, relationDraft]) =>
        supabase
          .from("candidate_projects")
          .update({
            status: relationDraft.status,
            notes: relationDraft.notes,
            interview_summary: relationDraft.interview_summary,
            recruiter_notes: relationDraft.recruiter_notes,
            recommended_to_client: Boolean(relationDraft.recommended_to_client),
          })
          .eq("id", relationId)
      );

      const results = await Promise.all(updates);
      const failed = results.find((result) => result.error);
      if (failed?.error) {
        setSaving(false);
        setFeedback("Save failed: " + failed.error.message);
        return;
      }

      setCandidates((prev) =>
        prev.map((item) =>
          item.id === candidate.id
            ? {
                ...item,
                status: draft.status,
                notatki: draft.notatki,
                candidate_projects: item.candidate_projects?.map((relation) => ({
                  ...relation,
                  ...(draft.projectRelations[relation.id] || {}),
                })),
              }
            : item
        )
      );

      setSaving(false);
      setFeedback("Saved successfully");
      refreshAll();
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm md:p-6">
        <div className="max-h-[94vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10">
          <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className={`h-2 bg-gradient-to-r ${getAccentStyle(draft.status || "New")}`} />
            <div className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between md:p-6">
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <StatusBadge status={draft.status || "New"} />
                  {candidate.favorite && <span className="rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-black text-yellow-700">★ Shortlist</span>}
                  {isCandidateRecommended(candidate) && <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-800">♦ Recommended</span>}
                </div>
                <h2 className="truncate text-2xl font-black tracking-tight text-slate-950 md:text-4xl">{candidate.name || "Kandydat bez nazwy"}</h2>
                <p className="mt-2 text-sm font-semibold text-slate-500">Edit candidate status, notes and all project interview fields. Save keeps this modal open.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                {feedback && <span className={`rounded-full px-3 py-2 text-xs font-black ${feedback.includes("failed") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{feedback}</span>}
                <button type="button" onClick={saveModalChanges} disabled={saving} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300">
                  {saving ? "Saving..." : "Save changes"}
                </button>
                <button type="button" onClick={closeEnlargedCandidate} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 hover:bg-slate-50">
                  Close
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-[calc(94vh-132px)] overflow-y-auto bg-slate-50 p-4 md:p-6">
            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.4fr]">
              <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Candidate details</h3>
                  <p className="mt-1 text-sm text-slate-500">Quick context while editing the process.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <FieldValue label="Email" value={candidate.email} />
                  <FieldValue label="Phone" value={candidate.telefon} />
                  <FieldValue label="Location" value={candidate.lokalizacja} />
                  <FieldValue label="Experience" value={candidate["doświadczenie"]} />
                  <FieldValue label="Role area" value={candidate.obszar} />
                  <FieldValue label="Technology" value={[candidate.jezyk_programowania, candidate.framework].filter(Boolean).join(" / ")} />
                  {candidate.linkedin && (
                    <FieldValue label="LinkedIn">
                      <a className="text-blue-700 hover:underline" href={candidate.linkedin} target="_blank" rel="noreferrer">Open profile</a>
                    </FieldValue>
                  )}
                  {candidate.cv_url && <FieldValue label="CV" value={candidate.cv_url} />}
                </div>
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-400">Candidate status</span>
                  <select className={`rounded-2xl border p-3 font-black shadow-sm ${getStatusStyle(draft.status || "New")}`} value={draft.status} onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value }))}>
                    {STATUSES.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </label>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-1">
                  <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Candidate notes</h3>
                  <p className="text-sm text-slate-500">Main notes visible on the candidate profile.</p>
                </div>
                <textarea
                  className="min-h-72 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  value={draft.notatki}
                  onChange={(event) => setDraft((prev) => ({ ...prev, notatki: event.target.value }))}
                  placeholder="Candidate notes, context, risks, next steps..."
                />
              </section>

              <section className="lg:col-span-2">
                <div className="mb-4 flex flex-col gap-1">
                  <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Projects and interviews</h3>
                  <p className="text-sm text-slate-500">Edit project status, project notes, interview summary and recruiter notes. Changes are sent to Supabase after Save changes.</p>
                </div>
                <div className="grid gap-4">
                  {candidate.candidate_projects?.length ? (
                    candidate.candidate_projects.map((relation) => {
                      const relationDraft = draft.projectRelations[relation.id] || {
                        status: relation.status || "New",
                        notes: relation.notes || "",
                        interview_summary: relation.interview_summary || "",
                        recruiter_notes: relation.recruiter_notes || "",
                        recommended_to_client: Boolean(relation.recommended_to_client),
                      };

                      return (
                        <div key={relation.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div>
                              <h4 className="text-xl font-black text-slate-950">{projectName(relation.Projekty)}</h4>
                              <p className="mt-1 text-sm font-semibold text-slate-500">Client: {getProjectClientName(relation.Projekty)}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setRelationDraft(relation.id, "recommended_to_client", !relationDraft.recommended_to_client)}
                                className={`rounded-full border px-4 py-2 text-sm font-black ${relationDraft.recommended_to_client ? "border-cyan-600 bg-cyan-600 text-white shadow-sm shadow-cyan-200" : "border-slate-200 bg-white text-slate-500 hover:border-cyan-300 hover:text-cyan-700"}`}
                              >
                                ♦ Recommended
                              </button>
                              <select
                                className={`rounded-2xl border px-4 py-2 text-sm font-black shadow-sm ${getStatusStyle(relationDraft.status || "New")}`}
                                value={relationDraft.status}
                                onChange={(event) => setRelationDraft(relation.id, "status", event.target.value)}
                              >
                                {STATUSES.map((status) => <option key={status}>{status}</option>)}
                              </select>
                            </div>
                          </div>

                          <div className="mt-5 grid gap-4 lg:grid-cols-3">
                            <label className="grid gap-2">
                              <span className="text-xs font-black uppercase tracking-wide text-slate-400">Project notes</span>
                              <textarea className="min-h-44 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100" value={relationDraft.notes} onChange={(event) => setRelationDraft(relation.id, "notes", event.target.value)} placeholder="Project context, status, next step..." />
                            </label>
                            <label className="grid gap-2">
                              <span className="text-xs font-black uppercase tracking-wide text-slate-400">Interview summary</span>
                              <textarea className="min-h-44 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100" value={relationDraft.interview_summary} onChange={(event) => setRelationDraft(relation.id, "interview_summary", event.target.value)} placeholder="Motivation, expectations, fit, objections..." />
                            </label>
                            <label className="grid gap-2">
                              <span className="text-xs font-black uppercase tracking-wide text-slate-400">Recruiter notes</span>
                              <textarea className="min-h-44 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100" value={relationDraft.recruiter_notes} onChange={(event) => setRelationDraft(relation.id, "recruiter_notes", event.target.value)} placeholder="Internal notes, risks, recommendation..." />
                            </label>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-slate-400">No projects assigned to this candidate.</div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AddCandidateView = () => (
    <section className="rounded-3xl bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black">{editingId ? "Edytuj kandydata" : "Dodaj kandydata"}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <input className="rounded-xl border p-3" placeholder="Imię i nazwisko" value={candidateForm.name} onChange={(event) => updateCandidateForm("name", event.target.value)} />
        <select className={`rounded-xl border p-3 font-black ${getSoftStatusStyle(candidateForm.status)}`} value={candidateForm.status} onChange={(event) => updateCandidateForm("status", event.target.value)}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
        <input className="rounded-xl border p-3" placeholder="Email" value={candidateForm.email} onChange={(event) => updateCandidateForm("email", event.target.value)} />
        <input className="rounded-xl border p-3" placeholder="Telefon" value={candidateForm.telefon} onChange={(event) => updateCandidateForm("telefon", event.target.value)} />
        <input className="rounded-xl border p-3" placeholder="LinkedIn" value={candidateForm.linkedin} onChange={(event) => updateCandidateForm("linkedin", event.target.value)} />
        <input className="rounded-xl border p-3" placeholder="Lokalizacja" value={candidateForm.lokalizacja} onChange={(event) => updateCandidateForm("lokalizacja", event.target.value)} />
        <input className="rounded-xl border p-3" placeholder="Doświadczenie" value={candidateForm["doświadczenie"]} onChange={(event) => updateCandidateForm("doświadczenie", event.target.value)} />
        <input className="rounded-xl border p-3" placeholder="Język programowania" value={candidateForm.jezyk_programowania} onChange={(event) => updateCandidateForm("jezyk_programowania", event.target.value)} />
        <input className="rounded-xl border p-3" placeholder="Framework" value={candidateForm.framework} onChange={(event) => updateCandidateForm("framework", event.target.value)} />
        <input className="rounded-xl border p-3" placeholder="Obszar" value={candidateForm.obszar} onChange={(event) => updateCandidateForm("obszar", event.target.value)} />
        <input className="rounded-xl border p-3" placeholder="Tagi" value={candidateForm.tagi} onChange={(event) => updateCandidateForm("tagi", event.target.value)} />
        <input className="rounded-xl border p-3" placeholder="CV URL / ścieżka" value={candidateForm.cv_url} onChange={(event) => updateCandidateForm("cv_url", event.target.value)} />
        <textarea className="min-h-28 rounded-xl border p-3 lg:col-span-3" placeholder="Notatki" value={candidateForm.notatki} onChange={(event) => updateCandidateForm("notatki", event.target.value)} />
      </div>
      {!editingId && (
        <div className="mt-4 flex flex-wrap gap-2">
          {projects.map((project) => {
            const selected = formProjectIds.includes(project.id);
            return <button key={project.id} type="button" onClick={() => setFormProjectIds((prev) => selected ? prev.filter((id) => id !== project.id) : [...prev, project.id])} className={`rounded-full border px-3 py-1 text-sm font-bold ${selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>{projectName(project)}</button>;
          })}
        </div>
      )}
      <div className="mt-5 flex gap-2">
        <button type="button" onClick={saveCandidate} className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-800">{editingId ? "Zapisz zmiany" : "Dodaj kandydata"}</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setCandidateForm(emptyCandidate); }} className="rounded-xl border px-5 py-3 font-bold hover:bg-slate-50">Anuluj</button>}
      </div>
    </section>
  );

  const CandidatesView = () => (
    <>
      <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-black">Kandydaci</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <input className="rounded-xl border p-3 md:col-span-2" placeholder="Szukaj..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <select className="rounded-xl border p-3" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Status: wszystkie</option>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
          <select className="rounded-xl border p-3" value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}><option value="">Projekt: wszystkie</option>{projects.map((project) => <option key={project.id} value={project.id}>{projectName(project)}</option>)}</select>
          <select className="rounded-xl border p-3" value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="newest">Najnowsi</option><option value="name">Nazwa A-Z</option><option value="rating">Ocena</option></select>
          <button type="button" onClick={() => { setQuery(""); setStatusFilter(""); setProjectFilter(""); setOnlyFavorites(false); setOnlyRecommended(false); }} className="rounded-xl border px-4 py-3 font-bold hover:bg-slate-50">Wyczyść filtry</button>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={onlyFavorites} onChange={(event) => setOnlyFavorites(event.target.checked)} /> Tylko shortlista ★</label>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={onlyRecommended} onChange={(event) => setOnlyRecommended(event.target.checked)} /> Tylko rekomendowani ♦</label>
          </div>
          <p className="text-sm text-slate-500">Znaleziono: <b>{filteredCandidates.length}</b></p>
        </div>
      </section>
      {loading && <div className="rounded-3xl bg-white p-6 text-center shadow-sm">Ładowanie...</div>}
      {!loading && filteredCandidates.length === 0 && <div className="rounded-3xl bg-white p-10 text-center shadow-sm">Brak kandydatów.</div>}
      <main className="grid gap-4 lg:grid-cols-2">{filteredCandidates.map((candidate) => <CandidateCard key={candidate.id} candidate={candidate} />)}</main>
    </>
  );

  const ProjectsView = () => (
    <>
      <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-black">Projekty</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <input className="rounded-xl border p-3 md:col-span-2" placeholder="Nazwa projektu" value={newProjectName} onChange={(event) => setNewProjectName(event.target.value)} />
          <select className="rounded-xl border p-3" value={newProjectClientId} onChange={(event) => setNewProjectClientId(event.target.value)}><option value="">Bez klienta</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select>
          <button type="button" onClick={addProject} className="rounded-xl bg-green-600 px-4 py-2 font-bold text-white hover:bg-green-700">Dodaj projekt</button>
        </div>
        <input className="mt-4 w-full rounded-xl border p-3" placeholder="Szukaj projektu..." value={projectSearch} onChange={(event) => setProjectSearch(event.target.value)} />
      </section>
      <main className="grid gap-4 lg:grid-cols-2">{filteredProjects.map((project) => {
        const projectCandidates = candidates.filter((candidate) => candidate.candidate_projects?.some((relation) => relation.project_id === project.id));
        return <div key={project.id} className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div><h3 className="text-xl font-black">{projectName(project)}</h3><p className="text-sm text-slate-500">Kandydaci: <b>{projectCandidates.length}</b></p></div>
            <button type="button" onClick={() => deleteProject(project)} className="rounded-full border border-red-200 px-3 py-1 text-sm font-bold text-red-600 hover:bg-red-50">Usuń</button>
          </div>
          <div className="mt-4 rounded-2xl border bg-slate-50 p-3"><label className="mb-1 block text-sm font-bold text-slate-700">Klient projektu</label><select className="w-full rounded-xl border bg-white p-2" value={project.client_id || ""} onChange={(event) => updateProjectClient(project.id, event.target.value)}><option value="">Bez klienta</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></div>
          <div className="mt-4 grid gap-2">{projectCandidates.map((candidate) => <button key={candidate.id} type="button" onClick={() => openEnlargedCandidate(candidate.id)} className="rounded-2xl border bg-slate-50 p-3 text-left hover:bg-blue-50"><div className="font-bold">{candidate.name}</div><div className="text-sm text-slate-500">{candidate.email || candidate.telefon || "Brak kontaktu"}</div></button>)}</div>
        </div>;
      })}</main>
    </>
  );

  const ClientsView = () => (
    <>
      <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-black">Klienci</h2>
        <div className="grid gap-3 md:grid-cols-5">
          <input className="rounded-xl border p-3" placeholder="Nazwa klienta" value={newClientName} onChange={(event) => setNewClientName(event.target.value)} />
          <input className="rounded-xl border p-3" placeholder="Osoba do kontaktu" value={newClientContact} onChange={(event) => setNewClientContact(event.target.value)} />
          <input className="rounded-xl border p-3" placeholder="Email" value={newClientEmail} onChange={(event) => setNewClientEmail(event.target.value)} />
          <input className="rounded-xl border p-3" placeholder="Telefon" value={newClientPhone} onChange={(event) => setNewClientPhone(event.target.value)} />
          <input className="rounded-xl border p-3" placeholder="Notatki" value={newClientNotes} onChange={(event) => setNewClientNotes(event.target.value)} />
          <button type="button" onClick={addClient} className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white hover:bg-slate-800">Dodaj klienta</button>
        </div>
        <input className="mt-4 w-full rounded-xl border p-3" placeholder="Szukaj klienta..." value={clientSearch} onChange={(event) => setClientSearch(event.target.value)} />
      </section>
      <main className="grid gap-4 lg:grid-cols-2">{filteredClients.map((client) => {
        const clientProjects = projects.filter((project) => project.client_id === client.id);
        return <div key={client.id} className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-black">{client.name}</h3><p className="text-sm text-slate-500">{client.osoba_do_kontaktu || "Brak osoby kontaktowej"}</p></div><button type="button" onClick={() => deleteClient(client)} className="rounded-full border border-red-200 px-3 py-1 text-sm font-bold text-red-600 hover:bg-red-50">Usuń</button></div>
          {client.email && <p className="mt-2 text-sm text-slate-500">Email: <b>{client.email}</b></p>}
          {client.telefon && <p className="text-sm text-slate-500">Telefon: <b>{client.telefon}</b></p>}
          {client.notatki && <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">{client.notatki}</p>}
          <div className="mt-4 grid gap-2"><div className="text-sm font-bold text-slate-700">Projekty klienta ({clientProjects.length})</div>{clientProjects.map((project) => <button key={project.id} type="button" onClick={() => { setProjectFilter(project.id); setActiveTab("candidates"); }} className="rounded-2xl border bg-slate-50 p-3 text-left font-bold hover:bg-blue-50">{projectName(project)}</button>)}</div>
        </div>;
      })}</main>
    </>
  );

  if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-slate-50">Ładowanie...</div>;

  if (!session && !clientView) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm"><h1 className="text-3xl font-black">Mini ATS</h1><p className="mt-2 text-slate-500">Zaloguj się, żeby zobaczyć bazę kandydatów.</p><div className="mt-6 grid gap-3"><input className="rounded-xl border p-3" placeholder="Email" type="email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} /><input className="rounded-xl border p-3" placeholder="Hasło" type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") login(); }} /><button type="button" onClick={login} className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-800">Zaloguj</button></div>{message && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}</div></div>;
  }

  if (clientView) {
    return <div className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8"><div className="mx-auto max-w-6xl"><header className="mb-8 rounded-3xl bg-white p-6 shadow-sm"><h1 className="text-3xl font-black">Mini ATS kandydatów</h1><p className="mt-2 text-slate-500">Shortlista kandydatów - {clientProjectName}</p></header><CandidatesView /></div>{enlargedCandidate && <EditableCandidateModal candidate={enlargedCandidate} />}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-72 flex-col bg-slate-950 p-5 text-white md:flex">
          <div className="mb-8"><div className="text-2xl font-black">Mini ATS</div><div className="mt-1 text-sm text-slate-400">Kandydaci, projekty i klienci</div></div>
          <nav className="grid gap-2">
            <button type="button" onClick={() => setActiveTab("add")} className={`rounded-2xl px-4 py-3 text-left font-bold ${activeTab === "add" ? "bg-white text-slate-900" : "text-slate-300 hover:bg-slate-800"}`}>Dodaj kandydata</button>
            <button type="button" onClick={() => setActiveTab("candidates")} className={`rounded-2xl px-4 py-3 text-left font-bold ${activeTab === "candidates" ? "bg-white text-slate-900" : "text-slate-300 hover:bg-slate-800"}`}>Kandydaci</button>
            <button type="button" onClick={() => setActiveTab("projects")} className={`rounded-2xl px-4 py-3 text-left font-bold ${activeTab === "projects" ? "bg-white text-slate-900" : "text-slate-300 hover:bg-slate-800"}`}>Projekty</button>
            <button type="button" onClick={() => setActiveTab("clients")} className={`rounded-2xl px-4 py-3 text-left font-bold ${activeTab === "clients" ? "bg-white text-slate-900" : "text-slate-300 hover:bg-slate-800"}`}>Klienci</button>
          </nav>
          <div className="mt-auto grid gap-2"><button type="button" onClick={refreshAll} className="rounded-2xl border border-slate-700 px-4 py-3 font-bold text-slate-200 hover:bg-slate-800">Odśwież bazę</button><button type="button" onClick={logout} className="rounded-2xl border border-red-900 px-4 py-3 font-bold text-red-300 hover:bg-red-950">Wyloguj</button></div>
        </aside>
        <main className="w-full p-4 md:p-8"><div className="mx-auto max-w-6xl"><header className="mb-8 rounded-3xl bg-white p-6 shadow-sm"><h1 className="text-3xl font-black md:text-4xl">{activeTab === "add" && "Dodaj kandydata"}{activeTab === "candidates" && "Baza kandydatów"}{activeTab === "projects" && "Projekty"}{activeTab === "clients" && "Klienci"}</h1><p className="mt-2 text-slate-500">Dane zapisują się w Supabase.</p><div className="mt-4 grid grid-cols-2 gap-2 md:hidden"><button type="button" onClick={() => setActiveTab("add")} className="rounded-xl border p-2 font-bold">Dodaj</button><button type="button" onClick={() => setActiveTab("candidates")} className="rounded-xl border p-2 font-bold">Kandydaci</button><button type="button" onClick={() => setActiveTab("projects")} className="rounded-xl border p-2 font-bold">Projekty</button><button type="button" onClick={() => setActiveTab("clients")} className="rounded-xl border p-2 font-bold">Klienci</button></div></header>{message && <p className="mb-6 rounded-2xl bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm">{message}</p>}{activeTab === "add" && <AddCandidateView />}{activeTab === "candidates" && <CandidatesView />}{activeTab === "projects" && <ProjectsView />}{activeTab === "clients" && <ClientsView />}</div></main>
      </div>
      {enlargedCandidate && <EditableCandidateModal candidate={enlargedCandidate} />}
    </div>
  );
}
