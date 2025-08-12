"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Pokemon = {
  id: number;
  name: string;
  sprite: string;
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = () => {
    setLoading(true);
    setError(null);

    try {
      const stored = localStorage.getItem("favorites");
      if (!stored) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      const ids: number[] = JSON.parse(stored);

      Promise.all(
        ids.map(async (id) => {
          const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
          if (!res.ok) throw new Error(`Failed to fetch Pokémon with ID ${id}`);
          const data = await res.json();
          return {
            id,
            name: data.name,
            sprite: data.sprites.front_default,
          };
        })
      )
        .then((results) => {
          setFavorites(results);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error loading favorites:", err);
          setError("Failed to load favorites. Please try again.");
          setLoading(false);
        });
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <h1 className="text-4xl font-bold mb-6">Your Favorite Pokémon</h1>
        <div className="grid grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="border rounded-lg p-4 animate-pulse text-center"
            >
              <div className="w-20 h-20 bg-gray-300 mx-auto rounded"></div>
              <div className="h-4 bg-gray-300 mt-2 rounded w-16 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4 text-center">
        <h1 className="text-4xl font-bold mb-4">Your Favorite Pokémon</h1>
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchFavorites}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
        <Link
          href="/"
          className="mt-4 block text-blue-500 hover:underline"
        >
          ← Back to Pokédex
        </Link>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-4 text-center">
        <h1 className="text-4xl font-bold mb-4">Your Favorite Pokémon</h1>
        <p>No favorites yet.</p>
        <Link
          href="/"
          className="mt-4 inline-block px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          ← Back to Pokédex
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-4xl font-bold mb-6">Your Favorite Pokémon</h1>
      <div className="grid grid-cols-6 gap-4">
        {favorites.map((p) => (
          <Link
            key={p.id}
            href={`/pokemon/${p.id}`}
            className="border rounded-lg p-4 hover:bg-gray-100 text-center"
          >
            <img src={p.sprite} alt={p.name} className="mx-auto" />
            <p className="capitalize mt-2">{p.name}</p>
          </Link>
        ))}
      </div>

      <Link
        href="/"
        className="mt-6 inline-block px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        ← Back to Pokédex
      </Link>
    </div>
  );
}
