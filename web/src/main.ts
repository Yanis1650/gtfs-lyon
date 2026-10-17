import 'maplibre-gl/dist/maplibre-gl.css'
// Polices de la charte, servies depuis le site : aucune requête vers Google.
import '@fontsource/space-grotesk/latin-400.css'
import '@fontsource/space-grotesk/latin-600.css'
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import './style.css'
import './styles/panneau.css'

import { createApp } from 'vue'

import App from './App.vue'

createApp(App).mount('#app')
