import fs from "node:fs";

const appPath = new URL("../src/App.jsx", import.meta.url);
let source = fs.readFileSync(appPath, "utf8");

if (source.includes("const [newClientContact, setNewClientContact]")) {
  console.log("Normalized clients patch already applied.");
  process.exit(0);
}

function replaceOnce(from, to) {
  if (!source.includes(from)) {
    throw new Error(`Cannot apply normalized clients patch. Missing snippet:\n${from.slice(0, 200)}`);
  }
  source = source.replace(from, to);
}

replaceOnce(
`const supabaseUrl = "https://cocydftwrdshqwvauodb.supabase.co";
const supabaseKey = "sb_publishable_un7LVevS6WPsvuhl2KBPVg_d_wjK9KD";`,
`const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://cocydftwrdshqwvauodb.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_un7LVevS6WPsvuhl2KBPVg_d_wjK9KD";`
);

replaceOnce(
`const [newClientName, setNewClientName] = useState("");
  const [newClientNote, setNewClientNote] = useState("");`,
`const [newClientName, setNewClientName] = useState("");
  const [newClientContact, setNewClientContact] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientNotes, setNewClientNotes] = useState("");`
);

replaceOnce(
`const { data } = await supabase.from("Projekty").select("*").order("created_at", { ascending: false });`,
`const { data } = await supabase.from("Projekty").select("*, clients (*)").order("created_at", { ascending: false });`
);

replaceOnce(
`          notes,
          Projekty (*)`,
`          notes,
          interview_summary,
          recruiter_notes,
          created_at,
          Projekty (
            *,
            clients (*)
          )`
);

replaceOnce(
`    const { error } = await supabase.from("clients").insert([{ name: newClientName.trim(), note: newClientNote.trim() }]);

    if (error) {
      setMessage("Błąd dodawania klienta. Sprawdź, czy masz tabelę clients z kolumnami: id, name, note, created_at. " + error.message);
      return;
    }

    setNewClientName("");
    setNewClientNote("");`,
`    let contactColumn = "osoba_do_kontaktu";
    let includeNotes = true;
    let error = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const payload = {
        name: newClientName.trim(),
        email: newClientEmail.trim(),
        telefon: newClientPhone.trim(),
        [contactColumn]: newClientContact.trim(),
      };

      if (includeNotes) payload.notatki = newClientNotes.trim();

      ({ error } = await supabase.from("clients").insert([payload]));
      if (!error) break;

      const errorMessage = String(error.message || "");
      if (errorMessage.includes("osoba_do_kontaktu")) {
        contactColumn = "osoba do kontaktu";
        continue;
      }
      if (errorMessage.includes("notatki")) {
        includeNotes = false;
        continue;
      }
      break;
    }

    if (error) {
      setMessage("Błąd dodawania klienta: " + error.message);
      return;
    }

    setNewClientName("");
    setNewClientContact("");
    setNewClientEmail("");
    setNewClientPhone("");
    setNewClientNotes("");`
);

replaceOnce(
`    setMessage("Notatka zapisana ✅");
    fetchCandidates();
  };

  const openCv = async (cvPath) => {`,
`    setMessage("Notatka zapisana ✅");
    fetchCandidates();
  };

  const updateProjectRelationField = async (relationId, field, value) => {
    const { error } = await supabase.from("candidate_projects").update({ [field]: value }).eq("id", relationId);

    if (error) {
      setMessage("Błąd zapisu: " + error.message);
      return;
    }

    setMessage("Zapisano ✅");
    fetchCandidates();
  };

  const openCv = async (cvPath) => {`
);

replaceOnce(
`return projects.filter((p) => includesIgnoreCase(`${p.name || ""} ${p.nazwa || ""}`, projectSearch));`,
`return projects.filter((p) => includesIgnoreCase(`${p.name || ""} ${p.nazwa || ""} ${p.kategoria || ""} ${p.lokalizacja || ""} ${p.clients?.name || ""}`, projectSearch));`
);

