import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

async function modules(t) {
  const serveur = await createServer({ configFile: false, logLevel: 'silent', appType: 'custom',
    root: fileURLToPath(new URL('..', import.meta.url)), server: { middlewareMode: true, watch: null } })
  t.after(() => serveur.close())
  return {
    trajets: await serveur.ssrLoadModule('/src/simulation/trajets.ts'),
    gabarits: await serveur.ssrLoadModule('/src/simulation/gabarits.ts'),
  }
}

const M = 111_200
const COS = Math.cos((45.76 * Math.PI) / 180)
const est = (lon, m) => lon + m / (M * COS)
const troncon = (de, vers, points) => ({ type: 'Feature', properties: { de, vers }, geometry: { type: 'LineString', coordinates: points } })
const longueurMax = (caisse) => {
  const p = caisse.geometry.coordinates[0]
  let max = 0
  for (const a of p) for (const b of p) max = Math.max(max, Math.hypot((a[0] - b[0]) * COS * M, (a[1] - b[1]) * M))
  return max
}

function course(trajets, ecartQuais) {
  const lat = 45.76
  // Deux quais du même arrêt logique B : le tronçon suivant repart `ecartQuais` mètres plus loin.
  const index = trajets.indexerTroncons({ type: 'FeatureCollection', features: [
    troncon('A', 'B', [[4.85, lat], [est(4.85, 200), lat]]),
    troncon('B', 'C', [[est(4.85, 200 + ecartQuais), lat], [est(4.85, 400 + ecartQuais), lat]]),
  ] })
  return { mode: 'bus', ligne: '86', couleur: '#000', heures: [0, 60, 120], traces: [index.get('A>B'), index.get('B>C')] }
}

test('un bus qui quitte un arrêt aux quais éloignés garde sa longueur', async (t) => {
  const { trajets, gabarits } = await modules(t)
  const c = course(trajets, 100)
  const [caisse] = gabarits.silhouettes(c, 1, 2 / M, '#000')
  assert.ok(longueurMax(caisse) < 13.5, `caisse de ${longueurMax(caisse).toFixed(1)} m`)
})

test('sur des tronçons raccordés, l’arrière suit encore le tronçon précédent', async (t) => {
  const { trajets } = await modules(t)
  const c = course(trajets, 0)
  const [lon] = trajets.pointCourse(c, 1, -10 / M)
  assert.ok(Math.abs((lon - est(4.85, 190)) * COS * M) < 0.01)
})
