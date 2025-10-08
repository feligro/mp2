import { useEffect, useMemo, useState } from 'react';
import { fetchPokemonPage, fetchPokemon, fetchAllSpeciesNames, fetchSpecies } from '../api/pokeapi';
import type { Pokemon } from '../types/pokemon';
import SearchBar from '../components/SearchBar';
import PokemonCard from '../components/PokemonCard';
import useDebounce from '../hooks/useDebounce';

type SortKey = 'name' | 'id';

type StatKey =
  | 'hp'
  | 'attack'
  | 'defense'
  | 'special-attack'
  | 'special-defense'
  | 'speed';

const STAT_OPTIONS: StatKey[] = [
  'hp',
  'attack',
  'defense',
  'special-attack',
  'special-defense',
  'speed',
];

const PAGE_SIZE = 512;
const TOTAL_COUNT = 1025;
const TOTAL_PAGES = Math.ceil(TOTAL_COUNT / PAGE_SIZE);

export default function ListView() {
  const [rawQuery, setRawQuery] = useState('');
  const query = useDebounce(rawQuery, 200);

  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [asc, setAsc] = useState(true);

  const [statKey, setStatKey] = useState<StatKey>('hp');
  const [cmp, setCmp] = useState<'gt' | 'lt' | 'eq'>('gt');
  const [statValue, setStatValue] = useState<number | ''>('');

  const [items, setItems] = useState<Pokemon[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const q = query.trim().toLowerCase();
        const qn = q.replace(/\s+/g, '-');

        if (q) {
          if (/^\d+$/.test(q)) {
            const mon = await fetchPokemon(parseInt(q, 10));
            if (alive) setItems([mon]);
            return;
          }

          try {
            const exact = await fetchPokemon(qn);
            if (alive) { setItems([exact]); return; }
          } catch {}

          try {
            const species = await fetchSpecies(qn);
            const varietyNames = species.varieties.map((v: any) => v.pokemon.name);
            const mons = await Promise.all(varietyNames.map((name: string) => fetchPokemon(name)));
            if (alive) { setItems(mons); return; }
          } catch {}

          const speciesMatches = (await fetchAllSpeciesNames())
            .filter((n: string) => n.includes(q))
            .slice(0, 24);

          const mons = await Promise.all(
            speciesMatches.map(async (name: string) => {
              const s = await fetchSpecies(name);
              const def = s.varieties.find((v: any) => v.is_default) ?? s.varieties[0];
              return fetchPokemon(def.pokemon.name);
            })
          );
          if (alive) setItems(mons);
          return;
        }

        // use PAGE_SIZE everywhere
        const page = await fetchPokemonPage(offset, PAGE_SIZE);
        const full = await Promise.all(page.results.map((r: any) => fetchPokemon(r.name)));
        if (alive) setItems(full);
      } catch (e: any) {
        if (alive) setErr(e?.message ?? 'Failed to load Pokémon');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [query, offset]);

  const shown = useMemo(() => {
  const filtered = items.filter(p => {
    if (statValue === '') return true;        
    const entry = p.stats.find(s => s.stat.name === statKey);
    const v = entry?.base_stat ?? 0;
    const n = Number(statValue);
    if (cmp === 'gt') return v > n;
    if (cmp === 'lt') return v < n;
    return v === n; // eq
  });

  const arr = filtered.slice().sort((a, b) => {
    const va = sortKey === 'name' ? a.name : a.id;
    const vb = sortKey === 'name' ? b.name : b.id;
    return (va < vb ? -1 : va > vb ? 1 : 0) * (asc ? 1 : -1);
  });
  return arr;
}, [items, sortKey, asc, statKey, cmp, statValue]);

  const atFirst = currentPage <= 1;
  const atLast  = currentPage >= TOTAL_PAGES;

  const goPrev = () =>
    setOffset(o => Math.max(0, o - PAGE_SIZE));

  const goNext = () =>
    setOffset(o => Math.min((TOTAL_PAGES - 1) * PAGE_SIZE, o + PAGE_SIZE));

  return (
    <div className="page">
      <h2>Pokémon - List</h2>

      <div className="toolbar">
        <SearchBar value={rawQuery} onChange={setRawQuery} placeholder="Search by name or id…" />

        <label>
          Sort:&nbsp;
          <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}>
            <option value="name">Name</option>
            <option value="id">ID</option>
          </select>
        </label>

        <button onClick={() => setAsc(a => !a)}>{asc ? 'Asc' : 'Desc'}</button>

        { }
        <div className="stat-filter">
          <label>
            Stat:&nbsp;
            <select
              value={statKey}
              onChange={e => setStatKey(e.target.value as StatKey)}
              className="stat-name"
            >
              {STAT_OPTIONS.map(s => (
                <option key={s} value={s} className="stat-name">{s}</option>
              ))}
            </select>
          </label>

          <select value={cmp} onChange={e => setCmp(e.target.value as 'gt'|'lt'|'eq')}>
            <option value="gt">&gt;</option>
            <option value="lt">&lt;</option>
            <option value="eq">=</option>
          </select>

          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={statValue}
            onChange={e => {
              const v = e.target.value;
              setStatValue(v === '' ? '' : Number(v));
            }}
            placeholder="value"
          />

          { }
          <button onClick={() => setStatValue('')}>Clear stat</button>
        </div>
        <button onClick={goPrev} disabled={!!query || atFirst}>&larr; Prev</button>
        <span className="page-count">{currentPage}/{TOTAL_PAGES}</span>
        <button onClick={goNext} disabled={!!query || atLast}>Next &rarr;</button>

        {query && <button onClick={() => setRawQuery('')}>Clear</button>}
      </div>

      {err && <p className="error">{err}</p>}
      {loading && <p>Loading…</p>}

      <div className="list">
        {shown.map(p => <PokemonCard key={p.id} p={p} />)}
      </div>

      {!loading && shown.length === 0 && <p>No Pokémon found.</p>}
    </div>
  );
}
