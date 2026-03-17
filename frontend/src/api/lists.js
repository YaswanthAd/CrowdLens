import client from './client'

export async function getLists(params = {}) {
  const res = await client.get('/reviews/lists/', { params })
  return res.data
}

export async function getMyLists() {
  const res = await client.get('/reviews/lists/', { params: { mine: true } })
  return res.data
}

export async function getUserLists(username) {
  const res = await client.get('/reviews/lists/', { params: { username } })
  return res.data
}

export async function getList(id) {
  const res = await client.get(`/reviews/lists/${id}/`)
  return res.data
}

export async function createList(data) {
  const res = await client.post('/reviews/lists/', data)
  return res.data
}

export async function updateList(id, data) {
  const res = await client.patch(`/reviews/lists/${id}/`, data)
  return res.data
}

export async function deleteList(id) {
  await client.delete(`/reviews/lists/${id}/`)
}

export async function getListEntries(id) {
  const res = await client.get(`/reviews/lists/${id}/entries/`)
  return res.data
}

export async function addListEntry(id, data) {
  const res = await client.post(`/reviews/lists/${id}/entries/`, data)
  return res.data
}

export async function removeListEntry(listId, entryId) {
  await client.delete(`/reviews/lists/${listId}/entries/${entryId}/`)
}

export async function reorderListEntries(listId, order) {
  const res = await client.post(`/reviews/lists/${listId}/reorder/`, { order })
  return res.data
}

export async function likeList(id) {
  const res = await client.post(`/reviews/lists/${id}/like/`)
  return res.data
}

export async function unlikeList(id) {
  const res = await client.post(`/reviews/lists/${id}/unlike/`)
  return res.data
}
