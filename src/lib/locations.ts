// Source of truth: Location.csv (31 locations)
// Asheville — zip coverage CSV not yet provided
// Philippines — no zip coverage (PH staff only)

export const WORK_MAP_LOCATIONS = [
  "Asheville",
  "Atlanta",
  "Birmingham",
  "Cape Girardeau",
  "Chattanooga",
  "Columbus",
  "Dallas",
  "Destin",
  "Huntsville",
  "Jackson,MS",
  "Jackson,TN",
  "Jacksonville",
  "Jonesboro",
  "Knoxville",
  "Lake Charles",
  "Little Rock",
  "Louisville",
  "Memphis",
  "Mobile",
  "Montgomery",
  "Nashville",
  "New Orleans",
  "Norfolk",
  "Philippines",
  "Raleigh",
  "Richmond",
  "San Antonio",
  "Savannah",
  "St. Louis",
  "Tallahassee",
  "Wilmington",
] as const;

export const LOCATIONS = [
  "Asheville",
  "Atlanta",
  "Birmingham",
  "Cape Girardeau",
  "Chattanooga",
  "Columbus",
  "Dallas",
  "Destin",
  "Huntsville",
  "Jackson,MS",
  "Jackson,TN",
  "Jacksonville",
  "Jonesboro",
  "Knoxville",
  "Lake Charles",
  "Little Rock",
  "Louisville",
  "Memphis",
  "Mobile",
  "Montgomery",
  "Nashville",
  "New Orleans",
  "Norfolk",
  "Philippines",
  "Raleigh",
  "Richmond",
  "San Antonio",
  "Savannah",
  "St. Louis",
  "Tallahassee",
  "Wilmington",
] as const;

// Sourced from Location.csv — Rep. Tech. per branch
export const LOCATION_REP_TECH: Record<string, string> = {
  "Memphis":        "Sean Smith",
  "Nashville":      "Leo Sun",
  "Jacksonville":   "Daven Hodge",
  "Tallahassee":    "Matthew Mccrary",
  "Birmingham":     "David Sims",
  "Huntsville":     "Jordan Stanley",
  "Jonesboro":      "Erick Guzman Juarez",
  "Atlanta":        "Kevin Khaiphanliane",
  "Knoxville":      "Leo Sun",
  "Wilmington":     "Brye'shawn Butler",
  "Mobile":         "Jonathon Allen",
  "Savannah":       "Lance Novak",
  "Montgomery":     "Kenny Shin",
  "Chattanooga":    "Jonathon Allen",
  "Columbus":       "Matt Simmons",
  "Jackson,MS":     "Lashamus Dowell",
  "Raleigh":        "Alexxis Henry",
  "New Orleans":    "Danny Thornton",
  "Louisville":     "",
  "St. Louis":      "Derious Nichols",
  "Richmond":       "Zachary Gonzalez",
  "Jackson,TN":     "Brandon Phillips",
  "Asheville":      "Daven Hodge",
  "Norfolk":        "Chris Simpson",
  "Little Rock":    "Danny Thornton",
  "Cape Girardeau": "Matthew Nichols",
  "Destin":         "Garrett McCarley",
  "San Antonio":    "Erick Guzman Juarez",
  "Lake Charles":   "Danny Thornton",
  "Dallas":         "Lashamus Dowell",
  "Philippines":    "",
};

