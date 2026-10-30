<template>
  <ion-page>
    <ion-content :fullscreen="true" class="app-screen">
      <div class="screen-shell auth-shell">
        <!-- Auth Header -->
        <section class="auth-hero">
          <div class="auth-logo-badge">
            <i class="fa-solid fa-graduation-cap"></i>
          </div>
          <span class="pill pill--brand">Twige Academy</span>
          <h1>Welcome back</h1>
          <p>Sign in to sync your course progress, certificates, and personalized learning dashboard.</p>
          
          <div class="auth-hero__highlights">
            <span class="highlight-chip">
              <i class="fa-solid fa-circle-play"></i> Full HD Lessons
            </span>
            <span class="highlight-chip">
              <i class="fa-solid fa-language"></i> EN / FR / RN
            </span>
            <span class="highlight-chip">
              <i class="fa-solid fa-shield-halved"></i> Secure Access
            </span>
          </div>
        </section>

        <!-- Auth Form Card -->
        <section class="surface-card auth-card">
          <div class="auth-card__header">
            <div>
              <p class="section-kicker">
                <i class="fa-solid fa-lock"></i> Account Login
              </p>
              <h3>Sign in to continue</h3>
            </div>
          </div>

          <form class="auth-form" @submit.prevent="submitLogin">
            <label class="input-block">
              <span>Email address</span>
              <div class="input-field-wrap">
                <i class="fa-regular fa-envelope input-icon"></i>
                <input
                  v-model="form.email"
                  type="email"
                  placeholder="name@example.com"
                  autocomplete="email"
                  required
                />
              </div>
            </label>

            <label class="input-block">
              <div class="password-label-row">
                <span>Password</span>
              </div>
              <div class="input-field-wrap">
                <i class="fa-solid fa-key input-icon"></i>
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Enter your password"
                  autocomplete="current-password"
                  required
                />
                <button
                  class="password-toggle-btn"
                  type="button"
                  aria-label="Toggle password visibility"
                  @click="showPassword = !showPassword"
                >
                  <i :class="showPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'"></i>
                </button>
              </div>
            </label>

            <button
              class="primary-button auth-submit-btn"
              type="submit"
              :disabled="isSubmitting"
            >
              <i v-if="isSubmitting" class="fa-solid fa-circle-notch fa-spin"></i>
              <i v-else class="fa-solid fa-right-to-bracket"></i>
              <span>{{ isSubmitting ? 'Signing in...' : 'Sign In' }}</span>
            </button>
          </form>

          <div v-if="message" class="auth-feedback" :class="{ 'is-error': isError, 'is-info': !isError }">
            <i :class="isError ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-info'"></i>
            <span>{{ message }}</span>
          </div>

          <div class="auth-card__footer">
            <RouterLink to="/home" class="text-link">
              <i class="fa-solid fa-arrow-left"></i>
              <span>Back to explore courses</span>
            </RouterLink>
          </div>
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { IonContent, IonPage } from '@ionic/vue';
import { loginUser } from '@/services/api';

export default {
  name: 'LoginPage',
  components: {
    IonContent,
    IonPage,
  },
  data() {
    return {
      form: {
        email: '',
        password: '',
      },
      showPassword: false,
      isSubmitting: false,
      isError: false,
      message: 'Enter your Twige Academy credentials to access your account.',
    };
  },
  methods: {
    async submitLogin() {
      if (!this.form.email.trim() || !this.form.password) {
        this.isError = true;
        this.message = 'Please provide both email and password.';
        return;
      }

      this.isSubmitting = true;
      this.isError = false;
      this.message = 'Verifying credentials...';

      try {
        await loginUser({
          email: this.form.email.trim(),
          password: this.form.password,
        });
        const redirect = this.$route.query.redirect || '/profile';
        this.$router.replace(redirect);
      } catch (error) {
        this.isError = true;
        this.message = error.message || 'Login failed. Please check your credentials.';
      } finally {
        this.isSubmitting = false;
      }
    },
  },
};
</script>

<style scoped>
.auth-shell {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
  padding-bottom: 40px;
}

.auth-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  padding: 10px 10px 0;
}

.auth-logo-badge {
  width: 58px;
  height: 58px;
  border-radius: var(--radius-xl);
  background: var(--brand-gradient);
  color: #ffffff;
  display: grid;
  place-items: center;
  font-size: 1.5rem;
  box-shadow: var(--shadow-brand);
  margin-bottom: 4px;
}

.auth-hero h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.02em;
}

.auth-hero p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.5;
  max-width: 320px;
}

.auth-hero__highlights {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
}

.highlight-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--text-secondary);
  font-size: 0.74rem;
  font-weight: 600;
  box-shadow: var(--shadow-xs);
}

.highlight-chip i {
  color: var(--brand);
}

/* Card */
.auth-card {
  padding: 26px;
  border-radius: var(--radius-2xl);
  display: grid;
  gap: 20px;
}

.auth-card__header h3 {
  margin: 4px 0 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-main);
}

.auth-form {
  display: grid;
  gap: 16px;
}

.input-block {
  display: grid;
  gap: 8px;
}

.input-block span {
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.password-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.input-field-wrap {
  display: flex;
  align-items: center;
  padding: 0 14px;
  border-radius: var(--radius-lg);
  background: var(--surface-soft);
  border: 1px solid var(--line);
  transition: all var(--transition-fast);
}

.input-field-wrap:focus-within {
  background: var(--surface);
  border-color: var(--brand-light);
  box-shadow: 0 0 0 4px var(--brand-glow);
}

.input-icon {
  color: var(--text-subtle);
  font-size: 0.95rem;
  margin-right: 10px;
}

.input-field-wrap input {
  width: 100%;
  padding: 14px 0;
  border: none;
  background: transparent;
  outline: none;
  color: var(--text-main);
  font-size: 0.92rem;
  font-weight: 500;
}

.input-field-wrap input::placeholder {
  color: var(--text-subtle);
}

.password-toggle-btn {
  color: var(--text-subtle);
  font-size: 0.95rem;
  padding: 6px;
  transition: color var(--transition-fast);
}

.password-toggle-btn:hover {
  color: var(--text-main);
}

.auth-submit-btn {
  width: 100%;
  padding: 15px;
  font-size: 0.95rem;
  border-radius: var(--radius-lg);
  margin-top: 4px;
}

.auth-feedback {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  font-size: 0.84rem;
  font-weight: 600;
  line-height: 1.4;
}

.auth-feedback.is-error {
  background: var(--danger-soft);
  color: var(--danger);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.auth-feedback.is-info {
  background: var(--brand-soft);
  color: var(--brand);
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.auth-card__footer {
  display: flex;
  justify-content: center;
  padding-top: 6px;
}
</style>
