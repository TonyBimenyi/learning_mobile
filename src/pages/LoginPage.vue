<template>
  <ion-page>
    <ion-content :fullscreen="true" class="app-screen">
      <div class="auth-shell">
        <!-- Brand + headline (one place, no repeated titles) -->
        <section class="auth-hero">
          <span class="auth-hero__glow" aria-hidden="true"></span>

          <div class="auth-hero__top">
            <div class="auth-brand">
              <span class="auth-brand__mark"><i class="fa-solid fa-graduation-cap"></i></span>
              <span>{{ t('appName') }}</span>
            </div>
            <RouterLink to="/home" class="auth-skip">
              <span>{{ t('backToExplore') }}</span>
              <i class="fa-solid fa-arrow-right"></i>
            </RouterLink>
          </div>

          <div class="auth-hero__copy">
            <span class="auth-hero__eyebrow">
              <i :class="mode === 'login' ? 'fa-solid fa-right-to-bracket' : 'fa-solid fa-user-plus'"></i>
              {{ t(mode === 'login' ? 'memberAccess' : 'newMember') }}
            </span>
            <h1>{{ t(mode === 'login' ? 'greeting' : 'createAccount') }}</h1>
            <p>{{ t(mode === 'login' ? 'loginSubtitle' : 'registerSubtitle') }}</p>
          </div>
        </section>

        <!-- Single form card -->
        <section class="auth-card">
          <div class="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              :aria-selected="mode === 'login'"
              :class="{ 'is-active': mode === 'login' }"
              @click="setMode('login')"
            >
              {{ t('signIn') }}
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="mode === 'register'"
              :class="{ 'is-active': mode === 'register' }"
              @click="setMode('register')"
            >
              {{ t('signUp') }}
            </button>
          </div>

          <form class="auth-form" @submit.prevent="submitAuth">
            <label v-if="mode === 'register'" class="auth-field">
              <span>{{ t('fullName') }}</span>
              <div class="auth-field__control">
                <i class="fa-regular fa-user"></i>
                <input
                  v-model="form.name"
                  type="text"
                  :placeholder="t('fullNamePlaceholder')"
                  autocomplete="name"
                  required
                />
              </div>
            </label>

            <label v-if="mode === 'register'" class="auth-field">
              <span>{{ t('whatsappNumber') }}</span>
              <div class="auth-field__control">
                <i class="fa-brands fa-whatsapp"></i>
                <input
                  v-model="form.whatsapp"
                  type="tel"
                  :placeholder="t('whatsappPlaceholder')"
                  autocomplete="tel"
                  required
                />
              </div>
            </label>

            <label class="auth-field">
              <span>{{ t('emailAddress') }}</span>
              <div class="auth-field__control">
                <i class="fa-regular fa-envelope"></i>
                <input
                  v-model="form.email"
                  type="email"
                  :placeholder="t('emailPlaceholder')"
                  autocomplete="email"
                  required
                />
              </div>
            </label>

            <label class="auth-field">
              <span>{{ t('password') }}</span>
              <div class="auth-field__control">
                <i class="fa-solid fa-key"></i>
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  :placeholder="t('passwordPlaceholder')"
                  :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
                  minlength="6"
                  required
                />
                <button
                  class="auth-field__toggle"
                  type="button"
                  :aria-label="t('togglePasswordVisibility')"
                  @click="showPassword = !showPassword"
                >
                  <i :class="showPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'"></i>
                </button>
              </div>
            </label>

            <button class="auth-submit" type="submit" :disabled="isSubmitting">
              <i v-if="isSubmitting" class="fa-solid fa-circle-notch fa-spin"></i>
              <i v-else :class="mode === 'login' ? 'fa-solid fa-right-to-bracket' : 'fa-solid fa-user-plus'"></i>
              <span>{{ isSubmitting ? t(mode === 'login' ? 'verifying' : 'signingUp') : t(mode === 'login' ? 'signIn' : 'signUp') }}</span>
            </button>
          </form>

          <div v-if="message" class="auth-feedback" :class="{ 'is-error': isError }">
            <i :class="isError ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check'"></i>
            <span>{{ message }}</span>
          </div>

          <p class="auth-footnote">
            <i class="fa-solid fa-shield-halved"></i>
            <span>{{ t('secureAccess') }}</span>
          </p>
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { translate } from '@/services/i18n';
import { IonContent, IonPage } from '@ionic/vue';
import { loginUser, registerUser } from '@/services/api';

