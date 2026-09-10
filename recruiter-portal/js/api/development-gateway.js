const DEV_SESSION_KEY = "headsbase-recruiter-portal:development-session";
const emptyDemo = () => new URLSearchParams(window.location.search).get("demo") === "empty";

const sampleJobs = [
  {
    id: "senior-product-operations-lead",
    title: "Senior Product Operations Lead",
    client: "Vela Health",
    clientVisibility: "Shared with your organization",
    location: "New York, NY · Hybrid",
    locationType: "Hybrid",
    employmentType: "Full-time",
    experienceLevel: "7+ years",
    compensation: "$155,000–$180,000 base + equity",
    priority: "High",
    status: "Active",
    assignedAt: "2026-09-08",
    candidatesSubmitted: 2,
    description:
      "Vela Health is looking for an operator who can bring clarity to product planning, launch readiness, and cross-functional decision making. This person will partner closely with product, engineering, and commercial leadership.",
    requiredSkills: ["Product operations", "Program management", "Cross-functional leadership", "Analytics"],
    preferredSkills: ["Healthcare technology", "B2B SaaS", "SQL"],
    instructions:
      "Prioritize candidates who have operated in an ambiguous, scaling environment. Please include a concise note on the candidate’s experience improving product delivery rituals.",
    expectations: "Please submit up to three well-qualified candidates by September 22.",
  },
  {
    id: "technical-program-manager-platform",
    title: "Technical Program Manager, Platform",
    client: "Confidential client",
    clientVisibility: "Client identity shared after shortlist confirmation",
    location: "Austin, TX · Remote within the U.S.",
    locationType: "Remote",
    employmentType: "Full-time",
    experienceLevel: "6+ years",
    compensation: "Compensation shared with qualified candidates",
    priority: "Urgent",
    status: "New",
    assignedAt: "2026-09-10",
    candidatesSubmitted: 0,
    description:
      "A growth-stage B2B software company needs a technical program leader to coordinate platform migrations and improve delivery across multiple engineering teams.",
    requiredSkills: ["Technical program management", "Platform engineering", "Risk management", "Stakeholder communication"],
    preferredSkills: ["Cloud migrations", "Developer platforms", "SaaS"],
    instructions:
      "Do not disclose the client name. Emphasize the scope and platform opportunity when approaching candidates.",
    expectations: "Send an initial calibration slate of two candidates before presenting a broader shortlist.",
  },
  {
    id: "senior-data-engineer",
    title: "Senior Data Engineer",
    client: "Harborline Logistics",
    clientVisibility: "Shared with your organization",
    location: "Chicago, IL · Hybrid",
    locationType: "Hybrid",
    employmentType: "Full-time",
    experienceLevel: "5+ years",
    compensation: "$140,000–$165,000 base",
    priority: "Standard",
    status: "Active",
    assignedAt: "2026-09-03",
    candidatesSubmitted: 3,
    description:
      "Harborline Logistics is modernizing its data platform to improve operational forecasting and customer delivery visibility. The team is looking for an engineer who can build dependable pipelines and collaborate with analytics partners.",
    requiredSkills: ["Python", "SQL", "Data modeling", "Cloud data warehousing"],
    preferredSkills: ["dbt", "Airflow", "Supply chain data"],
    instructions:
      "Focus on hands-on engineers who can explain the reliability and business impact of the pipelines they have built.",
    expectations: "Introduce candidates with a relevant project example and current location.",
  },
  {
    id: "director-of-customer-success",
    title: "Director of Customer Success",
    client: "Northbank Systems",
    clientVisibility: "Shared with your organization",
    location: "Boston, MA · Hybrid",
    locationType: "Hybrid",
    employmentType: "Full-time",
    experienceLevel: "9+ years",
    compensation: "$175,000–$205,000 base + variable",
    priority: "Standard",
    status: "Paused",
    assignedAt: "2026-08-28",
    candidatesSubmitted: 1,
    description:
      "Northbank Systems is seeking a customer success leader to scale post-sale strategy for enterprise customers and build a high-performing team.",
    requiredSkills: ["Customer success leadership", "Enterprise SaaS", "Renewals", "Team building"],
    preferredSkills: ["Fintech", "Change management"],
    instructions: "Do not continue outreach while this assignment is paused.",
    expectations: "We will share timing when the search reopens.",
  },
];

const sampleCandidates = [
  { name: "Mina Rao", job: "Senior Product Operations Lead", submitted: "Sep 9, 2026", status: "Under Review", activity: "Profile opened today" },
  { name: "Theo Brooks", job: "Senior Data Engineer", submitted: "Sep 6, 2026", status: "Interview", activity: "Interview coordination requested" },
  { name: "Avery Coleman", job: "Senior Data Engineer", submitted: "Sep 4, 2026", status: "Shortlisted", activity: "Hiring team feedback received" },
];

const sampleSubmissions = [
  { candidate: "Mina Rao", job: "Senior Product Operations Lead", submitted: "Sep 9, 2026", status: "Under Review", feedback: "Hiring team is reviewing experience against the role scope.", nextAction: "Await feedback" },
  { candidate: "Theo Brooks", job: "Senior Data Engineer", submitted: "Sep 6, 2026", status: "Interview", feedback: "Initial interview requested.", nextAction: "Confirm availability" },
  { candidate: "Avery Coleman", job: "Senior Data Engineer", submitted: "Sep 4, 2026", status: "Shortlisted", feedback: "Strong data platform background.", nextAction: "Stand by" },
];

