import { Link } from 'react-router-dom';
import type { Pokemon } from '../types/pokemon';

export default function PokemonCard({ p }: { p: Pokemon }) {
  const name = p.name[0].toUpperCase() + p.name.slice(1);
  const id = "#" + p.id
  const sprite = p.sprites.other?.['official-artwork']?.front_default ?? '';
  const types = p.types.map(t => t.type.name);
  const primary = types[0] ?? 'normal';
  return (
    <Link to={`/pokemon/${p.name}`} className={`card card--${primary}`}>
      <img src={sprite} alt={name} loading="lazy" />
      <div className="card-body">
        <h3 className="title">{id + " " + name}</h3>
        <div className="types">
          {types.map(t => (
          <span key={t} className={`type type--${t}`}>
          {t[0].toUpperCase() + t.slice(1)}
          </span>
          ))}
        </div>
      </div>
    </Link>
  );
}