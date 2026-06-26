/**
 * FixedDropdown — position:fixed + getBoundingClientRect so the list
 * always renders directly below the trigger button, regardless of
 * overflow/stacking context on any parent.
 *
 * Key fix: position is read inside useLayoutEffect AFTER the open render,
 * so getBoundingClientRect() always reflects the current scroll position.
 */
import { useState, useRef, useEffect, useLayoutEffect, useCallback, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface FixedDropdownProps {
  label: string;
  display: ReactNode;
  placeholder?: boolean;
  listWidth?: number | "match";
  className?: string;
  children: ReactNode;
}

export function FixedDropdown({
  label, display, placeholder, listWidth = "match",
  className = "relative flex-1", children,
}: FixedDropdownProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Read position AFTER the render that set open=true, so scroll is current
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 2, left: r.left, width: r.width });
  }, [open]);

  // Reposition on scroll or resize while open
  const reposition = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 2, left: r.left, width: r.width });
  }, []);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, reposition]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        listRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  const listStyle: React.CSSProperties = pos ? {
    position: "fixed",
    top: pos.top,
    left: pos.left,
    width: listWidth === "match" ? pos.width : listWidth,
    zIndex: 99999,
    maxHeight: 260,
    overflowY: "auto",
    background: "rgb(22, 28, 52)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "6px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  } : { display: "none" };

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen(o => !o)}
        className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2 text-left"
      >
        <span className={`truncate ${placeholder ? "text-muted-foreground" : ""}`}>{display}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div ref={listRef} role="listbox" aria-label={label} style={listStyle}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Single-select ──────────────────────────────────────────────────────────
interface SelectDropdownProps {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  emptyLabel?: string;
  listWidth?: number | "match";
  className?: string;
}

export function SelectDropdown({
  label, options, value, onChange,
  emptyLabel = "— All —", listWidth = "match", className,
}: SelectDropdownProps) {
  return (
    <FixedDropdown
      label={label} display={value || emptyLabel} placeholder={!value}
      listWidth={listWidth} className={className ?? "relative flex-1"}
    >
      <button type="button" onClick={() => onChange("")}
        className={`w-full text-left px-3 py-2.5 text-sm hover:bg-white/10 ${!value ? "bg-blue-600 text-white" : "text-slate-300"}`}>
        {emptyLabel}
      </button>
      {options.map(o => (
        <button type="button" key={o} onClick={() => onChange(o)}
          className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 ${value === o ? "bg-blue-600 text-white" : "text-slate-200"}`}>
          {o}
        </button>
      ))}
    </FixedDropdown>
  );
}

// ─── Location dropdown ───────────────────────────────────────────────────────
interface LocationDropdownProps {
  locations: string[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}

export function LocationDropdown({ locations, value, onChange, className }: LocationDropdownProps) {
  return (
    <FixedDropdown
      label="Select location" display={value || "All Locations"}
      placeholder={!value} className={className ?? "relative flex-1"}
    >
      {locations.map((l, i) => (
        <button type="button" key={i} onClick={() => onChange(l)}
          className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 ${value === l ? "bg-blue-600 text-white" : l === "" ? "text-slate-400" : "text-slate-200"}`}>
          {l || "— All Locations —"}
        </button>
      ))}
    </FixedDropdown>
  );
}

// ─── Multi-check dropdown ────────────────────────────────────────────────────
interface MultiCheckDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  listWidth?: number | "match";
  className?: string;
}

export function MultiCheckDropdown({
  label, options, selected, onChange, listWidth = 264, className,
}: MultiCheckDropdownProps) {
  const all = selected.length === options.length;
  const display = selected.length === 0 ? "None selected"
    : all ? "All selected"
    : selected.length <= 3 ? selected.join(", ")
    : `${selected.slice(0, 3).join(", ")} +${selected.length - 3}`;

  return (
    <FixedDropdown
      label={label} display={display}
      placeholder={selected.length === 0} listWidth={listWidth}
      className={className ?? "relative flex-1"}
    >
      <label className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 cursor-pointer border-b border-white/10 text-sm font-medium text-slate-200">
        <input type="checkbox" checked={all}
          onChange={() => onChange(all ? [] : [...options])}
          className="accent-blue-500" title="Select all"/>
        [ Select All ]
      </label>
      {options.map(o => (
        <label key={o} className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 cursor-pointer text-sm text-slate-200">
          <input type="checkbox"
            checked={selected.includes(o)}
            onChange={() => onChange(
              selected.includes(o) ? selected.filter(x => x !== o) : [...selected, o]
            )}
            className="accent-blue-500" title={o}/>
          {o}
        </label>
      ))}
    </FixedDropdown>
  );
}
