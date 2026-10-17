import type { Map } from 'maplibre-gl'
import { avancement, pointCourse, type Course } from './trajets'

/** Rapproche la vue d’un véhicule de surface effectivement en circulation, de préférence un tram. */
export function montrerModele(carte: Map, courses: Course[], temps: number) {
  if (carte.getZoom() >= 17) return
  const centre = carte.getCenter()
  const limites = carte.getBounds()
  const candidats = courses.flatMap((c) => {
    const a = avancement(c, temps)
    if (!a) return []
    const point = pointCourse(c, a.k, a.d)
    if (!limites.contains(point)) return []
    const distance = (point[0] - centre.lng) ** 2 + (point[1] - centre.lat) ** 2
    return [{ point, distance, surface: ['tram', 'bus', 'trolleybus'].includes(c.mode), tram: c.mode === 'tram' }]
  })
  const visibles = candidats.filter((c) => c.surface)
  const trams = visibles.filter((c) => c.tram)
  const choix = (trams.length ? trams : visibles.length ? visibles : candidats).sort((a, b) => a.distance - b.distance)[0]
  if (!choix) return
  const reduire = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  carte.flyTo({ center: choix.point, zoom: 17, duration: reduire ? 0 : 1200 })
}
