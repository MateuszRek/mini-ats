// MINI ATS - SUPABASE ONLINE

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  cv_url: "",
};

function statusStyle(status) {
  return STATUS_STYLES[status] || STATUS_STYLES.New;
}

function includesText(value, query) {
  return String(value || "").toLowerCase().includes(String(query || "").toLowerCase());
}

function projectName(project) {
  return project?.name || project?.nazwa || "Projekt bez nazwy";
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

  const clientProjectName = useMemo(() => {
    const project = projects.find((item) => item.id === clientProjectId);
    return projectName(project) || "wybrany projekt";
  }, [projects, clientProjectId]);

  const getClientName = (clientId) => clients.find((client) => client.id === clientId)?.name || "Bez klienta";
  const getProjectClientName = (project) => getClientName(project?.client_id);

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
      doświadczenie: candidateForm.doświadczenie.trim(),
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
      await supabase.from("candidate_projects").insert(rows);
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
    setCandidateForm({ ...emptyCandidate, ...candidate, cv_file: null });
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
      notatki: newClientNotes.trim(),
    };
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
      const relationText = (candidate.candidate_projects || []).map((cp) => [cp.status, cp.notes, cp.interview_summary, cp.recruiter_notes, projectName(cp.Projekty)].join(" ")).join(" ");
      const searchable = [candidate.name, candidate.email, candidate.telefon, candidate.linkedin, candidate.lokalizacja, candidate.doświadczenie, candidate.notatki, candidate.tagi, candidate.jezyk_programowania, candidate.framework, candidate.obszar, relationText].join(" ");
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
  const filteredClients = useMemo(() => clients.filter((client) => includesText([client.name, client.osoba_do_kontaktu, client.email, client.telefon, client.notatki].join(" "), clientSearch)), [clients, clientSearch]);
  const enlargedCandidate = candidates.find((candidate) => candidate.id === enlargedCandidateId);

  const CandidateCard = ({ candidate }) => {
    const active = activeCandidateId === candidate.id;
    return (
      <div
        className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:shadow-lg ${active ? "border-cyan-300 ring-2 ring-cyan-100" : "border-slate-200"}`}
        onDoubleClick={() => openEnlargedCandidate(candidate.id)}
      >
        <div className="h-2 bg-gradient-to-r from-slate-700 to-cyan-400" />
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            {!clientView && (
              <div className="flex flex-col items-center gap-2">
                <button type="button" onClick={() => toggleFavorite(candidate)} className={`text-2xl ${candidate.favorite ? "text-yellow-400" : "text-slate-300 hover:text-yellow-400"}`} title="Shortlista">★</button>
                <button type="button" onClick={() => toggleRecommendedToClient(candidate)} className={`text-2xl ${isCandidateRecommended(candidate) ? "text-cyan-500" : "text-slate-300 hover:text-cyan-500"}`} title="Rekomendowany do klienta">♦</button>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-black text-slate-900">{candidate.name || "Kandydat bez nazwy"}</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{candidate.email || candidate.telefon || candidate.lokalizacja || "Brak danych kontaktowych"}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                {candidate.jezyk_programowania && <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{candidate.jezyk_programowania}</span>}
                {candidate.framework && <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-700">{candidate.framework}</span>}
                {candidate.tagi && String(candidate.tagi).split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => <span key={tag} className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">#{tag}</span>)}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`rounded-full border px-3 py-1 text-sm font-bold ${statusStyle(candidate.status)}`}>{candidate.status || "New"}</span>
              <button type="button" onClick={() => openEnlargedCandidate(candidate.id)} className="rounded-xl border px-3 py-1.5 text-xs font-bold hover:bg-slate-50">Powiększ</button>
            </div>
          </div>

          {!clientView && (
            <div className="mt-4 grid gap-3">
              <select className={`rounded-xl border p-3 font-semibold ${statusStyle(candidate.status)}`} value={candidate.status || "New"} onChange={(event) => updateCandidateStatus(candidate, event.target.value)}>
                {STATUSES.map((status) => <option key={status}>{status}</option>)}
              </select>
              {candidate.notatki && <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">{candidate.notatki}</p>}
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

  const CandidateProjects = ({ candidate }) => (
    <div className="mt-4 grid gap-3">
      {candidate.candidate_projects?.length ? candidate.candidate_projects.map((relation) => (
        <div key={relation.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <button type="button" onClick={() => setProjectFilter(relation.project_id)} className="font-black text-slate-900 hover:text-blue-700 hover:underline">{projectName(relation.Projekty)}</button>
              <p className="text-xs text-slate-500">Klient: {getProjectClientName(relation.Projekty)}</p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => toggleRecommendedToClient(candidate, relation)} className={`rounded-full px-2 text-xl font-black ${relation.recommended_to_client ? "text-cyan-500" : "text-slate-300 hover:text-cyan-500"}`}>♦</button>
              <button type="button" onClick={() => removeCandidateFromProject(relation.id)} className="rounded-full px-2 text-lg font-black text-red-500 hover:bg-red-50">×</button>
            </div>
          </div>
          <select className={`mt-3 w-full rounded-xl border p-2 text-sm font-semibold ${statusStyle(relation.status)}`} value={relation.status || "New"} onChange={(event) => updateProjectRelation(relation.id, "status", event.target.value)}>
            {STATUSES.map((status) => <option key={status}>{status}</option>)}
          </select>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <textarea className="min-h-24 rounded-xl border p-2 text-sm" placeholder="Notatka projektowa" defaultValue={relation.notes || ""} onBlur={(event) => updateProjectRelation(relation.id, "notes", event.target.value)} />
            <textarea className="min-h-24 rounded-xl border p-2 text-sm" placeholder="Podsumowanie rozmowy" defaultValue={relation.interview_summary || ""} onBlur={(event) => updateProjectRelation(relation.id, "interview_summary", event.target.value)} />
            <textarea className="min-h-24 rounded-xl border p-2 text-sm" placeholder="Notatki rekrutera" defaultValue={relation.recruiter_notes || ""} onBlur={(event) => updateProjectRelation(relation.id, "recruiter_notes", event.target.value)} />
          </div>
        </div>
      )) : <p className="text-sm text-slate-400">Brak przypisanego projektu</p>}
      <div className="flex gap-2">
        <select className="w-full rounded-xl border p-2" value={selectedProjects[candidate.id] || ""} onChange={(event) => setSelectedProjects((prev) => ({ ...prev, [candidate.id]: event.target.value }))}>
          <option value="">Wybierz projekt</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{projectName(project)}</option>)}
        </select>
        <button type="button" onClick={() => assignProject(candidate.id)} className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700">Przypisz</button>
      </div>
    </div>
  );

  const CandidateModal = ({ candidate }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b bg-white p-5">
          <div>
            <h2 className="text-3xl font-black text-slate-900">{candidate.name || "Kandydat bez nazwy"}</h2>
            <div className="mt-2 flex flex-wrap gap-2 text-sm font-bold">
              <span className={`rounded-full border px-3 py-1 ${statusStyle(candidate.status)}`}>{candidate.status || "New"}</span>
              {candidate.favorite && <span className="rounded-full bg-yellow-50 px-3 py-1 text-yellow-700">Shortlista</span>}
              {isCandidateRecommended(candidate) && <span className="rounded-full bg-cyan-50 px-3 py-1 text-cyan-700">♦ Rekomendowany</span>}
            </div>
          </div>
          <button type="button" onClick={closeEnlargedCandidate} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">Zamknij</button>
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1.2fr]">
          <section className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-700">
            <h3 className="mb-3 text-sm font-black uppercase text-slate-500">Dane kandydata</h3>
            {candidate.email && <p><b>Email:</b> {candidate.email}</p>}
            {candidate.telefon && <p><b>Telefon:</b> {candidate.telefon}</p>}
            {candidate.linkedin && <p><b>LinkedIn:</b> <a className="font-semibold text-blue-600 hover:underline" href={candidate.linkedin} target="_blank" rel="noreferrer">Otwórz profil</a></p>}
            {candidate.lokalizacja && <p><b>Lokalizacja:</b> {candidate.lokalizacja}</p>}
            {candidate.doświadczenie && <p><b>Doświadczenie:</b> {candidate.doświadczenie}</p>}
            {candidate.obszar && <p><b>Obszar:</b> {candidate.obszar}</p>}
            {candidate.jezyk_programowania && <p><b>Język:</b> {candidate.jezyk_programowania}</p>}
            {candidate.framework && <p><b>Framework:</b> {candidate.framework}</p>}
            {candidate.tagi && <p><b>Tagi:</b> {candidate.tagi}</p>}
          </section>
          <section className="rounded-2xl border bg-white p-4">
            <h3 className="mb-3 text-sm font-black uppercase text-slate-500">Notatki</h3>
            <div className="min-h-24 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{candidate.notatki || "Brak notatek"}</div>
          </section>
          <section className="lg:col-span-2">
            <h3 className="mb-3 text-sm font-black uppercase text-slate-500">Projekty i rozmowy</h3>
            <div className="grid gap-3">
              {candidate.candidate_projects?.length ? candidate.candidate_projects.map((relation) => (
                <div key={relation.id} className="rounded-2xl border bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h4 className="text-lg font-black">{projectName(relation.Projekty)}</h4>
                      <p className="text-sm text-slate-500">Klient: {getProjectClientName(relation.Projekty)}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-sm font-bold ${statusStyle(relation.status)}`}>{relation.status || "New"}</span>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <InfoBlock title="Notatka projektowa" value={relation.notes} />
                    <InfoBlock title="Podsumowanie rozmowy" value={relation.interview_summary} />
                    <InfoBlock title="Notatki rekrutera" value={relation.recruiter_notes} />
                  </div>
                </div>
              )) : <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-slate-400">Brak projektów</div>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  const InfoBlock = ({ title, value }) => (
    <div className="rounded-xl bg-white p-3">
      <div className="text-xs font-black uppercase text-slate-400">{title}</div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{value || "Brak"}</p>
    </div>
  );

  const AddCandidateView = () => (
    <section className="rounded-3xl bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black">{editingId ? "Edytuj kandydata" : "Dodaj kandydata"}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <input className="rounded-xl border p-3" placeholder="Imię i nazwisko" value={candidateForm.name} onChange={(event) => updateCandidateForm("name", event.target.value)} />
        <select className="rounded-xl border p-3" value={candidateForm.status} onChange={(event) => updateCandidateForm("status", event.target.value)}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
        <input className="rounded-xl border p-3" placeholder="Email" value={candidateForm.email} onChange={(event) => updateCandidateForm("email", event.target.value)} />
        <input className="rounded-xl border p-3" placeholder="Telefon" value={candidateForm.telefon} onChange={(event) => updateCandidateForm("telefon", event.target.value)} />
        <input className="rounded-xl border p-3" placeholder="LinkedIn" value={candidateForm.linkedin} onChange={(event) => updateCandidateForm("linkedin", event.target.value)} />
        <input className="rounded-xl border p-3" placeholder="Lokalizacja" value={candidateForm.lokalizacja} onChange={(event) => updateCandidateForm("lokalizacja", event.target.value)} />
        <input className="rounded-xl border p-3" placeholder="Doświadczenie" value={candidateForm.doświadczenie} onChange={(event) => updateCandidateForm("doświadczenie", event.target.value)} />
        <input className="rounded-xl border p-3" placeholder="Język programowania" value={candidateForm.jezyk_programowania} onChange={(event) => updateCandidateForm("jezyk_programowania", event.target.value)} />
        <input className="rounded-xl border p-3" placeholder="Framework" value={candidateForm.framework} onChange={(event) => updateCandidateForm("framework", event.target.value)} />
        <input className="rounded-xl border p-3" placeholder="Obszar" value={candidateForm.obszar} onChange={(event) => updateCandidateForm("obszar", event.target.value)} />
        <input className="rounded-xl border p-3" placeholder="Tagi" value={candidateForm.tagi} onChange={(event) => updateCandidateForm("tagi", event.target.value)} />
        <input className="rounded-xl border p-3" placeholder="CV URL / ścieżka" value={candidateForm.cv_url} onChange={(event) => updateCandidateForm("cv_url", event.target.value)} />
        <textarea className="min-h-28 rounded-xl border p-3 lg:col-span-3" placeholder="Notatki" value={candidateForm.notatki} onChange={(event) => updateCandidateForm("notatki", event.target.value)} />
      </div>
      {!editingId && <div className="mt-4 flex flex-wrap gap-2">{projects.map((project) => {
        const selected = formProjectIds.includes(project.id);
        return <button key={project.id} type="button" onClick={() => setFormProjectIds((prev) => selected ? prev.filter((id) => id !== project.id) : [...prev, project.id])} className={`rounded-full border px-3 py-1 text-sm font-bold ${selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>{projectName(project)}</button>;
      })}</div>}
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
          <div className="mt-4 grid gap-2">{projectCandidates.map((candidate) => <div key={candidate.id} className="rounded-2xl border bg-slate-50 p-3"><div className="font-bold">{candidate.name}</div><div className="text-sm text-slate-500">{candidate.email || candidate.telefon || "Brak kontaktu"}</div></div>)}</div>
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
    return <div className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8"><div className="mx-auto max-w-6xl"><header className="mb-8 rounded-3xl bg-white p-6 shadow-sm"><h1 className="text-3xl font-black">Mini ATS kandydatów</h1><p className="mt-2 text-slate-500">Shortlista kandydatów - {clientProjectName}</p></header><CandidatesView /></div>{enlargedCandidate && <CandidateModal candidate={enlargedCandidate} />}</div>;
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
      {enlargedCandidate && <CandidateModal candidate={enlargedCandidate} />}
    </div>
  );
}
