export interface Memorial {
  id: number
  name: string
  aboutHtml: string
}

export interface DraftResponse {
  id: number
  memorialId: number
  contentHtml: string
  updatedAt: string
}
