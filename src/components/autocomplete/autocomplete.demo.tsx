import { useState } from 'react';
import { Autocomplete } from './autocomplete';

const languages = ['TypeScript', 'JavaScript', 'Java', 'Kotlin', 'Python', 'Rust', 'Go', 'Swift', 'C#', 'Ruby'];

function useSearch() {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  return {
    suggestions,
    onSearch: ({ query }: { query: string }) =>
      setSuggestions(languages.filter((l) => l.toLowerCase().includes(query.toLowerCase()))),
  };
}

export default function AutocompleteDemo() {
  const single = useSearch();
  const multi = useSearch();
  const [chosen, setChosen] = useState<unknown>(['Rust']);
  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
      <Autocomplete aria-label="Language" placeholder="Search a language" {...single} />
      <Autocomplete
        aria-label="Languages"
        multiple
        placeholder="Add languages"
        value={chosen}
        onChange={setChosen}
        {...multi}
      />
      <Autocomplete aria-label="On focus" completeOnFocus placeholder="Opens on focus" {...useSearch()} />
      <Autocomplete aria-label="Invalid" aria-invalid placeholder="Invalid" suggestions={[]} />
      <Autocomplete aria-label="Disabled" disabled multiple defaultValue={['Go']} suggestions={[]} />
    </div>
  );
}
