import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

test('le rendu réutilise les polygones, ne recolore que les différences et restaure un nouveau style', async t => {
  const serveur = await createServer({ configFile: false, logLevel: 'silent',
    root: fileURLToPath(new URL('..', import.meta.url)), appType: 'custom',
    server: { middlewareMode: true, watch: null } })
  t.after(() => serveur.close())
  const { afficherIsochrones } = await serveur.ssrLoadModule('/src/isochrones/couches.ts')
  const sources = new Map()
  const donnees = [], etats = [], peintures = []
  const carte = {
    getSource(id) {
      if (!sources.has(id)) sources.set(id, { setData: d => donnees.push([id, d]) })
      return sources.get(id)
    },
    getLayer: () => true,
    setLayoutProperty() {},
    setPaintProperty: (...args) => peintures.push(args),
    setFeatureState: (f, etat) => etats.push([f.id, etat['iso-bande']]),
  }
  const ids = ['a', 'b', 'c']
  const vide = { type: 'FeatureCollection', features: [] }
  const trace = (bandes, seuil = 45) => ({ ids, bandes: new Uint8Array(bandes), seuil,
    contours: vide, depart: vide, habitants: 0, carreaux: 0 })
  let resultat = trace([1, 3, 4])
  afficherIsochrones(carte, true, resultat)
  assert.deepEqual(etats, [['a', 1], ['b', 3]], 'Les carreaux hors limite restent transparents par défaut')
  assert.deepEqual(donnees.map(([id]) => id), ['iso-contours', 'iso-depart'])
  donnees.length = etats.length = peintures.length = 0
  afficherIsochrones(carte, true, resultat)
  assert.equal(donnees.length + etats.length + peintures.length, 0, 'Un affichage inchangé ne renvoie rien')
  resultat = trace([1, 4, 4])
  afficherIsochrones(carte, true, resultat)
  assert.deepEqual(etats, [['b', 4]], 'Le carreau qui sort de la zone est bien effacé')
  assert.equal(peintures.length, 0, 'Changer de départ ne recrée pas les expressions de couleur')
  donnees.length = etats.length = 0
  resultat = trace([1, 4, 4], 15)
  afficherIsochrones(carte, true, resultat)
  assert.equal(etats.length, 0, 'Changer le seuil ne recolore pas tous les carreaux')
  assert.deepEqual(peintures[0].slice(0, 2), ['iso-zones', 'fill-opacity'])
  donnees.length = 0
  afficherIsochrones(carte, false, resultat)
  assert.equal(donnees.length, 0, 'Masquer les isochrones ne recharge pas leurs sources')
  afficherIsochrones(carte, true)
  assert.ok(donnees.every(([, d]) => d.features.length === 0))
  resultat = trace([3, 4, 1])
  etats.length = 0
  afficherIsochrones(carte, true, resultat)
  assert.deepEqual(etats, [['a', 3], ['c', 1]], 'Un nouveau départ après effacement remplace les anciennes couleurs')
  etats.length = donnees.length = 0
  sources.clear()
  afficherIsochrones(carte, true, resultat)
  assert.deepEqual(etats, [['a', 3], ['c', 1]], 'Satellite et thème recréent les états perdus avec le style')
  assert.equal(donnees.length, 2)
})
