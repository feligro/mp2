import { Link } from 'react-router-dom';
import { typeBg } from '../utils/colors';
import type { Pokemon } from '../types/pokemon';

export default function PokemonCard({ p }: { p: Pokemon }) {
  const name = p.name[0].toUpperCase() + p.name.slice(1);
  const sprite = p.sprites.other?.['official-artwork']?.front_default ?? '';
  const types = p.types.map(t => t.type.name);
  return (
    <Link to={`/pokemon/${p.name}`} className="card" style={{ borderColor: typeBg(types) }}>
      <img src={sprite} alt={name} loading="lazy" />
    </Link>
  );
}