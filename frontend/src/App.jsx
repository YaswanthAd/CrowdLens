import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Browse from './pages/Browse'
import TitleDetail from './pages/TitleDetail'
import Search from './pages/Search'
import Trending from './pages/Trending'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Watchlist from './pages/Watchlist'
import Feed from './pages/Feed'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen bg-zinc-950 flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/movies" element={<Browse />} />
                <Route path="/tv" element={<Browse />} />
                <Route path="/anime" element={<Browse />} />
                <Route path="/title/:slug" element={<TitleDetail />} />
                <Route path="/search" element={<Search />} />
                <Route path="/trending" element={<Trending />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/user/:username" element={<Profile />} />
                <Route path="/watchlist" element={<Watchlist />} />
                <Route path="/feed" element={<Feed />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
