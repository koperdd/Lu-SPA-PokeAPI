"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type PokemonDetails = {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  sprites: {
    front_default: string;
    other?: {
      "official-artwork"?: {
        front_default?: string;
      };
    };
  };
  types: { type: { name: string } }[];
  abilities: { ability: { name: string } }[];
  stats: { stat: { name: string }; base_stat: number }[];
  moves: { move: { name: string } }[];
  forms: { name: string }[];
};

export default function PokemonPage() {
  const params = useParams();
  const currentId = parseInt(params.id as string, 10);

  const [pokemon, setPokemon] = useState<PokemonDetails | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load favorites from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("favorites");
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  // Fetch Pokémon details
  const fetchPokemon = () => {
    setLoading(true);
    setError(null);

    fetch(`https://pokeapi.co/api/v2/pokemon/${currentId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch Pokémon data");
        return res.json();
      })
      .then((data) => {
        setPokemon(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Something went wrong");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPokemon();
  }, [currentId]);

  // Toggle favorite and persist in localStorage
  const toggleFavorite = (id: number) => {
    setFavorites((prev) => {
      let updated;
      if (prev.includes(id)) {
        updated = prev.filter((fav) => fav !== id);
      } else {
        updated = [...prev, id];
      }
      localStorage.setItem("favorites", JSON.stringify(updated));
      return updated;
    });
  };

  // Skeleton UI while loading
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4 animate-pulse">
        <div className="h-6 w-32 bg-gray-300 rounded mb-4"></div>
        <div className="h-80 w-80 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 w-48 bg-gray-300 rounded mb-2"></div>
        <div className="h-4 w-40 bg-gray-300 rounded mb-2"></div>
        <div className="h-4 w-36 bg-gray-300 rounded"></div>
      </div>
    );
  }

  // Error UI with retry button
  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-4 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchPokemon}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!pokemon) return null;

  const heightInMeters = pokemon.height / 10;
  const weightInKg = pokemon.weight / 10;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Link
        href="/"
        className="inline-block mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        ← Back to List
      </Link>

      <div className="flex justify-between mb-4">
        {currentId > 1 ? (
          <Link
            href={`/pokemon/${currentId - 1}`}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            ← Previous
          </Link>
        ) : (
          <div />
        )}
        <Link
          href={`/pokemon/${currentId + 1}`}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Next →
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold capitalize mb-4">{pokemon.name}</h1>
        <button
          onClick={() => toggleFavorite(pokemon.id)}
          className="text-5xl"
        >
          {favorites.includes(pokemon.id) ? "⭐" : "☆"}
        </button>
      </div>

      <img
        src={
          pokemon.sprites.other?.["official-artwork"]?.front_default ||
          pokemon.sprites.front_default
        }
        alt={pokemon.name}
        width={300}
        height={300}
        className="mb-4"
      />

      <p>Base Experience: {pokemon.base_experience}</p>
      <p>Height: {heightInMeters} m</p>
      <p>Weight: {weightInKg} kg</p>

      <h2 className="mt-4 font-semibold">Types</h2>
      <ul>
        {pokemon.types.map((t, i) => (
          <li key={i} className="capitalize">{t.type.name}</li>
        ))}
      </ul>

      <h2 className="mt-4 font-semibold">Abilities</h2>
      <ul>
        {pokemon.abilities.map((a, i) => (
          <li key={i} className="capitalize">{a.ability.name}</li>
        ))}
      </ul>

      <h2 className="mt-4 font-semibold">Stats</h2>
      <ul>
        {pokemon.stats.map((s, i) => (
          <li key={i} className="capitalize">
            {s.stat.name}: {s.base_stat}
          </li>
        ))}
      </ul>

      <h2 className="mt-4 font-semibold">Forms</h2>
      <ul>
        {pokemon.forms.map((f, i) => (
          <li key={i} className="capitalize">{f.name}</li>
        ))}
      </ul>

      <h2 className="mt-4 font-semibold">Moves</h2>
      <div className="grid grid-cols-2 gap-2">
        {pokemon.moves.map((m, i) => (
          <span
            key={i}
            className="capitalize bg-gray-100 px-2 py-1 rounded text-sm"
          >
            {m.move.name}
          </span>
        ))}
      </div>
    </div>
  );
}
