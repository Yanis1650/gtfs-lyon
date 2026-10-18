// Prépare les variantes gzip une fois dans l'étape Node de l'image, sans dépendance ajoutée.
import { readdirSync, readFileSync, statSync, utimesSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const FORMATS = new Set(['.html', '.css', '.js', '.json', '.geojson', '.bin', '.svg', '.txt', '.xml'])

export function precompresser(dossier) {
  const bilan = { fichiers: 0, originaux: 0, compresses: 0 }
  function parcourir(repertoire) {
    for (const entree of readdirSync(repertoire, { withFileTypes: true })) {
      const chemin = join(repertoire, entree.name)
      if (entree.isDirectory()) parcourir(chemin)
      else if (entree.isFile() && FORMATS.has(extname(entree.name))) {
        const dates = statSync(chemin)
        const original = readFileSync(chemin)
        const compresse = gzipSync(original, { level: 9 })
        writeFileSync(`${chemin}.gz`, compresse)
        // Même Last-Modified pour les deux représentations ; ETag et Vary les distinguent.
        utimesSync(`${chemin}.gz`, dates.atime, dates.mtime)
        bilan.fichiers++
        bilan.originaux += original.length
        bilan.compresses += compresse.length
      }
    }
  }
  parcourir(resolve(dossier))
  return bilan
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const b = precompresser(process.argv[2] ?? 'dist')
  console.log(`${b.fichiers} variantes gzip : ${b.compresses} octets pour ${b.originaux} octets originaux.`)
}
