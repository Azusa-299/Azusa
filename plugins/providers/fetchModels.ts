export async function fetchModels(baseUrl: string, apiKey: string): Promise<string[]> {
  // 大部分 OpenAI 兼容的 API 都是 GET /models
  const res = await fetch(`${baseUrl}/models`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  })
  const data = await res.json()
  // OpenAI 格式: { data: [{ id: "gpt-4o", ... }] }
  return data.data?.map((m: any) => m.id) ?? []
}
