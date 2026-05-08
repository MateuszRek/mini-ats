import fs from "node:fs";

const appPath = new URL("../src/App.jsx", import.meta.url);
let source = fs.readFileSync(appPath, "utf8");

if (
  source.includes("const [onlyRecommended, setOnlyRecommended]") &&
  source.includes("const toggleRecommendedToClient = async") &&
  source.includes("recommended_to_client")
) {
  console.log("Diamond recommendations patch already applied.");
  process.exit(0);
}

function fail(message) {
  throw new Error(`Cannot apply diamond recommendations patch: ${message}`);
}

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) fail(`missing ${label}`);
  source = source.replace(search, replacement);
}

function insertBefore(search, insertion, label) {
  if (!source.includes(search)) fail(`missing ${label}`);
  source = source.replace(search, insertion + search);
}

replaceOnce(
  '  const [onlyFavorites, setOnlyFavorites] = useState(false);\n',
  '  const [onlyFavorites, setOnlyFavorites] = useState(false);\n  const [onlyRecommended, setOnlyRecommended] = useState(false);\n',
  "onlyFavorites state"
);

replaceOnce(
  `        candidate_projects (
          id,
          project_id,
          status,
          notes,
          interview_summary,
          recruiter_notes,
          created_at,
          Projekty (*)
        )`,
  `        candidate_projects (
          *,
          Projekty (*)
        )`,
  "candidate_projects select"
);

insertBefore(
  "  const filtered = useMemo(() => {",
  `  const getRecommendationProjectId = (candidate) => {
    const activeProjectId = clientView ? clientProjectId : projectFilter || kanbanProjectId;
    if (activeProjectId) return activeProjectId;

    const relations = candidate.candidate_projects || [];
    if (relations.length === 1) return relations[0].project_id;

    return "";
  };

  const getRecommendationRelation = (candidate, relationOverride = null) => {
    if (relationOverride) return relationOverride;

    const projectId = getRecommendationProjectId(candidate);
    if (!projectId) return null;

    return candidate.candidate_projects?.find((cp) => cp.project_id === projectId) || null;
  };

  const isCandidateRecommended = (candidate, relationOverride = null) => {
    if (relationOverride) return Boolean(relationOverride.recommended_to_client);

    const projectId = getRecommendationProjectId(candidate);
    if (projectId) {
      return Boolean(candidate.candidate_projects?.some((cp) => cp.project_id === projectId && cp.recommended_to_client));
    }

    return Boolean(candidate.candidate_projects?.some((cp) => cp.recommended_to_client));
  };

  const toggleRecommendedToClient = async (candidate, relationOverride = null) => {
    const relation = getRecommendationRelation(candidate, relationOverride);

    if (!relation?.id) {
      setMessage("Najpierw przypisz kandydata do projektu. Jesli ma kilka projektow, wybierz projekt albo kliknij diament przy konkretnym projekcie.");
      return;
    }

    const newValue = !relation.recommended_to_client;

    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidate.id
          ? {
              ...c,
              candidate_projects: c.candidate_projects?.map((cp) =>
                cp.id === relation.id ? { ...cp, recommended_to_client: newValue } : cp
              ),
            }
          : c
      )
    );

    const { error } = await supabase
      .from("candidate_projects")
      .update({ recommended_to_client: newValue })
      .eq("id", relation.id);

    if (error) {
      setMessage("Blad zmiany rekomendacji do klienta: " + error.message);
      fetchCandidates();
      return;
    }

    setMessage(newValue ? "Kandydat oznaczony jako rekomendowany do klienta" : "Cofnieto rekomendacje do klienta");
    fetchCandidates();
  };

`,
  "filtered useMemo"
);

replaceOnce(
  "      const matchesFavorite = !onlyFavorites || c.favorite;\n",
  `      const matchesFavorite = !onlyFavorites || c.favorite;
      const matchesRecommended =
        !onlyRecommended ||
        c.candidate_projects?.some((cp) => {
          const activeProjectFilter = clientView ? clientProjectId : projectFilter;
          return Boolean(cp.recommended_to_client) && (!activeProjectFilter || cp.project_id === activeProjectFilter);
        });
`,
  "matchesFavorite"
);

replaceOnce(
  "      return matchesQuery && matchesGlobalStatus && matchesProject && matchesProjectStatus && matchesTags && matchesLanguage && matchesFramework && matchesArea && matchesFavorite && matchesClientStatus && matchesClientRating;\n",
  "      return matchesQuery && matchesGlobalStatus && matchesProject && matchesProjectStatus && matchesTags && matchesLanguage && matchesFramework && matchesArea && matchesFavorite && matchesRecommended && matchesClientStatus && matchesRating && matchesClientStatus && matchesClientRating;\n",
  "filtered return"
);

