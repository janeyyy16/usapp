/**
 * CSR staff roster — placeholder data sourced from the USHS staff list
 * (5 Team Leaders, 29 Agents, 1 Manager). Used by the Team Composition tool.
 * Swap this for a live query (e.g. profiles where role in CSR/TEAM_LEADER)
 * when the feature is wired to the backend.
 */
export interface CsrStaff {
  name: string;
  role: "Team Leader" | "Agent" | "Manager";
  username: string;
  email: string;
}

export const CSR_TEAM_LEADERS: CsrStaff[] = [
  { name: "Daniela Mercado", role: "Team Leader", username: "daniela.mercado", email: "daniemarie.mercado@gmail.com" },
  { name: "MaCzarina Lagumen", role: "Team Leader", username: "maczarina.lagumen", email: "maczarina16@gmail.com" },
  { name: "Robyn Heredia", role: "Team Leader", username: "robyn.heredia", email: "herediarobmae.rmh@gmail.com" },
  { name: "Rochelle Ortiz", role: "Team Leader", username: "rochelle.ortiz", email: "annortiz9192@gmail.com" },
  { name: "Shane Marie Rebadomia", role: "Team Leader", username: "shane.rebadomia", email: "shanemariegrebadomia@gmail.com" }
];

export const CSR_AGENTS_ROSTER: CsrStaff[] = [
  { name: "Alona Jane Bautista", role: "Agent", username: "alona.bautista", email: "alonajanebautista966@gmail.com" },
  { name: "Ana Jessa Vito", role: "Agent", username: "ana.vito", email: "ajvito16@gmail.com" },
  { name: "Anna Dominique Dimacali", role: "Agent", username: "anna.dimacali", email: "vixendyii08@gmail.com" },
  { name: "Anne Murray Lorico", role: "Agent", username: "anne.lorico", email: "murray.lorico10@gmail.com" },
  { name: "Ashley Danica Barnuevo", role: "Agent", username: "ashley.barnuevo", email: "barnuevoashleydanica@gmail.com" },
  { name: "Colleen Tac-on", role: "Agent", username: "colleen.tac-on", email: "taconcolleen@gmail.com" },
  { name: "Dale Cardona", role: "Agent", username: "dale.cardona", email: "johndale.3253@gmail.com" },
  { name: "Donna Oliveros", role: "Agent", username: "donna.oliveros", email: "donnaoliveros23@gmail.com" },
  { name: "Francis John Rebosura", role: "Agent", username: "francis.rebosura", email: "fjrebs@gmail.com" },
  { name: "Geneva Calomarde", role: "Agent", username: "geneva.calomarde", email: "cgenevabaney@gmail.com" },
  { name: "Gerlyn Garcia", role: "Agent", username: "gerlyn.garcia", email: "gerlynfg@gmail.com" },
  { name: "Glenn Arawiran", role: "Agent", username: "glenn.arawiran", email: "glennmark1103@gmail.com" },
  { name: "Jerwin Pineda", role: "Agent", username: "jerwin.pineda", email: "jerwin_pnd@yahoo.com" },
  { name: "Jeryan Luzano", role: "Agent", username: "jeryan.luzano", email: "jeryanjohn.luzano@yahoo.com" },
  { name: "Jo-Ann Lazarte", role: "Agent", username: "joann.lazarte", email: "joannlazarte92@gmail.com" },
  { name: "John Carl Cabahug", role: "Agent", username: "john.cabahug", email: "soyaxkenz@gmail.com" },
  { name: "John Carlo Bicaldo", role: "Agent", username: "john.bicaldo", email: "jbic2975@gmail.com" },
  { name: "Jordan Calendacion", role: "Agent", username: "jordan.calendacion", email: "Calendacionjordan@gmail.com" },
  { name: "Kyle Jomarc Sicat", role: "Agent", username: "kyle.sicat", email: "kylejomarc.sicat@gmail.com" },
  { name: "Mary Rose Labuanan", role: "Agent", username: "mary.labuanan", email: "labuananmaryrose00@gmail.com" },
  { name: "MaryGrace Cosio", role: "Agent", username: "marygrace.cosio", email: "marygracecosio25@gmail.com" },
  { name: "Mycha Landanganon", role: "Agent", username: "mycha.landanganon", email: "landanganon25@gmail.com" },
  { name: "Nicko Muega", role: "Agent", username: "nicko.muega", email: "nickolovm@yahoo.com" },
  { name: "Patrick Tendero", role: "Agent", username: "patrick.tendero", email: "patrick.tendero00@gmail.com" },
  { name: "Renz Marion Casilao", role: "Agent", username: "renz.casilao", email: "renzmarioncasilao@gmail.com" },
  { name: "Rhona Lae Solivar", role: "Agent", username: "rhona.solivar", email: "vo798313@gmail.com" },
  { name: "Richelle Labajo", role: "Agent", username: "richelle.labajo", email: "rich.labajo.directmedia@gmail.com" },
  { name: "Rogie Oliveros", role: "Agent", username: "rogie.oliveros", email: "rogiepotter@gmail.com" },
  { name: "Shiela Marie Estrellado", role: "Agent", username: "shiela.estrellado", email: "shyestrellado06@gmail.com" }
];

export const CSR_MANAGER: CsrStaff = { name: "Raul Bayuyos Jr", role: "Manager", username: "raul.bayuyos", email: "rbayuyos26@gmail.com" };

// Everyone available to place on a team (leaders first, then agents).
export const CSR_STAFF: CsrStaff[] = [...CSR_TEAM_LEADERS, ...CSR_AGENTS_ROSTER];
