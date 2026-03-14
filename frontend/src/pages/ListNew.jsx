import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createList } from '../api/lists'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function ListNew() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [isRanked, setIsRanked] = useState(false)
  const [saving, setSaving] = useState(false)

  const { user, loading: authLoading } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'New List — CrowdLens'
  }, [])

  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [user, authLoading, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const list = await createList({ name: name.trim(), description, is_public: isPublic, is_ranked: isRanked })
      showToast('List created!')
      navigate(`/lists/${list.id}/edit`)
    } catch {
      showToast('Failed to create list', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) return null

  return (
    <div className="min-h-screen bg-zinc-950 max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-white mb-8">Create a List</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2">
            List Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Best Horror of the 80s"
            maxLength={200}
            required
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this list about?"
            rows={3}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
          />
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 cursor-pointer">
            <div>
              <p className="text-white text-sm font-medium">Public</p>
              <p className="text-zinc-500 text-xs mt-0.5">Anyone can see this list</p>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic((v) => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                isPublic ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  isPublic ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 cursor-pointer">
            <div>
              <p className="text-white text-sm font-medium">Ranked</p>
              <p className="text-zinc-500 text-xs mt-0.5">Show position numbers</p>
            </div>
            <button
              type="button"
              onClick={() => setIsRanked((v) => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                isRanked ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  isRanked ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/lists')}
            className="flex-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white text-sm font-medium py-3 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black text-sm font-semibold py-3 rounded-lg transition-colors"
          >
            {saving ? 'Creating…' : 'Create List'}
          </button>
        </div>
      </form>
    </div>
  )
}
