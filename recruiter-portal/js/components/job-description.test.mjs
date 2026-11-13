import assert from "node:assert/strict";
import { copyFileSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const tmp = join(dir, `_ui_job_description_test_${process.pid}.mjs`);
copyFileSync(join(dir, "ui.js"), tmp);

const {
  cleanJobFieldText,
  enrichJobFromDescription,
  formatJobDescriptionHtml,
  formatJobListHtml,
  parseJobDescription,
  renderJobDetailSections,
  unglueProseText,
} = await import(pathToFileURL(tmp).href);
unlinkSync(tmp);

const taxGlued = "Role Title: Tax Preparer, Individual Income Tax (Form 1040), TY2025 (EA/CPA)Role Type: ContractorLocation: US, Remotemicro1 is engaging Enrolled Agents and CPAs who actively prepare individual returns to participate in a project supporting a customer. Your domain knowledge is what matters.Scope of WorkPrepare complete federal individual returns by hand.Write clear preparer notes.Required Qualifications (all levels)Active EA or CPA.3+ tax seasons.LevelsContributor: 3+ years.Preferred Experience (specialty areas)Foreign tax credit.";

const litigationGlued = "Job Title: Litigation AttorneyJob Type: ContractorLocation: RemoteJob Summary: We are seeking seasoned U.S.-licensed litigation attorneys for a part-time role.In this role, you will review AI workflows.Key Responsibilities:Perform simulated litigation tasks.Review and assess AI responses.Required Skills and Qualifications:J.D. from an ABA-accredited law school.Active bar admission in at least one U.S. jurisdiction.Preferred Qualifications:Judicial clerkship experience.Prior exposure to AI.Why Join:This is an opportunity to work at the intersection of law and technology.You will help define how AI is developed.";

const imageryGlued = "Role Title: Imagery Analyst - AI/ML Training DataRole Type: Contractor (Part-time or Full-time)Eligibility: This role supports a U.S. Navy project. Under the terms of that federal contract, it requires U.S. citizenship.Scope of WorkReview and refine machine-generated bounding boxes.";

test("parseJobDescription restores Role Title and Job Title variants", () => {
  const tax = parseJobDescription(taxGlued);
  assert.equal(tax.meta.find((item) => item.title === "Role title")?.value.includes("Tax Preparer"), true);
  assert.equal(tax.meta.find((item) => item.title === "Location")?.value, "US, Remote");

  const litigation = parseJobDescription(litigationGlued);
  assert.equal(litigation.meta.find((item) => item.title === "Role title")?.value, "Litigation Attorney");
  assert.equal(litigation.meta.find((item) => item.title === "Role type")?.value, "Contractor");
  assert.equal(litigation.meta.find((item) => item.title === "Location")?.value, "Remote");
  assert.match(litigation.sections.find((section) => section.key === "jobSummary")?.body || "", /seasoned U\.S\.-licensed/);
  assert.match(litigation.sections.find((section) => section.key === "whyJoin")?.body || "", /intersection of law/);
});

test("cleanJobFieldText strips Why Join and trailing JSON", () => {
  const cleaned = cleanJobFieldText("Judicial clerkship.\nPrior AI exposure.\nWhy Join:\nGreat opportunity.\n{\"skills\":[\"law\"]}");
  assert.equal(cleaned.includes("Why Join"), false);
  assert.equal(cleaned.includes("skills"), false);
  assert.match(cleaned, /Judicial clerkship/);
});

test("formatJobDescriptionHtml keeps overview readable without dumping later lists twice", () => {
  const html = formatJobDescriptionHtml(litigationGlued, { includeLists: false });
  assert.match(html, /<dt>Location<\/dt><dd>Remote<\/dd>/);
  assert.match(html, /<h4>Job summary<\/h4>/);
  assert.doesNotMatch(html, /Key Responsibilities/);
  assert.match(html, /Why join/);
});

test("renderJobDetailSections formats litigation jobs without Why Join bullets", () => {
  const html = renderJobDetailSections({
    description: litigationGlued,
    responsibilities: "Perform simulated litigation tasks.\nReview and assess AI responses.",
    requirements: "J.D. from an ABA-accredited law school.\nActive bar admission in at least one U.S. jurisdiction.",
    preferredQualifications: "Judicial clerkship experience.\nPrior exposure to AI.\nWhy Join:\nThis is an opportunity.\nYou will help define AI.",
  });
  assert.match(html, /<dt>Location<\/dt><dd>Remote<\/dd>/);
  assert.match(html, /Job summary/);
  assert.match(html, /<h3>Scope of work<\/h3>/);
  assert.match(html, /<h3>Preferred qualifications<\/h3>/);
  assert.match(html, /<h3>Why join<\/h3>/);
  assert.doesNotMatch(html, /<li>Why Join:/);
  assert.doesNotMatch(html, /RemoteJob Summary/);
  assert.doesNotMatch(html, /AttorneyJob Type/);
});

test("formatJobListHtml splits glued sentences", () => {
  const html = formatJobListHtml("Prepare complete federal returns by hand.Write clear preparer notes.Build realistic tax scenarios.");
  assert.equal((html.match(/<li>/g) || []).length, 3);
});

test("unglueProseText restores missing spaces after periods", () => {
  assert.equal(
    unglueProseText("intersection of law and technology.You will help define how AI is developed."),
    "intersection of law and technology. You will help define how AI is developed.",
  );
});

test("parseJobDescription keeps Eligibility and parenthetical role types", () => {
  const imagery = parseJobDescription(imageryGlued);
  assert.equal(imagery.meta.find((item) => item.title === "Role type")?.value, "Contractor (Part-time or Full-time)");
  assert.match(imagery.sections.find((section) => section.key === "eligibility")?.body || "", /U\.S\. Navy/);
});

test("enrichJobFromDescription fills hero fields and JSON skills", () => {
  const litigation = enrichJobFromDescription({
    description: litigationGlued,
    location: "",
    employmentType: "",
    requirements: "",
  });
  assert.equal(litigation.location, "Remote");
  assert.equal(litigation.employmentType, "Contractor");

  const qa = enrichJobFromDescription({
    description: "",
    requirements: "{\"skills\":[\"Ubuntu\",\"Migration\"],\"requiredSkills\":[\"Ubuntu\",\"Migration\"],\"preferredSkills\":[]}",
    requiredSkills: [],
  });
  assert.deepEqual(qa.requiredSkills, ["Ubuntu", "Migration"]);
  assert.equal(qa.requirements, "");
});

test("renderJobDetailSections unglues Why Join prose", () => {
  const html = renderJobDetailSections({
    description: litigationGlued,
    responsibilities: "Perform simulated litigation tasks.\nReview and assess AI responses.",
    requirements: "J.D. from an ABA-accredited law school.",
    preferredQualifications: "Judicial clerkship experience.",
  });
  assert.match(html, /technology\. You will help/);
  assert.doesNotMatch(html, /technology\.You will/);
});

test("renderJobDetailSections recovers Preferred Experience from description when field is empty", () => {
  const html = renderJobDetailSections({
    description: taxGlued,
    responsibilities: "Prepare complete federal individual returns by hand.\nWrite clear preparer notes.",
    requirements: "Active EA or CPA.\n3+ tax seasons.",
    preferredQualifications: "",
  });
  assert.match(html, /<h3>Preferred qualifications<\/h3>/);
  assert.match(html, /Foreign tax credit/);
  assert.match(html, /<h3>Levels<\/h3>/);
});
