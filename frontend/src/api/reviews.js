import client from './client'

export async function getReviews(params = {}) {
  const res = await client.get('/reviews/', { params })
  return res.data
}

export async function createReview(data) {
  const res = await client.post('/reviews/', data)
  return res.data
}

export async function likeReview(id) {
  const res = await client.post(`/reviews/${id}/like/`)
  return res.data
}

export async function unlikeReview(id) {
  const res = await client.post(`/reviews/${id}/unlike/`)
  return res.data
}

export async function getWatchlist(params = {}) {
  const res = await client.get('/reviews/watchlist/', { params })
  return res.data
}

export async function addToWatchlist(data) {
  const res = await client.post('/reviews/watchlist/', data)
  return res.data
}

export async function removeFromWatchlist(id) {
  await client.delete(`/reviews/watchlist/${id}/`)
}

export async function getFeed() {
  const res = await client.get('/reviews/feed/')
  return res.data
}

export async function getRecap(year) {
  const params = year ? { year } : {}
  const res = await client.get('/reviews/recap/', { params })
  return res.data
}
