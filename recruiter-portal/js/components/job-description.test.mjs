import assert from "node:assert/strict";
import { copyFileSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const tmp = join(dir, `_ui_job_description_test_${process.pid}.mjs`);
copyFileSync(join(dir, "ui.js"), tmp);

const {
  formatJobDescriptionHtml,
  formatJobListHtml,
  parseJobDescription,
  renderJobDetailSections,
} = await import(pathToFileURL(tmp).href);
unlinkSync(tmp);

const glued = "Role Title: Tax Preparer, Individual Income Tax (Form 1040), TY2025 (EA/CPA)Role Type: ContractorLocation: US, Remotemicro1 is engaging Enrolled Agents and CPAs who actively prepare individual returns to participate in a project supporting a customer. In this role, you’ll apply your hands-on preparation expertise to help train next-generation AI systems. Your domain knowledge is what matters.Scope of WorkPrepare complete federal individual returns (Form 1040) from scratch under TY2025 rules, working through the worksheets, phase-outs, limitations, and carryovers by hand.Write clear, concise preparer notes explaining how each figure on the return was derived, so that every number can be traced and reproduced.Build realistic, self-contained tax scenarios involving complex returns.Required Qualifications (all levels)Active EA or CPA who currently prepares individual (1040) returns.3+ tax seasons on complex returns.Fluency in TY2025 rules.LevelsContributor: 3+ years preparing complex personal returns.Expert: 5+ years.Preferred Experience (specialty areas)Foreign tax credit (Form 1116).Small business (Schedule C).";

test("parseJobDescription restores glued Micro1 headings and meta values", () => {
  const parsed = parseJobDescription(glued);
  assert.equal(parsed.meta.find((item) => item.title === "Role title")?.value.includes("Tax Preparer"), true);
  assert.equal(parsed.meta.find((item) => item.title === "Role type")?.value, "Contractor");
  assert.equal(parsed.meta.find((item) => item.title === "Location")?.value, "US, Remote");
  assert.match(parsed.sections.find((section) => section.key === "overview")?.body || "", /micro1 is engaging/);
  assert.match(parsed.sections.find((section) => section.key === "scopeOfWork")?.body || "", /^Prepare complete federal/);
  assert.match(parsed.sections.find((section) => section.key === "requiredQualifications")?.body || "", /^Active EA or CPA/);
  assert.match(parsed.sections.find((section) => section.key === "preferredExperience")?.body || "", /Foreign tax credit/);
});

test("formatJobDescriptionHtml renders structured markup and escapes HTML", () => {
  const html = formatJobDescriptionHtml(`${glued}<script>alert(1)</script>`);
  assert.match(html, /class="job-prose"/);
  assert.match(html, /<dt>Role title<\/dt>/);
  assert.match(html, /<h4>Scope of work<\/h4>/);
  assert.match(html, /<ul class="job-prose-list">/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

test("formatJobListHtml splits newline and sentence-run list items", () => {
  const fromNewlines = formatJobListHtml("Active EA or CPA.\n3+ tax seasons.\nFluency in TY2025 rules.");
  assert.equal((fromNewlines.match(/<li>/g) || []).length, 3);
  const fromSentences = formatJobListHtml("Prepare complete federal returns by hand.Write clear preparer notes.Build realistic tax scenarios.");
  assert.equal((fromSentences.match(/<li>/g) || []).length, 3);
});

test("renderJobDetailSections prefers structured API fields when present", () => {
  const html = renderJobDetailSections({
    description: glued,
    responsibilities: "Prepare complete federal returns by hand.\nWrite clear preparer notes.",
    requirements: "Active EA or CPA.\n3+ tax seasons.",
    preferredQualifications: "Foreign tax credit (Form 1116).",
  });
  assert.match(html, /<h3>About the role<\/h3>/);
  assert.match(html, /<h3>Scope of work<\/h3>/);
  assert.match(html, /<h3>Required qualifications<\/h3>/);
  assert.match(html, /<h3>Preferred qualifications<\/h3>/);
  assert.match(html, /US, Remote/);
  assert.match(html, /micro1 is engaging/);
  assert.equal((html.match(/Prepare complete federal returns by hand/g) || []).length, 1);
});

test("renderJobDetailSections falls back to description formatting", () => {
  const html = renderJobDetailSections({ description: glued });
  assert.match(html, /<h3>About the role<\/h3>/);
  assert.match(html, /<h4>Scope of work<\/h4>/);
  assert.match(html, /<h4>Required qualifications<\/h4>/);
});
