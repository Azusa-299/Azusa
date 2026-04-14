export interface Provider {
  id: string
  name: string
  baseUrl: string
  apiKeyFormat: string
  features: string[]
  modelsEndpoint: string
}
