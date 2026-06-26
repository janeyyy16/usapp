import { useState } from "react";
import { FileText, Wrench, DollarSign, Receipt, Link2, ClipboardList, Package, Paperclip, PanelLeftClose, Menu } from "lucide-react";

type TabKey = "general" | "tracking" | "compensation" | "billing";

interface TicketSidebarProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}

// Sub-sections live inside the "tracking" tab; clicking switches the tab then
// scrolls to the section by its anchor id.
const TRACKING_SECTIONS = [
  { id: "section-related-tickets", label: "Related Tickets", icon: Link2 },
  { id: "section-visit-log",       label: "Visit Log",        icon: ClipboardList },
  { id: "section-part-transaction",label: "Part Transaction", icon: Package },
  { id: "section-attachments",     label: "Attachments",      icon: Paperclip },
];

export function TicketSidebar({ activeTab, setActiveTab }: TicketSidebarProps) {
  const [open, setOpen] = useState(true);

  const jumpToTracking = (anchorId: string) => {
    setActiveTab("tracking");
    setTimeout(() => {
      document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const TopBtn = ({ tab, label, Icon }: { tab: TabKey; label: string; Icon: React.ElementType }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
        activeTab === tab
          ? "bg-blue-500/25 text-white font-semibold border border-blue-400/40"
          : "text-slate-300 hover:bg-white/8 hover:text-white border border-transparent"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  );

  // Collapsed: show a small floating "open" button (three dashes / menu icon).
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="hidden xl:flex fixed left-3 top-24 z-20 h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
        title="Open ticket sections"
        aria-label="Open ticket sections"
      >
        <Menu className="h-5 w-5" />
      </button>
    );
  }

  return (
    <aside className="hidden xl:block fixed left-0 top-24 w-56 px-3">
      <div className="rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-2.5">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Ticket Sections
          </span>
          <button
            onClick={() => setOpen(false)}
            className="grid h-6 w-6 place-items-center rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Collapse"
            aria-label="Collapse ticket sections"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-1">
          <TopBtn tab="general" label="General" Icon={FileText} />
          <TopBtn tab="tracking" label="Service Tracking" Icon={Wrench} />

          {/* Tracking sub-sections */}
          <div className="ml-3 border-l border-white/10 pl-2 space-y-0.5 py-1">
            {TRACKING_SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => jumpToTracking(s.id)}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] text-slate-400 hover:bg-white/8 hover:text-white transition-colors"
              >
                <s.icon className="h-3.5 w-3.5 shrink-0" />
                {s.label}
              </button>
            ))}
          </div>

          <TopBtn tab="compensation" label="Compensation" Icon={DollarSign} />
          <TopBtn tab="billing" label="Billing" Icon={Receipt} />
        </div>
      </div>
    </aside>
  );
}
