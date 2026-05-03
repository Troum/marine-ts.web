export type LatitudeHemisphere = 'N' | 'S'
export type LongitudeHemisphere = 'E' | 'W'

export type DmsLatitude = {
  deg: number
  min: number
  sec: number
  hem: LatitudeHemisphere
}

export type DmsLongitude = {
  deg: number
  min: number
  sec: number
  hem: LongitudeHemisphere
}

function roundSec(sec: number): number {
  return Math.round(sec * 10000) / 10000
}

/** Десятичные градусы → градусы, минуты, секунды и полушарие. */
export function decimalLatitudeToDms(latitude: number): DmsLatitude {
  const hem: LatitudeHemisphere = latitude >= 0 ? 'N' : 'S'
  let abs = Math.min(Math.abs(latitude), 90)
  let deg = Math.floor(abs + 1e-12)
  let rem = abs - deg
  let min = Math.floor(rem * 60 + 1e-12)
  let sec = (rem * 60 - min) * 60
  if (sec >= 59.99995) {
    sec = 0
    min += 1
  }
  if (min >= 60) {
    min = 0
    deg += 1
  }
  if (deg > 90) {
    deg = 90
    min = 0
    sec = 0
  }
  return { deg, min, sec: roundSec(sec), hem }
}

export function decimalLongitudeToDms(longitude: number): DmsLongitude {
  const hem: LongitudeHemisphere = longitude >= 0 ? 'E' : 'W'
  let abs = Math.min(Math.abs(longitude), 180)
  let deg = Math.floor(abs + 1e-12)
  let rem = abs - deg
  let min = Math.floor(rem * 60 + 1e-12)
  let sec = (rem * 60 - min) * 60
  if (sec >= 59.99995) {
    sec = 0
    min += 1
  }
  if (min >= 60) {
    min = 0
    deg += 1
  }
  if (deg > 180) {
    deg = 180
    min = 0
    sec = 0
  }
  return { deg, min, sec: roundSec(sec), hem }
}

/** Градусы (неотрицательные), минуты, секунды и полушарие → десятичные градусы. */
export function dmsLatitudeToDecimal(deg: number, min: number, sec: number, hem: LatitudeHemisphere): number {
  const sign = hem === 'S' ? -1 : 1
  const v = Math.abs(deg) + min / 60 + sec / 3600
  const x = sign * v
  return Math.max(-90, Math.min(90, x))
}

export function dmsLongitudeToDecimal(deg: number, min: number, sec: number, hem: LongitudeHemisphere): number {
  const sign = hem === 'W' ? -1 : 1
  const v = Math.abs(deg) + min / 60 + sec / 3600
  const x = sign * v
  return Math.max(-180, Math.min(180, x))
}
