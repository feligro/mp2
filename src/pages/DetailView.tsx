import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchPokemon, fetchSpecies } from '../api/pokeapi';
import type { Pokemon } from '../types/pokemon';
import { typeBg } from '../utils/colors';

export default function DetailView() {
  const { name } = useParams<{ name: string }>();
  const nav = useNavigate();
  const [p, setP] = useState<Pokemon | null>(null);
  const [desc, setDesc] = useState<string>('');

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!name) return;
      const mon = await fetchPokemon(name);
      const species = await fetchSpecies(name);
      const en = species.flavor_text_entries.find(f => f.language.name === 'en');
      if (alive) {
        setP(mon);
        setDesc((en?.flavor_text ?? '').replace(/\f/g, ' ').replace(/\s+/g, ' ').trim());
      }
    })();
    return () => { alive = false; };
  }, [name]);

  const sprite = useMemo(() =>
    p?.sprites.other?.['official-artwork']?.front_default ?? '', [p]);

  if (!p) return <div className="page"><p>Loading…</p></div>;

  const types = p.types.map(t => t.type.name);
  const bg = typeBg(types);
  const prevId = p.id > 1 ? p.id - 1 : 1;
  const nextId = p.id + 1;

  return (
    <div className="page">
      <Link to="/">← Back</Link>
      <div className="detail" style={{ borderColor: bg }}>
        <img src={sprite} alt={p.name} />
        <div className="detail-body">
          <h2 style={{ color: bg }}>#{p.id} {p.name[0].toUpperCase() + p.name.slice(1)}</h2>

          <div className="types">
            {types.map(t => <span key={t} className="type" style={{ background: typeBg([t]) }}>{t[0].toUpperCase() + t.slice(1)}</span>)}
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
            <button onClick={() => nav(`/pokemon/${prevId}`)}>&larr; Prev</button>
            <button onClick={() => nav(`/pokemon/${nextId}`)}>Next &rarr;</button>
          </div>
        </div>
      </div>
    </div>
  );
}