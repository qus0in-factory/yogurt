import ky from 'ky'

const baseUrl = typeof window === 'undefined' ? 'http://localhost' : window.location.origin

export const api = ky.create({ prefix: '/api', baseUrl })
