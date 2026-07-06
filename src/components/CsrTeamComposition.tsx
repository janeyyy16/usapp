/**
 * CSR Team Composition — roster on the left, team placeholders on the right.
 *
 * - Left: the CSR roster (Team Leaders + Agents) from csrStaff.ts. Everyone
 *   starts here, unassigned.
 * - Right: empty team placeholders. Drag a Team Leader onto a team and they
 *   become its leader automatically; drag Agents in as members. You can also
 *   click the crown to (re)assign a leader, rename teams, add/remove teams.
 * - Drag anyone back to the roster to unassign. In-memory (offline placeholder).
 */

import { useMemo, useState } from "react";
import { RotateCcw, GripVertical, Users, Plus, X, Crown, UserCog, Pencil } from "lucide-react";
import { CSR_STAFF, type CsrStaff } from "@/lib/csrStaff";

const ROSTER = "__roster__";
const TEAM_COLORS = ["#3b82f6", "#34d399", "#a78bfa", "#fb923c", "#f43f5e", "#14b8a6", "#eab308", "#06b6d4", "#ec4899", "#22c55e"];

interface Team { key: string; name: string; color: string; custom?: boolean; }

const firstName = (full: string) => (full || "").trim().split(/\s+/)[0] || "";

export function CsrTeamComposition() {
  const staff = CSR_STAFF;
  const roleOf = useMemo(() => {
    const m: Record<string, CsrStaff["role"]> = {};
    for (const p of staff) m[p.name] = p.role;
    return m;
  }, [staff]);

  const defaultTeams: Team[] = [
    { key: "team-1", name: "Team 1", color: TEAM_COLORS[0] },
    { key: "team-2", name: "Team 2", color: TEAM_COLORS[1] },
  ];

  const [teams, setTeams] = useState<Team[]>(defaultTeams);
  const [assign, setAssign] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const p of staff) m[p.name] = ROSTER;
    return m;
  });
  const [leaders, setLeaders] = useState<Record<string, string>>({}); // teamKey -> name
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const membersOf = (key: string) => staff.filter((p) => assign[p.name] === key);
  const rosterLeaders = membersOf(ROSTER).filter((p) => p.role === "Team Leader");
  const rosterAgents = membersOf(ROSTER).filter((p) => p.role !== "Team Leader");

  const moveTo = (name: string, target: string) => {
    setAssign((prev) => (prev[name] === target ? prev : { ...prev, [name]: target }));
    if (target !== ROSTER && roleOf[name] === "Team Leader") {
      setLeaders((prev) => {
        const next = { ...prev };
        for (const tk of Object.keys(next)) if (next[tk] === name && tk !== target) delete next[tk];
        next[target] = name;
        return next;
      });
      // team name auto-adopts the leader's first name unless it was renamed by hand
      setTeams((prev) => prev.map((t) => (t.key === target && !t.custom ? { ...t, name: firstName(name) } : t)));
    } else {
      setLeaders((prev) => {
        const next = { ...prev };
        for (const tk of Object.keys(next)) if (next[tk] === name && tk !== target) delete next[tk];
        return next;
      });
    }
  };

  const setLeader = (teamKey: string, name: string) => {
    setLeaders((prev) => ({ ...prev, [teamKey]: prev[teamKey] === name ? "" : name }));
    setTeams((prev) => prev.map((t) => (t.key === teamKey && !t.custom && leaders[teamKey] !== name ? { ...t, name: firstName(name) } : t)));
  };

  const renameTeam = (key: string, name: string) =>
    setTeams((prev) => prev.map((t) => (t.key === key ? { ...t, name, custom: true } : t)));

  const addTeam = () =>
    setTeams((prev) => [...prev, { key: `team-${Date.now()}`, name: `Team ${prev.length + 1}`, color: TEAM_COLORS[prev.length % TEAM_COLORS.length] }]);

  const removeTeam = (key: string) => {
    setAssign((prev) => { const n = { ...prev }; for (const k of Object.keys(n)) if (n[k] === key) n[k] = ROSTER; return n; });
    setLeaders((prev) => { const n = { ...prev }; delete n[key]; return n; });
    setTeams((prev) => prev.filter((t) => t.key !== key));
  };

  const resetAll = () => {
    setTeams(defaultTeams);
    setAssign(() => { const m: Record<string, string> = {}; for (const p of staff) m[p.name] = ROSTER; return m; });
    setLeaders({});
  };

  const dirty = membersOf(ROSTER).length !== staff.length || teams.length !== defaultTeams.length;

  const Card = ({ p, teamKey }: { p: CsrStaff; teamKey: string }) => {
    const isLeader = teamKey !== ROSTER && leaders[teamKey] === p.name;
    const isTL = p.role === "Team Leader";
    return (
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", p.name);
          // Defer the visual state change so re-rendering the source node
          // doesn't cancel the (just-started) native drag on the first try.
          requestAnimationFrame(() => setDragging(p.name));
        }}
        onDragEnd={() => { setDragging(null); setOver(null); }}
        className={`group flex items-center gap-1.5 rounded-lg border px-2 py-1.5 cursor-grab active:cursor-grabbing ${
          isLeader ? "bg-white/10" : "border-white/10 bg-white/5"
        } ${dragging === p.name ? "opacity-50" : ""}`}
        style={isLeader ? { borderColor: "#f59e0b" } : undefined}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium truncate flex items-center gap-1">
            {isLeader && <Crown className="h-3 w-3 shrink-0 text-amber-500" />}
            {p.name}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">
            {isLeader ? "Team Leader (lead)" : isTL ? "Team Leader" : "CSR Agent"}
          </div>
        </div>
        {teamKey !== ROSTER && (
          <button type="button" onClick={(e) => { e.stopPropagation(); setLeader(teamKey, p.name); }}
            title={isLeader ? "Unset leader" : "Set as team leader"}
            className={`shrink-0 rounded-md p-1 transition-colors ${isLeader ? "text-amber-500" : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-amber-500"}`}>
            <Crown className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="panel p-4 mb-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Team Composition</h3>
          <span className="text-xs text-muted-foreground">{teams.length} teams · {staff.length} staff</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={addTeam}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/25">
            <Plus className="h-3.5 w-3.5" /> Add Team
          </button>
          <button type="button" onClick={resetAll} disabled={!dirty}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr] items-start">
        {/* LEFT — roster */}
        <div
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (over !== ROSTER) setOver(ROSTER); }}
          onDragLeave={() => setOver((o) => (o === ROSTER ? null : o))}
          onDrop={(e) => { const n = e.dataTransfer.getData("text/plain") || dragging; if (n) moveTo(n, ROSTER); setDragging(null); setOver(null); }}
          className={`rounded-xl border p-3 transition-colors overflow-y-auto max-h-[calc(100vh-220px)] lg:sticky lg:top-4 ${over === ROSTER ? "border-primary bg-white/10" : "border-white/10 bg-white/5"}`}
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-2 flex items-center gap-1.5">
            <UserCog className="h-3.5 w-3.5" /> Team Leaders · {rosterLeaders.length}
          </div>
          <div className="flex flex-col gap-1.5 mb-4">
            {rosterLeaders.length === 0 && <div className="text-[11px] text-muted-foreground italic px-1">All leaders placed.</div>}
            {rosterLeaders.map((p) => <Card key={p.name} p={p} teamKey={ROSTER} />)}
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-2 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> CSR Agents · {rosterAgents.length}
          </div>
          <div className="flex flex-col gap-1.5">
            {rosterAgents.length === 0 && <div className="text-[11px] text-muted-foreground italic px-1">All agents placed.</div>}
            {rosterAgents.map((p) => <Card key={p.name} p={p} teamKey={ROSTER} />)}
          </div>
        </div>

        {/* RIGHT — team placeholders */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 content-start">
          {teams.map((team) => {
            const members = membersOf(team.key);
            const leaderName = leaders[team.key];
            const isOver = over === team.key;
            return (
              <div
                key={team.key}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (over !== team.key) setOver(team.key); }}
                onDragLeave={() => setOver((o) => (o === team.key ? null : o))}
                onDrop={(e) => { const n = e.dataTransfer.getData("text/plain") || dragging; if (n) moveTo(n, team.key); setDragging(null); setOver(null); }}
                className={`rounded-xl border p-2.5 transition-colors ${isOver ? "bg-white/10" : "border-white/10 bg-white/5"}`}
                style={isOver ? { borderColor: team.color } : undefined}
              >
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: team.color }} />
                  <div className="min-w-0 flex-1">
                    {editingKey === team.key ? (
                      <input autoFocus value={team.name} onChange={(e) => renameTeam(team.key, e.target.value)}
                        onBlur={() => setEditingKey(null)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingKey(null); }}
                        className="glass-input !py-0.5 !px-1.5 text-[13px] font-semibold w-full" style={{ color: team.color }} placeholder="Team name" />
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="text-[13px] font-semibold truncate" style={{ color: team.color }}>
                          {team.name || "Untitled team"}
                        </span>
                        <button type="button" onClick={() => setEditingKey(team.key)} title="Edit team name"
                          className="shrink-0 rounded p-0.5 text-muted-foreground opacity-70 hover:opacity-100 hover:text-foreground">
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {leaderName ? `Lead: ${leaderName}` : "Drag a Team Leader here"} · {members.length} member{members.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <button type="button" onClick={() => removeTeam(team.key)} title="Remove team"
                    className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-red-500 hover:bg-white/10">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex flex-col gap-1.5 min-h-[64px]">
                  {members.length === 0 && <div className="text-[11px] text-muted-foreground italic px-1 py-3 text-center">Drop leader &amp; agents here…</div>}
                  {members.map((p) => <Card key={p.name} p={p} teamKey={team.key} />)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Drag a Team Leader onto a team to set its lead, then drag Agents in. Drag anyone back to the roster to unassign, or use the crown to change a leader. Team names are editable; use "Add Team" for more. Placeholder data — adjust once integrated online.
      </p>
    </div>
  );
}
