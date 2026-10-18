import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { dessiner, ordonner } from '../src/isochrones/geometrie.ts'

// Référence indépendante : annuler les côtés en double de tous les polygones retenus.
function unionBrute(cellules, temps, seuil) {
  const bords = new Set()
  cellules.forEach((c, i) => {
    if (temps[i] > seuil) return
    for (const anneau of c.geometry.coordinates) for (let j = 1; j < anneau.length; j++) {
      const cle = [anneau[j - 1].join(','), anneau[j].join(',')].sort().join('|')
      if (bords.has(cle)) bords.delete(cle)
      else bords.add(cle)
    }
  })
  return [...bords].sort()
}

test('les tracés rapides conservent exactement les unions et populations du jeu publié', async () => {
  const base = new URL('../public/data/', import.meta.url)
  const index = JSON.parse(await readFile(new URL('isochrones/index.json', base), 'utf8'))
  const cellules = ordonner(JSON.parse(await readFile(new URL('carreaux.geojson', base), 'utf8')), index.ids)
  const origines = [3598, ...Array.from({ length: 31 }, (_, i) => i * 253)].filter(i => i < index.ids.length)
  for (const origine of origines) {
    const temps = new Uint8Array(await readFile(new URL(`isochrones/${index.version}/${origine}.bin`, base)))
    for (const seuil of [15, 30, 45]) {
      const trace = dessiner(cellules, temps, origine, seuil)
      const selection = cellules.filter((_, i) => temps[i] <= seuil)
      assert.equal(trace.carreaux, selection.length)
      assert.equal(trace.habitants, selection.reduce((s, c) => s + c.properties.pop, 0))
      for (const c of trace.contours.features) {
        const segments = c.geometry.coordinates.map(a => a.map(p => p.join(',')).sort().join('|')).sort()
        assert.deepEqual(segments, unionBrute(cellules, temps, c.properties.minutes))
      }
      assert.equal(trace.bandes.filter(b => b <= seuil / 15).length, trace.carreaux)
    }
  }
})
