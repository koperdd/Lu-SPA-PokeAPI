"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

interface TypePokemonEntry {
  pokemon: {
    name: string;
    url: string;
  };
  slot: number;
}

type PokemonListItem = {
  name: string;
  url: string;
};

export default function HomePage() {
  const [allPokemon, setAllPokemon] = useState<PokemonListItem[]>([]);
  const [pokemonList, setPokemonList] = useState<PokemonListItem[]>([]);
  const [offset, setOffset] = useState(0);

  const [favorites, setFavorites] = useState<number[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("favorites");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [sortOrder, setSortOrder] = useState<"az" | "za">("az");
  const [typeCache, setTypeCache] = useState<Record<string, number[]>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🌙 Theme state
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "light" | "dark") || "light";
    }
    return "light";
  });

  const searchParams = useSearchParams();
  const router = useRouter();
  const limit = 36;

  // Abort controllers
  const listAbortController = useRef<AbortController | null>(null);
  const typeAbortController = useRef<AbortController | null>(null);

  useEffect(() => setIsLoaded(true), []);

  // Persist favorites
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    }
  }, [favorites, isLoaded]);

  // Sync favorites between tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "favorites") {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : [];
          setFavorites(Array.isArray(parsed) ? parsed : []);
        } catch {}
      }
      if (e.key === "theme") {
        setTheme((e.newValue as "light" | "dark") || "light");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // URL sync
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchTerm) params.set("q", searchTerm);
      else params.delete("q");

      if (filterType) params.set("type", filterType);
      else params.delete("type");

      params.set("sort", sortOrder);
      router.push(`/?${params.toString()}`);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchTerm, filterType, sortOrder]);

  // Fetch Pokémon list
  const fetchPokemonList = () => {
    if (listAbortController.current) {
      listAbortController.current.abort();
    }
    listAbortController.current = new AbortController();

    setLoading(true);
    setError(null);

    fetch(`https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0`, {
      signal: listAbortController.current.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch Pokémon list");
        return res.json();
      })
      .then((data) => {
        setAllPokemon(data.results);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.error(err);
        setError("Failed to load Pokémon. Please try again.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPokemonList();
    return () => {
      if (listAbortController.current) {
        listAbortController.current.abort();
      }
    };
  }, []);

  // Init from URL
  useEffect(() => {
    const q = searchParams.get("q") || "";
    const t = searchParams.get("type") || "";
    const s = (searchParams.get("sort") as "az" | "za") || "az";
    setSearchTerm(q);
    setFilterType(t);
    setSortOrder(s);
  }, []);

  const getPokemonIdsByType = async (type: string) => {
    if (typeCache[type]) return typeCache[type];

    if (typeAbortController.current) {
      typeAbortController.current.abort();
    }
    typeAbortController.current = new AbortController();

    const res = await fetch(`https://pokeapi.co/api/v2/type/${type}`, {
      signal: typeAbortController.current.signal,
    });
    const data = await res.json();
    const ids = data.pokemon.map((p: TypePokemonEntry) =>
      parseInt(p.pokemon.url.split("/").filter(Boolean).pop() || "0")
    );
    setTypeCache((prev) => ({ ...prev, [type]: ids }));
    return ids;
  };

  // Apply filters
  useEffect(() => {
    if (!allPokemon.length) {
      setPokemonList([]);
      return;
    }

    let cancelled = false;
    const applyFilters = async () => {
      setProcessing(true);
      try {
        let filtered = allPokemon;

        if (searchTerm) {
          filtered = filtered.filter((p) =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        if (filterType) {
          const ids = await getPokemonIdsByType(filterType);
          if (cancelled) return;
          filtered = filtered.filter((p) => {
            const id = parseInt(p.url.split("/").filter(Boolean).pop() || "0");
            return ids.includes(id);
          });
        }

        filtered = [...filtered].sort((a, b) =>
          sortOrder === "az"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name)
        );

        if (!searchTerm) {
          const start = offset;
          const end = offset + limit;
          if (!cancelled) setPokemonList(filtered.slice(start, end));
        } else {
          if (!cancelled) setPokemonList(filtered);
        }
      } catch {
        if (!cancelled) setError("Processing error. Try again.");
      } finally {
        if (!cancelled) setProcessing(false);
      }
    };

    applyFilters();
    return () => {
      cancelled = true;
    };
  }, [searchTerm, filterType, sortOrder, offset, allPokemon]);

  // ⭐ Optimistic Favorite Toggle with Logs
  const toggleFavorite = async (id: number) => {
    const isFav = favorites.includes(id);
    console.log(`Clicked star for Pokémon ID ${id} — currently ${isFav ? "favorited" : "not favorited"}`);

    setFavorites((prev) =>
      isFav ? prev.filter((fav) => fav !== id) : [...prev, id]
    );
    localStorage.setItem(
      "favorites",
      JSON.stringify(isFav ? favorites.filter((fav) => fav !== id) : [...favorites, id])
    );
    console.log(`Optimistically ${isFav ? "removed" : "added"} Pokémon ID ${id} from favorites`);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log(`Server confirmed favorite ${isFav ? "removal" : "addition"} for Pokémon ID ${id}`);
    } catch (err) {
      console.error("Favorite update failed:", err);
      setFavorites((prev) =>
        isFav ? [...prev, id] : prev.filter((fav) => fav !== id)
      );
      alert("Failed to update favorite. Please try again.");
    }
  };

  const showSkeleton = loading || processing;

  return (
    <div className={`max-w-6xl mx-auto p-4 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">Pokédex</h1>
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="px-4 py-2 border rounded"
        >
          {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
        </button>
      </div>

      {/* Search / Filters */}
      <div className="flex flex-wrap gap-4 items-center mb-4">
        <input
          type="text"
          placeholder="Search Pokémon..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded w-64"
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All Types</option>
          <option value="fire">🔥 Fire</option>
          <option value="water">💧 Water</option>
          <option value="grass">🌿 Grass</option>
          <option value="electric">⚡ Electric</option>
          <option value="psychic">🔮 Psychic</option>
          <option value="rock">🪨 Rock</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "az" | "za")}
          className="border p-2 rounded"
        >
          <option value="az">Sort A → Z</option>
          <option value="za">Sort Z → A</option>
        </select>

        <Link
          href="/favorites"
          className="px-4 py-2 bg-yellow-300 rounded hover:bg-yellow-400"
        >
          ⭐ Favorites
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="text-center p-4 text-red-600">
          <p>{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchPokemonList();
            }}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      )}

      {/* Pokémon Grid */}
      {showSkeleton ? (
        <div className="grid grid-cols-6 gap-4">
          {Array.from({ length: limit }).map((_, idx) => (
            <div
              key={idx}
              className="border rounded-lg p-4 animate-pulse bg-gray-200 h-32"
            />
          ))}
        </div>
      ) : !pokemonList.length ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No Pokémon found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-6 gap-4">
            {pokemonList.map((p) => {
              const id = parseInt(p.url.split("/").filter(Boolean).pop() || "0");
              return (
                <div key={p.name} className="border rounded-lg p-4 relative">
                  <button
                    onClick={() => toggleFavorite(id)}
                    className="absolute top-2 right-2 text-4xl"
                    aria-label={favorites.includes(id) ? "Unfavorite" : "Favorite"}
                  >
                    {favorites.includes(id) ? "⭐" : "☆"}
                  </button>
                  <Link href={`/pokemon/${id}`} className="text-center block">
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`}
                      alt={p.name}
                      className="mx-auto"
                    />
                    <p className="capitalize mt-2">{p.name}</p>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {!searchTerm && (
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setOffset((prev) => Math.max(prev - limit, 0))}
                disabled={offset === 0}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setOffset((prev) => prev + limit)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
