import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, RefreshCw, Loader2, ChevronRight } from "lucide-react";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";
import { MODULES } from "@/lib/modules";
import { ROLE_OPTIONS, ROLE_LABELS, isModuleAllowed } from "@/lib/roleLabels";
import { computeSubmoduleFallbackAccess } from "@/lib/dashboardAccess";
import {
  getCompanyRoleModuleAccess,
  setRoleModuleAccess,
  resolveModuleAccessOverride,
  type RoleModuleAccessRow,
} from "@/lib/supabase/roleModuleAccess";

interface Props {
  mod: ModuleDef;
  sub: SubModuleDef;
}

function upsertLocal(
  rows: RoleModuleAccessRow[],
  role: string,
  moduleSlug: string,
  submoduleSlug: string,
  allowed: boolean
): RoleModuleAccessRow[] {
  const idx = rows.findIndex((r) => r.role === role && r.moduleSlug === moduleSlug && r.submoduleSlug === submoduleSlug);
  if (idx === -1) return [...rows, { role, moduleSlug, submoduleSlug, allowed }];
  const copy = [...rows];
  copy[idx] = { ...copy[idx], allowed };
  return copy;
}

/**
 * Role x Module/Submodule access matrix — pick a role on the left, see (and
 * edit) exactly which modules/submodules it can open on the right. Every
 * checkbox's default state reflects TODAY's real, already-enforced rules
 * (CSR allow-list, Admin-module gate, User Management gate, Company
 * Settings gate, Dashboard-submodule gate — see computeSubmoduleFallbackAccess
 * in dashboardAccess.ts), so e.g. CSR Agent/Team Leader/Manager show up
 * mostly unchecked out of the box, matching their real current restriction.
 *
 * Toggling a checkbox writes a role_module_access override (migration
 * 0154) that the real route gate (m.$module.$submodule.tsx) and the
 * "Modules" hover strip (ModuleNavigator.tsx) both actually enforce — this
 * is live, not a read-only reference. A module-level checkbox is its own
 * independent override (applies to any submodule under it that has no more
 * specific override of its own); it does not cascade into its children
 * when toggled.
 *
 * Formerly this page/slug was "Accessibility Management" for the bulk
 * secondary-role grid — that page is now Role Management (see
 * RoleManagementPage.tsx); this is a new, unrelated feature that reused the
 * name because it fits what this one now does.
 */
