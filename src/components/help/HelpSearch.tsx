'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';

export function HelpSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/help/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="mx-auto max-w-2xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Search for help..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-14 rounded-full border-2 pl-12 pr-32 text-lg shadow-lg focus:border-primary focus:ring-4 focus:ring-primary/20"
        />
        <Button
          type="submit"
          disabled={!query.trim() || isSearching}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Search'
          )}
        </Button>
      </div>
    </form>
  );
}
