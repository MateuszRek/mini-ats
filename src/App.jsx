// MINI ATS — SUPABASE ONLINE

import React, { useMemo, useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cocydftwrdshqwvauodb.supabase.co";
const supabaseKey = "sb_publishable_un7LVevS6WPsvuhl2KBPVg_d_wjK9KD";
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
  const [newProjectClientId, setNewProjectClientId] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientNote, setNewClientNote] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("");
  const [globalStatusFilter, setGlobalStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [kanbanProjectId, setKanbanProjectId] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [frameworkFilter, setFrameworkFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [clientStatusFilter, setClientStatusFilter] = useState("");
  const [clientRatingFilter, setClientRatingFilter] = useState("");
  const [expandedCandidateId, setExpandedCandidateId] = useState(null);
  const [session, setSession] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [parsingCv, setParsingCv] = useState(false);
  const [parsingLinkedin, setParsingLinkedin] = useState(false);
  const [draggedKanbanItem, setDraggedKanbanItem] = useState(null);
  const cvInputRef = useRef(null);

  const [suggestions, setSuggestions] = useState({ languages: [], frameworks: [] });

  const clientProjectName = useMemo(() => {
    if (!clientProjectId) return "wybrany projekt";
    const project = projects.find((p) => p.id === clientProjectId);
    return project?.name || project?.nazwa || "wybrany projekt";
  }, [projects, clientProjectId]);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const parseCv = async () => {
    if (!form.cv_file) {
      setMessage("Najpierw wybierz plik CV / zdjęcie CV");
      return;
    }

    setParsingCv(true);
    setMessage("AI przepisuje dane z CV...");

    const body = new FormData();
    body.append("file", form.cv_file);
    body.append("source", "cv");

    try {
      const res = await fetch("/api/parse-cv", { method: "POST", body });
      const result = await res.json();

      if (!res.ok) {
        setMessage("Błąd AI: " + (result.error || "nieznany błąd"));
        return;
      }

      setForm((prev) => ({
        ...prev,
        name: result.name || prev.name,
        email: result.email || prev.email,
        telefon: result.telefon || prev.telefon,
        linkedin: result.linkedin || prev.linkedin,
        lokalizacja: result.lokalizacja || prev.lokalizacja,
        doświadczenie: result.doświadczenie || prev.doświadczenie,
        jezyk_programowania: result.jezyk_programowania || prev.jezyk_programowania,
        framework: result.framework || prev.framework,
        obszar: result.obszar || prev.obszar,
        tagi: result.tagi || prev.tagi,
        notatki: result.notatki || prev.notatki,
      }));

      setMessage("Dane z CV uzupełnione ✅ Sprawdź je przed zapisem.");
    } catch (error) {
      setMessage("Błąd połączenia z AI: " + error.message);
    } finally {
      setParsingCv(false);
    }
  };

  const parseLinkedin = async () => {
    if (!form.linkedin_text.trim() && !form.linkedin.trim()) {
      setMessage("Wklej link LinkedIn albo tekst z profilu LinkedIn");
      return;
    }

    setParsingLinkedin(true);
    setMessage("AI przepisuje dane z LinkedIn...");

    try {
      const res = await fetch("/api/parse-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "linkedin",
          linkedinUrl: form.linkedin,
          linkedinText: form.linkedin_text,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setMessage("Błąd AI LinkedIn: " + (result.error || "nieznany błąd"));
        return;
      }

      setForm((prev) => ({
        ...prev,
        name: result.name || prev.name,
        email: result.email || prev.email,
        telefon: result.telefon || prev.telefon,
        linkedin: result.linkedin || prev.linkedin,
        lokalizacja: result.lokalizacja || prev.lokalizacja,
        doświadczenie: result.doświadczenie || prev.doświadczenie,
        jezyk_programowania: result.jezyk_programowania || prev.jezyk_programowania,
        framework: result.framework || prev.framework,
        obszar: result.obszar || prev.obszar,
        tagi: result.tagi || prev.tagi,
        notatki: result.notatki || prev.notatki,
      }));

      setMessage("Dane z LinkedIn uzupełnione ✅ Sprawdź je przed zapisem.");
    } catch (error) {
      setMessage("Błąd połączenia z AI LinkedIn: " + error.message);
    } finally {
      setParsingLinkedin(false);
    }
  };

  const login = async () => {
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });

    if (error) {
      setMessage("Błąd logowania: " + error.message);
      return;
    }

    setLoginPassword("");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCandidates([]);
    setProjects([]);
    setClients([]);
    setMessage("Wylogowano");
  };

  const fetchClients = async () => {
    const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    if (error) {
      setClients([]);
      return;
    }
    setClients(data || []);
  };

  const fetchProjects = async () => {
    const { data } = await supabase.from("Projekty").select("*").order("created_at", { ascending: false });
    setProjects(data || []);
  };

  const fetchCandidates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("candidates")
      .select(`
        *,
        candidate_projects (
          id,
          project_id,
          status,
          notes,
          Projekty (*)
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Błąd pobierania danych: " + error.message);
    } else {
      setCandidates(data || []);
    }

    setLoading(false);
  };

  const refreshAll = () => {
    fetchCandidates();
    fetchProjects();
    fetchClients();
  };

  const addClient = async () => {
    if (!newClientName.trim()) {
      setMessage("Podaj nazwę klienta");
      return;
    }

    const { error } = await supabase.from("clients").insert([{ name: newClientName.trim(), note: newClientNote.trim() }]);

    if (error) {
      setMessage("Błąd dodawania klienta. Sprawdź, czy masz tabelę clients z kolumnami: id, name, note, created_at. " + error.message);
      return;
    }

    setNewClientName("");
    setNewClientNote("");
    setMessage("Klient dodany ✅");
    fetchClients();
  };

  const addProject = async () => {
    if (!newProjectName.trim()) {
      setMessage("Podaj nazwę projektu");
      return;
    }

    const payload = { name: newProjectName.trim() };
    if (newProjectClientId) payload.client_id = newProjectClientId;

    const { error } = await supabase.from("Projekty").insert([payload]);

    if (error) {
      setMessage("Błąd dodawania projektu: " + error.message);
      return;
    }

    setNewProjectName("");
    setNewProjectClientId("");
    setMessage("Projekt dodany ✅");
    fetchProjects();
  };

  const assignProject = async (candidateId) => {
    const projectId = selectedProjects[candidateId];

    if (!projectId) {
      setMessage("Najpierw wybierz projekt z listy");
      return;
    }

    const alreadyAssigned = candidates
      .find((c) => c.id === candidateId)
      ?.candidate_projects?.some((cp) => cp.project_id === projectId);

    if (alreadyAssigned) {
      setMessage("Ten projekt jest już przypisany do tego kandydata");
      return;
    }

    const { error } = await supabase.from("candidate_projects").insert([
      { candidate_id: candidateId, project_id: projectId, status: "New" },
    ]);

    if (error) {
      setMessage("Błąd przypisania projektu: " + error.message);
      return;
    }

    setSelectedProjects((prev) => ({ ...prev, [candidateId]: "" }));
    setMessage("Projekt przypisany ✅");
    fetchCandidates();
  };

  const removeCandidateFromProject = async (relationId) => {
    const { error } = await supabase.from("candidate_projects").delete().eq("id", relationId);

    if (error) {
      setMessage("Błąd usuwania projektu z kandydata: " + error.message);
      return;
    }

    setMessage("Projekt usunięty z kandydata ✅");
    fetchCandidates();
  };

  const updateProjectStatus = async (relationId, newStatus) => {
    const { error } = await supabase.from("candidate_projects").update({ status: newStatus }).eq("id", relationId);

    if (error) {
      setMessage("Błąd zmiany statusu projektu: " + error.message);
      return;
    }

    setMessage("Status w projekcie zmieniony ✅");
    fetchCandidates();
  };

  const handleKanbanDrop = async (newStatus, event) => {
    if (event) event.preventDefault();

    let item = draggedKanbanItem;

    if (!item && event?.dataTransfer) {
      try {
        const raw = event.dataTransfer.getData("application/json");
        if (raw) item = JSON.parse(raw);
      } catch (_error) {
        item = null;
      }
    }

    if (!item?.relationId) return;

    const relationId = item.relationId;
    const oldStatus = item.status || "New";

    setDraggedKanbanItem(null);

    if (oldStatus === newStatus) return;

    setCandidates((prev) =>
      prev.map((candidate) => ({
        ...candidate,
        candidate_projects: candidate.candidate_projects?.map((cp) =>
          cp.id === relationId ? { ...cp, status: newStatus } : cp
        ),
      }))
    );

    const { error } = await supabase.from("candidate_projects").update({ status: newStatus }).eq("id", relationId);

    if (error) {
      setMessage("Błąd przenoszenia kandydata: " + error.message);
      fetchCandidates();
      return;
    }

    setMessage(`Kandydat przeniesiony do: ${newStatus} ✅`);
    fetchCandidates();
  };

  const updateProjectNotes = async (relationId, notes) => {
    const { error } = await supabase.from("candidate_projects").update({ notes }).eq("id", relationId);

    if (error) {
      setMessage("Błąd zapisu notatek: " + error.message);
      return;
    }

    setMessage("Notatka zapisana ✅");
    fetchCandidates();
  };

  const openCv = async (cvPath) => {
    if (!cvPath) return;

    if (String(cvPath).startsWith("http")) {
      window.open(cvPath, "_blank", "noopener,noreferrer");
      return;
    }

    const { data, error } = await supabase.storage.from("CV").createSignedUrl(cvPath, 60);

    if (error) {
      setMessage("Nie udało się otworzyć CV: " + error.message);
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("client") === "true") {
      setClientView(true);
      setClientProjectId(params.get("project") || "");
      setAuthLoading(false);
      return;
    }

    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setAuthLoading(false);
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session && !clientView) return;
    refreshAll();
  }, [session, clientView]);

  useEffect(() => {
    const langs = new Set();
    const frameworks = new Set();

    candidates.forEach((c) => {
      if (c.jezyk_programowania) langs.add(c.jezyk_programowania);
      if (c.framework) frameworks.add(c.framework);
    });

    setSuggestions({
      languages: Array.from(new Set([...DEFAULT_LANGUAGES, ...langs])).sort(),
      frameworks: Array.from(new Set([...DEFAULT_FRAMEWORKS, ...frameworks])).sort(),
    });
  }, [candidates]);

  const addCandidate = async () => {
    if (!form.name.trim()) {
      setMessage("Podaj imię i nazwisko kandydata");
      return;
    }

    let cvUrl = form.cv_url;

    if (form.cv_file) {
      const safeFileName = form.cv_file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileName = `cv/${Date.now()}_${safeFileName}`;

      const { error: uploadError } = await supabase.storage.from("CV").upload(fileName, form.cv_file);

      if (uploadError) {
        setMessage("Błąd uploadu CV: " + uploadError.message);
        return;
      }

      cvUrl = fileName;
    }

    const payload = {
      name: form.name.trim(),
      status: form.status,
      email: form.email.trim(),
      telefon: form.telefon.trim(),
      linkedin: form.linkedin.trim(),
      lokalizacja: form.lokalizacja.trim(),
      doświadczenie: form.doświadczenie.trim(),
      notatki: form.notatki.trim(),
      tagi: form.tagi.trim(),
      jezyk_programowania: form.jezyk_programowania.trim(),
      framework: form.framework.trim(),
      obszar: form.obszar,
      rating: form.rating || 0,
      favorite: form.favorite || false,
      cv_url: cvUrl,
    };

    let insertedId = null;

    if (editingId) {
      const { error } = await supabase.from("candidates").update(payload).eq("id", editingId);

      if (error) {
        setMessage("Nie udało się zapisać zmian: " + error.message);
        return;
      }

      insertedId = editingId;
    } else {
      const { data, error } = await supabase.from("candidates").insert([payload]).select().single();

      if (error) {
        setMessage("Nie udało się dodać: " + error.message);
        return;
      }

      insertedId = data.id;

      if (formProjects.length > 0) {
        const relations = formProjects.map((projectId) => ({ candidate_id: insertedId, project_id: projectId, status: "New" }));
        const { error: relError } = await supabase.from("candidate_projects").insert(relations);

        if (relError) {
          setMessage("Kandydat dodany, ale błąd projektów: " + relError.message);
        }
      }
    }

    setForm(emptyCandidate);
    if (cvInputRef.current) cvInputRef.current.value = "";
    setFormProjects([]);
    setEditingId(null);
    setMessage(editingId ? "Kandydat zaktualizowany ✅" : "Kandydat dodany ✅");
    fetchCandidates();
    setActiveTab("candidates");
  };

  const startEditCandidate = (candidate) => {
    setEditingId(candidate.id);
    setForm({
      name: candidate.name || "",
      status: candidate.status || "New",
      email: candidate.email || "",
      telefon: candidate.telefon || "",
      linkedin: candidate.linkedin || "",
      linkedin_text: "",
      lokalizacja: candidate.lokalizacja || "",
      doświadczenie: candidate.doświadczenie || "",
      notatki: candidate.notatki || "",
      tagi: candidate.tagi || "",
      jezyk_programowania: candidate.jezyk_programowania || "",
      framework: candidate.framework || "",
      obszar: candidate.obszar || "",
      rating: candidate.rating || 0,
      favorite: candidate.favorite || false,
      cv_file: null,
      cv_url: candidate.cv_url || "",
    });
    setMessage("Edytujesz kandydata: " + (candidate.name || "bez nazwy"));
    setActiveTab("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEditCandidate = () => {
    setEditingId(null);
    setForm(emptyCandidate);
    if (cvInputRef.current) cvInputRef.current.value = "";
    setMessage("Edycja anulowana");
  };

  const deleteCandidate = async (id) => {
    if (!confirm("Czy na pewno chcesz usunąć tego kandydata?")) return;

    const { error: relationsError } = await supabase.from("candidate_projects").delete().eq("candidate_id", id);

    if (relationsError) {
      setMessage("Nie udało się usunąć przypisań projektu: " + relationsError.message);
      return;
    }

    const { error } = await supabase.from("candidates").delete().eq("id", id);

    if (error) {
      setMessage("Nie udało się usunąć kandydata: " + error.message);
      return;
    }

    setMessage("Kandydat usunięty ✅");
    fetchCandidates();
  };

  const toggleFavorite = async (candidate) => {
    const newValue = !candidate.favorite;

    setCandidates((prev) => prev.map((c) => (c.id === candidate.id ? { ...c, favorite: newValue } : c)));

    const { error } = await supabase.from("candidates").update({ favorite: newValue }).eq("id", candidate.id).select();

    if (error) {
      setMessage("Błąd zmiany shortlisty: " + error.message);
      fetchCandidates();
      return;
    }

    setMessage(newValue ? "Dodano do shortlisty ⭐" : "Usunięto ze shortlisty");
    fetchCandidates();
  };

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase.from("candidates").update({ status: newStatus }).eq("id", id).select();

    if (error) {
      setMessage("Nie udało się zmienić statusu: " + error.message);
      return;
    }

    fetchCandidates();
  };

  const filtered = useMemo(() => {
    const result = candidates.filter((c) => {
      const text = [
        c.name,
        c.status,
        c.email,
        c.telefon,
        c.linkedin,
        c.lokalizacja,
        c.doświadczenie,
        c.notatki,
        c.tagi,
        c.jezyk_programowania,
        c.framework,
        c.obszar,
        ...(c.candidate_projects || []).map((cp) => [cp.status, cp.notes, cp.Projekty?.name, cp.Projekty?.nazwa].join(" ")),
      ].join(" ");

      const matchesQuery = !query || includesIgnoreCase(text, query);
      const matchesGlobalStatus = !globalStatusFilter || c.status === globalStatusFilter;
      const activeProjectFilter = clientView ? clientProjectId : projectFilter;
      const matchesProject = !activeProjectFilter || c.candidate_projects?.some((cp) => cp.project_id === activeProjectFilter);
      const matchesProjectStatus = !projectStatusFilter || c.candidate_projects?.some((cp) => cp.status === projectStatusFilter);
      const matchesTags = !tagFilter || includesIgnoreCase(c.tagi, tagFilter);
      const matchesLanguage = !languageFilter || includesIgnoreCase(c.jezyk_programowania, languageFilter);
      const matchesFramework = !frameworkFilter || includesIgnoreCase(c.framework, frameworkFilter);
      const matchesArea = !areaFilter || c.obszar === areaFilter;
      const matchesFavorite = !onlyFavorites || c.favorite;
      const matchesClientStatus = !clientView || !clientStatusFilter || c.candidate_projects?.some((cp) => cp.project_id === clientProjectId && cp.status === clientStatusFilter);
      const matchesClientRating = !clientView || !clientRatingFilter || (Number(c.rating) || 0) >= Number(clientRatingFilter);

      return matchesQuery && matchesGlobalStatus && matchesProject && matchesProjectStatus && matchesTags && matchesLanguage && matchesFramework && matchesArea && matchesFavorite && matchesClientStatus && matchesClientRating;
    });

    return result.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (sortBy === "oldest") return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      if (sortBy === "rating_desc") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "rating_asc") return (a.rating || 0) - (b.rating || 0);
      if (sortBy === "name_asc") return String(a.name || "").localeCompare(String(b.name || ""), "pl");
      if (sortBy === "name_desc") return String(b.name || "").localeCompare(String(a.name || ""), "pl");
      if (sortBy === "experience_desc") return (parseFloat(b.doświadczenie) || 0) - (parseFloat(a.doświadczenie) || 0);
      if (sortBy === "experience_asc") return (parseFloat(a.doświadczenie) || 0) - (parseFloat(b.doświadczenie) || 0);
      return 0;
    });
  }, [candidates, query, globalStatusFilter, projectFilter, projectStatusFilter, tagFilter, languageFilter, frameworkFilter, areaFilter, sortBy, onlyFavorites, clientView, clientProjectId, clientStatusFilter, clientRatingFilter]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => includesIgnoreCase(`${p.name || ""} ${p.nazwa || ""}`, projectSearch));
  }, [projects, projectSearch]);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => includesIgnoreCase(`${c.name || ""} ${c.note || ""}`, clientSearch));
  }, [clients, clientSearch]);

  const getProjectName = (project) => project?.name || project?.nazwa || "Projekt bez nazwy";
  const getClientName = (clientId) => clients.find((c) => c.id === clientId)?.name || "Bez klienta";

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900">
        <div className="rounded-3xl bg-white p-8 shadow-sm">Ładowanie...</div>
      </div>
    );
  }

  if (!session && !clientView) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-black tracking-tight">Mini ATS</h1>
          <p className="mt-2 text-slate-500">Zaloguj się, żeby zobaczyć bazę kandydatów.</p>

          <div className="mt-6 grid gap-3">
            <input className="rounded-xl border p-3" placeholder="Email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
            <input
              className="rounded-xl border p-3"
              placeholder="Hasło"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") login();
              }}
            />
            <button onClick={login} className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800">
              Zaloguj
            </button>
          </div>

          {message && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
        </div>
      </div>
    );
  }

  const CandidateCard = ({ candidate }) => (
    <div
      key={candidate.id}
      onClick={() => clientView && setExpandedCandidateId((prev) => (prev === candidate.id ? null : candidate.id))}
      className={`group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${clientView ? "cursor-pointer" : ""}`}
    >
      <div className={`h-2 bg-gradient-to-r ${getAccentStyle(candidate.status || "New")}`} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          {!clientView && (
            <button onClick={() => toggleFavorite(candidate)} className={`text-2xl ${candidate.favorite ? "text-yellow-400" : "text-slate-300 hover:text-yellow-400"}`} title="Dodaj do shortlisty">
              ★
            </button>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm ${getAccentStyle(candidate.status || "New")}`}>👤</div>
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-900">{candidate.name}</h3>
                {clientView && (
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-bold text-yellow-500">{candidate.rating > 0 ? "★".repeat(candidate.rating) : "Brak oceny"}</span>
                    {candidate.obszar && <span className="text-slate-500">• {candidate.obszar}</span>}
                  </div>
                )}
                {!clientView && <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-slate-400">Dodany: {candidate.created_at ? new Date(candidate.created_at).toLocaleString("pl-PL") : "brak daty"}</p>}
              </div>
            </div>
          </div>

          {!clientView && (
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-bold shadow-sm ${getStatusStyle(candidate.status || "New")}`}>
              <span className="h-2 w-2 rounded-full bg-current" />
              {candidate.status || "New"}
            </span>
          )}
        </div>

        {clientView && (
          <div className="mt-4 rounded-2xl bg-slate-50/80 p-4 text-sm text-slate-700">
            <div className="flex flex-wrap gap-2">
              {candidate.jezyk_programowania && <span className="rounded-full bg-blue-50 px-3 py-1 font-bold text-blue-700">{candidate.jezyk_programowania}</span>}
              {candidate.framework && <span className="rounded-full bg-violet-50 px-3 py-1 font-bold text-violet-700">{candidate.framework}</span>}
              {candidate.lokalizacja && <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-600">{candidate.lokalizacja}</span>}
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-400">{expandedCandidateId === candidate.id ? "Kliknij kartę, żeby ukryć szczegóły" : "Kliknij kartę, żeby zobaczyć więcej informacji"}</p>
          </div>
        )}

        {(!clientView || expandedCandidateId === candidate.id) && (
          <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50/80 p-4 text-sm text-slate-700">
            {candidate.email && <p><b>Email:</b> {candidate.email}</p>}
            {candidate.telefon && <p><b>Telefon:</b> {candidate.telefon}</p>}
            {candidate.linkedin && <p><b>LinkedIn:</b> <a className="font-semibold text-blue-600 hover:underline" href={candidate.linkedin} target="_blank" rel="noreferrer">Otwórz profil</a></p>}
            {candidate.lokalizacja && <p><b>Lokalizacja:</b> {candidate.lokalizacja}</p>}
            {candidate.doświadczenie && <p><b>Doświadczenie:</b> {candidate.doświadczenie}</p>}
            {candidate.obszar && <p><b>Obszar:</b> {candidate.obszar}</p>}
            {candidate.rating > 0 && <p><b>Ocena:</b> {"★".repeat(candidate.rating)}</p>}
            {candidate.jezyk_programowania && <p><b>Język programowania:</b> {candidate.jezyk_programowania}</p>}
            {candidate.framework && <p><b>Framework:</b> {candidate.framework}</p>}
            {candidate.tagi && (
              <div className="flex flex-wrap gap-2">
                {candidate.tagi.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                  <button key={tag} onClick={() => !clientView && setTagFilter(tag)} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700" title={clientView ? "Tag" : "Filtruj po tagu"}>#{tag}</button>
                ))}
              </div>
            )}
            {!clientView && candidate.notatki && <p className="rounded-2xl bg-white p-3 shadow-sm"><b>Notatki:</b> {candidate.notatki}</p>}
            {candidate.cv_url && (
              <p>
                <b>CV:</b>{" "}
                <button type="button" onClick={(e) => { e.stopPropagation(); openCv(candidate.cv_url); }} className="font-semibold text-blue-600 hover:underline">
                  Otwórz CV
                </button>
              </p>
            )}
          </div>
        )}

        {!clientView && (
          <>
            <div className="mt-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Status procesu</label>
              <select className={`w-full rounded-2xl border p-3 font-semibold shadow-sm ${getStatusStyle(candidate.status || "New")}`} value={candidate.status || "New"} onChange={(e) => updateStatus(candidate.id, e.target.value)}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <label className="mb-2 block text-sm font-bold text-slate-800">Projekty kandydata</label>

              <div className="mb-3 grid gap-2">
                {candidate.candidate_projects?.length ? (
                  candidate.candidate_projects.map((cp) => (
                    <div key={cp.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <button onClick={() => { setProjectFilter(cp.project_id); setActiveTab("candidates"); }} className="font-bold text-slate-800 hover:text-blue-700 hover:underline" title="Filtruj po tym projekcie">
                          {cp.Projekty?.name || cp.Projekty?.nazwa || "Projekt bez nazwy"}
                        </button>
                        <button onClick={() => removeCandidateFromProject(cp.id)} className="rounded-full px-2 text-lg font-black text-slate-400 hover:bg-red-50 hover:text-red-600" title="Usuń projekt z kandydata">×</button>
                      </div>

                      <select className={`w-full rounded-xl border p-2 text-sm font-semibold ${getStatusStyle(cp.status || "New")}`} value={cp.status || "New"} onChange={(e) => updateProjectStatus(cp.id, e.target.value)}>
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>

                      <textarea className="mt-2 w-full rounded-xl border p-2 text-sm" placeholder="Notatki do tego projektu..." defaultValue={cp.notes || ""} onBlur={(e) => updateProjectNotes(cp.id, e.target.value)} />
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-slate-400">Brak przypisanego projektu</span>
                )}
              </div>

              <div className="flex gap-2">
                <select className="w-full rounded-xl border p-2" value={selectedProjects[candidate.id] || ""} onChange={(e) => setSelectedProjects((prev) => ({ ...prev, [candidate.id]: e.target.value }))}>
                  <option value="">Wybierz projekt</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{getProjectName(p)}</option>)}
                </select>
                <button onClick={() => assignProject(candidate.id)} className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700">Przypisz</button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <button onClick={() => startEditCandidate(candidate)} className="flex items-center gap-2 rounded-2xl border bg-white px-4 py-2 text-sm font-bold shadow-sm hover:bg-slate-50"><Icon>✎</Icon> Edytuj</button>
                <button onClick={() => deleteCandidate(candidate.id)} className="flex items-center gap-2 rounded-2xl border bg-white px-4 py-2 text-sm font-bold text-red-600 shadow-sm hover:bg-red-50"><Icon>🗑</Icon> Usuń</button>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-400">ID: {candidate.id?.slice(0, 6)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const AddCandidateView = () => (
    <section className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-lg font-bold"><Icon>{editingId ? "✎" : "＋"}</Icon> {editingId ? "Edytuj kandydata" : "Dodaj kandydata"}</div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <input className="rounded-xl border p-3" placeholder="Imię i nazwisko" value={form.name} onChange={(e) => setField("name", e.target.value)} />
        <select className="rounded-xl border p-3" value={form.status} onChange={(e) => setField("status", e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        <input className="rounded-xl border p-3" placeholder="Email" value={form.email} onChange={(e) => setField("email", e.target.value)} />
        <input className="rounded-xl border p-3" placeholder="Telefon" value={form.telefon} onChange={(e) => setField("telefon", e.target.value)} />
        <input className="rounded-xl border p-3" placeholder="LinkedIn URL" value={form.linkedin} onChange={(e) => setField("linkedin", e.target.value)} />
        <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="mb-2 block text-sm font-bold text-slate-800">LinkedIn — tekst profilu / About / Experience</label>
          <textarea
            className="min-h-28 w-full rounded-xl border p-3"
            placeholder="Wklej tutaj tekst skopiowany z profilu LinkedIn, np. nagłówek, About, Experience, Skills..."
            value={form.linkedin_text}
            onChange={(e) => setField("linkedin_text", e.target.value)}
          />
          <button
            type="button"
            onClick={parseLinkedin}
            disabled={parsingLinkedin || (!form.linkedin_text.trim() && !form.linkedin.trim())}
            className="mt-2 rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {parsingLinkedin ? "Przepisuję..." : "🤖 Przepisz z LinkedIn"}
          </button>
          <p className="mt-2 text-xs text-slate-500">AI uzupełni dane i doda do notatki krótką ocenę profilu kandydata.</p>
        </div>
        <input className="rounded-xl border p-3" placeholder="Lokalizacja / miasto" value={form.lokalizacja} onChange={(e) => setField("lokalizacja", e.target.value)} />
        <input className="rounded-xl border p-3" placeholder="Doświadczenie, np. 5 lat" value={form.doświadczenie} onChange={(e) => setField("doświadczenie", e.target.value)} />
        <input className="rounded-xl border p-3" placeholder="Język programowania, np. Java, Python" value={form.jezyk_programowania} onChange={(e) => setField("jezyk_programowania", e.target.value)} list="language-suggestions" />
        <datalist id="language-suggestions">{suggestions.languages.map((l) => <option key={l} value={l} />)}</datalist>
        <input className="rounded-xl border p-3" placeholder="Framework, np. React, Spring, Django" value={form.framework} onChange={(e) => setField("framework", e.target.value)} list="framework-suggestions" />
        <datalist id="framework-suggestions">{suggestions.frameworks.map((f) => <option key={f} value={f} />)}</datalist>
        <select className="rounded-xl border p-3" value={form.obszar} onChange={(e) => setField("obszar", e.target.value)}>
          <option value="">Obszar: wybierz</option>
          <option value="Frontend">Frontend</option>
          <option value="Backend">Backend</option>
          <option value="Fullstack">Fullstack</option>
          <option value="DevOps / SRE">DevOps / SRE</option>
          <option value="Data">Data</option>
          <option value="Mobile">Mobile</option>
          <option value="QA">QA</option>
          <option value="Product / PO">Product / PO</option>
          <option value="Sales / Nieruchomości">Sales / Nieruchomości</option>
          <option value="Inne">Inne</option>
        </select>
        <input className="rounded-xl border p-3 lg:col-span-3" placeholder="Tagi, np. Senior, Remote, Warsaw" value={form.tagi} onChange={(e) => setField("tagi", e.target.value)} />
        <textarea className="min-h-24 rounded-xl border p-3 lg:col-span-2" placeholder="Notatki" value={form.notatki} onChange={(e) => setField("notatki", e.target.value)} />

        <div className="lg:col-span-3">
          <label className="mb-1 block text-sm font-semibold">CV / zdjęcie CV</label>
          <input ref={cvInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setField("cv_file", e.target.files?.[0] || null)} className="hidden" />
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <button type="button" onClick={() => cvInputRef.current?.click()} className="rounded-xl border bg-white px-4 py-3 font-bold text-slate-800 hover:bg-slate-50">📎 Wybierz CV / zdjęcie</button>
            <span className="text-sm font-semibold text-slate-500">{form.cv_file ? form.cv_file.name : form.cv_url ? "CV już zapisane" : "Nie wybrano pliku"}</span>
          </div>
          <button type="button" onClick={parseCv} disabled={parsingCv || !form.cv_file} className="mt-2 rounded-xl bg-purple-600 px-4 py-2 font-bold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-slate-300">
            {parsingCv ? "Przepisuję..." : "🤖 Przepisz dane z CV"}
          </button>
        </div>

        <div className="lg:col-span-3">
          <label className="mb-1 block text-sm font-semibold">Dodaj do projektów</label>
          <div className="flex flex-wrap gap-2">
            {projects.map((p) => {
              const selected = formProjects.includes(p.id);
              return (
                <button key={p.id} type="button" onClick={() => setFormProjects((prev) => selected ? prev.filter((id) => id !== p.id) : [...prev, p.id])} className={`rounded-full border px-3 py-1 text-sm font-bold ${selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                  {getProjectName(p)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Ocena:</span>
          {[1, 2, 3, 4, 5].map((r) => <button key={r} type="button" onClick={() => setField("rating", r)} className={`text-lg ${form.rating >= r ? "text-yellow-500" : "text-slate-300"}`}>★</button>)}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 md:flex-row">
        <button onClick={addCandidate} className="w-full rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800 md:w-auto">{editingId ? "Zapisz zmiany" : "Dodaj kandydata"}</button>
        {editingId && <button onClick={cancelEditCandidate} className="w-full rounded-xl border px-5 py-3 font-semibold hover:bg-slate-50 md:w-auto">Anuluj edycję</button>}
      </div>
    </section>
  );

  const CandidatesView = () => (
    <>
      <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-lg font-bold"><Icon>🔎</Icon> Kandydaci</div>
        <div className="grid gap-3 md:grid-cols-4">
          <input className="rounded-xl border p-3 md:col-span-2" placeholder="Szukaj po nazwisku, statusie, emailu, telefonie, lokalizacji..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="rounded-xl border p-3" value={globalStatusFilter} onChange={(e) => setGlobalStatusFilter(e.target.value)}>
            <option value="">Status: wszystkie</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className="rounded-xl border p-3" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
            <option value="">Projekt: wszystkie</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{getProjectName(p)}</option>)}
          </select>
          <select className="rounded-xl border p-3" value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)}>
            <option value="">Język: wszystkie</option>
            {suggestions.languages.map((l) => <option key={l}>{l}</option>)}
          </select>
          <select className="rounded-xl border p-3" value={frameworkFilter} onChange={(e) => setFrameworkFilter(e.target.value)}>
            <option value="">Framework: wszystkie</option>
            {suggestions.frameworks.map((f) => <option key={f}>{f}</option>)}
          </select>
          <select className="rounded-xl border p-3" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Najnowsi pierwsi</option>
            <option value="oldest">Najstarsi pierwsi</option>
            <option value="rating_desc">Najwyższa ocena</option>
            <option value="rating_asc">Najniższa ocena</option>
            <option value="experience_desc">Największe doświadczenie</option>
            <option value="experience_asc">Najmniejsze doświadczenie</option>
            <option value="name_asc">Imię/Nazwisko A-Z</option>
            <option value="name_desc">Imię/Nazwisko Z-A</option>
          </select>
          <button onClick={() => { setQuery(""); setGlobalStatusFilter(""); setProjectFilter(""); setProjectStatusFilter(""); setTagFilter(""); setLanguageFilter(""); setFrameworkFilter(""); setAreaFilter(""); setSortBy("newest"); }} className="rounded-xl border px-4 py-3 font-semibold hover:bg-slate-50">Wyczyść filtry</button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={onlyFavorites} onChange={(e) => setOnlyFavorites(e.target.checked)} /> Tylko shortlista ⭐</label>
          <p className="text-sm text-slate-500">Znaleziono: <b>{filtered.length}</b> kandydatów</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode("list")} className={`rounded-xl border px-3 py-2 text-sm font-bold ${viewMode === "list" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}>Lista</button>
            <button onClick={() => setViewMode("kanban")} className={`rounded-xl border px-3 py-2 text-sm font-bold ${viewMode === "kanban" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}>Kanban</button>
          </div>
        </div>
      </section>

      {loading && <div className="rounded-3xl bg-white p-6 text-center shadow-sm">Ładowanie...</div>}
      {!loading && filtered.length === 0 && <div className="rounded-3xl bg-white p-10 text-center shadow-sm"><p className="text-lg font-semibold">Brak kandydatów.</p></div>}

      {viewMode === "kanban" && !loading && filtered.length > 0 && (
        <div className="mb-4">
          <select className="rounded-xl border p-3" value={kanbanProjectId} onChange={(e) => setKanbanProjectId(e.target.value)}>
            <option value="">Wybierz projekt do Kanban</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{getProjectName(p)}</option>)}
          </select>
        </div>
      )}

      {viewMode === "kanban" && !loading && filtered.length > 0 && kanbanProjectId && (
        <section className="mb-6 rounded-3xl bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-900">Kanban projektu</h3>
              <p className="text-sm text-slate-500">Przeciągnij kandydata do innej kolumny, żeby zmienić status w projekcie.</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
              Drag & drop
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {STATUSES.map((status) => {
              const statusCandidates = filtered.flatMap((c) =>
                (c.candidate_projects || [])
                  .filter((cp) => cp.project_id === kanbanProjectId && (cp.status || "New") === status)
                  .map((cp) => ({ candidate: c, cp }))
              );

              const isDropTarget = draggedKanbanItem && draggedKanbanItem.status !== status;

              return (
                <div
                  key={status}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => handleKanbanDrop(status, e)}
                  className={`min-h-[480px] rounded-2xl border p-2 transition ${
                    isDropTarget ? "border-blue-300 bg-blue-50/60" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className={`mb-2 rounded-xl border px-2 py-2 text-xs font-black ${getStatusStyle(status)}`}>
                    {status} <span className="font-semibold opacity-70">({statusCandidates.length})</span>
                  </div>

                  <div className="grid gap-2">
                    {statusCandidates.map(({ candidate, cp }) => (
                      <div
                        key={cp.id}
                        draggable="true"
                        onDragStart={(e) => {
                          const item = { relationId: cp.id, status: cp.status || "New" };
                          setDraggedKanbanItem(item);
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("application/json", JSON.stringify(item));
                        }}
                        onDragEnd={() => setDraggedKanbanItem(null)}
                        className="cursor-move rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-black leading-tight text-slate-900" title={candidate.name}>{candidate.name}</div>
                            <div className="mt-1 truncate text-[11px] text-slate-500" title={candidate.email || candidate.telefon || candidate.lokalizacja || "Brak danych"}>
                              {candidate.email || candidate.telefon || candidate.lokalizacja || "Brak danych"}
                            </div>
                          </div>
                          <span className="shrink-0 text-slate-300">☰</span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1">
                          {candidate.jezyk_programowania && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">{candidate.jezyk_programowania}</span>}
                          {candidate.framework && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">{candidate.framework}</span>}
                          {candidate.rating > 0 && <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-[10px] font-bold text-yellow-700">{'★'.repeat(candidate.rating)}</span>}
                        </div>

                        {cp.notes && <div className="mt-2 line-clamp-2 rounded-lg bg-slate-50 p-1.5 text-[10px] text-slate-600">{cp.notes}</div>}

                        <select
                          className={`mt-2 w-full rounded-lg border p-1.5 text-[11px] font-bold ${getStatusStyle(cp.status || "New")}`}
                          value={cp.status || "New"}
                          onChange={(e) => updateProjectStatus(cp.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          draggable="false"
                        >
                          {STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    ))}

                    {statusCandidates.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-3 text-center text-[11px] font-semibold text-slate-400">
                        Upuść tutaj
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {viewMode === "kanban" && !loading && filtered.length > 0 && !kanbanProjectId && <div className="mb-6 rounded-3xl bg-white p-6 text-center text-slate-500 shadow-sm">Wybierz projekt, żeby zobaczyć Kanban.</div>}
      {viewMode === "list" && <main className="grid gap-4 lg:grid-cols-2">{filtered.map((candidate) => <CandidateCard key={candidate.id} candidate={candidate} />)}</main>}
    </>
  );

  const ProjectsView = () => (
    <>
      <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-lg font-bold">📁 Projekty</div>
        <div className="grid gap-3 md:grid-cols-4">
          <input className="rounded-xl border p-3 md:col-span-2" placeholder="Nazwa projektu" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} />
          <select className="rounded-xl border p-3" value={newProjectClientId} onChange={(e) => setNewProjectClientId(e.target.value)}>
            <option value="">Klient: brak</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={addProject} className="rounded-xl bg-green-600 px-4 py-2 font-bold text-white hover:bg-green-700">Dodaj projekt</button>
        </div>
        <input className="mt-4 w-full rounded-xl border p-3" placeholder="Szukaj projektu..." value={projectSearch} onChange={(e) => setProjectSearch(e.target.value)} />
      </section>

      <main className="grid gap-4 lg:grid-cols-2">
        {filteredProjects.map((p) => {
          const projectCandidates = candidates.filter((c) => c.candidate_projects?.some((cp) => cp.project_id === p.id));
          const clientName = getClientName(p.client_id);
          return (
            <div key={p.id} className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black">{getProjectName(p)}</h3>
                  <p className="mt-1 text-sm text-slate-500">Klient: <b>{clientName}</b></p>
                  <p className="mt-1 text-sm text-slate-500">Kandydaci: <b>{projectCandidates.length}</b></p>
                </div>
                <button type="button" onClick={() => { const link = `${window.location.origin}?client=true&project=${p.id}`; navigator.clipboard.writeText(link); setMessage(`Link klienta do projektu „${getProjectName(p)}” skopiowany 📎`); }} className="rounded-full bg-blue-600 px-3 py-1 text-sm font-bold text-white hover:bg-blue-700">Skopiuj link klienta</button>
              </div>

              <div className="mt-4 grid gap-2">
                {projectCandidates.length ? projectCandidates.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="font-bold">{c.name}</div>
                    <div className="text-sm text-slate-500">{c.email || c.telefon || "Brak kontaktu"}</div>
                  </div>
                )) : <div className="rounded-2xl border border-dashed p-4 text-center text-sm text-slate-400">Brak kandydatów w projekcie</div>}
              </div>
            </div>
          );
        })}
      </main>
    </>
  );

  const ClientsView = () => (
    <>
      <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-lg font-bold">🏢 Klienci</div>
        <div className="grid gap-3 md:grid-cols-4">
          <input className="rounded-xl border p-3 md:col-span-2" placeholder="Nazwa klienta" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
          <input className="rounded-xl border p-3" placeholder="Notatka / branża" value={newClientNote} onChange={(e) => setNewClientNote(e.target.value)} />
          <button onClick={addClient} className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white hover:bg-slate-800">Dodaj klienta</button>
        </div>
        <input className="mt-4 w-full rounded-xl border p-3" placeholder="Szukaj klienta..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
      </section>

      <main className="grid gap-4 lg:grid-cols-2">
        {filteredClients.map((client) => {
          const clientProjects = projects.filter((p) => p.client_id === client.id);
          return (
            <div key={client.id} className="rounded-3xl bg-white p-5 shadow-sm">
              <h3 className="text-xl font-black">{client.name}</h3>
              {client.note && <p className="mt-1 text-sm text-slate-500">{client.note}</p>}
              <div className="mt-4">
                <div className="mb-2 text-sm font-bold text-slate-700">Projekty klienta ({clientProjects.length})</div>
                <div className="grid gap-2">
                  {clientProjects.length ? clientProjects.map((p) => (
                    <div key={p.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="font-bold">{getProjectName(p)}</div>
                      <div className="text-sm text-slate-500">Kandydaci: {candidates.filter((c) => c.candidate_projects?.some((cp) => cp.project_id === p.id)).length}</div>
                    </div>
                  )) : <div className="rounded-2xl border border-dashed p-4 text-center text-sm text-slate-400">Brak projektów klienta</div>}
                </div>
              </div>
            </div>
          );
        })}

        {clients.length === 0 && (
          <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm">
            Brak klientów. Jeżeli dodawanie klienta zwróci błąd, utwórz w Supabase tabelę <b>clients</b> z kolumnami: id, name, note, created_at.
          </div>
        )}
      </main>
    </>
  );

  if (clientView) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 rounded-3xl bg-white p-6 shadow-sm">
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">Mini ATS kandydatów</h1>
            <p className="mt-2 text-slate-500">Shortlista kandydatów — {clientProjectName}</p>
          </header>

          <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-3 text-lg font-bold">🔎 Wyszukiwarka klienta</div>
            <div className="grid gap-3 md:grid-cols-3">
              <select className="rounded-xl border p-3" value={clientStatusFilter} onChange={(e) => setClientStatusFilter(e.target.value)}>
                <option value="">Status: wszystkie</option>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <select className="rounded-xl border p-3" value={clientRatingFilter} onChange={(e) => setClientRatingFilter(e.target.value)}>
                <option value="">Ocena: wszystkie</option>
                <option value="5">Minimum 5 ★</option>
                <option value="4">Minimum 4 ★</option>
                <option value="3">Minimum 3 ★</option>
                <option value="2">Minimum 2 ★</option>
                <option value="1">Minimum 1 ★</option>
              </select>
              <button onClick={() => { setClientStatusFilter(""); setClientRatingFilter(""); }} className="rounded-xl border px-4 py-3 font-semibold hover:bg-slate-50">Wyczyść filtry</button>
            </div>
            <p className="mt-3 text-center text-sm font-semibold text-slate-500">Znaleziono: <b>{filtered.length}</b> kandydatów</p>
          </section>

          {loading && <div className="rounded-3xl bg-white p-6 text-center shadow-sm">Ładowanie...</div>}
          {!loading && <main className="grid gap-4 lg:grid-cols-2">{filtered.map((candidate) => <CandidateCard key={candidate.id} candidate={candidate} />)}</main>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-72 flex-col bg-slate-950 p-5 text-white md:flex">
          <div className="mb-8">
            <div className="text-2xl font-black">Mini ATS</div>
            <div className="mt-1 text-sm text-slate-400">Kandydaci, projekty i klienci</div>
          </div>

          <nav className="grid gap-2">
            <TabButton active={activeTab === "add"} onClick={() => setActiveTab("add")}>➕ Dodaj kandydata</TabButton>
            <TabButton active={activeTab === "candidates"} onClick={() => setActiveTab("candidates")}>👤 Kandydaci</TabButton>
            <TabButton active={activeTab === "projects"} onClick={() => setActiveTab("projects")}>📁 Projekty</TabButton>
            <TabButton active={activeTab === "clients"} onClick={() => setActiveTab("clients")}>🏢 Klienci</TabButton>
          </nav>

          <div className="mt-auto grid gap-2">
            <button onClick={refreshAll} className="rounded-2xl border border-slate-700 px-4 py-3 font-semibold text-slate-200 hover:bg-slate-800">Odśwież bazę</button>
            <button onClick={logout} className="rounded-2xl border border-red-900 px-4 py-3 font-semibold text-red-300 hover:bg-red-950">Wyloguj</button>
          </div>
        </aside>

        <main className="w-full p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            <header className="mb-8 rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                    {activeTab === "add" && "Dodaj kandydata"}
                    {activeTab === "candidates" && "Baza kandydatów"}
                    {activeTab === "projects" && "Projekty"}
                    {activeTab === "clients" && "Klienci"}
                  </h1>
                  <p className="mt-2 text-slate-500">Baza kandydatów online dla Ciebie i Klaudii. Dane zapisują się w Supabase.</p>
                </div>

                <div className="grid grid-cols-2 gap-2 md:hidden">
                  <button onClick={() => setActiveTab("add")} className={`rounded-xl border p-2 text-sm font-bold ${activeTab === "add" ? "bg-slate-900 text-white" : "bg-white"}`}>Dodaj</button>
                  <button onClick={() => setActiveTab("candidates")} className={`rounded-xl border p-2 text-sm font-bold ${activeTab === "candidates" ? "bg-slate-900 text-white" : "bg-white"}`}>Kandydaci</button>
                  <button onClick={() => setActiveTab("projects")} className={`rounded-xl border p-2 text-sm font-bold ${activeTab === "projects" ? "bg-slate-900 text-white" : "bg-white"}`}>Projekty</button>
                  <button onClick={() => setActiveTab("clients")} className={`rounded-xl border p-2 text-sm font-bold ${activeTab === "clients" ? "bg-slate-900 text-white" : "bg-white"}`}>Klienci</button>
                </div>
              </div>
            </header>

            {message && <p className="mb-6 rounded-2xl bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm">{message}</p>}

            {activeTab === "add" && <AddCandidateView />}
            {activeTab === "candidates" && <CandidatesView />}
            {activeTab === "projects" && <ProjectsView />}
            {activeTab === "clients" && <ClientsView />}
          </div>
        </main>
      </div>
    </div>
  );
}