replaceOnce(
`  const filteredClients = useMemo(() => {
    return clients.filter((c) => includesIgnoreCase(`${c.name || ""} ${c.note || ""}`, clientSearch));
  }, [clients, clientSearch]);

  const getProjectName = (project) => project?.name || project?.nazwa || "Projekt bez nazwy";
  const getClientName = (clientId) => clients.find((c) => c.id === clientId)?.name || "Bez klienta";`,
`  const getClientContact = (client) => client?.osoba_do_kontaktu || client?.["osoba do kontaktu"] || "";
  const getClientNotes = (client) => client?.notatki || client?.note || "";

  const filteredClients = useMemo(() => {
    return clients.filter((c) =>
      includesIgnoreCase(`${c.name || ""} ${getClientContact(c)} ${c.email || ""} ${c.telefon || ""} ${getClientNotes(c)}`, clientSearch)
    );
  }, [clients, clientSearch]);

  const getProjectName = (project) => project?.name || project?.nazwa || "Projekt bez nazwy";
  const getClientName = (clientId) => clients.find((c) => c.id === clientId)?.name || "Bez klienta";
  const getProjectClientName = (project) => project?.clients?.name || getClientName(project?.client_id);
  const getClientProjects = (client) => projects.filter((p) => p.client_id === client.id);`
);

replaceOnce(
`      { label: "Notatki projektowe", get: (c) => (c.candidate_projects || []).map((cp) => `${getProjectName(cp.Projekty)}: ${cp.notes || ""}`).join("; ") },
      { label: "Notatki", get: (c) => c.notatki },`,
`      { label: "Notatki projektowe", get: (c) => (c.candidate_projects || []).map((cp) => `${getProjectName(cp.Projekty)}: ${cp.notes || ""}`).join("; ") },
      { label: "Podsumowania rozmów", get: (c) => (c.candidate_projects || []).map((cp) => `${getProjectName(cp.Projekty)}: ${cp.interview_summary || ""}`).join("; ") },
      { label: "Notatki rekrutera", get: (c) => (c.candidate_projects || []).map((cp) => `${getProjectName(cp.Projekty)}: ${cp.recruiter_notes || ""}`).join("; ") },
      { label: "Notatki", get: (c) => c.notatki },`
);

replaceOnce(
`      { label: "Klient", get: (p) => getClientName(p.client_id) },`,
`      { label: "Klient", get: (p) => getProjectClientName(p) },`
);

replaceOnce(
`      { label: "Nazwa", get: (c) => c.name },
      { label: "Notatka", get: (c) => c.note },
      { label: "Liczba projektów", get: (c) => projects.filter((p) => p.client_id === c.id).length },`,
`      { label: "Nazwa", get: (c) => c.name },
      { label: "Osoba do kontaktu", get: (c) => getClientContact(c) },
      { label: "Email", get: (c) => c.email },
      { label: "Telefon", get: (c) => c.telefon },
      { label: "Notatki", get: (c) => getClientNotes(c) },
      { label: "Liczba projektów", get: (c) => getClientProjects(c).length },`
);

