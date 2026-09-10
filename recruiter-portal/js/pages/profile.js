import { escapeHtml, icon, initials, loadingBlock } from "../components/ui.js";
import { isDevelopmentMode } from "../config.js";

function profileForm(profile) {
  const user = profile.user;
  const organization = profile.organization;
  return `<form class="profile-form" id="profile-form">
    <section class="settings-section"><div class="settings-heading"><div><p class="page-kicker">Personal information</p><h2>Your recruiter profile</h2><p>Keep the contact details Headsbase uses for your organization current.</p></div><div class="photo-placeholder"><span class="avatar avatar-large">${initials(user.name)}</span><span><strong>Profile photo</strong><small>Upload is prepared for the HTN profile service.</small></span></div></div><div class="form-grid"><label>Full name<input name="name" required autocomplete="name" value="${escapeHtml(user.name)}" /></label><label>Email<input name="email" type="email" disabled value="${escapeHtml(user.email)}" /><small>Email changes require verification.</small></label><label>Phone<input name="phone" type="tel" autocomplete="tel" value="${escapeHtml(user.phone || "")}" /></label><label>Role<input name="role" value="${escapeHtml(user.role || "Recruiting partner")}" /></label></div></section>
    <section class="settings-section"><div class="settings-heading"><div><p class="page-kicker">Recruiter organization</p><h2>${escapeHtml(organization.name)}</h2><p>This information establishes the foundation for a future partner trust profile.</p></div></div><div class="form-grid"><label>Organization name<input name="organizationName" required autocomplete="organization" value="${escapeHtml(organization.name)}" /></label><label>Website<input name="website" type="url" placeholder="https://" value="${escapeHtml(organization.website || "")}" /></label><label>Primary location<input name="location" value="${escapeHtml(organization.location || "")}" /></label><label>Primary contact<input name="primaryContact" value="${escapeHtml(organization.primaryContact || "")}" /></label><label class="form-span-full">Recruiter specialization<textarea name="specialization" rows="3">${escapeHtml(organization.specialization || "")}</textarea></label><label class="form-span-full">Markets covered<textarea name="markets" rows="3">${escapeHtml(organization.markets || "")}</textarea></label></div></section>
    <section class="settings-section settings-security"><div><p class="page-kicker">Account</p><h2>Security &amp; notifications</h2><p>Security settings will remain tied to the authenticated identity, never to a recruiter-supplied organization identifier.</p></div><div class="security-list"><div><span class="security-icon">${icon("check", 17)}</span><p><strong>Email ${user.emailVerified ? "verified" : "needs verification"}</strong><small>${user.emailVerified ? "Your sign-in email is verified." : "Verify your email before entering the workspace."}</small></p></div><div><span class="security-icon">${icon("lock", 17)}</span><p><strong>Password</strong><small>Change passwords through the secure account recovery flow.</small></p><a class="button button-secondary" href="#/forgot-password">Reset password</a></div><fieldset class="notification-settings"><legend>Notification preferences</legend><label class="checkbox-label"><input type="checkbox" checked name="jobUpdates" /> <span>Job assignment and status updates</span></label><label class="checkbox-label"><input type="checkbox" checked name="submissionUpdates" /> <span>Submission activity and feedback</span></label></fieldset></div></section>
    <div class="profile-save"><p class="form-message" id="profile-message" role="status"></p><button class="button button-primary" type="submit">Save changes</button></div>
  </form>`;
}

export const profilePage = {
  title: "Profile & Organization",
  description: "Manage your recruiter identity, organization information, account security, and notification preferences.",
  initial: loadingBlock("Loading profile settings"),
  async load(container, api) {
    const profile = await api.getProfile();
    if (!profile) throw new Error("Your session no longer has a recruiter profile.");
    container.innerHTML = profileForm(profile);
    const form = container.querySelector("#profile-form");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const message = form.querySelector("#profile-message");
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      message.textContent = "Saving profile changes…";
      try {
        await api.updateProfile({
          user: { name: data.get("name"), phone: data.get("phone"), role: data.get("role") },
          organization: {
            name: data.get("organizationName"), website: data.get("website"), location: data.get("location"),
            primaryContact: data.get("primaryContact"), specialization: data.get("specialization"), markets: data.get("markets"),
          },
          notificationPreferences: { jobUpdates: data.has("jobUpdates"), submissionUpdates: data.has("submissionUpdates") },
        });
        message.textContent = isDevelopmentMode() ? "Saved in the local development workspace." : "Profile changes saved.";
        message.className = "form-message success";
      } catch (error) {
        message.textContent = error.message || "We could not save those changes.";
        message.className = "form-message error";
      } finally {
        button.disabled = false;
      }
    });
  },
};
