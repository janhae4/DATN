"use client";

import { useState, FormEvent, Suspense } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";

function SearchBarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();

    if (!query) return;
    router.push(`/search?q=${query}`);
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

      <Input
        type="text"
        placeholder="Search..."
        className="w-full pl-9"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </form>
  );
}

export function SearchBar() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md h-10 bg-muted/20 rounded-md animate-pulse" />
      }
    >
      <SearchBarContent />
    </Suspense>
  );
}
