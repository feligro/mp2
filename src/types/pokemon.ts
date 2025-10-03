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
}

export interface PokemonSpecies {
  flavor_text_entries: {
    flavor_text: string;
    language: NamedAPIResource;
    version: NamedAPIResource;
  }[];
  generation: NamedAPIResource; // e.g. "generation-i"
}

export interface Generation {
  id: number;
  name: string;                 // "generation-i"
  pokemon_species: NamedAPIResource[]; // names, not forms
}