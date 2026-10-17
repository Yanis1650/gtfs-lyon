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
      Yanis Lepesant, Drekky Studio, micro-entrepreneur. SIRET&nbsp;102&nbsp;161&nbsp;031&nbsp;00012. 63 route de
      l’Épine, 50800 Bourguenolles. Contact&nbsp;: <a href="mailto:contact@drekky.fr">contact@drekky.fr</a>,
      07&nbsp;87&nbsp;15&nbsp;81&nbsp;60.
    </p>
    <p>Directeur de la publication&nbsp;: Yanis Lepesant.</p>

    <h3>Hébergeur</h3>
    <p>OVH SAS, 2 rue Kellermann, 59100 Roubaix.</p>

    <h3>Données personnelles</h3>
    <p>
      Ce site ne collecte aucune donnée personnelle&nbsp;: ni compte, ni formulaire, ni mesure d’audience, ni cookie.
      Votre choix de thème clair ou sombre reste dans votre navigateur (stockage local) et n’est envoyé nulle part.
    </p>
    <p>
      Le fond de carte est chargé chez OpenFreeMap, qui reçoit à ce titre votre adresse IP, comme tout site que l’on
      consulte. Le serveur du site garde ses journaux de connexion techniques le temps nécessaire à sa sécurité.
    </p>

    <h3>Données et licences</h3>
    <p>
      Les couches de la carte dérivent des horaires du réseau TCL (SYTRAL Mobilités) et d’OpenStreetMap, sous licence
      ODbL, et des données carroyées de l’Insee (Licence Ouverte). Elles sont rediffusées sous la même licence ODbL.
    </p>
  </Dialogue>
</template>
