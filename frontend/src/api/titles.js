import client from './client'

/* Extract year from release_date and attach as release_year */
function addReleaseYear(title) {
  if (title && title.release_date && !title.release_year) {
    title.release_year = title.release_date.slice(0, 4)
  }
  return title
}

function enrichResults(data) {
  if (data.results) data.results.forEach(addReleaseYear)
  else if (Array.isArray(data)) data.forEach(addReleaseYear)
  return data
}

export async function getTitles(params = {}) {
  const res = await client.get('/titles/', { params })
  return enrichResults(res.data)
}

export async function getTitle(slug) {
  const res = await client.get(`/titles/${slug}/`)
  return addReleaseYear(res.data)
}

export async function getTrending() {
  const res = await client.get('/titles/trending/')
  return enrichResults(res.data)
}

export async function getGenres() {
  const res = await client.get('/titles/genres/')
  return res.data
}
