const API_ORIGIN = "https://htn-api-production-ab6d.up.railway.app";
const MAX_SIZE = 10 * 1024 * 1024;

const fileInput = document.querySelector("#resume-file");
const drop = document.querySelector("#resume-drop");
const uploadState = document.querySelector("#upload-state");
const form = document.querySelector("#profile-form");
const successState = document.querySelector("#success-state");
const uploadError = document.querySelector("#upload-error");
const submitError = document.querySelector("#submit-error");
const resumeName = document.querySelector("#resume-name");
const submitButton = document.querySelector("#submit-profile");

let resume = null;

function setError(element, message = "") { element.textContent = message; }
function value(name) { return form.elements[name]?.value?.trim() || ""; }
function setValue(name, valueToSet) { if (form.elements[name] && valueToSet) form.elements[name].value = valueToSet; }
function list(valueToParse) { return valueToParse.split(/[,;|\n]/).map(v => v.trim()).filter(Boolean); }

async function uploadResume(file) {
  if (!file) return;
  setError(uploadError);
  if (file.size <= 0 || file.size > MAX_SIZE) throw new Error("Your resume must be between 1 byte and 10 MB.");
  const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  if (!allowed.includes(file.type) && !/\.(pdf|docx?|)$/i.test(file.name)) throw new Error("Please upload a PDF, DOC or DOCX resume.");

  const response = await fetch(`${API_ORIGIN}/api/resumes/upload-url`, {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ fileName: file.name, mimeType: file.type || "application/pdf", size: file.size }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.success) throw new Error(payload.message || "We couldn't prepare your resume upload.");
  const upload = payload.data;
  const put = await fetch(upload.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type || upload.mimeType }, body: file });
  if (!put.ok) throw new Error(`Resume upload failed (${put.status}). Please try again.`);
  return { uploadId: upload.uploadId, storageKey: upload.storageKey, fileName: upload.fileName, mimeType: upload.mimeType, size: upload.size };
}

async function extractText(file) {
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
    if (!window.pdfjsLib) return "";
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await window.pdfjsLib.getDocument({ data }).promise;
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pages.push(content.items.map(item => item.str || "").join(" "));
    }
    return pages.join("\n");
  }
  if (/\.docx$/i.test(file.name) && window.mammoth) {
    const result = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value || "";
  }
  return "";
}

function parseResume(text, fileName) {
  const clean = text.replace(/\r/g, "").replace(/[ \t]+/g, " ");
  const lines = clean.split("\n").map(x => x.trim()).filter(Boolean);
  const email = clean.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
  const phone = clean.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.replace(/\s+/g, " ").trim() || "";
  const linkedin = clean.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s)]+/i)?.[0] || "";
  const github = clean.match(/https?:\/\/(?:www\.)?github\.com\/[^\s)]+/i)?.[0] || "";
  const portfolio = clean.match(/https?:\/\/(?!www\.)?[^\s]+\.[a-z]{2,}(?:\/[^\s]*)?/i)?.[0] || "";
  let firstName = "", lastName = "";
  const nameLine = lines.find(line => /^[A-Za-z][A-Za-z'’-]+(?:\s+[A-Za-z][A-Za-z'’-]+){1,3}$/.test(line) && line.length < 70);
  if (nameLine) { const parts = nameLine.split(/\s+/); firstName = parts.shift(); lastName = parts.join(" "); }
  const titleLine = lines.find(line => /\b(engineer|developer|scientist|manager|director|analyst|associate|consultant|designer|architect|specialist|recruiter|researcher|professor|accountant|officer|lead|head|founder|executive)\b/i.test(line) && line.length < 100);
  const experienceMatch = clean.match(/(\d{1,2})\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:professional\s+)?experience/i);
  const section = (names) => {
    const regex = new RegExp(`(?:^|\\n)\\s*(?:${names.join("|")})\\s*[:\\-]?\\s*([\\s\\S]*?)(?=\\n\\s*(?:skills?|experience|work experience|employment|education|certifications?|projects?|summary|profile|contact)\\b|$)`, "i");
    return clean.match(regex)?.[1]?.trim() || "";
  };
  const skills = section(["skills", "technical skills", "core competencies"]);
  const certifications = section(["certifications", "certificates", "licenses"]);
  const education = section(["education", "academic background", "qualifications"]);
  const summary = section(["summary", "professional summary", "profile", "about"]);
  return {
    firstName, lastName, email, phone, linkedinUrl: linkedin, githubUrl: github,
    portfolioUrl: portfolio && portfolio !== linkedin && portfolio !== github ? portfolio : "",
    currentTitle: titleLine || "", yearsExperience: experienceMatch ? Number(experienceMatch[1]) : "",
    skills: list(skills), certifications: list(certifications), education: list(education), summary,
    _source: fileName,
  };
}