function defaultSession() {
  return {
    user: {
      name: "Alex Morgan",
      email: "alex@northstartalent.example",
      phone: "+1 (312) 555-0184",
      role: "Recruiting partner",
      emailVerified: true,
    },
    organization: {
      name: "Northstar Talent Partners",
      website: "northstartalent.example",
      location: "Chicago, IL",
      specialization: "Product, data, and go-to-market recruiting",
      markets: "North America · United Kingdom",
      primaryContact: "Alex Morgan",
    },
    onboardingComplete: true,
  };
}

function readSession() {
  try {
    return JSON.parse(window.sessionStorage.getItem(DEV_SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function writeSession(session) {
  window.sessionStorage.setItem(DEV_SESSION_KEY, JSON.stringify(session));
  return session;
}

function shortDelay(value) {
  return new Promise((resolve) => window.setTimeout(() => resolve(value), 180));
}

function normalise(value) {
  return String(value || "").trim().toLowerCase();
}

/** Local-only sample adapter. It does not send a request, store passwords, or model other organizations. */
export class DevelopmentGateway {
  async getSession() {
    return shortDelay(readSession());
  }

  async login({ email }) {
    const session = defaultSession();
    session.user.email = String(email || session.user.email).trim().toLowerCase();
    return shortDelay(writeSession(session));
  }

  async signup({ name, email, organizationName }) {
    const session = defaultSession();
    session.user.name = String(name || "New recruiting partner").trim();
    session.user.email = String(email || "").trim().toLowerCase();
    session.user.emailVerified = false;
    session.organization.name = String(organizationName || "Your recruiting organization").trim();
    session.organization.primaryContact = session.user.name;
    session.onboardingComplete = false;
    return shortDelay(writeSession(session));
  }

  async logout() {
    window.sessionStorage.removeItem(DEV_SESSION_KEY);
    return shortDelay();
  }

  async requestPasswordReset() {
    return shortDelay({ delivered: true });
  }

  async verifyEmail() {
    const session = readSession();
    if (!session) return shortDelay(null);
    session.user.emailVerified = true;
    return shortDelay(writeSession(session));
  }

  async updateSession(patch) {
    const session = readSession();
    if (!session) return shortDelay(null);
    const next = {
      ...session,
      ...patch,
      user: { ...session.user, ...(patch.user || {}) },
      organization: { ...session.organization, ...(patch.organization || {}) },
    };
    return shortDelay(writeSession(next));
  }

  async completeOnboarding() {
    return this.updateSession({ onboardingComplete: true });
  }

  async getDashboard() {
    return shortDelay({
      metrics: [
        { label: "Assigned jobs", value: "8", detail: "Across your organization" },
        { label: "Active jobs", value: "5", detail: "Ready for candidate outreach" },
        { label: "Candidates submitted", value: "12", detail: "This quarter" },
        { label: "Candidates in review", value: "2", detail: "Awaiting Headsbase feedback" },
      ],
      jobs: emptyDemo() ? [] : sampleJobs.slice(0, 3),
      activity: emptyDemo() ? [] : [
        { title: "New assignment shared", detail: "Technical Program Manager, Platform", when: "Today" },
        { title: "Candidate moved to review", detail: "Mina Rao · Senior Product Operations Lead", when: "Today" },
        { title: "Feedback received", detail: "Avery Coleman · Senior Data Engineer", when: "Yesterday" },
      ],
    });
  }

  async getJobs(filters = {}) {
    let items = emptyDemo() ? [] : [...sampleJobs];
    const search = normalise(filters.search);
    if (search) items = items.filter((job) => normalise(`${job.title} ${job.client} ${job.location}`).includes(search));
    if (filters.status) items = items.filter((job) => job.status === filters.status);
    if (filters.location) items = items.filter((job) => job.locationType === filters.location);
    if (filters.assigned === "recent") items = items.filter((job) => new Date(job.assignedAt) >= new Date("2026-09-03"));
    if (filters.sort === "oldest") items.sort((a, b) => a.assignedAt.localeCompare(b.assignedAt));
    else if (filters.sort === "priority") items.sort((a, b) => ["Urgent", "High", "Standard"].indexOf(a.priority) - ["Urgent", "High", "Standard"].indexOf(b.priority));
    else items.sort((a, b) => b.assignedAt.localeCompare(a.assignedAt));
    return shortDelay({ items, pagination: { page: 1, pageSize: 20, total: items.length, hasNextPage: false } });
  }

  async getJob(jobId) {
    const job = sampleJobs.find((item) => item.id === jobId);
    if (!job) throw new Error("That shared job is not available in this workspace.");
    return shortDelay(job);
  }

  async getCandidates(filters = {}) {
    let items = emptyDemo() ? [] : [...sampleCandidates];
    const search = normalise(filters.search);
    if (search) items = items.filter((candidate) => normalise(`${candidate.name} ${candidate.job}`).includes(search));
    if (filters.status) items = items.filter((candidate) => candidate.status === filters.status);
    return shortDelay({ items, pagination: { page: 1, pageSize: 20, total: items.length, hasNextPage: false } });
  }

  async getSubmissions(filters = {}) {
    let items = emptyDemo() ? [] : [...sampleSubmissions];
    const search = normalise(filters.search);
    if (search) items = items.filter((submission) => normalise(`${submission.candidate} ${submission.job}`).includes(search));
    if (filters.status) items = items.filter((submission) => submission.status === filters.status);
    return shortDelay({ items, pagination: { page: 1, pageSize: 20, total: items.length, hasNextPage: false } });
  }

  async getProfile() {
    const session = readSession();
    return shortDelay(session ? { user: session.user, organization: session.organization } : null);
  }

  async updateProfile(patch) {
    return this.updateSession(patch);
  }
}
