import client from './client'

export async function getMentions(titleId, params = {}) {
  const res = await client.get(`/sentiment/titles/${titleId}/mentions/`, { params })
  return res.data
}

export async function getSentimentHistory(titleId, params = {}) {
  const res = await client.get(`/sentiment/titles/${titleId}/history/`, { params })
  return res.data
}