function showProfile(parsed) {
  setValue("firstName", parsed.firstName); setValue("lastName", parsed.lastName); setValue("email", parsed.email); setValue("phone", parsed.phone);
  setValue("currentTitle", parsed.currentTitle); setValue("linkedinUrl", parsed.linkedinUrl); setValue("githubUrl", parsed.githubUrl); setValue("portfolioUrl", parsed.portfolioUrl);
  if (parsed.yearsExperience !== "") setValue("yearsExperience", parsed.yearsExperience);
  setValue("summary", parsed.summary); setValue("skills", parsed.skills.join(", ")); setValue("certifications", parsed.certifications.join(", ")); setValue("education", parsed.education.join(", "));
  resumeName.textContent = parsed._source;
  uploadState.hidden = true; form.hidden = false; form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function handleFile(file) {
  try {
    setError(uploadError); drop.setAttribute("aria-busy", "true");
    drop.querySelector("strong").textContent = "Uploading and reading your resume…";
    resume = await uploadResume(file);
    const text = await extractText(file);
    showProfile(parseResume(text, file.name));
  } catch (error) {
    setError(uploadError, error instanceof Error ? error.message : "Something went wrong. Please try again.");
    drop.querySelector("strong").textContent = "Drop your resume here";
    resume = null;
  } finally { drop.removeAttribute("aria-busy"); }
}

fileInput.addEventListener("change", () => handleFile(fileInput.files?.[0]));
["dragenter", "dragover"].forEach(type => drop.addEventListener(type, event => { event.preventDefault(); drop.classList.add("dragging"); }));
["dragleave", "drop"].forEach(type => drop.addEventListener(type, event => { event.preventDefault(); drop.classList.remove("dragging"); }));
drop.addEventListener("drop", event => handleFile(event.dataTransfer.files?.[0]));

form.addEventListener("submit", async event => {
  event.preventDefault(); setError(submitError);
  if (!resume) { setError(submitError, "Please upload your resume first."); return; }
  submitButton.disabled = true; submitButton.firstChild.textContent = "Joining…";
  const payload = {
    firstName: value("firstName"), lastName: value("lastName"), email: value("email"), phone: value("phone"), location: value("location"),
    currentCompany: value("currentCompany"), currentTitle: value("currentTitle"),
    yearsExperience: value("yearsExperience") ? Number(value("yearsExperience")) : 0,
    linkedinUrl: value("linkedinUrl"), portfolioUrl: value("portfolioUrl"), githubUrl: value("githubUrl"),
    certifications: value("certifications"),
    additionalNotes: value("summary"),
    contactConsent: form.elements.consent.checked,
    resume,
  };
  try {
    const response = await fetch(`${API_ORIGIN}/api/candidates/talent-network`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) throw new Error(result.message || `Submission failed (${response.status}).`);
    form.hidden = true; successState.hidden = false; successState.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    setError(submitError, error instanceof Error ? error.message : "We couldn't save your profile. Please try again.");
    submitButton.disabled = false; submitButton.firstChild.textContent = "Join the Talent Network ";
  }
});

const pdfScript = document.createElement("script");
pdfScript.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs";
pdfScript.type = "module";
pdfScript.onload = () => { import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs").then(m => { window.pdfjsLib = m; window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs"; }).catch(() => {}); };
document.head.appendChild(pdfScript);
const mammothScript = document.createElement("script"); mammothScript.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.9.0/mammoth.browser.min.js"; document.head.appendChild(mammothScript);
