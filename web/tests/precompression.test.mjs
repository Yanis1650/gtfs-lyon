import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { gunzipSync } from 'node:zlib'
import { precompresser } from '../deploy/precompresser.mjs'

test('la précompression conserve les octets, les dates et les originaux, sans retraiter images et polices', t => {
  const dossier = mkdtempSync(join(tmpdir(), 'atlas-precompression-'))
  t.after(() => {
    const cible = realpathSync(dossier)
    assert.equal(dirname(cible), realpathSync(tmpdir()))
    assert.ok(basename(cible).startsWith('atlas-precompression-'))
    rmSync(cible, { recursive: true, force: true })
  })
  mkdirSync(join(dossier, 'isochrones'))
  const fichiers = ['index.html', 'app.js', 'app.css', 'index.json', 'carreaux.geojson', 'icone.svg',
    'robots.txt', 'sitemap.xml', join('isochrones', '0.bin')]
  const date = new Date('2026-10-18T08:00:00Z')
  for (const fichier of [...fichiers, 'police.woff2', 'partage.png']) {
    writeFileSync(join(dossier, fichier), new Uint8Array([0, 15, 45, 255, 0, 0]))
    utimesSync(join(dossier, fichier), date, date)
  }
  const bilan = precompresser(dossier)
  assert.equal(bilan.fichiers, fichiers.length)
  for (const fichier of fichiers) {
    const original = join(dossier, fichier), compresse = `${original}.gz`
    assert.deepEqual(gunzipSync(readFileSync(compresse)), readFileSync(original))
    assert.equal(statSync(compresse).mtimeMs, statSync(original).mtimeMs)
  }
  assert.throws(() => statSync(join(dossier, 'police.woff2.gz')), { code: 'ENOENT' })
  assert.throws(() => statSync(join(dossier, 'partage.png.gz')), { code: 'ENOENT' })
  const avant = readFileSync(join(dossier, 'isochrones', '0.bin.gz'))
  assert.deepEqual(precompresser(dossier), bilan, 'Relancer ne compresse pas les fichiers .gz une seconde fois')
  assert.deepEqual(readFileSync(join(dossier, 'isochrones', '0.bin.gz')), avant)
  writeFileSync(join(dossier, 'isochrones', '0.bin'), new Uint8Array([0, 255]))
  precompresser(dossier)
  assert.deepEqual(gunzipSync(readFileSync(join(dossier, 'isochrones', '0.bin.gz'))), Buffer.from([0, 255]))
})
