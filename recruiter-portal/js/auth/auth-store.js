export class AuthStore {
  constructor(gateway) {
    this.gateway = gateway;
    this.session = null;
    this.ready = false;
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((listener) => listener(this.getState()));
  }

  getState() {
    return { session: this.session, ready: this.ready };
  }

  async hydrate() {
    try {
      this.session = await this.gateway.getSession();
    } catch (error) {
      if (error?.status !== 401) console.warn("Unable to restore recruiter session", error);
      this.session = null;
    }
    this.ready = true;
    this.notify();
    return this.session;
  }

  async login(credentials) {
    this.session = await this.gateway.login(credentials);
    this.ready = true;
    this.notify();
    return this.session;
  }

  async signup(details) {
    this.session = await this.gateway.signup(details);
    this.ready = true;
    this.notify();
    return this.session;
  }

  async logout() {
    await this.gateway.logout();
    this.session = null;
    this.ready = true;
    this.notify();
  }

  async requestPasswordReset(email) {
    return this.gateway.requestPasswordReset(email);
  }

  async verifyEmail(code) {
    this.session = await this.gateway.verifyEmail(code);
    this.notify();
    return this.session;
  }

  async updateSession(patch) {
    this.session = await this.gateway.updateSession(patch);
    this.notify();
    return this.session;
  }

  async completeOnboarding() {
    this.session = await this.gateway.completeOnboarding();
    this.notify();
    return this.session;
  }

  clearExpiredSession() {
    this.session = null;
    this.ready = true;
    this.notify();
  }
}

export function isWorkspaceReady(session) {
  return Boolean(session?.user?.emailVerified && session?.onboardingComplete);
}
