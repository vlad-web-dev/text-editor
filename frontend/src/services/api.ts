import axios from 'axios'
import type { Memorial, DraftResponse } from '@/types/memorial'

const http = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

export const getMemorial = (id: number): Promise<Memorial> =>
  http.get<Memorial>(`/memorials/${id}`).then((r) => r.data)

export const patchAbout = (id: number, html: string): Promise<Memorial> =>
  http.patch<Memorial>(`/memorials/${id}/about`, { about_html: html }).then((r) => r.data)

export const getDraft = (id: number): Promise<DraftResponse> =>
  http.get<DraftResponse>(`/memorials/${id}/draft`).then((r) => r.data)

export const postDraft = (id: number, html: string): Promise<DraftResponse> =>
  http.post<DraftResponse>(`/memorials/${id}/draft`, { content_html: html }).then((r) => r.data)

export const deleteDraft = (id: number): Promise<void> =>
  http.delete(`/memorials/${id}/draft`).then(() => undefined)
