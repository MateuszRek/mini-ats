import fs from "node:fs";

const appPath = new URL("../src/App.jsx", import.meta.url);
let source = fs.readFileSync(appPath, "utf8");
let changed = false;

if (
  source.includes("const updateProjectClient = async") &&
  source.includes("const deleteClient = async") &&
  source.includes("const openProjectCandidates = (projectId)")
) {
  console.log("Client/project flow patch already applied.");
  process.exit(0);
}

function replaceOnce(from, to, label) {
  if (!source.includes(from)) {
    console.log(`Skipped ${label}; already applied or anchor not found.`);
    return false;
  }

  source = source.replace(from, to);
  changed = true;
  console.log(`Applied ${label}.`);
  return true;
}

function insertBefore(anchor, insert, label) {
  if (source.includes(insert.trim())) {
    console.log(`Skipped ${label}; already applied.`);
    return false;
  }

  if (!source.includes(anchor)) {
    console.log(`Skipped ${label}; anchor not found.`);
    return false;
  }

  source = source.replace(anchor, `${insert}\n${anchor}`);
  changed = true;
  console.log(`Applied ${label}.`);
  return true;
}

function replaceInSection(sectionStart, from, to, label) {
  const start = source.indexOf(sectionStart);
  if (start === -1) {
    console.log(`Skipped ${label}; section not found.`);
    return false;
  }

  const index = source.indexOf(from, start);
  if (index === -1) {
    console.log(`Skipped ${label}; already applied or anchor not found.`);
    return false;
  }

  source = `${source.slice(0, index)}${to}${source.slice(index + from.length)}`;
  changed = true;
  console.log(`Applied ${label}.`);
  return true;
}

insertBefore(
`  const assignProject = async (candidateId) => {`,
`  const updateProjectClient = async (projectId, clientId) => {
    const nextClientId = clientId || null;

    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, client_id: nextClientId } : p)));

    const { error } = await supabase.from("Projekty").update({ client_id: nextClientId }).eq("id", projectId);

    if (error) {
      setMessage("Nie udało się przypisać klienta do projektu: " + error.message);
      fetchProjects();
      return;
    }

    const clientName = nextClientId ? clients.find((c) => c.id === nextClientId)?.name || "wybrany klient" : "brak klienta";
    setMessage(\`Projekt przypisany do: \${clientName} ✅\`);
    fetchProjects();
    fetchCandidates();
  };

  const deleteClient = async (client) => {
    const clientProjects = projects.filter((p) => p.client_id === client.id);
    const projectInfo = clientProjects.length
      ? \` Projekty klienta (\${clientProjects.length}) nie zostaną usunięte, tylko odpięte od klienta.\`
      : "";

    if (!confirm(\`Czy na pewno chcesz usunąć klienta: \${client.name}?\${projectInfo}\`)) return;

    const { error } = await supabase.from("clients").delete().eq("id", client.id);

    if (error) {
      setMessage("Nie udało się usunąć klienta: " + error.message);
      return;
    }

    if (newProjectClientId === client.id) setNewProjectClientId("");
    setMessage("Klient usunięty ✅");
    fetchClients();
    fetchProjects();
    fetchCandidates();
  };
`,
"project/client actions"
);

insertBefore(
`  const downloadFile = (filename, content, type = "text/plain;charset=utf-8") => {`,
`  const openProjectCandidates = (projectId) => {
    setProjectFilter(projectId);
    setProjectStatusFilter("");
    setViewMode("list");
    setActiveTab("candidates");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openClientDetails = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    setClientSearch(client?.name || "");
    setActiveTab("clients");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
`,
"navigation helpers"
);

replaceInSection(
`  const ProjectsView = () => (`,
`                  <p className="mt-1 text-sm text-slate-500">Klient: <b>{clientName}</b></p>`,
`                  <p className="mt-1 text-sm text-slate-500">
                    Klient:{" "}
                    {p.client_id ? (
                      <button type="button" onClick={() => openClientDetails(p.client_id)} className="font-bold text-blue-700 hover:underline">
                        {clientName}
                      </button>
                    ) : (
                      <b>{clientName}</b>
                    )}
                  </p>`,
"project client link"
);

replaceInSection(
`  const ProjectsView = () => (`,
`                  <button type="button" onClick={() => { const link = \`${'${window.location.origin}?client=true&project=${p.id}'}\`; navigator.clipboard.writeText(link); setMessage(\`Link klienta do projektu „${'${getProjectName(p)}'}” skopiowany 📎\`); }} className="rounded-full bg-blue-600 px-3 py-1 text-sm font-bold text-white hover:bg-blue-700">Skopiuj link klienta</button>`,
`                  <button type="button" onClick={() => openProjectCandidates(p.id)} className="rounded-full border bg-white px-3 py-1 text-sm font-bold text-slate-700 hover:bg-slate-50">Pokaż kandydatów</button>
                  <button type="button" onClick={() => { const link = \`${'${window.location.origin}?client=true&project=${p.id}'}\`; navigator.clipboard.writeText(link); setMessage(\`Link klienta do projektu „${'${getProjectName(p)}'}” skopiowany 📎\`); }} className="rounded-full bg-blue-600 px-3 py-1 text-sm font-bold text-white hover:bg-blue-700">Skopiuj link klienta</button>`,
"open project button"
);

replaceInSection(
`  const ProjectsView = () => (`,
`              <div className="mt-4 grid gap-2">`,
`              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <label className="mb-1 block text-sm font-bold text-slate-700">Klient projektu</label>
                <select className="w-full rounded-xl border bg-white p-2" value={p.client_id || ""} onChange={(e) => updateProjectClient(p.id, e.target.value)}>
                  <option value="">Bez klienta</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="mt-4 grid gap-2">`,
"project client selector"
);

replaceInSection(
`  const ClientsView = () => (`,
`              <h3 className="text-xl font-black">{client.name}</h3>`,
`              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black">{client.name}</h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">Klient</p>
                </div>
                <button type="button" onClick={() => deleteClient(client)} className="rounded-full border border-red-200 bg-white px-3 py-1 text-sm font-bold text-red-600 hover:bg-red-50">Usuń klienta</button>
              </div>`,
"client delete button"
);

replaceInSection(
`  const ClientsView = () => (`,
`                      <div className="font-bold">{getProjectName(p)}</div>
                      <div className="text-sm text-slate-500">Kandydaci: {candidates.filter((c) => c.candidate_projects?.some((cp) => cp.project_id === p.id)).length}</div>`,
`                      <button type="button" onClick={() => openProjectCandidates(p.id)} className="font-bold text-slate-900 hover:text-blue-700 hover:underline">
                        {getProjectName(p)}
                      </button>
                      <div className="text-sm text-slate-500">Kandydaci: {candidates.filter((c) => c.candidate_projects?.some((cp) => cp.project_id === p.id)).length}</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" onClick={() => openProjectCandidates(p.id)} className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-700">Otwórz projekt</button>
                        <button type="button" onClick={() => updateProjectClient(p.id, "")} className="rounded-full border bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50">Odepnij od klienta</button>
                        <button type="button" onClick={() => deleteProject(p.id, getProjectName(p))} className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-50">Usuń projekt</button>
                      </div>`,
"client project actions"
);

if (changed) {
  fs.writeFileSync(appPath, source);
  console.log("Applied client/project flow patch.");
} else {
  console.log("Client/project flow patch already applied or no matching anchors.");
}