replaceOnce(
`                          Podsumowanie rozmowy / notatka do projektu
                        </summary>
                        <textarea
                          className="mt-2 min-h-28 w-full rounded-xl border p-2 text-sm"
                          placeholder="Wklej tutaj podsumowanie rozmowy, kontekst, potrzeby, nastawienie, next step..."
                          defaultValue={cp.notes || ""}
                          onBlur={(e) => updateProjectNotes(cp.id, e.target.value)}
                        />`,
`                          Notatki projektowe i rozmowy
                        </summary>
                        <label className="mt-3 block text-xs font-bold uppercase text-slate-400">Notatka ogólna</label>
                        <textarea
                          className="mt-2 min-h-28 w-full rounded-xl border p-2 text-sm"
                          placeholder="Krótka notatka projektowa, status, next step..."
                          defaultValue={cp.notes || ""}
                          onBlur={(e) => updateProjectNotes(cp.id, e.target.value)}
                        />
                        <label className="mt-3 block text-xs font-bold uppercase text-slate-400">Podsumowanie rozmowy</label>
                        <textarea
                          className="mt-2 min-h-28 w-full rounded-xl border p-2 text-sm"
                          placeholder="Podsumowanie rozmowy, potrzeby, motywacja, oczekiwania..."
                          defaultValue={cp.interview_summary || ""}
                          onBlur={(e) => updateProjectRelationField(cp.id, "interview_summary", e.target.value)}
                        />
                        <label className="mt-3 block text-xs font-bold uppercase text-slate-400">Notatki rekrutera</label>
                        <textarea
                          className="mt-2 min-h-28 w-full rounded-xl border p-2 text-sm"
                          placeholder="Wewnętrzne uwagi rekrutera, ryzyka, rekomendacja..."
                          defaultValue={cp.recruiter_notes || ""}
                          onBlur={(e) => updateProjectRelationField(cp.id, "recruiter_notes", e.target.value)}
                        />`
);

replaceOnce(
`          const clientName = getClientName(p.client_id);`,
`          const clientName = getProjectClientName(p);`
);

replaceOnce(
`        <div className="grid gap-3 md:grid-cols-4">
          <input className="rounded-xl border p-3 md:col-span-2" placeholder="Nazwa klienta" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
          <input className="rounded-xl border p-3" placeholder="Notatka / branża" value={newClientNote} onChange={(e) => setNewClientNote(e.target.value)} />
          <button onClick={addClient} className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white hover:bg-slate-800">Dodaj klienta</button>`,
`        <div className="grid gap-3 md:grid-cols-5">
          <input className="rounded-xl border p-3" placeholder="Nazwa klienta" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
          <input className="rounded-xl border p-3" placeholder="Osoba do kontaktu" value={newClientContact} onChange={(e) => setNewClientContact(e.target.value)} />
          <input className="rounded-xl border p-3" placeholder="Email" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} />
          <input className="rounded-xl border p-3" placeholder="Telefon" value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} />
          <input className="rounded-xl border p-3" placeholder="Notatki" value={newClientNotes} onChange={(e) => setNewClientNotes(e.target.value)} />
          <button onClick={addClient} className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white hover:bg-slate-800 md:col-span-5 lg:col-span-1">Dodaj klienta</button>`
);

replaceOnce(
`          const clientProjects = projects.filter((p) => p.client_id === client.id);
          return (
            <div key={client.id} className="rounded-3xl bg-white p-5 shadow-sm">
              <h3 className="text-xl font-black">{client.name}</h3>
              {client.note && <p className="mt-1 text-sm text-slate-500">{client.note}</p>}`,
`          const clientProjects = getClientProjects(client);
          return (
            <div key={client.id} className="rounded-3xl bg-white p-5 shadow-sm">
              <h3 className="text-xl font-black">{client.name}</h3>
              {getClientContact(client) && <p className="mt-1 text-sm text-slate-500">Kontakt: <b>{getClientContact(client)}</b></p>}
              {client.email && <p className="mt-1 text-sm text-slate-500">Email: <b>{client.email}</b></p>}
              {client.telefon && <p className="mt-1 text-sm text-slate-500">Telefon: <b>{client.telefon}</b></p>}
              {getClientNotes(client) && <p className="mt-2 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">{getClientNotes(client)}</p>}`
);

replaceOnce(
`            Brak klientów. Jeżeli dodawanie klienta zwróci błąd, utwórz w Supabase tabelę <b>clients</b> z kolumnami: id, name, note, created_at.`,
`            Brak klientów. Dodaj pierwszego klienta, a potem przypisz do niego projekty.`
);

fs.writeFileSync(appPath, source);
console.log("Applied normalized clients patch.");
