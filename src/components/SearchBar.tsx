import { ChangeEvent } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}
export default function SearchBar({ value, onChange, placeholder }: Props) {
  function handle(e: ChangeEvent<HTMLInputElement>) { onChange(e.target.value); }
  return (
    <input
      aria-label="search"
      value={value}
      onChange={handle}
      placeholder={placeholder ?? 'Search…'}
      className="search"
    />
  );
}