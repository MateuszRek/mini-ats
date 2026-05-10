// MINI ATS — SUPABASE ONLINE

import React, { useMemo, useState, useEffect, useLayoutEffect, useRef } from "react";
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

const DEFAULT_LANGUAGES = ["Java", "JavaScript", "TypeScript", "Python", "Go", "C#", "C++", "PHP", "Ruby", "Kotlin", "Swift", "SQL"];
const DEFAULT_FRAMEWORKS = ["React", "Angular", "Vue", "Next.js", "Node.js", "Express", "Spring", "Django", "Flask", ".NET", "Laravel", "Symfony", "NestJS"];

const TECHNOLOGY_GROUPS = {
  Backend: ["Java", "Spring", "Spring Boot", "Kotlin", "Go", "Python", "Django", "FastAPI", "Node.js", "NestJS", ".NET", "C#"],
  Frontend: ["React", "Next.js", "Angular", "Vue", "TypeScript", "JavaScript", "HTML", "CSS"],
  Cloud: ["AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform"],
  DevOps: ["CI/CD", "Linux", "SRE", "Monitoring", "GitHub Actions", "Jenkins"],
  "AI/Data": ["Python", "ML", "AI", "LLM", "Pandas", "Spark", "Databricks", "MLOps"],
  Databases: ["SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Supabase", "Snowflake"],
};

const QUICK_FILTER_CHIPS = ["Java", "React", "AI", "Remote", "Senior", "English C1", "AWS", "Kubernetes", "Recommended", "Shortlist"];

const DEFAULT_ADVANCED_FILTERS = {
  minExperience: "",
  maxExperience: "",
  city: "",
  country: "",
  remote: false,
  relocation: false,
  statuses: [],
  technologies: [],
  englishLevel: "",
  availability: "",
  projectHistory: "any",
};

function splitSearchTerms(value) {
  return String(value || "")
    .replace(/#/g, "")
    .split(/[,;/|]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getMaybe(candidate, keys) {
  for (const key of keys) {
    if (candidate?.[key] !== undefined && candidate?.[key] !== null) return candidate[key];
  }
  return "";
}

function getCandidateExperience(candidate) {
  const raw = getMaybe(candidate, ["doświadczenie", "doĹ›wiadczenie", "doswiadczenie", "experience"]);
  const match = String(raw || "").replace(",", ".").match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function getCandidateSearchText(candidate) {
  const projectText = (candidate?.candidate_projects || [])
    .map((cp) =>
      [
        cp.status,
        cp.notes,
        cp.interview_summary,
        cp.recruiter_notes,
        cp.recommended_to_client ? "recommended sent client diamond" : "",
        cp.Projekty?.name,
        cp.Projekty?.nazwa,
