import { computed, ref, watch } from 'vue'

type Theme = 'clair' | 'sombre'
const CLE = 'atlas-theme'

function lire(): Theme {
  try {
    return localStorage.getItem(CLE) === 'sombre' ? 'sombre' : 'clair'
  } catch {
    return 'clair'
  }
}

/** Thème clair par défaut, comme le veut la charte ; le sombre reste au choix, mémorisé. */
export function useTheme() {
  const theme = ref<Theme>(lire())
  const sombre = computed(() => theme.value === 'sombre')

  watch(sombre, (s) => document.documentElement.setAttribute('data-theme', s ? 'dark' : 'light'), {
    immediate: true,
  })

  function basculer() {
    theme.value = sombre.value ? 'clair' : 'sombre'
    try {
      localStorage.setItem(CLE, theme.value)
    } catch {
      // Stockage indisponible (navigation privée) : le choix vaut pour la visite.
    }
  }

  return { sombre, basculer }
}
