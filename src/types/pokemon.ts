export type PokemonTypeName =
  | 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic'
  | 'bug' | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';

export interface NamedAPIResource { name: string; url: string; }

export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: NamedAPIResource[];
}

export interface Pokemon {
  id: number;
  name: string;
  types: { slot: number; type: NamedAPIResource }[];
  sprites: {
    other?: {
      ['official-artwork']?: { front_default: string | null };
    };
  };
  stats: { base_stat: number; stat: NamedAPIResource }[];
  species: NamedAPIResource;
}

export interface PokemonSpecies {
  flavor_text_entries: {
    flavor_text: string;
    language: NamedAPIResource;
    version: NamedAPIResource;
  }[];
  generation: NamedAPIResource;
  varieties: { is_default: boolean; pokemon: { name: string; url: string } }[];
}

export async function fetchSpecies(nameOrId: string | number): Promise<PokemonSpecies> {
  const res = await fetch('https://pokeapi.co/api/v2/pokemon-species/${nameOrId}');
  if (!res.ok) throw new Error('Species not found');
  return res.json();
}

export interface Generation {
  id: number;
  name: string;                
  pokemon_species: NamedAPIResource[];
}