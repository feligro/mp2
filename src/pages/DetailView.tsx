import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchPokemon, fetchSpecies } from '../api/pokeapi';
import type { Pokemon } from '../types/pokemon';

export default function DetailView() {
  const { name } = useParams<{ name: string }>();
  const nav = useNavigate();
  const [p, setP] = useState<Pokemon | null>(null);
  const [desc, setDesc] = useState<string>('');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!name) return;
      setErr(null);

      const q = name.trim().toLowerCase().replace(/\s+/g, '-');

      try {
        let mon: Pokemon;

        try {
          mon = await fetchPokemon(q);
        } catch {
          const s = await fetchSpecies(q);
          const def = s.varieties.find((v: any) => v.is_default) ?? s.varieties[0];
          mon = await fetchPokemon(def.pokemon.name);
        }

        const species = await fetchSpecies(mon.species.name);
        const en = species.flavor_text_entries.find(
          (f: any) => f.language.name === 'en'
        );

        if (alive) {
          setP(mon);
          setDesc((en?.flavor_text ?? '')
            .replace(/\f/g, ' ')
            .replace(/\s+/g, ' ')
            .trim());
        }
      } catch (e: any) {
        if (alive) setErr(e?.message ?? 'Failed to load Pokémon');
      }
    })();

    return () => { alive = false; };
  }, [name]);

  const sprite = useMemo(() =>
    p?.sprites.other?.['official-artwork']?.front_default
      ?? '',
    [p]
  );

  if (err) return (
    <div className="page">
      <p className="error">{err}</p>
      <button onClick={() => nav(-1)}>Go back</button>
    </div>
  );

  if (!p) return <div className="page"><p>Loading…</p></div>;

  const types = p.types.map(t => t.type.name);
  const primary = types[0] ?? 'normal';
  const prevId = p.id > 1 ? p.id - 1 : 1;
  const nextId = p.id + 1;

  return (
    <div className="page">
      <Link to="/" className="links">← Back to List</Link>
      <Link to="/gallery" className="links">← Back to Gallery</Link>

      <div className={`detail detail--${primary}`}>
        <img src={sprite} alt={p.name} />
        <div className="detail-body">
          <h2 className="title">#{p.id} {p.name[0].toUpperCase() + p.name.slice(1)}</h2>

          <div className="types">
            {types.map(t => (
              <span key={t} className={`type type--${t}`}>
                {t[0].toUpperCase() + t.slice(1)}
              </span>
            ))}
          </div>

          <div className="divider">
            <div className="subdivider">
              <p className="desc">{desc}</p>
            </div>

            <div className="subdivider">
              <h3>Base Stats</h3>
              <ul className="stats">
                {p.stats.map(s => (
                  <li key={s.stat.name}>
                    <span className="stat-name">{s.stat.name.toUpperCase()}:</span>
                    <span className="stat-val"> {s.base_stat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pager">
            <button onClick={() => nav(`/pokemon/${prevId}`)}>&larr; Prev Id</button>
            <button onClick={() => nav(`/pokemon/${nextId}`)}>Next Id &rarr;</button>
          </div>
        </div>
      </div>
    </div>
  );
}