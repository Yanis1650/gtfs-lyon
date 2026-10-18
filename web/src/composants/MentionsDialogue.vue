<script setup lang="ts">
import { ref } from 'vue'

import Dialogue from './Dialogue.vue'

const cadre = ref<InstanceType<typeof Dialogue>>()
defineExpose({ ouvrir: () => cadre.value?.ouvrir() })
</script>

<template>
  <Dialogue ref="cadre" id="titre-mentions" etiquette="Lyon sans voiture" titre="Mentions légales">
    <h3>Éditeur</h3>
    <p>
      Yanis Lepesant. 63 route de l’Épine, 50800 Bourguenolles.
      Contact&nbsp;: <a href="mailto:yanis@drekky.fr">yanis@drekky.fr</a>,
      07&nbsp;87&nbsp;15&nbsp;81&nbsp;60.
    </p>
    <p>Directeur de la publication&nbsp;: Yanis Lepesant.</p>

    <h3>Hébergeur</h3>
    <p>
      OVH SAS, société par actions simplifiée au capital de 50&nbsp;000&nbsp;000&nbsp;€, RCS Lille Métropole
      424&nbsp;761&nbsp;419. Siège&nbsp;: 2 rue Kellermann, 59100 Roubaix, France.
    </p>

    <h3>Données personnelles</h3>
    <p>
      Ce site ne vous demande aucune donnée personnelle&nbsp;: ni compte, ni formulaire, ni cookie, ni mesure
      d’audience. Votre choix de thème clair ou sombre reste dans votre navigateur (stockage local) et n’est envoyé
      nulle part.
    </p>
    <p>
      Pour sa sécurité, le serveur web (nginx) et le relais d’accès (Traefik) enregistrent les requêtes dans deux
      journaux techniques&nbsp;: adresse IP, date et heure, page demandée et navigateur. Base légale&nbsp;:
      l’intérêt légitime à protéger le site (article 6.1.f du RGPD). Chacun est limité à trois fichiers de
      10&nbsp;Mo&nbsp;; les entrées les plus anciennes sont ensuite effacées. Leur durée de conservation dépend
      donc de la fréquentation. Ces journaux restent sur le serveur, chez l’hébergeur OVH, et ne sont transmis à personne.
    </p>
    <p>
      Le fond de carte est chargé chez OpenFreeMap, dont les serveurs passent par Cloudflare, société établie aux
      États-Unis&nbsp;: votre adresse IP leur parvient, comme à tout site que l’on consulte, et peut être traitée hors
      de l’Union européenne. En vue satellite seulement, les photographies aériennes viennent de la Géoplateforme de
      l’IGN, établissement public français, qui reçoit de même votre adresse IP.
    </p>
    <p>
      Vous pouvez demander l’accès à vos données, leur rectification ou leur effacement, en limiter le traitement ou
      vous y opposer en écrivant à <a href="mailto:yanis@drekky.fr">yanis@drekky.fr</a>. Vous pouvez aussi adresser
      une réclamation à la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">cnil.fr</a>).
    </p>

    <h3>Données et licences</h3>
    <p>
      Les couches de la carte dérivent des horaires du réseau TCL (SYTRAL Mobilités) et d’OpenStreetMap, sous licence
      ODbL, et des données carroyées de l’Insee (Licence Ouverte). Elles sont rediffusées sous la même licence ODbL.
      Les photographies aériennes de la vue satellite proviennent de la BD ORTHO® de l’IGN (Licence Ouverte 2.0)&nbsp;;
      la hauteur des immeubles en relief, d’OpenStreetMap.
    </p>
    <p class="note">Mis à jour le 18 octobre 2026.</p>
  </Dialogue>
</template>
