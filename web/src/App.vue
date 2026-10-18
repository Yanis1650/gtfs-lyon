<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef, watch } from 'vue'

import CarteAtlas from './composants/CarteAtlas.vue'
import BarreTemps from './composants/BarreTemps.vue'
import LegendeCarte from './composants/LegendeCarte.vue'
import CommandesCarte from './composants/CommandesCarte.vue'
import CommandesAcces from './composants/CommandesAcces.vue'
import EnTete from './composants/EnTete.vue'
import GuideDialogue from './composants/GuideDialogue.vue'
import MentionsDialogue from './composants/MentionsDialogue.vue'
import MethodeDialogue from './composants/MethodeDialogue.vue'
import NavigationMobile from './composants/NavigationMobile.vue'
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
import { useRetourCarte } from './etat/balayage'
import { useTheme } from './etat/theme'
import { useVue } from './etat/vue'
import { useDecouverte } from './etat/decouverte'

const { sombre, basculer } = useTheme()
const vue = useVue()
const heure = ref(4) // tranche 4 = 8 h-9 h
const modes = ref<Mode[]>(['metro', 'tram', 'trolleybus', 'bus', 'funiculaire', 'navette_fluviale'])
const indicateur = ref<IndicateurAcces>('pop_tc30')
const pole = ref('part_dieu')
const satellite = ref(false)
const relief = ref(false)
const hauteurTemps = ref(52)
const hauteurAcces = ref(72)
const exploration = ref(false)

const meta = shallowRef<Meta | null>(null)
const lignes = shallowRef(new Map<string, ProprietesLigne>())
const arrets = shallowRef<ProprietesArret[]>([])
const coordonnees = new Map<string, [number, number]>()
const carreaux = shallowRef<Carreaux | null>(null)

const arret = shallowRef<ProprietesArret | null>(null)
const troncon = shallowRef<ProprietesTroncon | null>(null)
const ligne = ref<string | null>(null)
const carreau = shallowRef<ProprietesCarreau | null>(null)
useDecouverte({ heure, relief, exploration, effacer: () => { arret.value = null; troncon.value = null; carreau.value = null; ligne.value = null } })

const carte = ref<InstanceType<typeof CarteAtlas>>()
const contenu = ref<HTMLElement>()
const panneau = ref<HTMLElement>()
const guide = ref<InstanceType<typeof GuideDialogue>>()
useRetourCarte(panneau, exploration)
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

// Une sélection ouvre la lecture sur téléphone, sans conserver la carte au-dessus.
watch([arret, troncon, carreau], async (choix) => {
  if (!choix.some(Boolean)) return
  exploration.value = true
  await nextTick()
  contenu.value?.querySelector('.fiche')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
})
watch(vue, () => { exploration.value = false; contenu.value?.scrollTo({ top: 0 }) })

function choisirArret(a: ProprietesArret | null, centrer = false) {
  arret.value = a
  const point = a && centrer ? coordonnees.get(a.id) : undefined
  if (point) carte.value?.voler(point[0], point[1], 14.5)
}

async function choisirLigne(id: string | null) {
  ligne.value = id
  exploration.value = true
  await nextTick()
  if (!id || !contenu.value) return
  contenu.value.querySelector('.fiche-ligne')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="atlas" :style="{ '--hauteur-temps': `${hauteurTemps}px`, '--hauteur-acces': `${hauteurAcces}px` }">
    <EnTete class="atlas__entete" :date="meta?.date_reference ?? null" :sombre="sombre" @basculer-theme="basculer" @guide="guide?.ouvrir()">
      <Onglets v-model="vue" />
    </EnTete>
    <NavigationMobile v-model="exploration" :vue="vue" class="atlas__navigation" />

    <main id="atlas-carte" :class="['atlas__carte', { 'atlas__carte--offre': vue === 'offre', 'atlas__carte--acces': vue === 'acces', 'atlas__carte--masquee': exploration }]">
      <CarteAtlas
        ref="carte"
        :vue="vue"
        :heure="heure"
        :sombre="sombre"
        :satellite="satellite"
        :relief="relief"
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
      <CommandesCarte v-model:satellite="satellite" v-model:relief="relief" :vue="vue" :heure="heure" />
      <CommandesAcces v-if="vue === 'acces'" v-model:indicateur="indicateur" v-model:pole="pole" :poles="meta?.poles ?? []" @hauteur="hauteurAcces = $event" />
      <LegendeCarte class="atlas__legende" :vue="vue" :sombre="sombre" :indicateur="indicateur" />
    </main>
    <BarreTemps v-if="vue === 'offre'" v-model:heure="heure" class="atlas__temps" @hauteur="hauteurTemps = $event" />

    <section id="atlas-lecture" ref="panneau" :class="['atlas__panneau', { 'atlas__panneau--ouvert': exploration }]" aria-label="Lecture de la carte">
      <p class="atlas__balayage">↔ Glissez pour revenir à la carte</p>
      <div ref="contenu" class="atlas__contenu">
        <template v-if="meta">
          <PanneauOffre
            v-if="vue === 'offre'"
            v-model:heure="heure"
            :meta="meta"
            :sombre="sombre"
            :arret="arret"
            :arrets="arrets"
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
        <PiedDePage class="atlas__pied-mobile" @methode="methode?.ouvrir()" @mentions="mentions?.ouvrir()" />
      </div>
    </section>

    <PiedDePage class="atlas__pied" @methode="methode?.ouvrir()" @mentions="mentions?.ouvrir()" />

    <MethodeDialogue v-if="meta" ref="methode" :meta="meta" />
    <MentionsDialogue ref="mentions" />
    <GuideDialogue ref="guide" @choisir="(v) => { vue = v; exploration = false }" />
  </div>
</template>

<style scoped src="./mise-en-page.css"></style>