export default {
  name: 'LoginPage',
  components: { IonContent, IonPage },
  data() {
    return {
      mode: 'login',
      form: {
        name: '',
        whatsapp: '',
        email: '',
        password: '',
      },
      showPassword: false,
      isSubmitting: false,
      isError: false,
      message: '',
    };
  },
  methods: {
    setMode(mode) {
      this.mode = mode;
      this.isError = false;
      this.message = '';
    },
    async submitAuth() {
      const { email, password, name, whatsapp } = this.form;
      if (!email.trim() || !password) {
        this.isError = true;
        this.message = translate('loginRequired');
        return;
      }
      if (this.mode === 'register') {
        if (name.trim().length < 2) {
          this.isError = true;
          this.message = translate('enterFullName');
          return;
        }
        if (whatsapp.replace(/\D/g, '').length < 9) {
          this.isError = true;
          this.message = translate('enterWhatsapp');
          return;
        }
        if (password.length < 6) {
          this.isError = true;
          this.message = translate('minChars');
          return;
        }
      }

      this.isSubmitting = true;
      this.isError = false;
      this.message = '';

      try {
        if (this.mode === 'register') {
          await registerUser({
            name: name.trim(),
            whatsapp: whatsapp.trim(),
            email: email.trim(),
            password,
          });
        } else {
          await loginUser({ email: email.trim(), password });
        }
        this.$router.replace(this.$route.query.redirect || '/profile');
      } catch (error) {
        this.isError = true;
        this.message = error.message || translate(this.mode === 'login' ? 'loginFailed' : 'registerFailed');
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
  gap: 0;
  padding-bottom: 36px;
}

/* ── Gradient hero ─────────────────────────────────────────── */
.auth-hero {
  position: relative;
  overflow: hidden;
  padding: 22px 22px 52px;
  border-radius: var(--radius-2xl);
  background: var(--brand-hero-gradient);
  color: #ffffff;
  box-shadow: 0 20px 48px -14px rgba(15, 23, 42, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}

.auth-hero__glow {
  position: absolute;
  top: -120px;
  right: -60px;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(129, 140, 248, 0.4) 0%, transparent 70%);
  pointer-events: none;
}

.auth-hero__top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.auth-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.auth-brand__mark {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(10px);
  font-size: 1.1rem;
}

.auth-skip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #ffffff;
  font-size: 0.76rem;
  font-weight: 700;
  text-decoration: none;
}

.auth-hero__copy {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 10px;
  margin-top: 28px;
}

.auth-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  width: fit-content;
  padding: 5px 11px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.auth-hero h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
}

.auth-hero p {
  margin: 0;
  max-width: 30rem;
  font-size: 0.88rem;
  line-height: 1.55;
  color: rgba(241, 245, 249, 0.85);
}

/* ── Form card ─────────────────────────────────────────────── */
.auth-card {
  position: relative;
  z-index: 2;
  margin-top: -26px;
  margin-inline: 12px;
  padding: 24px 20px 20px;
  border-radius: var(--radius-2xl);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-card);
  display: grid;
  gap: 20px;
}

.auth-tabs {
  display: flex;
  gap: 6px;
  padding: 5px;
  border-radius: var(--radius-lg);
  background: var(--surface-soft);
  border: 1px solid var(--line);
}

.auth-tabs button {
  flex: 1;
  padding: 11px 12px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.auth-tabs button.is-active {
  background: var(--brand-gradient);
  color: #ffffff;
  box-shadow: var(--shadow-brand-sm);
}

.auth-form {
  display: grid;
  gap: 16px;
}

.auth-field {
  display: grid;
  gap: 8px;
}

.auth-field > span {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.auth-field__control {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  border-radius: var(--radius-lg);
  background: var(--surface-soft);
  border: 1px solid var(--line);
  transition: all var(--transition-fast);
}

.auth-field__control:focus-within {
  background: var(--surface);
  border-color: var(--brand-light);
  box-shadow: 0 0 0 4px var(--brand-glow);
}

.auth-field__control > i {
  color: var(--text-subtle);
  font-size: 0.98rem;
  flex-shrink: 0;
}

.auth-field__control:focus-within > i {
  color: var(--brand);
}

.auth-field__control input {
  flex: 1;
  min-width: 0;
  padding: 14px 0;
  border: none;
  background: transparent;
  outline: none;
  color: var(--text-main);
  font-size: 0.92rem;
  font-weight: 500;
}

.auth-field__control input::placeholder {
  color: var(--text-subtle);
  font-weight: 400;
}

.auth-field__toggle {
  border: none;
  background: transparent;
  color: var(--text-subtle);
  padding: 6px;
  cursor: pointer;
}

.auth-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 100%;
  margin-top: 4px;
  padding: 15px;
  border: none;
  border-radius: var(--radius-lg);
  background: var(--brand-gradient);
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: var(--shadow-brand-sm);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.auth-submit:active {
  transform: scale(0.985);
}

.auth-submit:disabled {
  opacity: 0.7;
  cursor: default;
}

.auth-feedback {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  font-size: 0.84rem;
  font-weight: 600;
  line-height: 1.45;
  background: var(--success-soft);
  color: var(--success);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.auth-feedback.is-error {
  background: var(--danger-soft);
  color: var(--danger);
  border-color: rgba(239, 68, 68, 0.2);
}

.auth-footnote {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin: 0;
  color: var(--text-subtle);
  font-size: 0.76rem;
  font-weight: 600;
}

.auth-footnote i {
  color: var(--success);
}

@media (max-width: 360px) {
  .auth-card {
    margin-inline: 6px;
    padding-inline: 16px;
  }
}
</style>
