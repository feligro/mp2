import { useEffect, useMemo, useState } from 'react';
import { fetchGeneration, fetchPokemon, fetchSpecies } from '../api/pokeapi';
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
    try {
      const g = await fetchGeneration(gen);

      const speciesNames = g.pokemon_species.slice(0, 156).map((s: any) => s.name);

      const defaultPokemonNames = await Promise.all(
        speciesNames.map(async (name: string) => {
          try {
            const s = await fetchSpecies(name);
            const def = s.varieties.find((v: any) => v.is_default) ?? s.varieties[0];
            return def.pokemon.name; 
          } catch (e) {
            console.warn('species lookup failed:', name, e);
            return null;
          }
        })
      );

      const names = Array.from(new Set(defaultPokemonNames.filter(Boolean) as string[]));

      const results = await Promise.allSettled<Pokemon>(
        names.map(n => fetchPokemon(n))
      );

      const full = results
        .filter(
          (r): r is PromiseFulfilledResult<Pokemon> => r.status === 'fulfilled'
        )
        .map(r => r.value);

      if (isMounted) setItems(full);
    } catch (e) {
      console.error(e);
    }
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
              aria-pressed={typeFilters.has(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid">
        {filtered.map(p => (
          <div key={p.id}>
            <PokemonSprite p={p} />
          </div>
        ))}
      </div>
    </div>
  );
}