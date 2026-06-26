/**
 * OFFLINE DUMMY DATA
 * All data is local — no database, no network calls.
 * Used by the offline/demo version of Admin Hub Solutions.
 */

// ─── People ────────────────────────────────────────────────────────────────

export const TECHNICIANS = [
  "Danny Thornton","Marcus Webb","Carlos Rivera","James Okafor","David Kim",
  "Nelson Ogutu","Sean Smith","Christian Newson","Jacob Morehouse","Tyler Brooks",
  "Anthony Lewis","Michael Torres","Robert Hughes","Kevin Scott","Brian Hall",
  "Jason Turner","Eric Adams","Nathan Mitchell","Patrick Bailey","Derek Foster",
];

export const CSR_AGENTS = {
  "Team Daniela": ["Liza Park","Monica Reed","Terry Chase","Gina Flores","Omar Hassan"],
  "Team Robyn":   ["Alicia James","Deon Wright","Priya Nair","Sam Yuen","Cleo Martin"],
  "Team Rochelle":["Bea Santos","Will Cooper","Nina Shah","Lance Powell","Maya Torres"],
  "Team Shane":   ["Leo Grant","Iris Kim","Marcus Dale","Tanya Brown","Felix Ruiz"],
};

export const ALL_CSR = Object.values(CSR_AGENTS).flat();

export const MANAGERS = [
  "Aleena Hii","Daven Hodge","Ian Montesclaros","Jerich Leonard",
  "Jonathon Allen","Justin Parker","Naveen Lakhani","Raul Bayuyos Jr",
];

// ─── Locations / Branches ──────────────────────────────────────────────────

export const BRANCHES = [
  "Asheville","Atlanta","Birmingham","Charlotte","Chattanooga","Columbus",
  "Destin","Dallas","Huntsville","Jackson, MS","Jackson, TN","Jacksonville",
  "Jonesboro","Knoxville","Lake Charles","Little Rock","Memphis","Nashville",
  "New Orleans","Philippines","Raleigh","Wilmington",
];

// ─── Brands / Sources ─────────────────────────────────────────────────────

export const BRANDS = [
  "GE","Electrolux","Assurant","Samsung","LG","Whirlpool","Maytag",
  "Frigidaire","Bosch","Miele","Midea","Hisense","Alliance Speed Queen",
  "Centricity","AIG","Asurion","SquareTrade","Fidelity","NSA","SPPN",
  "Internal","OOW","Builder","Others",
];

export const TICKET_SOURCES = [
  "GE","LG","Samsung","Midea","NSA","SB","SP","SS","EarlyRepair","Assurant","Electrolux",
];

// ─── Status sets ──────────────────────────────────────────────────────────

export const REPAIR_STATUSES = [
  "TR-Need PO","CL-Need","OP-Ready for Service","CSR-Needs Scheduling",
  "OP-Waiting for Part","CL-Parts Back Ordered","CL-Ready to Complete",
  "OP-Reschedule Follow up","CSR-Left Message for Cx","CSR-Acknowledged",
  "Cancel","Completed","OP-UPDATE HOLD","PT-Need PreAuthorization",
  "CL-Claimed","Data Closed",
];

export const PART_STATUSES = [
  "PO Made","Not Used & Stocked","CX Home","Part Ready","Used",
  "Hold for next visit","Not received","Back in Stock",
];

export const WARRANTY_TYPES = [
  "Manufacturer Warranty","Extended Warranty","Service Contract",
  "Out of Warranty","Builder Warranty",
];

export const PRODUCT_TYPES = [
  "Refrigerator","Washer","Dryer","Dishwasher","Range","Microwave",
  "Freezer","Ice Maker","Wall Oven","Cooktop",
];

// ─── Part data ─────────────────────────────────────────────────────────────

export const PART_DESCRIPTIONS = [
  "Control Board","Drain Pump","Door Gasket","Heating Element","Thermistor",
  "Compressor","Inverter Board","Door Switch","Water Valve","Ice Maker Assembly",
  "Motor","Start Relay","Capacitor","Evaporator Fan","Defrost Timer",
  "Dispenser Board","Lid Switch","Drive Belt","Drum Bearing","Igniter",
  "Spark Module","Gas Valve","Pressure Switch","Timer Assembly","Float Switch",
];

