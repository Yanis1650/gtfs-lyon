<script setup lang="ts">
import { computed } from 'vue'

import type { Carreaux, IndicateurAcces, Meta, ProprietesCarreau } from '../donnees'
import { medianePonderee, partSous, population } from '../etat/statistiques'
import { nombre, part, pourcent } from '../format'
import { classesPart, classesTemps } from '../palette'
import FicheCarreau from './FicheCarreau.vue'
import Legende from './Legende.vue'

const props = defineProps<{
  meta: Meta
  sombre: boolean
  carreaux: Carreaux | null
  carreau: ProprietesCarreau | null
}>()
const indicateur = defineModel<IndicateurAcces>('indicateur', { required: true })
const pole = defineModel<string>('pole', { required: true })
const emit = defineEmits<{ fermerCarreau: [] }>()

const habitants = computed(() => props.carreaux?.features.map((f) => f.properties) ?? [])
const total = computed(() => population(habitants.value))
const depart = computed(() => props.meta.accessibilite?.heure_depart ?? 8)
const nomPole = computed(() => props.meta.poles.find((p) => p.id === pole.value)?.nom ?? '')
const seuil = computed(() => (indicateur.value === 'pop_tc45' ? 45 : 30))
const medianeTc = computed(() =>
  medianePonderee(habitants.value, (c) => (indicateur.value === 'pop_tc45' ? c.pop_tc45 : c.pop_tc30)),
)
const medianeMarche = computed(() => medianePonderee(habitants.value, (c) => c.pop_marche30))
</script>

<template>
  <section class="panneau-vue">
    <p class="intro">
      Chaque carreau habité de 200&nbsp;m sert de point de départ. Le calcul simule les trajets en transports en commun,
      marche comprise, pour un départ entre {{ depart }}&nbsp;h et {{ depart + 1 }}&nbsp;h, et retient la durée médiane.
    </p>

    <div class="puces" role="group" aria-label="Indicateur affiché">
      <button class="puce" :aria-pressed="indicateur === 'pop_tc30'" @click="indicateur = 'pop_tc30'">
        Métropole à 30&nbsp;min
      </button>
      <button class="puce" :aria-pressed="indicateur === 'pop_tc45'" @click="indicateur = 'pop_tc45'">
        à 45&nbsp;min
      </button>
      <button class="puce" :aria-pressed="indicateur === 'temps'" @click="indicateur = 'temps'">
        Temps depuis un pôle
      </button>
    </div>

    <template v-if="indicateur === 'temps'">
      <div class="puces" role="group" aria-label="Pôle de départ">
        <button
          v-for="p in meta.poles"
          :key="p.id"
          class="puce puce--petite"
          :aria-pressed="pole === p.id"
          @click="pole = p.id"
        >
          {{ p.nom }}
        </button>
      </div>
      <dl v-if="carreaux" class="tuiles">
        <div>
          <dt>Habitants à moins de 30&nbsp;min</dt>
          <dd class="chiffres">{{ pourcent(partSous(habitants, pole, 30)) }}</dd>
        </div>
        <div>
          <dt>À moins de 45&nbsp;min</dt>
          <dd class="chiffres">{{ pourcent(partSous(habitants, pole, 45)) }}</dd>
        </div>
      </dl>
      <Legende :titre="`Temps de trajet depuis ${nomPole}`" :classes="classesTemps(sombre)" forme="carre" />
    </template>

    <template v-else>
      <dl v-if="carreaux && total" class="tuiles">
        <div>
          <dt>Un habitant sur deux joint en {{ seuil }}&nbsp;min au moins</dt>
          <dd class="chiffres">{{ part(medianeTc / total) }}<span class="unite">de la Métropole</span></dd>
        </div>
        <div>
          <dt>À pied seulement, en 30&nbsp;min</dt>
          <dd class="chiffres">{{ part(medianeMarche / total) }}<span class="unite">de la Métropole</span></dd>
        </div>
      </dl>
      <Legende
        :titre="`Habitants de la Métropole joignables en ${seuil} minutes`"
        :classes="classesPart(sombre)"
        forme="carre"
        :note="
          `Lecture : 20 % signifie qu’en partant de ce carreau, on rejoint en ${seuil} min les lieux ` +
          `où vivent 20 % des ${nombre(total)} habitants de la Métropole (Insee, Filosofi 2021).`
        "
      />
    </template>

    <FicheCarreau
      v-if="carreau"
      :carreau="carreau"
      :poles="meta.poles"
      :total="total"
      @fermer="emit('fermerCarreau')"
    />
    <p v-else class="note">Touchez ou cliquez un carreau pour le détail.</p>
  </section>
</template>

<style scoped>
.puce--petite {
  font-size: 13px;
  padding: 4px 9px;
}
.unite {
  display: block;
  margin-top: 2px;
  font-family: var(--police-texte, inherit);
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0;
  color: var(--discret);
}
</style>
