<template>
  <!-- Splash Screen Overlay -->
  <transition name="splash-fade">
    <div v-if="showSplash" class="splash-screen">
      <div class="splash-content">
        <div class="splash-logo-ring">
          <div class="splash-logo-inner">
            <i class="fa-solid fa-graduation-cap"></i>
          </div>
        </div>
        <h1 class="splash-title">Twige Academy</h1>
        <p class="splash-tagline">Learn. Grow. Succeed.</p>
        <div class="splash-loader">
          <div class="splash-loader-bar"></div>
        </div>
      </div>
    </div>
  </transition>

  <!-- Exit Prompt Toast -->
  <transition name="toast-fade">
    <div v-if="showExitToast" class="exit-toast">
      <span>Press back again to exit</span>
    </div>
  </transition>

  <RouterView />

  <!-- Global picture-in-picture mini player: survives route changes so a
       lesson keeps playing after you go back from the video page. -->
  <MiniVideoPlayer />
</template>

<script>
import { App as CapApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { useRouter } from 'vue-router';
import { onMounted, ref, watch } from 'vue';
import MiniVideoPlayer from '@/components/MiniVideoPlayer.vue';
import { stopMiniPlayer } from '@/services/miniPlayer';

export default {
  name: 'AppRoot',
  components: { MiniVideoPlayer },
  setup() {
    const router = useRouter();
    const showSplash = ref(true);
    const showExitToast = ref(false);
    let lastBackPressTime = 0;
    let toastTimeout = null;

    // Whenever a full lesson page opens, the floating video is done: the user
    // is about to play a (possibly different) video in the main player.
    watch(
      () => router.currentRoute.value,
      (to) => {
        if (to.name === 'course-details') {
          stopMiniPlayer();
        }
      }
    );

    onMounted(async () => {
      // ── Hide native Capacitor splash screen smoothly ──
      try {
        await SplashScreen.hide();
      } catch (_) {
        // Not on native device – ignore
      }

      // ── Show animated branding splash for 2 seconds ──
      setTimeout(() => {
        showSplash.value = false;
      }, 2000);

      // ── Android hardware / gesture back button handler ──
      try {
        await CapApp.addListener('backButton', () => {
          const currentPath = router.currentRoute.value.path;

          // 1. If currently on a sub-page or detail page (not home and not login)
          if (currentPath !== '/home' && currentPath !== '/' && currentPath !== '/login') {
            // Check if there is history in Vue router
            if (window.history.state && window.history.state.back) {
              router.back();
            } else {
              // Fallback: If no back history exists, always go to home
              router.replace('/home');
            }
            return;
          }

          // 2. If already on Home (or Login) page:
          const now = Date.now();
          if (now - lastBackPressTime < 2000) {
            // Second back press within 2s -> exit / minimize app
            showExitToast.value = false;
            CapApp.exitApp();
          } else {
            // First back press -> prompt user with toast
            lastBackPressTime = now;
            showExitToast.value = true;
            if (toastTimeout) clearTimeout(toastTimeout);
            toastTimeout = setTimeout(() => {
              showExitToast.value = false;
            }, 2000);
          }
        });
      } catch (_) {
        // Not on native – ignore
      }
    });

    return {
      showSplash,
      showExitToast,
    };
  },
};
</script>

<style>
/* ── Splash Screen ── */
.splash-screen {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
}

.splash-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  animation: splash-enter 0.6s ease-out;
}

@keyframes splash-enter {
  from {
    opacity: 0;
    transform: scale(0.85) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Logo Ring */
.splash-logo-ring {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    #6366f1,
    #a78bfa,
    #818cf8,
    #6366f1
  );
  padding: 4px;
  animation: splash-spin 2.5s linear infinite;
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes splash-spin {
  to { transform: rotate(360deg); }
}

.splash-logo-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #1e1b4b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: #a78bfa;
}

/* Title */
.splash-title {
  margin: 0;
  font-family: 'Outfit', sans-serif;
  font-size: 2rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.02em;
  text-align: center;
}

.splash-tagline {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
  color: rgba(167, 139, 250, 0.8);
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

/* Loading Bar */
.splash-loader {
  width: 160px;
  height: 4px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
  margin-top: 12px;
}

.splash-loader-bar {
  width: 40%;
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, #6366f1, #a78bfa);
  animation: splash-load 1.4s ease-in-out infinite;
}

@keyframes splash-load {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}

/* Fade-out transition for splash */
.splash-fade-leave-active {
  transition: opacity 0.5s ease;
}
.splash-fade-leave-to {
  opacity: 0;
}

/* ── Exit Toast ── */
.exit-toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  color: #f1f5f9;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 10px 20px;
  border-radius: 9999px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  z-index: 99999;
  pointer-events: none;
  white-space: nowrap;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}
</style>
