import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProfile, updateProfile } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Settings() {
  const { user, loading: authLoading } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    display_name: '',
    bio: '',
    location: '',
    website: '',
    twitter_handle: '',
    letterboxd_username: '',
    mal_username: '',
    is_private: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    document.title = 'Settings — CrowdLens'
  }, [])

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [authLoading, user, navigate])

  // Load current profile data into form
  useEffect(() => {
    if (!user) return
    getProfile()
      .then((data) => {
        setForm({
          display_name: data.display_name || '',
          bio: data.bio || '',
          location: data.location || '',
          website: data.website || '',
          twitter_handle: data.twitter_handle || '',
          letterboxd_username: data.letterboxd_username || '',
          mal_username: data.mal_username || '',
          is_private: data.is_private || false,
        })
      })
      .catch(() => showToast('Failed to load profile', 'error'))
      .finally(() => setLoading(false))
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile(form)
      showToast('Profile saved!')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save'
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 max-w-2xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-8 bg-zinc-800 rounded w-40 mb-8" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-zinc-800 rounded mb-4" />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Profile section */}
        <section className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 flex flex-col gap-5">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Profile</h2>

          <div>
            <label className="block text-sm text-zinc-300 mb-1.5">Display name</label>
            <input
              type="text"
              name="display_name"
              value={form.display_name}
              onChange={handleChange}
              maxLength={50}
              placeholder={user?.username}
              className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-zinc-600"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-300 mb-1.5">Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              maxLength={500}
              rows={3}
              placeholder="Tell people a bit about yourself"
              className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-zinc-600 resize-none"
            />
            <p className="text-zinc-600 text-xs mt-1">{form.bio.length}/500</p>
          </div>

          <div>
            <label className="block text-sm text-zinc-300 mb-1.5">Location</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              maxLength={100}
              placeholder="City, Country"
              className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-zinc-600"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-300 mb-1.5">Website</label>
            <input
              type="url"
              name="website"
              value={form.website}
              onChange={handleChange}
              placeholder="https://yoursite.com"
              className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-zinc-600"
            />
          </div>
        </section>

        {/* Social links */}
        <section className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 flex flex-col gap-5">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Social Links</h2>

          <div>
            <label className="block text-sm text-zinc-300 mb-1.5">Twitter / X handle</label>
            <div className="flex items-center bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
              <span className="px-3 text-zinc-500 text-sm select-none">@</span>
              <input
                type="text"
                name="twitter_handle"
                value={form.twitter_handle}
                onChange={handleChange}
                maxLength={50}
                placeholder="username"
                className="flex-1 bg-transparent text-white text-sm py-2.5 pr-3 focus:outline-none placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-300 mb-1.5">Letterboxd username</label>
            <input
              type="text"
              name="letterboxd_username"
              value={form.letterboxd_username}
              onChange={handleChange}
              maxLength={50}
              placeholder="letterboxd username"
              className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-zinc-600"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-300 mb-1.5">MyAnimeList username</label>
            <input
              type="text"
              name="mal_username"
              value={form.mal_username}
              onChange={handleChange}
              maxLength={50}
              placeholder="MAL username"
              className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-zinc-600"
            />
          </div>
        </section>

        {/* Privacy */}
        <section className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Privacy</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="is_private"
              checked={form.is_private}
              onChange={handleChange}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 accent-emerald-500"
            />
            <div>
              <p className="text-white text-sm font-medium">Private account</p>
              <p className="text-zinc-500 text-xs">Your reviews and watchlist will only be visible to your followers</p>
            </div>
          </label>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-medium text-sm px-6 py-3 rounded-lg transition-colors self-start"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
