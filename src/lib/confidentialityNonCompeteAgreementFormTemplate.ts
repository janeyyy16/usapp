/**
 * Master Confidentiality, Non-Solicitation, Non-Compete, and Affirmative
 * Duty Agreement — sent to every employee (every Staff Form Checklist tier).
 * Text transcribed verbatim from the source document HR supplied.
 *
 * Same HTML/CSS → PDF technique and two-party flow as the Master W-2
 * agreements (see masterW2ExecutiveAgreementFormTemplate.ts): the employee
 * fills in their legal name and residence and signs
 * (FillConfidentialityNonCompeteAgreementPage.tsx), then an employer
 * representative countersigns from HR Paperworks (ReportHRDaily.tsx's
 * "Add Employer Signature" dialog). The Effective Date is the day the
 * employee signs.
 */

export interface ConfidentialityNonCompeteAgreementFormData {
  /** The employee's profile id — not shown on the document, carried along for lookups. */
  employeeId: string;
  /** "Printed Full Legal Name" — also the EMPLOYEE / INDIVIDUAL line at the top. */
  employeeName: string;
  /** "residing at ..." */
  residingAddress: string;
  /** ISO date the agreement takes effect — the day the employee signs. */
  effectiveDate: string;
  employeeDateSigned: string;
  employeeSignatureDataUrl: string;
  employerDateSigned: string;
  employerSignatureDataUrl: string;
  /** Employer representative's printed name / title — typed by HR when countersigning. */
  employerPrintedNameTitle: string;
}

const escapeHtml = (s: string) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const blank = (v: string, width = 220) =>
  v && v.trim() ? `<span class="cnc-fill">${escapeHtml(v)}</span>` : `<span class="cnc-line" style="min-width:${width}px">&nbsp;</span>`;

/** "2026-10-07" (or a full timestamp) -> { day: "7th", month: "October", year: "26", full: "October 7, 2026" }. */
function dateParts(iso: string): { day: string; month: string; year: string; full: string } | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso);
  if (isNaN(d.getTime())) return null;
  const n = d.getDate();
  const suffix = n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th";
  const month = d.toLocaleDateString("en-US", { month: "long" });
  return { day: `${n}${suffix}`, month, year: String(d.getFullYear()).slice(2), full: d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) };
}

export const confidentialityNonCompeteAgreementStyles = `
  .cnc-container * { margin: 0; padding: 0; box-sizing: border-box; }
  .cnc-container { width: 816px; background: #fff; padding: 56px 64px; position: relative; font-family: Arial, Helvetica, sans-serif; color: #111827; font-size: 11px; line-height: 1.5; }
  .cnc-header { text-align: center; margin-bottom: 10px; }
  .cnc-header h1 { font-size: 14px; letter-spacing: 0.2px; line-height: 1.35; }
  .cnc-p { margin: 6px 0; text-align: justify; }
  .cnc-p-fill { text-align: left; line-height: 1.9; }
  .cnc-section-title { font-weight: 700; font-size: 11.5px; margin-top: 14px; margin-bottom: 4px; }
  .cnc-center { text-align: center; font-weight: 700; margin: 12px 0 4px; }
  .cnc-bullet { padding: 2px 0 2px 14px; position: relative; text-align: justify; }
  .cnc-bullet::before { content: "•"; position: absolute; left: 0; }
  .cnc-fill { font-weight: 700; border-bottom: 1px solid #111827; padding: 0 3px; }
  .cnc-line { display: inline-block; border-bottom: 1px solid #111827; }
  .cnc-sign-block { margin-top: 14px; }
  .cnc-sign-title { font-weight: 700; margin-bottom: 6px; }
  .cnc-sign-row { display: flex; gap: 18px; align-items: flex-end; margin-top: 8px; }
  .cnc-sign-field { display: flex; align-items: flex-end; gap: 6px; }
  .cnc-sign-field .cnc-val { display: inline-flex; align-items: flex-end; min-width: 150px; min-height: 30px; border-bottom: 1px solid #111827; padding: 0 3px; font-weight: 700; }
  .cnc-sig-img { max-height: 34px; max-width: 160px; object-fit: contain; }
`;

