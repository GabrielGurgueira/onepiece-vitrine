import { Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import ListingDetail from './pages/ListingDetail'
import NewListing from './pages/NewListing'
import MyListings from './pages/MyListings'
import Login from './pages/Login'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/anuncio/:id" element={<ListingDetail />} />
        <Route path="/novo" element={<NewListing />} />
        <Route path="/meus-anuncios" element={<MyListings />} />
        <Route path="/entrar" element={<Login />} />
      </Routes>
      <NavBar />
    </div>
  )
}
