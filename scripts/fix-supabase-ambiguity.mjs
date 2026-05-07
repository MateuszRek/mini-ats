import fs from "node:fs";

const appPath = new URL("../src/App.jsx", import.meta.url);
let source = fs.readFileSync(appPath, "utf8");
let changed = false;

function replaceAllExact(from, to) {
  if (!source.includes(from)) return;
  source = source.split(from).join(to);
  changed = true;
}

function replacePattern(pattern, to) {
  const next = source.replace(pattern, to);
  if (next === source) return;
  source = next;
  changed = true;
}

replaceAllExact(`.select("*, clients (*)")`, `.select("*")`);

replacePattern(/          Projekty \(\r?\n            \*,\r?\n            clients \(\*\)\r?\n          \)/g, `          Projekty (*)`);

replaceAllExact(
`  const getProjectClientName = (project) => project?.clients?.name || getClientName(project?.client_id);`,
`  const getProjectClientName = (project) => getClientName(project?.client_id);`
);

if (changed) {
  fs.writeFileSync(appPath, source);
  console.log("Fixed Supabase ambiguous clients relationship.");
} else {
  console.log("Supabase ambiguous clients relationship fix already applied.");
}