export function AccessibilityManagementPage({ mod, sub }: Props) {
  const [overrides, setOverrides] = useState<RoleModuleAccessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>(ROLE_OPTIONS[0]?.value ?? "");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => new Set(MODULES.map((m) => m.slug)));
  // `${moduleSlug}:${submoduleSlug}` (submoduleSlug "" for a module-level row) of the one checkbox currently saving.
  const [savingCell, setSavingCell] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOverrides = async () => {
    setLoading(true);
    try {
      setOverrides(await getCompanyRoleModuleAccess());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverrides();
  }, []);

  const moduleEffectiveAccess = (moduleSlug: string): boolean => {
    const ov = resolveModuleAccessOverride(overrides, selectedRole, [], moduleSlug, "");
    if (ov !== undefined) return ov;
    return isModuleAllowed(selectedRole, moduleSlug, []);
  };

  const submoduleEffectiveAccess = (m: ModuleDef, s: SubModuleDef): boolean => {
    const ov = resolveModuleAccessOverride(overrides, selectedRole, [], m.slug, s.slug);
    if (ov !== undefined) return ov;
    return computeSubmoduleFallbackAccess(m, s, selectedRole);
  };

  const toggleCell = async (moduleSlug: string, submoduleSlug: string, checked: boolean) => {
    const cellKey = `${moduleSlug}:${submoduleSlug}`;
    const prevOverrides = overrides;
    setOverrides((prev) => upsertLocal(prev, selectedRole, moduleSlug, submoduleSlug, checked));
    setSavingCell(cellKey);
    setError(null);
    try {
      await setRoleModuleAccess(selectedRole, moduleSlug, submoduleSlug, checked);
    } catch (err) {
      setOverrides(prevOverrides);
      setError(err instanceof Error ? err.message : "Failed to update access.");
    } finally {
      setSavingCell(null);
    }
  };

  const toggleModuleExpanded = (moduleSlug: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleSlug)) next.delete(moduleSlug);
      else next.add(moduleSlug);
      return next;
    });
  };

  const selectedRoleLabel = useMemo(
    () => ROLE_OPTIONS.find((r) => r.value === selectedRole)?.label ?? selectedRole,
    [selectedRole]
  );

  return (
    <main className="flex-1 bg-slate-950 py-6">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="mb-4 flex flex-wrap items-center gap-3 text-white">
          <Link to="/m/$module" params={{ module: mod.slug }} className="btn">
            <ChevronLeft className="h-4 w-4" />
            {mod.label}
          </Link>
          <div>
            <h1 className="text-2xl font-semibold leading-tight">{sub.title}</h1>
            <p className="text-sm text-muted-foreground">{sub.description}</p>
          </div>
          <button
            onClick={() => void loadOverrides()}
            disabled={loading}
            className="ml-auto inline-flex items-center gap-2 btn hover:bg-white/15 disabled:opacity-60"
            title="Re-read overrides from Supabase"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        <div className="panel mb-4">
          <p className="text-sm text-slate-300">
            Checkboxes reflect what <span className="font-semibold text-white">{selectedRoleLabel}</span> can open{" "}
            <span className="font-semibold text-white">right now</span> — including today's existing restrictions
            (e.g. CSR-tier roles are limited to Dashboard/Tickets by default). Checking or unchecking a box takes
            effect immediately for everyone with this role.
          </p>
          {error && <p className="mt-2 text-sm text-red-300">⚠ {error}</p>}
        </div>

        <div className="grid gap-4 lg:grid-cols-[240px_1fr] items-start">
          {/* Roles list */}
          <div className="panel p-2 max-h-[75vh] overflow-y-auto">
            {ROLE_OPTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setSelectedRole(r.value)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                  selectedRole === r.value
                    ? "bg-blue-500/20 text-blue-200 font-semibold"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Module/Submodule tree for the selected role */}
          <div className="panel p-0 overflow-hidden">
            {loading ? (
              <div className="px-4 py-6 text-center text-sm text-slate-400">Loading…</div>
            ) : (
              <div className="divide-y divide-white/5">
                {MODULES.map((m) => {
                  const expanded = expandedModules.has(m.slug);
                  const moduleChecked = moduleEffectiveAccess(m.slug);
                  const moduleCellKey = `${m.slug}:`;
                  const moduleSaving = savingCell === moduleCellKey;
                  return (
                    <div key={m.slug}>
                      <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.03]">
                        <button
                          type="button"
                          onClick={() => toggleModuleExpanded(m.slug)}
                          className="text-slate-400 hover:text-white transition"
                          title={expanded ? "Collapse" : "Expand"}
                        >
                          <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`} />
                        </button>
                        {moduleSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        ) : (
                          <input
                            type="checkbox"
                            checked={moduleChecked}
                            onChange={(e) => void toggleCell(m.slug, "", e.target.checked)}
                            className="h-4 w-4 accent-blue-500"
                            title="Module-level default — applies to any submodule below without its own override"
                          />
                        )}
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: m.accent }}
                        />
                        <span className="font-semibold text-white text-sm">{m.label}</span>
                        <span className="text-xs text-slate-500">{m.tagline}</span>
                      </div>

                      {expanded && (
                        <div>
                          {m.submodules.map((s) => {
                            const subChecked = submoduleEffectiveAccess(m, s);
                            const subCellKey = `${m.slug}:${s.slug}`;
                            const subSaving = savingCell === subCellKey;
                            return (
                              <div
                                key={s.slug}
                                className="flex items-center gap-3 pl-12 pr-4 py-2 hover:bg-white/[0.02]"
                              >
                                {subSaving ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                                ) : (
                                  <input
                                    type="checkbox"
                                    checked={subChecked}
                                    onChange={(e) => void toggleCell(m.slug, s.slug, e.target.checked)}
                                    className="h-3.5 w-3.5 accent-blue-500"
                                  />
                                )}
                                <span className="text-sm text-slate-200">{s.title}</span>
                                {s.hiddenFromGrid && (
                                  <span className="text-[10px] uppercase tracking-wide text-slate-500">
                                    (not on tile grid)
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Role labels reference: {ROLE_OPTIONS.map((r) => ROLE_LABELS[r.value] ?? r.label).length} roles ·{" "}
          {MODULES.reduce((sum, m) => sum + m.submodules.length, 0)} submodules across {MODULES.length} modules.
        </p>
      </div>
    </main>
  );
}
