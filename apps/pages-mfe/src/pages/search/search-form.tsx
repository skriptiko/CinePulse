import { SEARCH_QUERY_MAX_LENGTH } from '@repo/api';
import { Button, Input } from '@repo/ui';
import { Search as SearchIcon } from 'lucide-react';
import { type FormEvent, useEffect, useId, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

export type SearchFormProps = {
  /** The query in the URL. */
  query: string;
  onSubmit: (text: string) => void;
};

export function SearchForm({ query, onSubmit }: SearchFormProps) {
  const { key: locationKey } = useLocation();
  const [text, setText] = useState(query);
  const [syncedKey, setSyncedKey] = useState(locationKey);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  // The URL decides what was searched for: any change of it, as on Back, replaces a draft.
  if (locationKey !== syncedKey) {
    setSyncedKey(locationKey);
    setText(query);
  }

  // Not `autoFocus`, which runs before the layout effect that moves focus to `main` on a new page.
  useEffect(() => {
    if (query === '') inputRef.current?.focus({ preventScroll: true });
  }, [query]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(text);
  };

  return (
    // `block`: the browsers of the build target do not know `<search>`, so it would be inline.
    <search className="block px-4 pb-4 sm:px-6 lg:px-12">
      <form onSubmit={handleSubmit} className="max-w-xl">
        <label htmlFor={inputId} className="mb-2 block text-sm font-medium">
          Search by title or name
        </label>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <SearchIcon
              aria-hidden="true"
              className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <Input
              ref={inputRef}
              id={inputId}
              type="search"
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={SEARCH_QUERY_MAX_LENGTH}
              className="bg-secondary h-10 rounded-lg border-0 pl-10"
            />
          </div>
          <Button type="submit" className="h-10 rounded-lg">
            Search
          </Button>
        </div>
      </form>
    </search>
  );
}
