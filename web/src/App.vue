<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue'

import CarteAtlas from './composants/CarteAtlas.vue'
import EnTete from './composants/EnTete.vue'
import MentionsDialogue from './composants/MentionsDialogue.vue'
import MethodeDialogue from './composants/MethodeDialogue.vue'
import Onglets from './composants/Onglets.vue'
import PanneauAcces from './composants/PanneauAcces.vue'
import PanneauOffre from './composants/PanneauOffre.vue'
import PanneauVitesse from './composants/PanneauVitesse.vue'
import PiedDePage from './composants/PiedDePage.vue'
import {
  type Carreaux,
  chargerArrets,
  chargerCarreaux,
  chargerLignes,
  chargerMeta,
  type IndicateurAcces,
  type Meta,
  type Mode,
  type ProprietesArret,
  type ProprietesCarreau,
  type ProprietesLigne,
  type ProprietesTroncon,
} from './donnees'
import { population } from './etat/statistiques'
import { useTheme } from './etat/theme'
import { useVue } from './etat/vue'

const { sombre, basculer } = useTheme()
const vue = useVue()
const heure = ref(4) // tranche 4 = 8 h-9 h
const modes = ref<Mode[]>(['metro', 'tram', 'trolleybus', 'bus', 'funiculaire', 'navette_fluviale'])
const indicateur = ref<IndicateurAcces>('pop_tc30')
const pole = ref('part_dieu')

const meta = shallowRef<Meta | null>(null)
const lignes = shallowRef(new Map<string, ProprietesLigne>())
const arrets = shallowRef<ProprietesArret[]>([])
const coordonnees = new Map<string, [number, number]>()
const carreaux = shallowRef<Carreaux | null>(null)

const arret = shallowRef<ProprietesArret | null>(null)
const troncon = shallowRef<ProprietesTroncon | null>(null)
const ligne = ref<string | null>(null)
const carreau = shallowRef<ProprietesCarreau | null>(null)

const carte = ref<InstanceType<typeof CarteAtlas>>()
const contenu = ref<HTMLElement>()
const methode = ref<InstanceType<typeof MethodeDialogue>>()
const mentions = ref<InstanceType<typeof MentionsDialogue>>()

const nomsArrets = computed(() => new Map(arrets.value.map((a) => [a.id, a.nom])))
// Dénominateur des parts de la Métropole, tiré du même fichier que les chiffres des carreaux.
const habitants = computed(() => population(carreaux.value?.features.map((f) => f.properties) ?? []))
const plusDesservis = computed(() => [...arrets.value].sort((a, b) => b.departs - a.departs).slice(0, 8))

onMounted(async () => {
  const [m, l, a] = await Promise.all([chargerMeta(), chargerLignes(), chargerArrets()])
  meta.value = m
  lignes.value = new Map(l.features.map((f) => [f.properties.id, f.properties]))
  arrets.value = a.features.map((f) => f.properties)
  a.features.forEach((f) => coordonnees.set(f.properties.id, f.geometry.coordinates as [number, number]))
})

watch(
  vue,
  async (v) => {
    if (v === 'acces' && !carreaux.value) carreaux.value = await chargerCarreaux().catch(() => null)
  },
  { immediate: true },
)

function choisirArret(a: ProprietesArret | null, centrer = false) {
  arret.value = a
  const point = a && centrer ? coordonnees.get(a.id) : undefined
  if (point) carte.value?.voler(point[0], point[1], 14.5)
}

function choisirLigne(id: string | null) {
  ligne.value = id
  // La fiche de la ligne s'ouvre en haut du panneau : on y remonte (le panneau défile sur
  // bureau, la page sur téléphone).
  if (!id || !contenu.value) return
  contenu.value.scrollTo({ top: 0, behavior: 'smooth' })
  if (window.matchMedia('(max-width: 899px)').matches) contenu.value.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div class="atlas">
    <EnTete class="atlas__entete" :date="meta?.date_reference ?? null" :sombre="sombre" @basculer-theme="basculer" />

    <main class="atlas__carte">
      <CarteAtlas
        ref="carte"
        :vue="vue"
        :heure="heure"
        :sombre="sombre"
        :meta="meta"
        :modes="modes"
        :indicateur="indicateur"
        :pole="pole"
        :population="habitants"
        :ligne="ligne"
        :arret="arret?.id ?? null"
        :carreau="carreau?.id ?? null"
        @arret="(a) => choisirArret(a)"
        @troncon="(t) => (troncon = t)"
        @carreau="(c) => (carreau = c)"
      />
    </main>

    <section class="atlas__panneau" aria-label="Lecture de la carte">
      <Onglets v-model="vue" class="atlas__onglets" />
      <div ref="contenu" class="atlas__contenu">
        <template v-if="meta">
          <PanneauOffre
            v-if="vue === 'offre'"
            v-model:heure="heure"
            :meta="meta"
            :sombre="sombre"
            :arret="arret"
            :plus-desservis="plusDesservis"
            :lignes="lignes"
            @choisir-arret="(a) => choisirArret(a, true)"
          />
          <PanneauVitesse
            v-else-if="vue === 'vitesse'"
            v-model:modes="modes"
            :meta="meta"
            :sombre="sombre"
            :lignes="lignes"
            :noms-arrets="nomsArrets"
            :ligne="ligne"
            :troncon="troncon"
            @choisir-ligne="choisirLigne"
            @fermer-troncon="troncon = null"
          />
          <PanneauAcces
            v-else
            v-model:indicateur="indicateur"
            v-model:pole="pole"
            :meta="meta"
            :sombre="sombre"
            :carreaux="carreaux"
            :carreau="carreau"
            @fermer-carreau="carreau = null"
          />
        </template>
      </div>
    </section>

    <PiedDePage class="atlas__pied" @methode="methode?.ouvrir()" @mentions="mentions?.ouvrir()" />

    <MethodeDialogue v-if="meta" ref="methode" :meta="meta" />
    <MentionsDialogue ref="mentions" />
  </div>
</template>

<style scoped src="./mise-en-page.css"></style>
