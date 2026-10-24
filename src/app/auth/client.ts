import { HTTPError } from 'ky'
import { sessionResponseSchema } from '../../domain/auth/auth-schema.ts'
import { api } from '../http/http.ts'

export async function checkSession(): Promise<boolean> {
  try {
    const response = await api.get('session')
    const body = sessionResponseSchema.parse(await response.json())
    return body.authenticated
  } catch (error) {
    if (error instanceof HTTPError && error.response.status === 401) return false
    throw error
  }
}

export async function login(password: string): Promise<boolean> {
  try {
    const response = await api.post('login', { json: { password } })
    if (response.status === 204) return true
    throw new Error('Unexpected login response')
  } catch (error) {
    if (error instanceof HTTPError && error.response.status === 401) return false
    throw error
  }
}

export async function logout(): Promise<void> {
  await api.post('logout')
}