if (source.includes("matchesRating &&")) {
  source = source.replace("matchesFavorite && matchesRecommended && matchesRating && matchesClientStatus", "matchesFavorite && matchesRecommended && matchesClientStatus");
}

replaceOnce(
  "  }, [candidates, query, globalStatusFilter, projectFilter, projectStatusFilter, tagFilter, languageFilter, frameworkFilter, areaFilter, sortBy, onlyFavorites, clientView, clientProjectId, clientStatusFilter, clientRatingFilter]);\n",
  "  }, [candidates, query, globalStatusFilter, projectFilter, projectStatusFilter, tagFilter, languageFilter, frameworkFilter, areaFilter, sortBy, onlyFavorites, onlyRecommended, clientView, clientProjectId, clientStatusFilter, clientRatingFilter]);\n",
  "filtered dependencies"
);

replaceOnce(
  '      { label: "Statusy w projektach", get: (c) => (c.candidate_projects || []).map((cp) => `${getProjectName(cp.Projekty)}: ${cp.status || "New"}`).join("; ") },\n',
  '      { label: "Statusy w projektach", get: (c) => (c.candidate_projects || []).map((cp) => `${getProjectName(cp.Projekty)}: ${cp.status || "New"}`).join("; ") },\n      { label: "Rekomendowany do klienta", get: (c) => (c.candidate_projects || []).map((cp) => `${getProjectName(cp.Projekty)}: ${cp.recommended_to_client ? "TAK" : "NIE"}`).join("; ") },\n',
  "candidate csv recommendation"
);

replaceOnce(
  `          {!clientView && (
            <button onClick={() => toggleFavorite(candidate)} className={\`text-2xl \${candidate.favorite ? "text-yellow-400" : "text-slate-300 hover:text-yellow-400"}\`} title="Dodaj do shortlisty">
              ★
            </button>
          )}`,
  `          {!clientView && (
            <div className="flex flex-col items-center gap-1">
              <button onClick={() => toggleFavorite(candidate)} className={\`text-2xl \${candidate.favorite ? "text-yellow-400" : "text-slate-300 hover:text-yellow-400"}\`} title="Dodaj do shortlisty">
                ★
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRecommendedToClient(candidate);
                }}
                className={\`text-2xl \${isCandidateRecommended(candidate) ? "text-cyan-500" : "text-slate-300 hover:text-cyan-500"}\`}
                title="Oznacz jako rekomendowany do klienta"
              >
                ♦
              </button>
            </div>
          )}`,
  "candidate card favorite button"
);

replaceOnce(
  `                        <button onClick={() => removeCandidateFromProject(cp.id)} className="rounded-full px-2 text-lg font-black text-slate-400 hover:bg-red-50 hover:text-red-600" title="Usuń projekt z kandydata">×</button>`,
  `                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleRecommendedToClient(candidate, cp)}
                            className={\`rounded-full px-2 text-lg font-black \${cp.recommended_to_client ? "text-cyan-500 hover:bg-cyan-50" : "text-slate-300 hover:bg-cyan-50 hover:text-cyan-500"}\`}
                            title="Rekomendowany do klienta w tym projekcie"
                          >
                            ♦
                          </button>
                          <button onClick={() => removeCandidateFromProject(cp.id)} className="rounded-full px-2 text-lg font-black text-slate-400 hover:bg-red-50 hover:text-red-600" title="Usuń projekt z kandydata">×</button>
                        </div>`,
  "project relation remove button"
);

replaceOnce(
  `          <button onClick={() => { setQuery(""); setGlobalStatusFilter(""); setProjectFilter(""); setProjectStatusFilter(""); setTagFilter(""); setLanguageFilter(""); setFrameworkFilter(""); setAreaFilter(""); setSortBy("newest"); }} className="rounded-xl border px-4 py-3 font-semibold hover:bg-slate-50">Wyczyść filtry</button>`,
  `          <button onClick={() => { setQuery(""); setGlobalStatusFilter(""); setProjectFilter(""); setProjectStatusFilter(""); setTagFilter(""); setLanguageFilter(""); setFrameworkFilter(""); setAreaFilter(""); setSortBy("newest"); setOnlyFavorites(false); setOnlyRecommended(false); }} className="rounded-xl border px-4 py-3 font-semibold hover:bg-slate-50">Wyczyść filtry</button>`,
  "clear filters button"
);

replaceOnce(
  `          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={onlyFavorites} onChange={(e) => setOnlyFavorites(e.target.checked)} /> Tylko shortlista ⭐</label>`,
  `          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={onlyFavorites} onChange={(e) => setOnlyFavorites(e.target.checked)} /> Tylko shortlista ⭐</label>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={onlyRecommended} onChange={(e) => setOnlyRecommended(e.target.checked)} /> Tylko rekomendowani ♦</label>
          </div>`,
  "favorite filter label"
);

fs.writeFileSync(appPath, source);
console.log("Applied diamond recommendations patch.");
