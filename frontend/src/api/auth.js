import axios from 'axios'
import client from './client'

export async function login(username, password) {
  const res = await axios.post('/api/v1/auth/login/', { username, password })
  return res.data
}

export async function register(username, email, password1, password2) {
  const res = await axios.post('/api/v1/auth/register/', { username, email, password1, password2 })
  return res.data
}

export async function getProfile() {
  const res = await client.get('/auth/profile/')
  return res.data
}

export async function getUserProfile(username) {
  const res = await client.get(`/auth/users/${username}/`)
  return res.data
}

export async function followUser(username) {
  const res = await client.post(`/auth/users/${username}/follow/`)
  return res.data
}

export async function unfollowUser(username) {
  const res = await client.post(`/auth/users/${username}/unfollow/`)
  return res.data
}

export async function updateProfile(data) {
  const res = await client.patch('/auth/profile/', data)
  return res.data
}