// Sourced from Location.csv — office address per branch
export const LOCATION_ADDRESS: Record<string, {address1:string;address2:string;city:string;state:string;zip:string;phone:string;lat:string;lng:string}> = {
  "Memphis":        { address1:"3663 Cherry Rd",           address2:"#101",          city:"Memphis",         state:"TN", zip:"38118", phone:"8007793579", lat:"35.04533",       lng:"-89.91821" },
  "Nashville":      { address1:"163 N MOUNT JULIET RD",    address2:"",              city:"Mount Juliet",    state:"TN", zip:"37122", phone:"8007793579", lat:"36.17316441",    lng:"-86.5136183" },
  "Jacksonville":   { address1:"5913 Normandy Blvd",       address2:"#11",           city:"Jacksonville",    state:"FL", zip:"32205", phone:"8007793579", lat:"30.307471",      lng:"-81.7508335" },
  "Tallahassee":    { address1:"5281 Tower Rd",            address2:"B5",            city:"Tallahassee",     state:"FL", zip:"32303", phone:"8007793579", lat:"30.528767",      lng:"-84.367864" },
  "Birmingham":     { address1:"631 Beacon Pkwy W",        address2:"ste 106",       city:"Birmingham",      state:"AL", zip:"35209", phone:"8007793579", lat:"33.475347",      lng:"-86.816091" },
  "Huntsville":     { address1:"8207 Stephanie Dr SW",     address2:"",              city:"Huntsville",      state:"AL", zip:"35802", phone:"8007793579", lat:"34.65718827",    lng:"-86.56789588" },
  "Jonesboro":      { address1:"649 Burke Ave",            address2:"",              city:"Jonesboro",       state:"AR", zip:"72401", phone:"8007793579", lat:"35.84184324",    lng:"-90.71064972" },
  "Atlanta":        { address1:"2001 Lawrencevill-Suwanee rd", address2:"ste 104",   city:"Suwanee",         state:"GA", zip:"30024", phone:"8007793579", lat:"33.99973",       lng:"-84.03785" },
  "Knoxville":      { address1:"3137 Lakemoor View Road",  address2:"",              city:"Knoxville",       state:"TN", zip:"37920", phone:"8007793579", lat:"35.92806059",    lng:"-83.97912129" },
  "Wilmington":     { address1:"108 N Kerr Ave",           address2:"#2H",           city:"Wilmington",      state:"NC", zip:"28405", phone:"8007793579", lat:"34.244483",      lng:"-77.890015" },
  "Mobile":         { address1:"3656 Government Blvd",     address2:"ste E",         city:"Mobile",          state:"AL", zip:"36693", phone:"8007793579", lat:"30.647699",      lng:"-88.129321" },
  "Savannah":       { address1:"24 Commerce Place",        address2:"Unit A",        city:"Savannah",        state:"GA", zip:"31406", phone:"8007793579", lat:"32.006726",      lng:"-81.107398" },
  "Montgomery":     { address1:"1115C Perry hill rd",      address2:"unit C",        city:"Montgomery",      state:"AL", zip:"36109", phone:"8007793579", lat:"",               lng:"" },
  "Chattanooga":    { address1:"5805 Lee Hwy",             address2:"#307",          city:"Chattanooga",     state:"TN", zip:"37421", phone:"8007793579", lat:"35.019874",      lng:"-85.202254" },
  "Columbus":       { address1:"2013 Devonshire Dr",       address2:"Ste 1200",      city:"Columbus",        state:"GA", zip:"31904", phone:"8007793579", lat:"32.50911195",    lng:"-84.96269862" },
  "Jackson,MS":     { address1:"407 Briarwood Dr",         address2:"Suites 210 A",  city:"Jackson",         state:"MS", zip:"39206", phone:"8007793579", lat:"32.380344",      lng:"-90.154387" },
  "Raleigh":        { address1:"313 US-70",                address2:"Suite B",       city:"Garner",          state:"NC", zip:"27529", phone:"8007793579", lat:"35.7020432",     lng:"-78.5979922" },
  "New Orleans":    { address1:"179 Belle Terre Blvd",     address2:"Ste B",         city:"Laplace",         state:"LA", zip:"70068", phone:"8007793579", lat:"30.073816",      lng:"-90.500679" },
  "Louisville":     { address1:"3721 Tuscany Valley Dr",   address2:"",              city:"Louisville",      state:"KY", zip:"40219", phone:"",           lat:"38.1199472",     lng:"-85.6933519" },
  "St. Louis":      { address1:"11040 Lin Valle Dr,",      address2:"Suite D",       city:"St. Louis",       state:"MO", zip:"63123", phone:"8007793579", lat:"38.5188833",     lng:"-90.3332572" },
  "Richmond":       { address1:"4501 Williamsburg Rd",     address2:"Ste H",         city:"Richmond",        state:"VA", zip:"23231", phone:"8007793579", lat:"37.5169546",     lng:"-77.3532014" },
  "Jackson,TN":     { address1:"1903 N Highland Ave",      address2:"Ste 10",        city:"Jackson",         state:"TN", zip:"38305", phone:"8007793579", lat:"35.6526672",     lng:"-88.8292651" },
  "Asheville":      { address1:"3869 Sweeten Creek Rd",    address2:"Ste C",         city:"Arden",           state:"NC", zip:"28704", phone:"8007793579", lat:"35.4680177",     lng:"-82.5156063" },
  "Norfolk":        { address1:"1905 S Military Highway",  address2:"Suite 110",     city:"Chesapeake",      state:"VA", zip:"23320", phone:"8007793579", lat:"36.7865798",     lng:"-76.2536608" },
  "Little Rock":    { address1:"11701 I-30",               address2:"Suite 324",     city:"Little Rock",     state:"AR", zip:"72209", phone:"8007793579", lat:"34.6573556",     lng:"-92.4054108" },
  "Cape Girardeau": { address1:"1204 Meadowbrook Dr",      address2:"Suite 2",       city:"Cape Girardeau",  state:"MO", zip:"63703", phone:"8007793579", lat:"37.2651778",     lng:"-89.5656887" },
  "Destin":         { address1:"106 Eastview DR",          address2:"",              city:"Crestview",       state:"FL", zip:"32536", phone:"8007793579", lat:"30.702514",      lng:"-86.575855" },
  "San Antonio":    { address1:"817 I-35",                 address2:"",              city:"San Marcos",      state:"TX", zip:"78666", phone:"",           lat:"29.8792459",     lng:"-97.9270414" },
  "Lake Charles":   { address1:"6809 Cane Strip Ct",       address2:"",              city:"Maurice",         state:"LA", zip:"70555", phone:"",           lat:"30.1000318",     lng:"-92.0883896" },
  "Dallas":         { address1:"4347 W Northwest Hwy",     address2:"Suite 130, Box 114", city:"Dallas",     state:"TX", zip:"75220", phone:"",           lat:"32.8660842",     lng:"-96.8362724" },
  "Philippines":    { address1:"",                         address2:"",              city:"Philippines",     state:"",   zip:"",      phone:"",           lat:"",               lng:"" },
};

