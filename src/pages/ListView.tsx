import { useEffect, useMemo, useState } from 'react';
import { fetchPokemonPage, fetchPokemon, fetchAllSpeciesNames } from '../api/pokeapi';
import type { Pokemon } from '../types/pokemon';
import SearchBar from '../components/SearchBar';
import PokemonCard from '../components/PokemonCard';
import useDebounce from '../hooks/useDebounce';

type SortKey = 'name' | 'id' | 'generation';

export default function ListView() {
  const [rawQuery, setRawQuery] = useState('');
  const query = useDebounce(rawQuery, 200);

  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [asc, setAsc] = useState(true);

  const [items, setItems] = useState<Pokemon[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Load either a normal page or a global search result
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const q = query.trim().toLowerCase();

        if (q) {
          // numeric ID?
          if (/^\d+$/.test(q)) {
            const mon = await fetchPokemon(parseInt(q, 10));
            if (alive) setItems([mon]);
            return;
          }
          // exact name match first (e.g., "mew")
          try {
            const exact = await fetchPokemon(q);
            if (alive) { setItems([exact]); return; }
          } catch { /* not exact, continue */ }

          // substring search over all species names, cap to 24 matches
          const names = (await fetchAllSpeciesNames())
            .filter(n => n.includes(q))
            .slice(0, 24);

          const full = await Promise.all(names.map(n => fetchPokemon(n)));
          if (alive) setItems(full);
          return;
        }

        // No query: classic paged list (60 per page)
        const page = await fetchPokemonPage(offset, 513);
        const full = await Promise.all(page.results.map(r => fetchPokemon(r.name)));
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
    // Only sort the current 'items' (they are either the page or search results)
    const arr = items.slice().sort((a, b) => {
      const va = sortKey === 'name' ? a.name : a.id;
      const vb = sortKey === 'name' ? b.name : b.id;
      return (va < vb ? -1 : va > vb ? 1 : 0) * (asc ? 1 : -1);
    });
    return arr;
  }, [items, sortKey, asc]);

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

        <button onClick={() => setOffset(o => Math.max(0, o - 513))} disabled={!!query}>Prev Page</button>
        <button onClick={() => setOffset(o => o + 513)} disabled={!!query}>Next Page</button>

        {query && <button onClick={() => setRawQuery('')}>Clear</button>}
      </div>

      {err && <p style={{ color: 'crimson' }}>{err}</p>}
      {loading && <p>Loading…</p>}

      <div className="list">
        {shown.map(p => <PokemonCard key={p.id} p={p} />)}
      </div>

      {!loading && shown.length === 0 && <p>No Pokémon found.</p>}
    </div>
  );
}
