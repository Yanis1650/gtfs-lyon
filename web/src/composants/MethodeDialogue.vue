<script setup lang="ts">
import { computed, ref } from 'vue'

import type { Meta } from '../donnees'
import { dateLongue } from '../format'
import Dialogue from './Dialogue.vue'

const props = defineProps<{ meta: Meta }>()
const cadre = ref<InstanceType<typeof Dialogue>>()
const depart = computed(() => props.meta.accessibilite?.heure_depart ?? 8)
defineExpose({ ouvrir: () => cadre.value?.ouvrir() })
</script>

<template>
  <Dialogue ref="cadre" id="titre-methode" etiquette="Lyon sans voiture" titre="Méthode et sources">
    <h3>Un jour de référence</h3>
    <p>
      Je mesure tout sur un même jour&nbsp;: le {{ dateLongue(meta.date_reference) }}, un jour de semaine en période
      scolaire, hors vacances et jours fériés. Les services actifs ce jour-là viennent du calendrier du flux GTFS
      (calendrier de la semaine, plus les ajouts, moins les retraits). J’écarte les lignes scolaires
      «&nbsp;Junior Direct&nbsp;», qui ne relèvent pas de l’offre ouverte à tous.
    </p>

    <h3>Des quais aux arrêts</h3>
    <p>
      Le GTFS décrit des quais&nbsp;: un par sens et par mode. Je regroupe en un arrêt les quais de même nom distants de
      moins de 250&nbsp;m, ou rattachés à la même station. Un départ compte chaque fois qu’un véhicule quitte l’arrêt en
      prenant des voyageurs&nbsp;; les arrivées en terminus ne comptent pas.
    </p>

    <h3>Des tracés reconstitués</h3>
    <p>
      Le flux ne fournit pas le tracé du métro, du tram, des funiculaires et de quelques bus. Pour chaque suite d’arrêts
      concernée, je cherche parmi les relations OpenStreetMap de la ligne celle qui passe au plus près des arrêts, dans
      leur ordre (écart moyen de 1 à 10&nbsp;m), et j’y place chaque arrêt pour mesurer les distances. À défaut, je relie
      les arrêts en ligne droite&nbsp;: c’est le cas de deux lignes de bus.
    </p>

    <h3>La vitesse commerciale</h3>
    <p>
      C’est la distance parcourue le long du tracé, divisée par le temps de trajet de l’horaire, arrêts compris. Pour une
      ligne ou un tronçon, j’additionne d’abord les kilomètres et les heures de toutes les courses, puis je fais le
      rapport&nbsp;: une course longue pèse plus qu’une courte. Les horaires étant arrondis à la minute, la vitesse d’un
      tronçon se mesure sur une fenêtre de cinq inter-arrêts centrée sur lui.
    </p>

    <h3>Les véhicules en circulation</h3>
    <p>
      Chaque point est une course du jour de référence, placée d’après ses horaires théoriques&nbsp;: ce n’est pas un
      suivi en direct. Le flux arrondit la plupart des horaires à la minute, si bien que plusieurs arrêts de suite
      portent la même heure&nbsp;; je répartis alors le temps selon la distance, entre deux arrêts où l’heure change.
      Entre deux arrêts, le véhicule suit le tracé du tronçon, marque un court arrêt, accélère puis freine.
    </p>
    <p>
      De près, chacun prend sa forme et sa taille réelles, en ordres de grandeur&nbsp;: bus de 12&nbsp;m, articulés de
      18&nbsp;m sur les lignes C et les trolleybus, trams de 32&nbsp;m en cinq modules, métros de deux ou trois
      voitures. Chaque caisse suit la courbe de la voie. Métros et funiculaires, souterrains, restent à plat sous les
      immeubles, dont la hauteur vient d’OpenStreetMap.
    </p>

    <h3>L’accessibilité</h3>
    <p>
      Je la calcule avec r5py, l’interface Python du moteur d’itinéraires R5 de Conveyal, sur le réseau piéton
      d’OpenStreetMap et les horaires GTFS. Pour chacun des carreaux habités de 200&nbsp;m (Insee, Filosofi 2021), je
      simule les départs minute par minute entre {{ depart }}&nbsp;h et {{ depart + 1 }}&nbsp;h et je retiens la durée
      médiane, marche à 3,6&nbsp;km/h comprise. Les temps «&nbsp;depuis un pôle&nbsp;» partent du pôle vers chaque carreau.
    </p>
    <p>
      Pour chaque carreau de départ, j’additionne les habitants des carreaux atteints dans le délai, puis je rapporte ce
      total à la population de la Métropole. «&nbsp;20&nbsp;% en 30&nbsp;min&nbsp;» signifie donc qu’en partant de ce
      carreau, on rejoint en une demi-heure les lieux où vivent 20&nbsp;% des habitants&nbsp;: une mesure de ce que le
      réseau met à portée, et non des habitants du carreau lui-même.
    </p>

    <h3>Outils</h3>
    <p>
      Python et DuckDB (extension spatiale) pour la chaîne de traitement, testée sur un mini-réseau dont chaque résultat
      se calcule à la main&nbsp;; r5py dans un conteneur Docker&nbsp;; Vue 3, TypeScript et MapLibre GL pour la carte, sur
      un fond OpenFreeMap. Le code est public&nbsp;:
      <a href="https://github.com/Yanis1650/gtfs-lyon" target="_blank" rel="noopener noreferrer">github.com/Yanis1650/gtfs-lyon</a>.
    </p>

    <h3>Sources</h3>
    <ul>
      <li v-for="s in meta.sources" :key="s.nom">{{ s.nom }} ({{ s.licence }})</li>
    </ul>
    <p class="note">
      Ces chiffres décrivent l’offre théorique publiée, pas la circulation réelle&nbsp;: retards et perturbations n’y
      figurent pas.
    </p>
  </Dialogue>
</template>
