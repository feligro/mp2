import axios from 'axios';
import type { Pokemon, PokemonListResponse, PokemonSpecies, Generation } from '../types/pokemon';

const api = axios.create({ baseURL: 'https://pokeapi.co/api/v2' });

// very small localStorage cache for GETs
// --- add a tiny in-memory cache to always have a fallback
const mem = new Map<string, { t: number; v: any }>();

const trySetLocalStorage = (key: string, payload: string) => {
  try {
    localStorage.setItem(key, payload);
    return true;
  } catch (e: any) {
    // if quota exceeded, prune some of our own keys and try once more
    try {
      const ours = Object.keys(localStorage).filter(k => k.startsWith('pk:'));
      const half = Math.ceil(ours.length / 2);
      for (let i = 0; i < half; i++) localStorage.removeItem(ours[i]);
      localStorage.setItem(key, payload);
      return true;
    } catch {
      return false; // give up, rely on memory cache only
    }
  }
};

const getCached = async <T>(key: string, fetcher: () => Promise<T>, ttlMs = 1000 * 60 * 60) => {
  // memory first
  const m = mem.get(key);
  if (m && Date.now() - m.t < ttlMs) return m.v as T;

  // localStorage second
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const { t, v } = JSON.parse(raw);
      if (Date.now() - t < ttlMs) {
        mem.set(key, { t, v });
        return v as T;
      }
    }
  } catch { /* ignore parse/LS errors */ }

  // fetch fresh
  const v = await fetcher();
  const wrapped = JSON.stringify({ t: Date.now(), v });
  mem.set(key, { t: Date.now(), v });
  trySetLocalStorage(key, wrapped); // if it fails, we still have mem cache
  return v;
};

export const fetchPokemonPage = (offset = 0, limit = 60) =>
  getCached<PokemonListResponse>(
    `pk:list:${offset}:${limit}`,
    async () => (await api.get(`/pokemon?offset=${offset}&limit=${limit}`)).data
  );

export const fetchPokemon = (nameOrId: string | number) =>
  getCached<Pokemon>(
    `pk:mon:${nameOrId}`,
    async () => (await api.get(`/pokemon/${nameOrId}`)).data
  );

export const fetchSpecies = (nameOrId: string | number) =>
  getCached<PokemonSpecies>(
    `pk:species:${nameOrId}`,
    async () => (await api.get(`/pokemon-species/${nameOrId}`)).data
  );

export const fetchGeneration = (gen: number) =>
  getCached<Generation>(
    `pk:gen:${gen}`,
    async () => (await api.get(`/generation/${gen}`)).data
  );

export const fetchAllSpeciesNames = () =>
  getCached<string[]>(
    'pk:allSpeciesNames',
    async () => {
      const limit = 2000;
      const res = await api.get(`/pokemon-species?limit=${limit}&offset=0`);
      return (res.data.results as { name: string }[]).map(r => r.name);
    },
    1000 * 60 * 60 * 24 // 24h
  );
