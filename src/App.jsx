// MINI ATS — SUPABASE ONLINE

import React, { useMemo, useState, useEffect } from "react";
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

function getAccentStyle(status) {
  return STATUS_ACCENTS[status] || STATUS_ACCENTS.New;
}

function getStatusStyle(status) {
  return STATUS_STYLES[status] || STATUS_STYLES.New;
}

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
};

function includesIgnoreCase(value, query) {
  return String(value || "").toLowerCase().includes(query.toLowerCase());
}

function Icon({ children }) {
  return <span className="inline-flex h-5 w-5 items-center justify-center text-sm">{children}</span>;
}

export default function MiniATSApp() {
  const [candidates, setCandidates] = useState([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyCandidate);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [projects, setProjects] = useState([]);
  const [formProjects, setFormProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState({});
  const [newProjectName, setNewProjectName] = useState("");
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
  const [session, setSession] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(true);

  const [suggestions, setSuggestions] = useState({
    languages: [],
    frameworks: [],
  });

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
    setMessage("Wylogowano");
  };

  const fetchProjects = async () => {
    const { data } = await supabase.from("Projekty").select("*");
    setProjects(data || []);
  };

  const addProject = async () => {
    if (!newProjectName.trim()) {
      setMessage("Podaj nazwę projektu");
      return;
    }

    const { error } = await supabase.from("Projekty").insert([
      { name: newProjectName }
    ]);

    if (error) {
      setMessage("Błąd dodawania projektu: " + error.message);
      return;
    }

    setNewProjectName("");
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
    const { error } = await supabase
      .from("candidate_projects")
      .delete()
      .eq("id", relationId);

    if (error) {
      setMessage("Błąd usuwania projektu z kandydata: " + error.message);
      return;
    }

    setMessage("Projekt usunięty z kandydata ✅");
    fetchCandidates();
  };

  const updateProjectStatus = async (relationId, newStatus) => {
    const { error } = await supabase
      .from("candidate_projects")
      .update({ status: newStatus })
      .eq("id", relationId);

    if (error) {
      setMessage("Błąd zmiany statusu projektu: " + error.message);
      return;
    }

    setMessage("Status w projekcie zmieniony ✅");
    fetchCandidates();
  };

  const updateProjectNotes = async (relationId, notes) => {
    const { error } = await supabase
      .from("candidate_projects")
      .update({ notes })
      .eq("id", relationId);

    if (error) {
      setMessage("Błąd zapisu notatek: " + error.message);
      return;
    }

    setMessage("Notatka zapisana ✅");
    fetchCandidates();
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

  useEffect(() => {
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
    if (!session) return;
    fetchCandidates();
    fetchProjects();
  }, [session]);

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
    if (!form.name.trim()) return;

    let cvUrl = form.cv_url;

    // 🔥 upload CV do Supabase Storage
    if (form.cv_file) {
      const fileName = `${Date.now()}_${form.cv_file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("CV")
        .upload(fileName, form.cv_file);

      if (uploadError) {
        setMessage("Błąd uploadu CV: " + uploadError.message);
        return;
      }

      const { data } = supabase.storage
        .from("CV")
        .getPublicUrl(fileName);

      cvUrl = data.publicUrl;
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
      const { error } = await supabase
        .from("candidates")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        setMessage("Nie udało się zapisać zmian: " + error.message);
        return;
      }

      insertedId = editingId;
    } else {
      const { data, error } = await supabase
        .from("candidates")
        .insert([payload])
        .select()
        .single();

      if (error) {
        setMessage("Nie udało się dodać: " + error.message);
        return;
      }

      insertedId = data.id;

      // 🔥 dodanie projektów przy tworzeniu
      if (formProjects.length > 0) {
        const relations = formProjects.map((projectId) => ({
          candidate_id: insertedId,
          project_id: projectId,
          status: "New",
        }));

        const { error: relError } = await supabase
          .from("candidate_projects")
          .insert(relations);

        if (relError) {
          setMessage("Kandydat dodany, ale błąd projektów: " + relError.message);
        }
      }
    }

    setForm(emptyCandidate);
    setFormProjects([]);
    setEditingId(null);
    setMessage(editingId ? "Kandydat zaktualizowany ✅" : "Kandydat dodany ✅");
    fetchCandidates();
  };

  const startEditCandidate = (candidate) => {
    setEditingId(candidate.id);
    setForm({
      name: candidate.name || "",
      status: candidate.status || "New",
      email: candidate.email || "",
      telefon: candidate.telefon || "",
      linkedin: candidate.linkedin || "",
      lokalizacja: candidate.lokalizacja || "",
      doświadczenie: candidate.doświadczenie || "",
      notatki: candidate.notatki || "",
      tagi: candidate.tagi || "",
      jezyk_programowania: candidate.jezyk_programowania || "",
      framework: candidate.framework || "",
      obszar: candidate.obszar || "",
      rating: candidate.rating || 0,
      favorite: candidate.favorite || false,
    });
    setMessage("Edytujesz kandydata: " + (candidate.name || "bez nazwy"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEditCandidate = () => {
    setEditingId(null);
    setForm(emptyCandidate);
    setMessage("Edycja anulowana");
  };

  const deleteCandidate = async (id) => {
    const { error } = await supabase.from("candidates").delete().eq("id", id);

    if (error) {
      setMessage("Nie udało się usunąć: " + error.message);
      return;
    }

    setMessage("Kandydat usunięty ✅");
    fetchCandidates();
  };

  const toggleFavorite = async (candidate) => {
    const newValue = !candidate.favorite;

    // szybka zmiana w UI, żeby od razu było widać kliknięcie
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidate.id ? { ...c, favorite: newValue } : c))
    );

    const { error } = await supabase
      .from("candidates")
      .update({ favorite: newValue })
      .eq("id", candidate.id)
      .select();

    if (error) {
      setMessage("Błąd zmiany shortlisty: " + error.message);
      fetchCandidates();
      return;
    }

    setMessage(newValue ? "Dodano do shortlisty ⭐" : "Usunięto ze shortlisty");
    fetchCandidates();
  };

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from("candidates")
      .update({ status: newStatus })
      .eq("id", id)
      .select();

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
      const matchesProject = !projectFilter || c.candidate_projects?.some((cp) => cp.project_id === projectFilter);
      const matchesProjectStatus = !projectStatusFilter || c.candidate_projects?.some((cp) => cp.status === projectStatusFilter);
      const matchesTags = !tagFilter || includesIgnoreCase(c.tagi, tagFilter);
      const matchesLanguage = !languageFilter || includesIgnoreCase(c.jezyk_programowania, languageFilter);
      const matchesFramework = !frameworkFilter || includesIgnoreCase(c.framework, frameworkFilter);
      const matchesArea = !areaFilter || c.obszar === areaFilter;
      const matchesFavorite = !onlyFavorites || c.favorite;

      return matchesQuery && matchesGlobalStatus && matchesProject && matchesProjectStatus && matchesTags && matchesLanguage && matchesFramework && matchesArea && matchesFavorite;
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
  }, [candidates, query, globalStatusFilter, projectFilter, projectStatusFilter, tagFilter, languageFilter, frameworkFilter, areaFilter, sortBy, onlyFavorites]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900">
        <div className="rounded-3xl bg-white p-8 shadow-sm">Ładowanie...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-black tracking-tight">Mini ATS</h1>
          <p className="mt-2 text-slate-500">Zaloguj się, żeby zobaczyć bazę kandydatów.</p>

          <div className="mt-6 grid gap-3">
            <input
              className="rounded-xl border p-3"
              placeholder="Email"
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
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
            <button
              onClick={login}
              className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
            >
              Zaloguj
            </button>
          </div>

          {message && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">Mini ATS kandydatów</h1>
              <p className="mt-2 text-slate-500">Baza kandydatów online dla Ciebie i Klaudii. Dane zapisują się w Supabase.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={fetchCandidates} className="rounded-2xl border px-5 py-3 font-semibold hover:bg-slate-50">
                Odśwież bazę
              </button>
              <button onClick={logout} className="rounded-2xl border px-5 py-3 font-semibold text-red-600 hover:bg-red-50">
                Wyloguj
              </button>
            </div>
          </div>
        </header>

        <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-lg font-bold"><Icon>{editingId ? "✎" : "＋"}</Icon> {editingId ? "Edytuj kandydata" : "Dodaj kandydata"}</div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <input
              className="rounded-xl border p-3"
              placeholder="Imię i nazwisko"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
            />
            <select className="rounded-xl border p-3" value={form.status} onChange={(e) => setField("status", e.target.value)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <input
              className="rounded-xl border p-3"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
            />
            <input
              className="rounded-xl border p-3"
              placeholder="Telefon"
              value={form.telefon}
              onChange={(e) => setField("telefon", e.target.value)}
            />
            <input
              className="rounded-xl border p-3"
              placeholder="LinkedIn URL"
              value={form.linkedin}
              onChange={(e) => setField("linkedin", e.target.value)}
            />
            <input
              className="rounded-xl border p-3"
              placeholder="Lokalizacja / miasto"
              value={form.lokalizacja}
              onChange={(e) => setField("lokalizacja", e.target.value)}
            />
            <input
              className="rounded-xl border p-3"
              placeholder="Doświadczenie, np. 5 lat"
              value={form.doświadczenie}
              onChange={(e) => setField("doświadczenie", e.target.value)}
            />
            <div className="relative">
              <input
                className="rounded-xl border p-3 w-full"
                placeholder="Język programowania, np. Java, Python"
                value={form.jezyk_programowania}
                onChange={(e) => setField("jezyk_programowania", e.target.value)}
              />
              {form.jezyk_programowania && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border bg-white shadow">
                  {suggestions.languages
                    .filter((l) => l.toLowerCase().includes(form.jezyk_programowania.toLowerCase()))
                    .map((l) => (
                      <div
                        key={l}
                        onClick={() => setField("jezyk_programowania", l)}
                        className="cursor-pointer px-3 py-2 hover:bg-slate-100"
                      >
                        {l}
                      </div>
                    ))}
                </div>
              )}
            </div>
            <div className="relative">
              <input
                className="rounded-xl border p-3 w-full"
                placeholder="Framework, np. React, Spring, Django"
                value={form.framework}
                onChange={(e) => setField("framework", e.target.value)}
              />
              {form.framework && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border bg-white shadow">
                  {suggestions.frameworks
                    .filter((f) => f.toLowerCase().includes(form.framework.toLowerCase()))
                    .map((f) => (
                      <div
                        key={f}
                        onClick={() => setField("framework", f)}
                        className="cursor-pointer px-3 py-2 hover:bg-slate-100"
                      >
                        {f}
                      </div>
                    ))}
                </div>
              )}
            </div>
            <select
              className="rounded-xl border p-3"
              value={form.obszar}
              onChange={(e) => setField("obszar", e.target.value)}
            >
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
            <input
              className="rounded-xl border p-3 lg:col-span-3"
              placeholder="Tagi, np. Senior, Remote, Warsaw"
              value={form.tagi}
              onChange={(e) => setField("tagi", e.target.value)}
            />
            <textarea
              className="min-h-24 rounded-xl border p-3 lg:col-span-2"
              placeholder="Notatki"
              value={form.notatki}
              onChange={(e) => setField("notatki", e.target.value)}
            />

            {/* 🔥 CV UPLOAD */}
            <div className="lg:col-span-3">
              <label className="mb-1 block text-sm font-semibold">CV (PDF)</label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setField("cv_file", e.target.files[0])}
                className="w-full rounded-xl border p-2"
              />
            </div>

            {/* 🔥 WYBÓR PROJEKTÓW PRZY DODAWANIU */}
            <div className="lg:col-span-3">
              <label className="mb-1 block text-sm font-semibold">Dodaj do projektów</label>
              <div className="flex flex-wrap gap-2">
                {projects.map((p) => {
                  const selected = formProjects.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setFormProjects((prev) =>
                          selected ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                        );
                      }}
                      className={`rounded-full px-3 py-1 text-sm font-bold border ${selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}
                    >
                      {p.name || p.nazwa}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Ocena:</span>
              {[1,2,3,4,5].map((r) => (
                <button
                  key={r}
                  onClick={() => setField("rating", r)}
                  className={`text-lg ${form.rating >= r ? "text-yellow-500" : "text-slate-300"}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 md:flex-row">
            <button onClick={addCandidate} className="w-full rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800 md:w-auto">
              {editingId ? "Zapisz zmiany" : "Dodaj kandydata"}
            </button>
            {editingId && (
              <button onClick={cancelEditCandidate} className="w-full rounded-xl border px-5 py-3 font-semibold hover:bg-slate-50 md:w-auto">
                Anuluj edycję
              </button>
            )}
          </div>

          {message && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
        </section>

        <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-lg font-bold">📁 Projekty</div>

          <div className="flex gap-2">
            <input
              className="w-full rounded-xl border p-3"
              placeholder="Nazwa projektu"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
            <button
              onClick={addProject}
              className="rounded-xl bg-green-600 px-4 py-2 font-bold text-white hover:bg-green-700"
            >
              Dodaj projekt
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setProjectFilter(p.id)}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold hover:bg-slate-200"
                title="Filtruj po projekcie"
              >
                {p.name || p.nazwa || "Projekt"}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-lg font-bold"><Icon>🔎</Icon> Wyszukiwarka</div>
          <input
            className="w-full rounded-xl border p-3"
            placeholder="Szukaj po nazwisku, statusie, emailu, telefonie, lokalizacji, doświadczeniu lub notatkach..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <div className="relative">
              <input
                className="w-full rounded-xl border p-3"
                placeholder="Język, np. Java / Python"
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
              />
              {languageFilter && (
                <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border bg-white shadow">
                  {suggestions.languages
                    .filter((l) => l.toLowerCase().includes(languageFilter.toLowerCase()))
                    .slice(0, 8)
                    .map((l) => (
                      <div
                        key={l}
                        onClick={() => setLanguageFilter(l)}
                        className="cursor-pointer px-3 py-2 text-sm hover:bg-slate-100"
                      >
                        {l}
                      </div>
                    ))}
                </div>
              )}
            </div>
            <div className="relative">
              <input
                className="w-full rounded-xl border p-3"
                placeholder="Framework, np. React / Spring"
                value={frameworkFilter}
                onChange={(e) => setFrameworkFilter(e.target.value)}
              />
              {frameworkFilter && (
                <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border bg-white shadow">
                  {suggestions.frameworks
                    .filter((f) => f.toLowerCase().includes(frameworkFilter.toLowerCase()))
                    .slice(0, 8)
                    .map((f) => (
                      <div
                        key={f}
                        onClick={() => setFrameworkFilter(f)}
                        className="cursor-pointer px-3 py-2 text-sm hover:bg-slate-100"
                      >
                        {f}
                      </div>
                    ))}
                </div>
              )}
            </div>
            <select
              className="rounded-xl border p-3"
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
            >
              <option value="">Obszar: wszystkie</option>
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
            <input
              className="rounded-xl border p-3"
              placeholder="Tag, np. React / Senior / Remote"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
            />
            <select
              className="rounded-xl border p-3"
              value={globalStatusFilter}
              onChange={(e) => setGlobalStatusFilter(e.target.value)}
            >
              <option value="">Status kandydata: wszystkie</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              className="rounded-xl border p-3"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <option value="">Projekt: wszystkie</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name || p.nazwa || "Projekt bez nazwy"}</option>
              ))}
            </select>

            <select
              className="rounded-xl border p-3"
              value={projectStatusFilter}
              onChange={(e) => setProjectStatusFilter(e.target.value)}
            >
              <option value="">Status w projekcie: wszystkie</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </section>

        <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-lg font-bold">↕️ Sortowanie</div>
          <select
            className="w-full rounded-xl border p-3 md:w-80"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Najnowsi pierwsi</option>
            <option value="oldest">Najstarsi pierwsi</option>
            <option value="rating_desc">Najwyższa ocena</option>
            <option value="rating_asc">Najniższa ocena</option>
            <option value="experience_desc">Największe doświadczenie</option>
            <option value="experience_asc">Najmniejsze doświadczenie</option>
            <option value="name_asc">Imię/Nazwisko A-Z</option>
            <option value="name_desc">Imię/Nazwisko Z-A</option>
          </select>
        </section>

        <div className="mb-4 flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={onlyFavorites}
              onChange={(e) => setOnlyFavorites(e.target.checked)}
            />
            Tylko shortlista ⭐
          </label>
          <p className="text-sm text-slate-500">Znaleziono: <b>{filtered.length}</b> kandydatów</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-xl border px-3 py-2 text-sm font-bold ${viewMode === "list" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`rounded-xl border px-3 py-2 text-sm font-bold ${viewMode === "kanban" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
            >
              Kanban
            </button>
            <button
              onClick={() => {
                setQuery("");
                setGlobalStatusFilter("");
                setProjectFilter("");
                setProjectStatusFilter("");
                setTagFilter("");
                setLanguageFilter("");
                setFrameworkFilter("");
                setAreaFilter("");
                setSortBy("newest");
              }}
              className="text-sm font-medium text-slate-600 hover:underline"
            >
              Wyczyść filtry
            </button>
          </div>
        </div>

        {loading && <div className="rounded-3xl bg-white p-6 text-center shadow-sm">Ładowanie...</div>}

        {!loading && filtered.length === 0 && (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-semibold">Brak kandydatów.</p>
            <p className="mt-2 text-slate-500">Dodaj pierwszego kandydata powyżej.</p>
          </div>
        )}

        {viewMode === "kanban" && !loading && filtered.length > 0 && (
          <div className="mb-4">
            <select
              className="rounded-xl border p-3"
              value={kanbanProjectId}
              onChange={(e) => setKanbanProjectId(e.target.value)}
            >
              <option value="">Wybierz projekt do Kanban</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name || p.nazwa}</option>
              ))}
            </select>
          </div>
        )}

        {viewMode === "kanban" && !loading && filtered.length > 0 && kanbanProjectId && (
          <section className="mb-6 grid gap-4 xl:grid-cols-7 lg:grid-cols-4 md:grid-cols-2">
            {STATUSES.map((status) => {
              const statusCandidates = filtered.flatMap((c) =>
                (c.candidate_projects || [])
                  .filter((cp) => cp.project_id === kanbanProjectId && (cp.status || "New") === status)
                  .map((cp) => ({ candidate: c, cp }))
              );

              return (
                <div key={status} className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className={`mb-3 rounded-2xl border px-3 py-2 text-sm font-black ${getStatusStyle(status)}`}>
                    {status} <span className="font-semibold opacity-70">({statusCandidates.length})</span>
                  </div>

                  <div className="grid gap-3">
                    {statusCandidates.map(({ candidate, cp }) => (
                      <div key={cp.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
                        <div className="font-black text-slate-900">{candidate.name}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {candidate.email || candidate.telefon || candidate.lokalizacja || "Brak danych"}
                        </div>

                        {cp.notes && (
                          <div className="mt-2 rounded-xl bg-white p-2 text-xs text-slate-600">
                            {cp.notes}
                          </div>
                        )}

                        <select
                          className={`mt-3 w-full rounded-xl border p-2 text-xs font-bold ${getStatusStyle(cp.status || "New")}`}
                          value={cp.status || "New"}
                          onChange={(e) => updateProjectStatus(cp.id, e.target.value)}
                        >
                          {STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    ))}

                    {statusCandidates.length === 0 && (
                      <div className="rounded-2xl border border-dashed p-4 text-center text-xs text-slate-400">Brak</div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {viewMode === "kanban" && !loading && filtered.length > 0 && !kanbanProjectId && (
          <div className="mb-6 rounded-3xl bg-white p-6 text-center text-slate-500 shadow-sm">
            Wybierz projekt, żeby zobaczyć Kanban.
          </div>
        )}

        {viewMode === "list" && <main className="grid gap-4 lg:grid-cols-2">
          {filtered.map((candidate) => (
            <div key={candidate.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
              <div className={`h-2 bg-gradient-to-r ${getAccentStyle(candidate.status || "New")}`} />

              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <button
                    onClick={() => toggleFavorite(candidate)}
                    className={`text-2xl ${candidate.favorite ? "text-yellow-400" : "text-slate-300 hover:text-yellow-400"}`}
                    title="Dodaj do shortlisty"
                  >
                    ★
                  </button>
                  <div>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm ${getAccentStyle(candidate.status || "New")}`}>
                        👤
                      </div>
                      <div>
                        <h3 className="text-xl font-black tracking-tight text-slate-900">{candidate.name}</h3>
                        <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                          Dodany: {candidate.created_at ? new Date(candidate.created_at).toLocaleString("pl-PL") : "brak daty"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-bold shadow-sm ${getStatusStyle(candidate.status || "New")}`}>
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {candidate.status || "New"}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50/80 p-4 text-sm text-slate-700">
                  {candidate.email && <p><b>Email:</b> {candidate.email}</p>}
                  {candidate.telefon && <p><b>Telefon:</b> {candidate.telefon}</p>}
                  {candidate.linkedin && <p><b>LinkedIn:</b> <a className="font-semibold text-blue-600 hover:underline" href={candidate.linkedin} target="_blank" rel="noreferrer">Otwórz profil</a></p>}
                  {candidate.lokalizacja && <p><b>Lokalizacja:</b> {candidate.lokalizacja}</p>}
                  {candidate.doświadczenie && <p><b>Doświadczenie:</b> {candidate.doświadczenie}</p>}
                  {candidate.obszar && <p><b>Obszar:</b> {candidate.obszar}</p>}
                  {candidate.rating > 0 && (
                    <p><b>Ocena:</b> {'★'.repeat(candidate.rating)}</p>
                  )}
                  {candidate.jezyk_programowania && <p><b>Język programowania:</b> {candidate.jezyk_programowania}</p>}
                  {candidate.framework && <p><b>Framework:</b> {candidate.framework}</p>}
                  {candidate.tagi && (
                    <div className="flex flex-wrap gap-2">
                      {candidate.tagi.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setTagFilter(tag)}
                          className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900"
                          title="Filtruj po tagu"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}
                  {candidate.notatki && <p className="rounded-2xl bg-white p-3 shadow-sm"><b>Notatki:</b> {candidate.notatki}</p>}
                  {candidate.cv_url && (
                    <p>
                      <b>CV:</b>{" "}
                      <a
                        href={candidate.cv_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 font-semibold hover:underline"
                      >
                        Otwórz CV
                      </a>
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Status procesu</label>
                  <select
                    className={`w-full rounded-2xl border p-3 font-semibold shadow-sm ${getStatusStyle(candidate.status || "New")}`}
                    value={candidate.status || "New"}
                    onChange={(e) => updateStatus(candidate.id, e.target.value)}
                  >
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
                            <button
                              onClick={() => setProjectFilter(cp.project_id)}
                              className="font-bold text-slate-800 hover:text-blue-700 hover:underline"
                              title="Filtruj po tym projekcie"
                            >
                              {cp.Projekty?.name || cp.Projekty?.nazwa || "Projekt bez nazwy"}
                            </button>
                            <button
                              onClick={() => removeCandidateFromProject(cp.id)}
                              className="rounded-full px-2 text-lg font-black text-slate-400 hover:bg-red-50 hover:text-red-600"
                              title="Usuń projekt z kandydata"
                            >
                              ×
                            </button>
                          </div>

                          <select
                            className={`w-full rounded-xl border p-2 text-sm font-semibold ${getStatusStyle(cp.status || "New")}`}
                            value={cp.status || "New"}
                            onChange={(e) => updateProjectStatus(cp.id, e.target.value)}
                          >
                            {STATUSES.map((s) => <option key={s}>{s}</option>)}
                          </select>

                          <textarea
                            className="mt-2 w-full rounded-xl border p-2 text-sm"
                            placeholder="Notatki do tego projektu..."
                            defaultValue={cp.notes || ""}
                            onBlur={(e) => updateProjectNotes(cp.id, e.target.value)}
                          />
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">Brak przypisanego projektu</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <select
                      className="w-full rounded-xl border p-2"
                      value={selectedProjects[candidate.id] || ""}
                      onChange={(e) => setSelectedProjects((prev) => ({ ...prev, [candidate.id]: e.target.value }))}
                    >
                      <option value="">Wybierz projekt</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name || p.nazwa || "Projekt bez nazwy"}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => assignProject(candidate.id)}
                      className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700"
                    >
                      Przypisz
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => startEditCandidate(candidate)} className="flex items-center gap-2 rounded-2xl border bg-white px-4 py-2 text-sm font-bold shadow-sm hover:bg-slate-50">
                      <Icon>✎</Icon> Edytuj
                    </button>
                    <button onClick={() => deleteCandidate(candidate.id)} className="flex items-center gap-2 rounded-2xl border bg-white px-4 py-2 text-sm font-bold text-red-600 shadow-sm hover:bg-red-50">
                      <Icon>🗑</Icon> Usuń
                    </button>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-400">ID: {candidate.id?.slice(0, 6)}</span>
                </div>
              </div>
            </div>
          ))}
        </main>}
      </div>
    </div>
  );
}