function signField(label: string, inner: string, minWidth = 150) {
  return `<div class="cnc-sign-field">${escapeHtml(label)}: <span class="cnc-val" style="min-width:${minWidth}px">${inner || "&nbsp;"}</span></div>`;
}

export function buildConfidentialityNonCompeteAgreementBodyMarkup(data: ConfidentialityNonCompeteAgreementFormData, logoDataUrl: string): string {
  const eff = dateParts(data.effectiveDate);
  const empDate = dateParts(data.employeeDateSigned);
  const erDate = dateParts(data.employerDateSigned);
  const sig = (url: string) => (url ? `<img class="cnc-sig-img" src="${url}" alt="Signature" />` : "");
  return `
    <div class="cnc-container">
      <div class="cnc-header">
        ${logoDataUrl ? `<img src="${logoDataUrl}" alt="US In Home Services" style="width:56px;height:56px;object-fit:contain;" />` : ""}
        <h1>MASTER CONFIDENTIALITY, NON-SOLICITATION, NON-COMPETE, AND AFFIRMATIVE DUTY AGREEMENT</h1>
      </div>

      <p class="cnc-p cnc-p-fill">THIS MASTER AGREEMENT (the "Agreement") is made and entered into as of this ${blank(eff?.day ?? "", 50)} day of ${blank(eff?.month ?? "", 110)}, 20${blank(eff?.year ?? "", 24)} (the "Effective Date"), by and between:</p>
      <p class="cnc-p"><b>EMPLOYER:</b> US In Home Services, its subsidiaries, affiliates, related entities (including but not limited to Admin Hub Solutions), successors, and assigns (collectively, the "Company"), having its principal place of business at 3663 Cherry Rd. #101, Memphis, TN 38117, USA.</p>
      <p class="cnc-p cnc-p-fill"><b>EMPLOYEE / INDIVIDUAL:</b> ${blank(data.employeeName, 260)} ("Employee" or "Recipient"), residing at ${blank(data.residingAddress, 420)}.</p>

      <p class="cnc-center">RECITALS</p>
      <p class="cnc-p">WHEREAS, the Company is engaged in specialized appliance repair, home services, BPO operations, dispatch routing, and technical workforce management across multiple jurisdictions; WHEREAS, in the course of employment or engagement, Employee will be granted access to highly valuable, proprietary, and confidential trade secrets, operational systems, B2B client relationships, and specialized technical/administrative personnel; and WHEREAS, to protect the Company’s legitimate business interests, trade secrets, goodwill, and operational security, Employee agrees to be strictly bound by the terms of this Agreement.</p>
      <p class="cnc-p">NOW, THEREFORE, in consideration of employment, continued employment, compensation, and access to Company Confidential Information, Employee agrees as follows:</p>

      <p class="cnc-section-title">SECTION 1. COMPREHENSIVE DEFINITION OF CONFIDENTIAL INFORMATION &amp; TRADE SECRETS</p>
      <p class="cnc-p">1.1. Broad Scope: "Confidential Information" shall mean any and all non-public, proprietary, or confidential information, whether written, oral, electronic, or visual, belonging to, used by, or in the possession of the Company, including but not limited to:</p>
      <p class="cnc-bullet"><b>Business Operations &amp; BPO Systems:</b> Standard Operating Procedures (SOPs), BPO workflows, dispatch routing algorithms, call center scripting, warranty management protocols, and back-office administrative structures (including those of Admin Hub Solutions).</p>
      <p class="cnc-bullet"><b>Client &amp; Vendor Data:</b> B2B commercial client accounts (including GE, Assurant, Samsung, and direct manufacturer relationships), customer lists, pricing structures, discount schedules, service ticket logs, and contract terms.</p>
      <p class="cnc-bullet"><b>Personnel &amp; Technical Data:</b> Technical training manuals, repair methods, technician performance databases, commission tiers, compensation formulas, and the identity, contact information, and skill sets of all field technicians, managers, and remote overseas staff (including Philippine BPO staff).</p>
      <p class="cnc-bullet"><b>Financial &amp; Strategic Data:</b> Profit margins, revenue data, expansion plans, market analyses, and software tool configurations (including AHS App, EarlyRepair, Car IQ integrations).</p>
      <p class="cnc-p">1.2. Exclusions: Confidential Information does not include information that has become generally known to the public strictly through lawful means without breach of this Agreement or any fault of Employee.</p>

      <p class="cnc-section-title">SECTION 2. AFFIRMATIVE DUTY TO REPORT &amp; BAN ON COMPLICITY / CONCEALMENT</p>
      <p class="cnc-p">2.1. Affirmative Duty to Disclose: Employee owes a duty of loyalty to the Company. Employee shall immediately report to Executive Management, in writing, any knowledge or reasonable suspicion of:</p>
      <p class="cnc-bullet">Any unauthorized disclosure or misuse of Company Confidential Information.</p>
      <p class="cnc-bullet">Any effort, proposal, or solicitation by former employees, current employees, or third parties (including competing entities such as Apex Technical Service, Sycamore Appliance, or their principals) to poach Company personnel, divert business, or copy Company systems.</p>
      <p class="cnc-bullet">Any conflict of interest or dual employment involving active Company personnel.</p>
      <p class="cnc-p">2.2. Ban on Concealment &amp; Complicity: Silence, failure to disclose, or concealment of any competing activities, poaching efforts, or internal sabotage shall constitute a material breach of this Agreement, breach of fiduciary duty, and gross misconduct, subjecting Employee to immediate termination for cause and civil liability for damages.</p>

      <p class="cnc-section-title">SECTION 3. RESTRICTIVE COVENANTS (NON-SOLICITATION &amp; NON-COMPETE)</p>
      <p class="cnc-p">3.1. Non-Solicitation of Personnel (Broad Scope): During employment and for a period of two (2) years following the termination of employment for any reason (the "Restricted Period"), Employee shall not, directly or indirectly, solicit, induce, recruit, hire, attempt to hire, or encourage to leave the Company:</p>
      <p class="cnc-bullet">Any field technician, branch manager, administrative officer, or employee of the Company.</p>
      <p class="cnc-bullet">Any remote, offshore, or overseas staff, contractors, or BPO personnel (specifically including staff managed under Admin Hub Solutions or Philippine operations).</p>
      <p class="cnc-p">3.2. Non-Solicitation of Clients &amp; B2B Accounts: During the Restricted Period, Employee shall not, directly or indirectly, solicit, service, divert, or attempt to divert any client, B2B account, warranty provider, or manufacturer with whom the Company did business or solicited during Employee's tenure.</p>
      <p class="cnc-p">3.3. Non-Compete Covenants: During employment and for a period of two (2) years post-termination, Employee shall not directly or indirectly own, manage, operate, join, control, consult for, or be employed by any business entity that directly competes with the Company’s appliance repair, home service, or BPO operations (specifically including Apex Technical Service, Sycamore Appliance, or similar entities) within a fifty (50) mile radius of any Company branch location or operating territory where Employee performed services.</p>

      <p class="cnc-section-title">SECTION 4. DIGITAL SECURITY, UNAUTHORIZED MESSAGING &amp; ASSET RETURN</p>
      <p class="cnc-p">4.1. Prohibition of Off-Grid Communications: Employee shall not use unauthorized, encrypted, or personal third-party messaging channels (e.g., personal Discord, Telegram, WhatsApp) to conduct Company business, transmit Confidential Information, or secretly coordinate with competing entities or former management.</p>
      <p class="cnc-p">4.2. Immediate Return of Property: Upon termination or upon Company request, Employee shall immediately surrender all Company property, including laptops, mobile devices, access keys, credentials, customer files, parts inventory, and digital backups. Employee shall not retain any copies, extracts, or summaries of Confidential Information.</p>

      <p class="cnc-section-title">SECTION 5. LEGAL REMEDIES, INJUNCTIVE RELIEF &amp; ATTORNEY’S FEES</p>
      <p class="cnc-p">5.1. Irreparable Harm &amp; Injunctive Relief: Employee acknowledges that any breach or threatened breach of this Agreement will cause immediate and irreparable harm to the Company for which monetary damages alone would be inadequate. Accordingly, the Company shall be entitled to seek an immediate Temporary Restraining Order (TRO), Preliminary Injunction, and Permanent Injunction from any court of competent jurisdiction to enforce this Agreement, without the necessity of posting a bond.</p>
      <p class="cnc-p">5.2. Liquidated &amp; Compensatory Damages: In addition to injunctive relief, the Company shall be entitled to recover full monetary damages, disgorgement of any profits or compensation earned by Employee as a result of the breach, and financial restitution for lost business or diverted personnel.</p>
      <p class="cnc-p">5.3. Full Recovery of Attorney’s Fees &amp; Legal Costs: In the event of any legal action, arbitration, or litigation arising out of or related to the enforcement of this Agreement, the prevailing party (and specifically the Company if enforcing its rights) shall be entitled to recover from the breaching party all attorneys' fees, court costs, expert witness fees, and litigation expenses incurred.</p>

      <p class="cnc-section-title">SECTION 6. GOVERNING LAW, JURISDICTION &amp; SEVERABILITY</p>
      <p class="cnc-p">6.1. Governing Law &amp; Venue: This Agreement shall be governed by, construed, and enforced in accordance with the laws of the State of Tennessee, without regard to its conflict of law principles. Any legal action arising hereunder shall be brought exclusively in the state or federal courts located in Shelby County, Tennessee, and Employee consents to personal jurisdiction therein.</p>
      <p class="cnc-p">6.2. Severability &amp; Blue-Penciling: If any provision, clause, or restriction of this Agreement is held by a court to be invalid, illegal, or unenforceable, such provision shall be deemed modified ("blue-penciled") to the minimum extent necessary to make it valid and enforceable, and the remaining provisions of this Agreement shall remain in full force and effect.</p>
      <p class="cnc-p">6.3. At-Will Status Preserved: Nothing in this Agreement shall be construed to alter the "At-Will" nature of Employee's employment. Either party may terminate employment at any time, with or without cause or prior notice.</p>

      <p class="cnc-center">ACKNOWLEDGMENT OF VOLUNTARY EXECUTION</p>
      <p class="cnc-p">BY SIGNING BELOW, EMPLOYEE ACKNOWLEDGES THAT THEY HAVE READ, UNDERSTOOD, AND VOLUNTARILY AGREE TO ALL TERMS OF THIS AGREEMENT. EMPLOYEE CONFIRMS THEY HAVE HAD THE OPPORTUNITY TO CONSULT WITH INDEPENDENT LEGAL COUNSEL PRIOR TO SIGNING.</p>

      <div class="cnc-sign-block">
        <div class="cnc-sign-title">EMPLOYEE:</div>
        <div class="cnc-sign-row">
          ${signField("Signature", sig(data.employeeSignatureDataUrl), 190)}
          ${signField("Date", empDate ? escapeHtml(empDate.full) : "", 120)}
        </div>
        <div class="cnc-sign-row">${signField("Printed Full Legal Name", data.employeeName ? escapeHtml(data.employeeName) : "", 300)}</div>
      </div>

      <div class="cnc-sign-block">
        <div class="cnc-sign-title">EMPLOYER REPRESENTATIVE (US IN HOME SERVICES):</div>
        <div class="cnc-sign-row">
          ${signField("Authorized Representative Signature", sig(data.employerSignatureDataUrl), 170)}
          ${signField("Date", erDate ? escapeHtml(erDate.full) : "", 120)}
        </div>
        <div class="cnc-sign-row">${signField("Name / Title", data.employerPrintedNameTitle ? escapeHtml(data.employerPrintedNameTitle) : "", 300)}</div>
      </div>
    </div>
  `;
}
