<template>
  <ion-page>
    <ion-content :fullscreen="true" class="app-screen">
      <div class="screen-shell auth-shell">
        <!-- Auth Header -->
        <section class="auth-hero">
          <div class="auth-logo-badge">
            <i class="fa-solid fa-graduation-cap"></i>
          </div>
          <span class="pill pill--brand">{{ t('appName') }}</span>
          <h1>{{ t(mode === 'login' ? 'greeting' : 'createAccount') }}</h1>
          <p>{{ t(mode === 'login' ? 'loginSubtitle' : 'registerSubtitle') }}</p>
          
          <div class="auth-hero__highlights">
            <span class="highlight-chip">
              <i class="fa-solid fa-circle-play"></i> {{ t('fullHDLessons') }}
            </span>
            <span class="highlight-chip">
              <i class="fa-solid fa-language"></i> EN / FR / RN
            </span>
            <span class="highlight-chip">
              <i class="fa-solid fa-shield-halved"></i> {{ t('secureAccess') }}
            </span>
          </div>
        </section>

        <!-- Auth Form Card -->
        <section class="surface-card auth-card">
          <div class="auth-card__header">
            <div>
              <p class="section-kicker">
                <i :class="mode === 'login' ? 'fa-solid fa-lock' : 'fa-solid fa-user-plus'"></i>
                {{ t(mode === 'login' ? 'accountLogin' : 'createAccount') }}
              </p>
              <h3>{{ t(mode === 'login' ? 'signInContinue' : 'createAccount') }}</h3>
            </div>
          </div>

          <div class="auth-mode-switch" role="tablist">
            <button
              type="button"
              role="tab"
              :aria-selected="mode === 'login'"
              :class="{ 'is-active': mode === 'login' }"
              @click="setMode('login')"
            >
              <i class="fa-solid fa-right-to-bracket"></i> {{ t('signIn') }}
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="mode === 'register'"
              :class="{ 'is-active': mode === 'register' }"
              @click="setMode('register')"
            >
              <i class="fa-solid fa-user-plus"></i> {{ t('signUp') }}
            </button>
          </div>

          <form class="auth-form" @submit.prevent="submitAuth">
            <label v-if="mode === 'register'" class="input-block">
              <span>{{ t('fullName') }}</span>
              <div class="input-field-wrap">
                <i class="fa-regular fa-user input-icon"></i>
                <input
                  v-model="form.name"
                  type="text"
                  :placeholder="t('fullNamePlaceholder')"
                  autocomplete="name"
                  required
                />
              </div>
            </label>

            <label v-if="mode === 'register'" class="input-block">
              <span>{{ t('whatsappNumber') }}</span>
              <div class="input-field-wrap">
                <i class="fa-brands fa-whatsapp input-icon"></i>
                <input
                  v-model="form.whatsapp"
                  type="tel"
                  :placeholder="t('whatsappPlaceholder')"
                  autocomplete="tel"
                  required
                />
              </div>
            </label>

            <div v-if="mode === 'register'" class="input-block">
              <span>{{ t('registerAs') }}</span>
              <div class="role-switch">
                <button
                  type="button"
                  :class="{ 'is-active': form.role === 'student' }"
                  @click="form.role = 'student'"
                >
                  <i class="fa-solid fa-book-open"></i> {{ t('student') }}
                </button>
                <button
                  type="button"
                  :class="{ 'is-active': form.role === 'teacher' }"
                  @click="form.role = 'teacher'"
                >
                  <i class="fa-solid fa-chalkboard-user"></i> {{ t('teacher') }}
                </button>
              </div>
            </div>

            <label v-if="mode === 'register' && form.role === 'teacher'" class="input-block">
              <span>{{ t('specialty') }}</span>
              <div class="input-field-wrap">
                <i class="fa-solid fa-palette input-icon"></i>
                <input
                  v-model="form.specialty"
                  type="text"
                  :placeholder="t('specialtyPlaceholder')"
                />
              </div>
            </label>

            <label class="input-block">
              <span>{{ t('emailAddress') }}</span>
              <div class="input-field-wrap">
                <i class="fa-regular fa-envelope input-icon"></i>
                <input
                  v-model="form.email"
                  type="email"
                  :placeholder="t('emailPlaceholder')"
                  autocomplete="email"
                  required
                />
              </div>
            </label>

            <label class="input-block">
              <div class="password-label-row">
                <span>{{ t('password') }}</span>
              </div>
              <div class="input-field-wrap">
                <i class="fa-solid fa-key input-icon"></i>
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  :placeholder="t('passwordPlaceholder')"
                  :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
                  minlength="6"
                  required
                />
                <button
                  class="password-toggle-btn"
                  type="button"
                  :aria-label="t('togglePasswordVisibility')"
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
              <i v-else-if="mode === 'login'" class="fa-solid fa-right-to-bracket"></i>
              <i v-else class="fa-solid fa-user-plus"></i>
              <span>{{ isSubmitting ? t(mode === 'login' ? 'verifying' : 'signingUp') : t(mode === 'login' ? 'signIn' : 'signUp') }}</span>
            </button>
          </form>

          <div v-if="message" class="auth-feedback" :class="{ 'is-error': isError, 'is-info': !isError }">
            <i :class="isError ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-info'"></i>
            <span>{{ message }}</span>
          </div>

          <div class="auth-card__footer">
            <button type="button" class="text-link auth-mode-link" @click="setMode(mode === 'login' ? 'register' : 'login')">
              <i :class="mode === 'login' ? 'fa-solid fa-user-plus' : 'fa-solid fa-right-to-bracket'"></i>
              <span>{{ t(mode === 'login' ? 'switchToSignUp' : 'switchToSignIn') }}</span>
            </button>
            <RouterLink to="/home" class="text-link">
              <i class="fa-solid fa-arrow-left"></i>
              <span>{{ t('backToExplore') }}</span>
            </RouterLink>
          </div>
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
  components: {
    IonContent,
    IonPage,
  },
  data() {
    return {
      mode: 'login',
      form: {
        name: '',
        whatsapp: '',
        role: 'student',
        specialty: '',
        email: '',
        password: '',
      },
      showPassword: false,
      isSubmitting: false,
      isError: false,
      message: translate('loginHeroSubtitle'),
    };
  },
  methods: {
    setMode(mode) {
      this.mode = mode;
      this.isError = false;
      this.message = translate(mode === 'login' ? 'loginHeroSubtitle' : 'registerSubtitle');
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
      this.message = translate(this.mode === 'login' ? 'verifying' : 'signingUp');

      try {
        if (this.mode === 'register') {
          await registerUser({
            name: name.trim(),
            whatsapp: whatsapp.trim(),
            role: this.form.role,
            specialty: this.form.role === 'teacher' ? this.form.specialty.trim() : '',
            email: email.trim(),
            password,
          });
        } else {
          await loginUser({ email: email.trim(), password });
        }
        const redirect = this.$route.query.redirect || '/profile';
        this.$router.replace(redirect);
      } catch (error) {
        this.isError = true;
        this.message = error.message || translate(this.mode === 'login' ? 'loginFailed' : 'checkoutFailed');
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

.auth-mode-switch,
.role-switch {
  display: flex;
  gap: 8px;
  padding: 5px;
  border-radius: var(--radius-lg);
  background: var(--surface-soft);
  border: 1px solid var(--line);
}

.auth-mode-switch button,
.role-switch button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 10px 12px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.auth-mode-switch button.is-active,
.role-switch button.is-active {
  background: var(--brand-gradient);
  color: #ffffff;
  box-shadow: var(--shadow-brand-sm);
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
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px 18px;
  padding-top: 6px;
}

.auth-mode-link {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  font: inherit;
}
</style>
