import { Routes, Route, NavLink } from 'react-router-dom';
import ListView from './pages/ListView';
import GalleryView from './pages/GalleryView';
import DetailView from './pages/DetailView';
import './index.css';


export default function App() {
  return (
    <>
      <header className="header">
        <h1>Pokédex</h1>
        <nav>
          <NavLink to="/" end>List</NavLink>
          <NavLink to="/gallery">Gallery</NavLink>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<ListView />} />
          <Route path="/gallery" element={<GalleryView />} />
          <Route path="/pokemon/:name" element={<DetailView />} />
        </Routes>
      </main>

      <footer className="footer">CS 409 · MP2</footer>
    </>
  );
}