export const TECHNICIANS_BY_LOCATION: Record<string, readonly string[]> = {
  Atlanta:           ["Abel Severino", "Abraham Im", "Gerrell Berg", "Jordan Brown", "Joshua Silva", "Kevin Khaiphanliane", "Nathan Napora"],
  Birmingham:        ["David Sims", "Kenny Shin", "Zonate Grant"],
  "Cape Girardeau":  ["Alaska Olinger", "Deprece Harris", "Matthew Nichols"],
  Chattanooga:       ["Austin Ferguson", "Christian Andrews", "Seven Grinis"],
  Columbus:          ["A'Dejaun Tyson", "Matt Simmons", "Percy Smith"],
  Dallas:            ["Lashamus Dowell"],
  Destin:            ["Garrett McCarley"],
  Huntsville:        ["Dylan Lano", "Jordan Stanley", "Nathan Wagner"],
  "Jackson,MS":      ["Anthony Leonard Cavett", "Antonio Smith", "Mikkel Brown", "Terry Davis", "Tywon Ross"],
  "Jackson,TN":      ["Brandon Phillips", "Christian Clark", "Gabriel Talley", "Jaylon Yarbrough", "Justin Parker"],
  Jacksonville:      ["Bradley Hollowell", "Zakarya Moradi"],
  Jonesboro:         ["Jason Bateman"],
  Knoxville:         ["Alex Myles", "Joshua Rhinehart", "Zac Coisman"],
  "Lake Charles":    ["Danny Thornton"],
  "Little Rock":     ["Andre Riddle", "Darius Brown", "Jonathan Knox", "Nocona Detten"],
  Louisville:        [],
  Memphis:           ["Darrin Stewart", "Darryel Burdette", "Jeff Lucas", "Memphis Admin", "Rico Shaw", "Sean Smith"],
  Mobile:            ["Dominic Holman", "Jonathan Colquett", "Jonathon Allen", "Thaddaeus Springfield"],
  Montgomery:        ["Andy Oh"],
  Nashville:         ["Baolin Henry Zhang", "John Godfrey", "Justin Robertson", "Leo Sun", "Nashville Admin", "Steven Kurvink"],
  "New Orleans":     ["Cole Mushinsky", "Cooper Shaffett", "Corey Cage", "Joseph Wease", "Kurt Merckel", "Ryder Tourere"],
  Norfolk:           ["Chris Simpson", "Edward Lindsey"],
  Raleigh:           ["Alexxis Henry", "Damon Ottley", "Javier Camel", "Marc James"],
  Richmond:          ["Zachary Gonzalez"],
  "San Antonio":     ["Erick Guzman Juarez"],
  Savannah:          ["Carlos Ramirez", "Dustin Earls", "Lance Novak"],
  "St. Louis":       ["Demarkco Cody", "Derious Nichols", "Jacob Rhodes", "Memphis Admin", "Tony Nguyen", "Troy Willis"],
  Tallahassee:       ["Hunter Burch", "Matthew Mccrary"],
  Wilmington:        ["Brye'shawn Butler", "Jordan Davis", "Josh Malloch", "Justin Alverez"],
  Asheville:         [],
  Philippines:       [],
};

export function getTechniciansForLocation(location: string) {
  const normalized = normalizeLocationName(location);
  return TECHNICIANS_BY_LOCATION[normalized] ?? [];
}

export const ALL_TECHNICIANS = Array.from(
  new Set(Object.values(TECHNICIANS_BY_LOCATION).flat().filter(Boolean)),
).sort((a, b) => a.localeCompare(b));

export const PARTS_FROM_OPTIONS = [
  "AIG",
  "Electrolux",
  "Encompass",
  "Encompass-Birmingham / Montgomery",
  "GE",
  "LG",
  "Marcone-Birmingham / Montgomery",
  "Marcone-162468",
  "Midea",
  "Miele",
  "NSA",
  "OW",
  "SB",
  "Sharp",
  "SP",
  "Squaretrade",
  "SS",
] as const;

export function normalizeLocationName(location: string) {
  return String(location || "").trim().replace(/\s*,\s*/g, ",");
}

export function mergeLocationOptions(...groups: Array<Iterable<string>>) {
  const seen = new Set<string>();
  const merged: string[] = [];
  groups.forEach((group) => {
    for (const location of group) {
      const normalized = normalizeLocationName(location);
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      merged.push(normalized);
    }
  });
  return merged;
}
