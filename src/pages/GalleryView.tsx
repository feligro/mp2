import { useEffect, useMemo, useState } from 'react';
import { fetchGeneration, fetchPokemon } from '../api/pokeapi';
import type { Pokemon, PokemonTypeName } from '../types/pokemon';
import PokemonSprite from '../components/PokemonSprite';

const GENERATIONS = [
  { id: 1, label: 'Gen I' }, { id: 2, label: 'Gen II' }, { id: 3, label: 'Gen III' },
  { id: 4, label: 'Gen IV' }, { id: 5, label: 'Gen V' }, { id: 6, label: 'Gen VI' },
  { id: 7, label: 'Gen VII' }, { id: 8, label: 'Gen VIII' }, { id: 9, label: 'Gen IX' },
];

const TYPES: PokemonTypeName[] = [
  'normal','fire','water','electric','grass','ice','fighting','poison','ground',
  'flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'
];

export default function GalleryView() {
  const [gen, setGen] = useState<number>(1);
  const [typeFilters, setTypeFilters] = useState<Set<PokemonTypeName>>(new Set());
  const [items, setItems] = useState<Pokemon[]>([]);
  const toggleType = (t: PokemonTypeName) =>
    setTypeFilters(s => {
      const next = new Set(s);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const g = await fetchGeneration(gen);
      // limit to first 50 of the generation to keep it snappy
      const names = g.pokemon_species.slice(0, 30).map(s => s.name);
      const full = await Promise.all(names.map(n => fetchPokemon(n)));
      if (isMounted) setItems(full);
    })();
    return () => { isMounted = false; };
  }, [gen]);

  const filtered = useMemo(() => {
    if (typeFilters.size === 0) return items;
    return items.filter(p => p.types.some(t => typeFilters.has(t.type.name as PokemonTypeName)));
  }, [items, typeFilters]);

  return (
    <div className="page">
      <h2>Pokémon - Gallery</h2>

      <div className="toolbar">
        <label>
          Generation:&nbsp;
          <select value={gen} onChange={e => setGen(parseInt(e.target.value, 10))}>
            {GENERATIONS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
        </label>

        <div className="chips">
          {TYPES.map(t => (
            <button
              key={t}
              className={`chip ${typeFilters.has(t) ? 'active' : ''}`}
              onClick={() => toggleType(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid">
        {filtered.map(p => <PokemonSprite key={p.id} p={p} />)}
      </div>
    </div>
  );
}