export const DISTRIBUTORS = [
  "Encompass","Marcone","GE","LG","Samsung","Midea","Miele","NSA",
  "Amazon","Repair Clinic","AppliancePartsPros",
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function pick<T>(arr: T[], i: number): T { return arr[i % arr.length]; }
function pad(n: number, len = 12) { return String(n).padStart(len, "0"); }
function dateStr(offsetDays: number) {
  const d = new Date(); d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
function fmtDate(offsetDays: number) {
  const d = new Date(); d.setDate(d.getDate() + offsetDays);
  return `${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}/${d.getFullYear()}`;
}
function randomPhone() {
  return `(${Math.floor(Math.random()*900)+100}) ${Math.floor(Math.random()*900)+100}-${Math.floor(Math.random()*9000)+1000}`;
}

const FIRST_NAMES = ["James","Mary","Robert","Patricia","John","Jennifer","Michael","Linda","David","Barbara","William","Susan","Richard","Jessica","Joseph","Sarah","Thomas","Karen","Charles","Lisa"];
const LAST_NAMES  = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Wilson","Anderson","Taylor","Thomas","Jackson","White","Harris","Martin","Thompson","Young","Allen","King"];
const CITIES = ["Charlotte","Atlanta","Nashville","Memphis","Knoxville","Asheville","Raleigh","Birmingham","Chattanooga","Huntsville","Jackson","Little Rock","New Orleans","Jacksonville","Columbus"];
const STATES = ["NC","GA","TN","TN","TN","NC","NC","AL","TN","AL","MS","AR","LA","FL","GA"];
const MODELS = ["WTW5000DW","GTW720BSNWS","WFW9620HW","MHW5630HW","GDF630PGMWW","GDT695SSJSS","WRS325SDHZ","GSS25GSHSS","GAS702BSNWS","LRMVS3006S","RF28R7351SG","WDT730PAHZ","KDTM404KPS","FFSS2615TS","PFE28KMKES"];
const SERIALS = ["GD726338B","HN84726512","TR928476AB","KL738291CD","PM926374EF","XR847261GH","WT936182IJ","BN827364KL","CR736291MN","DQ628374OP"];

// ─── Generate Tickets ──────────────────────────────────────────────────────

export interface OfflineTicket {
  ticketNo: string;
  ticketSource: string;
  warranty: string;
  manufacturer: string;
  customer: string;
  city: string;
  location: string;
  model: string;
  serial: string;
  productType: string;
  warrantyType: string;
  internalNote: string;
  diagnosed: string;
  technician: string;
  customerPref: string;
  schedule: string;
  status: string;
  phone: string;
  redo: string;
  aging: number;
  calls: number;
  partOrder: string;
  created: string;
  firstName: string;
  lastName: string;
  address: string;
  zip: string;
  state: string;
  email: string;
  branch: string;
  claimCompany: string;
  visits: Array<{
    id: string; visitNo: string; scheduleDate: string;
    technician: string; repairStatus: string; repairType: string;
    symptomCx: string; diagnosis: string; status: string; note: string;
  }>;
  parts: Array<{
    id: string; partNo: string; partDesc: string; poNo: string;
    quantity: string; partPrice: string; status: string;
    partDist: string; eta: string; createdBy: string;
  }>;
}

const REPAIR_TYPES = ["Board Replacement","Pump Replacement","Gasket Replacement","Motor Replacement","Compressor Replacement","Belt Replacement","Thermostat Replacement","Valve Replacement","Full Diagnosis","Part Order Required"];
const SYMPTOMS = ["Unit not starting","Water leaking","Not cooling","Making loud noise","Door not sealing","Control panel unresponsive","Not draining","No heat","Not spinning","Ice maker not working"];
const DIAGNOSES = ["Faulty control board","Worn door gasket","Defective drain pump","Failed heating element","Compressor failure","Broken drive belt","Defective water valve","Faulty thermistor","Burned igniter","Ice maker motor failed"];

export const OFFLINE_TICKETS: OfflineTicket[] = Array.from({ length: 250 }, (_, i) => {
  const firstName = pick(FIRST_NAMES, i * 7);
  const lastName  = pick(LAST_NAMES,  i * 3);
  const cityIdx   = i % CITIES.length;
  const branch    = pick(BRANCHES, i);
  const tech      = pick(TECHNICIANS, i);
  const status    = pick(REPAIR_STATUSES, i);
  const aging     = (i % 45) + 1;
  const hasParts  = i % 3 !== 0;
  const partDesc  = pick(PART_DESCRIPTIONS, i);
  const dist      = pick(DISTRIBUTORS, i);

  return {
    ticketNo:      pad(54800000000 + i * 137 + 1000),
    ticketSource:  pick(TICKET_SOURCES, i),
    warranty:      pick(["Active","Expired","Pending"], i),
    manufacturer:  pick(BRANDS, i),
    customer:      `${firstName} ${lastName}`,
    firstName,
    lastName,
    city:          CITIES[cityIdx],
    state:         STATES[cityIdx],
    location:      branch,
    branch,
    model:         pick(MODELS, i),
    serial:        pick(SERIALS, i) + String(i).padStart(4,"0"),
    productType:   pick(PRODUCT_TYPES, i),
    warrantyType:  pick(WARRANTY_TYPES, i),
    internalNote:  i % 5 === 0 ? "Customer prefers morning calls" : "",
    diagnosed:     i % 2 === 0 ? "Yes" : "No",
    technician:    tech,
    customerPref:  i % 3 === 0 ? "AM" : i % 3 === 1 ? "PM" : "Any",
    schedule:      fmtDate(-(aging - 1)),
    status,
    phone:         randomPhone(),
    redo:          i % 15 === 0 ? "Yes" : "No",
    aging,
    calls:         (i % 5) + 1,
    partOrder:     hasParts ? `PO-${String(7000 + i).padStart(6,"0")}` : "",
    created:       dateStr(-(aging + 3)),
    address:       `${100 + i} ${pick(["Oak","Maple","Pine","Cedar","Elm"],i)} ${pick(["St","Ave","Blvd","Dr","Ln"],i)}`,
    zip:           String(28000 + (i % 900)).padStart(5,"0"),
    email:         `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
    claimCompany:  pick(BRANDS, i + 3),
    visits: [
      {
        id:           `V${i}-1`,
        visitNo:      "V1",
        scheduleDate: fmtDate(-(aging - 1)),
        technician:   tech,
        repairStatus: status,
        repairType:   pick(REPAIR_TYPES, i),
        symptomCx:    pick(SYMPTOMS, i).toUpperCase(),
        diagnosis:    pick(DIAGNOSES, i),
        status:       i % 4 === 0 ? "Completed" : "In Progress",
        note:         i % 6 === 0 ? "Customer was not home. Left notice." : "",
      },
      ...(i % 3 === 0 ? [{
        id:           `V${i}-2`,
        visitNo:      "V2",
        scheduleDate: fmtDate(-(aging - 8)),
        technician:   pick(TECHNICIANS, i + 1),
        repairStatus: "OP-Ready for Service",
        repairType:   pick(REPAIR_TYPES, i + 2),
        symptomCx:    pick(SYMPTOMS, i + 2).toUpperCase(),
        diagnosis:    pick(DIAGNOSES, i + 2),
        status:       "Completed",
        note:         "Part installed successfully.",
      }] : []),
    ],
    parts: hasParts ? [
      {
        id:          `P${i}-1`,
        partNo:      `${pick(["WE","WD","WH","ACQ","BN","LG"],i)}${String(10000000 + i * 137).slice(0,8)}`,
        partDesc:    partDesc,
        poNo:        `PO-${String(7000 + i).padStart(6,"0")}`,
        quantity:    String((i % 3) + 1),
        partPrice:   `$${((i % 40) * 12 + 45).toFixed(2)}`,
        status:      pick(PART_STATUSES, i),
        partDist:    dist,
        eta:         fmtDate((i % 7) + 1),
        createdBy:   pick(ALL_CSR, i),
      },
      ...(i % 4 === 0 ? [{
        id:          `P${i}-2`,
        partNo:      `${pick(["WR","WF","PS","DE"],i)}${String(20000000 + i * 79).slice(0,8)}`,
        partDesc:    pick(PART_DESCRIPTIONS, i + 5),
        poNo:        `PO-${String(7500 + i).padStart(6,"0")}`,
        quantity:    "1",
        partPrice:   `$${((i % 20) * 8 + 25).toFixed(2)}`,
        status:      pick(PART_STATUSES, i + 2),
        partDist:    pick(DISTRIBUTORS, i + 2),
        eta:         fmtDate((i % 5) + 2),
        createdBy:   pick(ALL_CSR, i + 3),
      }] : []),
    ] : [],
  };
});

// ─── CSR Daily Data ────────────────────────────────────────────────────────

export interface CSRAgentStats {
  name: string;
  team: string;
  gh: number;
  total: number;
  scheduled: number;
  attempted: number;
  updated: number;
  mistakes: number;
  warnings: number;
  absent: boolean;
  inbound: number;
  outbound: number;
}

export const CSR_DAILY_STATS: CSRAgentStats[] = Object.entries(CSR_AGENTS).flatMap(([team, agents]) =>
  agents.map((name, i) => ({
    name,
    team,
    gh:        Math.floor(Math.random() * 30) + 10,
    total:     Math.floor(Math.random() * 50) + 20,
    scheduled: Math.floor(Math.random() * 20) + 5,
    attempted: Math.floor(Math.random() * 15) + 3,
    updated:   Math.floor(Math.random() * 40) + 15,
    mistakes:  Math.floor(Math.random() * 3),
    warnings:  Math.floor(Math.random() * 2),
    absent:    i === 3,
    inbound:   Math.floor(Math.random() * 30) + 5,
    outbound:  Math.floor(Math.random() * 25) + 5,
  }))
);

// ─── Parts Inventory ───────────────────────────────────────────────────────

export interface InventoryRow {
  id: string;
  uniqueId: string;
  partNo: string;
  description: string;
  vendor: string;
  location: string;
  branch: string;
  onHand: number;
  reserved: number;
  available: number;
  reorder: number;
  cost: number;
}

export const INVENTORY_ROWS: InventoryRow[] = Array.from({ length: 180 }, (_, i) => {
  const onHand   = (i % 20) + 1;
  const reserved = Math.floor(onHand * 0.3);
  return {
    id:          String(i + 1),
    uniqueId:    `${pick(BRANCHES,i).slice(0,3).toUpperCase()}${String(7100000000 + i * 10007).padStart(16,"0")}`,
    partNo:      `${pick(["WE","WD","WH","WR","ACQ","BN"],i)}${String(10000000 + i * 137).slice(0,8)}`,
    description: pick(PART_DESCRIPTIONS, i),
    vendor:      pick(DISTRIBUTORS, i),
    location:    pick(BRANCHES, i),
    branch:      pick(BRANCHES, i),
    onHand,
    reserved,
    available:   onHand - reserved,
    reorder:     5,
    cost:        parseFloat(((i % 40) * 12.5 + 45).toFixed(2)),
  };
});

// ─── Part Returns ─────────────────────────────────────────────────────────

export interface ReturnRow {
  id: number;
  ticketNo: string;
  branch: string;
  uniqueId: string;
  partNo: string;
  description: string;
  invoiceDate: string;
  returnQty: number;
  coreValue: number;
  lotNo: string;
  partStatus: string;
  aging: number;
  inReview: string;
  defect: string;
  pnn: string;
  scheduleDate: string;
  technician: string;
  coreRA: string;
}

export const RETURN_ROWS: ReturnRow[] = Array.from({ length: 60 }, (_, i) => ({
  id:           i + 1,
  ticketNo:     pad(54800000000 + i * 137 + 1000),
  branch:       pick(BRANCHES, i),
  uniqueId:     `${pick(BRANCHES,i).slice(0,3).toUpperCase()}${String(7100000000 + i * 10007).padStart(16,"0")}`,
  partNo:       `BN${String(44010560 + i * 7).padStart(8,"0")}A`,
  description:  pick(PART_DESCRIPTIONS, i),
  invoiceDate:  dateStr(-(i % 30 + 5)),
  returnQty:    1,
  coreValue:    i % 3 === 0 ? parseFloat(((i % 10) * 10 + 40).toFixed(2)) : 0,
  lotNo:        `LOT-${String(2026001 + i).padStart(7,"0")}`,
  partStatus:   pick(["Claimed","Pending","Returned","Used","In Review"], i),
  aging:        (i % 45) + 1,
  inReview:     "",
  defect:       "",
  pnn:          "",
  scheduleDate: fmtDate(-(i % 20 + 1)),
  technician:   pick(TECHNICIANS, i),
  coreRA:       i % 3 === 0 ? `RA-${String(1000 + i).padStart(5,"0")}` : "",
}));

// ─── Part Receive rows ─────────────────────────────────────────────────────

export interface ReceiveRow {
  id: string;
  partFrom: string;
  poNumber: string;
  poDate: string;
  orderNo: string;
  partNumber: string;
  partDesc: string;
  tracking: string;
  ticketNo: string;
  ticketStatus: string;
  tech: string;
  schedule: string;
  total: number;
  rcvd: number;
  partCost: number;
  coreCost: number;
  received: boolean;
}

export const RECEIVE_ROWS: ReceiveRow[] = Array.from({ length: 40 }, (_, i) => {
  const total = (i % 4) + 1;
  const rcvd  = i % 3 === 0 ? total : i % 3 === 1 ? 0 : Math.floor(total / 2);
  return {
    id:           `RCV-${String(1001 + i).padStart(5,"0")}`,
    partFrom:     pick(DISTRIBUTORS, i),
    poNumber:     `PO-${String(7000 + i).padStart(6,"0")}`,
    poDate:       dateStr(-(i % 20 + 5)),
    orderNo:      `ORD-${String(2300 + i).padStart(5,"0")}`,
    partNumber:   `${pick(["WE","WD","WH","ACQ","BN"],i)}${String(10000000 + i * 137).slice(0,8)}`,
    partDesc:     pick(PART_DESCRIPTIONS, i),
    tracking:     i % 2 === 0 ? `1Z999AA1${String(1000000 + i * 7).padStart(8,"0")}` : `${String(9400111 + i * 13).padStart(22,"0")}`,
    ticketNo:     pad(54800000000 + i * 137 + 1000),
    ticketStatus: pick(["Open","In Progress","Ready","Completed","On Hold"], i),
    tech:         pick(TECHNICIANS, i),
    schedule:     fmtDate((i % 7) + 1),
    total,
    rcvd,
    partCost:     parseFloat(((i % 30) * 15 + 65).toFixed(2)),
    coreCost:     i % 4 === 0 ? parseFloat(((i % 10) * 5 + 25).toFixed(2)) : 0,
    received:     rcvd > 0,
  };
});

// ─── Demo Users ────────────────────────────────────────────────────────────

export interface DemoUser {
  uid: string;
  displayName: string;
  email: string;
  username: string;
  role: string;
  userType: string;
  branch: string;
  companyId: string;
  isActive: boolean;
  manager: string;
}

export const DEMO_USERS_LIST: DemoUser[] = [
  { uid:"u001", displayName:"Admin User",          email:"admin@ahsolutions.com",     username:"Admin.User",     role:"ADMIN",           userType:"Admin",               branch:"Nashville",   companyId:"4930403", isActive:true, manager:"Aleena Hii" },
  { uid:"u002", displayName:"Aleena Hii",           email:"aleena@ahsolutions.com",    username:"Aleena.Hii",     role:"MANAGER",         userType:"Senior Manager",      branch:"Nashville",   companyId:"4930403", isActive:true, manager:"Naveen Lakhani" },
  { uid:"u003", displayName:"Raul Bayuyos Jr",      email:"raul@ahsolutions.com",      username:"Raul.Bayuyos",   role:"CSR_MANAGER",     userType:"CSR Manager",         branch:"Nashville",   companyId:"4930403", isActive:true, manager:"Aleena Hii" },
  { uid:"u004", displayName:"Naveen Lakhani",       email:"naveen@ahsolutions.com",    username:"Naveen.Lakhani", role:"MANAGER",         userType:"Manager",             branch:"Nashville",   companyId:"4930403", isActive:true, manager:"Aleena Hii" },
  { uid:"u005", displayName:"Ian Montesclaros",     email:"ian@ahsolutions.com",       username:"Ian.Montesclaros",role:"PARTS_MANAGER",  userType:"Parts Manager",       branch:"Atlanta",     companyId:"4930403", isActive:true, manager:"Naveen Lakhani" },
  { uid:"u006", displayName:"Daniela Cruz",         email:"daniela@ahsolutions.com",   username:"Daniela.Cruz",   role:"CSR_TEAM_LEADER", userType:"CSR Team Leader",     branch:"Nashville",   companyId:"4930403", isActive:true, manager:"Raul Bayuyos Jr" },
  { uid:"u007", displayName:"Danny Thornton",       email:"danny@ahsolutions.com",     username:"Danny.Thornton", role:"TECHNICIAN",      userType:"Technician",          branch:"Asheville",   companyId:"4930403", isActive:true, manager:"Daven Hodge" },
  { uid:"u008", displayName:"Marcus Webb",          email:"marcus@ahsolutions.com",    username:"Marcus.Webb",    role:"TECHNICIAN",      userType:"Technician",          branch:"Atlanta",     companyId:"4930403", isActive:true, manager:"Daven Hodge" },
  { uid:"u009", displayName:"Liza Park",            email:"liza@ahsolutions.com",      username:"Liza.Park",      role:"CSR",             userType:"CSR Agent",           branch:"Nashville",   companyId:"4930403", isActive:true, manager:"Daniela Cruz" },
  { uid:"u010", displayName:"Monica Reed",          email:"monica@ahsolutions.com",    username:"Monica.Reed",    role:"CSR",             userType:"CSR Agent",           branch:"Nashville",   companyId:"4930403", isActive:true, manager:"Daniela Cruz" },
  { uid:"u011", displayName:"HR Manager",           email:"hr@ahsolutions.com",        username:"HR.Manager",     role:"HR",              userType:"HR",                  branch:"Nashville",   companyId:"4930403", isActive:true, manager:"Aleena Hii" },
  { uid:"u012", displayName:"Finance User",         email:"finance@ahsolutions.com",   username:"Finance.User",   role:"FINANCE",         userType:"Finance",             branch:"Nashville",   companyId:"4930403", isActive:true, manager:"Aleena Hii" },
];
