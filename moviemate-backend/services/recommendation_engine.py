"""
services/recommendation_engine.py — ML Recommendation Engine (sparse similarity)

ALGORITHM: Content-Based Filtering using TF-IDF + Sparse Cosine Similarity

HOW IT WORKS:
1. LOAD     : Read movies_processed.csv (pre-built feature soup per movie)
2. VECTORIZE: TF-IDF converts each feature soup into a numerical vector
3. COMPUTE  : Cosine similarity computed in batches of 500; only the top-50
              most-similar movies are kept per movie (sparse dict, not full matrix)
4. CACHE    : Save tfidf_matrix.pkl + top_similar.pkl to data/precomputed/
5. SERVE    : Dict lookups are O(1) — no matrix slicing at request time

WHY SPARSE:
  Full matrix for 17 620 movies = 17620² × 4 bytes ≈ 1.2 GB RAM.
  The sparse dict stores only 50 entries per movie = ~4 MB total.

FEATURE WEIGHTS (baked into the feature soup at preprocessing time):
  director  × 3  (highest signal)
  genres    × 2  (strong signal)
  cast      × 1
  keywords  × 1
  overview  × 1  (capped at 150 words)
"""

import os
import pickle
import time

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import Dict, List, Optional


class RecommendationEngine:
    """
    Content-based movie recommendation engine.
    Uses TF-IDF vectors + sparse top-50 cosine similarity per movie.
    """

    def __init__(self):
        self.movies_df:        Optional[pd.DataFrame] = None
        self.tfidf_matrix      = None
        self.top_similar:      Dict[int, List]        = {}   # id → [(id, score), …]
        self.tfidf_vectorizer  = None
        self.movie_indices     = None   # title (lower) → df index
        self.movie_id_indices  = None   # TMDB id (int) → df index
        self.is_loaded:        bool     = False

        self.data_dir        = os.path.join(os.path.dirname(__file__), "..", "data")
        self.csv_path        = os.path.join(self.data_dir, "movies_processed.csv")
        self.tfidf_path      = os.path.join(self.data_dir, "precomputed", "tfidf_matrix.pkl")
        self.top_sim_path    = os.path.join(self.data_dir, "precomputed", "top_similar.pkl")
        self.df_path         = os.path.join(self.data_dir, "precomputed", "movies_df.pkl")
        self.vectorizer_path = os.path.join(self.data_dir, "precomputed", "vectorizer.pkl")

    # ------------------------------------------------------------------ #
    # STEP 1 — LOAD DATA                                                   #
    # ------------------------------------------------------------------ #

    def _load_data(self) -> pd.DataFrame:
        """Load movies_processed.csv; feature_soup column is already built."""
        print(f"Loading movie data from: {self.csv_path}")

        if not os.path.exists(self.csv_path):
            raise FileNotFoundError(
                f"Processed dataset not found at {self.csv_path}. "
                "Run scripts/preprocess_dataset.py first."
            )

        df = pd.read_csv(self.csv_path, low_memory=False)

        # Normalise text columns — NaN → ''
        text_cols = ["overview", "genres", "keywords", "director",
                     "cast_names", "tagline", "feature_soup"]
        for col in text_cols:
            if col in df.columns:
                df[col] = df[col].fillna("")
            else:
                df[col] = ""

        df = df.drop_duplicates(subset=["id"], keep="first")
        df = df.reset_index(drop=True)

        print(f"  Loaded {len(df):,} movies  |  columns: {df.columns.tolist()}")
        return df

    # ------------------------------------------------------------------ #
    # STEP 2 — TF-IDF                                                      #
    # ------------------------------------------------------------------ #

    def _build_tfidf(self, feature_soup: pd.Series):
        """Fit TF-IDF on the pre-built feature soup column."""
        print("Building TF-IDF matrix...")

        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=15_000,
            stop_words="english",
            ngram_range=(1, 2),
            min_df=2,
            sublinear_tf=True,
        )

        self.tfidf_matrix = self.tfidf_vectorizer.fit_transform(feature_soup)
        print(f"  TF-IDF matrix shape: {self.tfidf_matrix.shape}")

    # ------------------------------------------------------------------ #
    # STEP 3 — SPARSE SIMILARITY                                           #
    # ------------------------------------------------------------------ #

    def _compute_similarity(self):
        """
        Build self.top_similar: for every movie, keep only the top-50
        most-similar other movies.  Processed in batches of 500 rows to
        cap peak RAM usage to ~1-2 GB.
        """
        print("Computing sparse similarity (top-50 per movie)...")
        t0 = time.time()
        n          = self.tfidf_matrix.shape[0]
        batch_size = 500
        self.top_similar = {}

        for start in range(0, n, batch_size):
            end   = min(start + batch_size, n)
            batch = self.tfidf_matrix[start:end]

            # (batch_size × n) similarity block
            sim_block = cosine_similarity(batch, self.tfidf_matrix)

            for local_i, global_i in enumerate(range(start, end)):
                movie_id  = int(self.movies_df.iloc[global_i]["id"])
                sim_row   = sim_block[local_i]

                # argsort ascending → reverse → first 51 (includes self)
                top_indices = sim_row.argsort()[::-1][:51]

                similar_list = []
                for idx in top_indices:
                    if idx == global_i:
                        continue                 # skip itself
                    other_id = int(self.movies_df.iloc[idx]["id"])
                    score    = float(sim_row[idx])
                    similar_list.append((other_id, score))
                    if len(similar_list) == 50:
                        break

                self.top_similar[movie_id] = similar_list

            if (start // batch_size) % 5 == 0:
                elapsed = round(time.time() - t0, 1)
                print(f"  Progress: {end:>6,}/{n:,} movies  ({elapsed}s elapsed)")

        elapsed = round(time.time() - t0, 1)
        print(f"Sparse similarity built: {len(self.top_similar):,} movies indexed  ({elapsed}s)")

    # ------------------------------------------------------------------ #
    # STEP 4 — INDEX MAPPINGS                                              #
    # ------------------------------------------------------------------ #

    def _build_indices(self):
        """title (lower) → df index  and  TMDB id (int) → df index."""
        self.movie_indices = pd.Series(
            self.movies_df.index,
            index=self.movies_df["title"].str.lower()
        )
        self.movie_id_indices = pd.Series(
            self.movies_df.index,
            index=self.movies_df["id"].astype(int)
        )

    # ------------------------------------------------------------------ #
    # SAVE / LOAD                                                          #
    # ------------------------------------------------------------------ #

    def _save_precomputed(self):
        os.makedirs(os.path.join(self.data_dir, "precomputed"), exist_ok=True)
        print("Saving pre-computed files...")

        with open(self.tfidf_path, "wb") as f:
            pickle.dump(self.tfidf_matrix, f)
        with open(self.top_sim_path, "wb") as f:
            pickle.dump(self.top_similar, f)
        with open(self.df_path, "wb") as f:
            pickle.dump(self.movies_df, f)
        with open(self.vectorizer_path, "wb") as f:
            pickle.dump(self.tfidf_vectorizer, f)

        print("  Saved: tfidf_matrix.pkl, top_similar.pkl, movies_df.pkl, vectorizer.pkl")

    def _load_precomputed(self) -> bool:
        """Load cached artefacts.  Returns True only when ALL four files exist."""
        required = [self.tfidf_path, self.top_sim_path, self.df_path]
        if not all(os.path.exists(p) for p in required):
            return False

        try:
            print("Loading pre-computed data...")

            with open(self.tfidf_path, "rb") as f:
                self.tfidf_matrix = pickle.load(f)
            with open(self.top_sim_path, "rb") as f:
                self.top_similar = pickle.load(f)
            with open(self.df_path, "rb") as f:
                self.movies_df = pickle.load(f)
            if os.path.exists(self.vectorizer_path):
                with open(self.vectorizer_path, "rb") as f:
                    self.tfidf_vectorizer = pickle.load(f)

            self._build_indices()
            self.is_loaded = True
            print(
                f"  Loaded! {len(self.movies_df):,} movies  |  "
                f"{len(self.top_similar):,} entries in top_similar dict"
            )
            return True

        except Exception as e:
            print(f"  Error loading pre-computed data: {e}")
            return False

    # ------------------------------------------------------------------ #
    # MAIN ENTRY POINT                                                     #
    # ------------------------------------------------------------------ #

    def initialize(self):
        """
        Call once at server start.
        • Fast path (~2 s): loads from pickle if precomputed files exist.
        • Slow path (10-20 min for 17 k movies): builds TF-IDF + sparse sim.
        """
        if self._load_precomputed():
            return

        print("\nBuilding recommendation engine from scratch...")

        self.movies_df = self._load_data()
        self._build_tfidf(self.movies_df["feature_soup"])
        self._compute_similarity()
        self._build_indices()
        self._save_precomputed()

        self.is_loaded = True
        print("Recommendation engine ready!\n")

    # ------------------------------------------------------------------ #
    # CORE RECOMMENDATION — SIMILAR MOVIES                                 #
    # ------------------------------------------------------------------ #

    def get_similar_movies(
        self,
        movie_id:   int            = None,
        movie_title: str           = None,
        top_n:      int            = 10,
        exclude_ids: List[int]     = None,
    ) -> List[Dict]:
        """
        Return up to top_n movies most similar to the given movie.

        Looks up the pre-computed top_similar dict (O(1)) — no matrix ops
        at request time.
        """
        if not self.is_loaded:
            return []

        # --- resolve movie_id from title if needed ---
        if movie_id is None and movie_title is not None:
            title_lower = movie_title.lower()
            if title_lower not in self.movie_indices.index:
                return []
            idx = self.movie_indices[title_lower]
            if isinstance(idx, pd.Series):
                idx = idx.iloc[0]
            movie_id = int(self.movies_df.iloc[idx]["id"])

        if movie_id is None or movie_id not in self.top_similar:
            return []

        exclude_set   = set(exclude_ids or [])
        similar_pairs = self.top_similar[movie_id]   # [(id, score), …]
        seed_movie    = self.get_movie_from_dataset(movie_id)

        results = []
        for (similar_id, score) in similar_pairs:
            if similar_id in exclude_set:
                continue
            if len(results) >= top_n:
                break

            movie_row = self.get_movie_from_dataset(similar_id)
            if not movie_row:
                continue

            results.append({
                "id":               similar_id,
                "title":            movie_row["title"],
                "poster_path":      movie_row.get("poster_path", ""),
                "vote_average":     movie_row.get("vote_average", 0),
                "similarity_score": round(score, 4),
                "match_percentage": round(score * 100),
                "explanation":      self._build_explanation(seed_movie, movie_row),
                "genres":           movie_row.get("genres", ""),
                "release_date":     movie_row.get("release_date", ""),
            })

        return results

    # ------------------------------------------------------------------ #
    # EXPLANATION BUILDER                                                  #
    # ------------------------------------------------------------------ #

    def _build_explanation(self, seed: Optional[Dict], result: Optional[Dict]) -> str:
        """
        Produce a short human-readable reason why this movie was recommended.

        Checks (in order):
          1. Shared genres
          2. Same director
          3. Shared cast member
          Falls back to "Similar themes and style".
        """
        if not seed or not result:
            return "Similar themes and style"

        reasons = []

        # 1. Genres overlap
        seed_genres   = {g.strip() for g in str(seed.get("genres",   "")).split(",") if g.strip()}
        result_genres = {g.strip() for g in str(result.get("genres", "")).split(",") if g.strip()}
        shared        = seed_genres & result_genres
        if shared:
            label = ", ".join(sorted(shared)[:3])
            reasons.append(f"Shares {label} genres")

        # 2. Same director
        seed_dir   = str(seed.get("director",   "")).strip()
        result_dir = str(result.get("director", "")).strip()
        if seed_dir and result_dir and seed_dir.lower() == result_dir.lower():
            reasons.append(f"Same director: {seed_dir}")

        # 3. Cast overlap (compare comma-separated cast_names)
        def _cast_set(movie: Dict) -> set:
            raw = str(movie.get("cast_names", movie.get("cast", ""))).strip()
            return {n.strip().lower() for n in raw.split(",") if n.strip()}

        shared_cast = _cast_set(seed) & _cast_set(result)
        shared_cast.discard("")
        if shared_cast:
            name = next(iter(shared_cast)).title()
            reasons.append(f"Features {name}")

        return ".  ".join(reasons) + "." if reasons else "Similar themes and style"

    # ------------------------------------------------------------------ #
    # PERSONALIZED RECOMMENDATIONS                                         #
    # ------------------------------------------------------------------ #

    def get_personalized_recommendations(
        self,
        rated_movies: List[Dict],
        top_n:        int   = 20,
        min_rating:   float = 3.5,
    ) -> List[Dict]:
        """
        Aggregate similar-movie scores across all highly-rated seed movies,
        weighted by the user's rating, and return the top-N candidates.
        """
        if not self.is_loaded or not rated_movies:
            return []

        good_ratings = [r for r in rated_movies if r.get("rating", 0) >= min_rating]
        if not good_ratings:
            good_ratings = rated_movies[:5]

        rated_ids  = set(r["movie_id"] for r in rated_movies)
        candidates: Dict[int, Dict] = {}

        for rated in good_ratings:
            similar = self.get_similar_movies(
                movie_id    = rated["movie_id"],
                top_n       = 15,
                exclude_ids = list(rated_ids),
            )

            rating_weight = rated.get("rating", 4.0) / 5.0

            for movie in similar:
                mid            = movie["id"]
                weighted_score = movie["similarity_score"] * rating_weight

                if mid in candidates:
                    candidates[mid]["score"] += weighted_score
                    candidates[mid]["sources"].append({
                        "source_id":   rated["movie_id"],
                        "similarity":  movie["similarity_score"],
                        "explanation": movie["explanation"],
                    })
                else:
                    candidates[mid] = {
                        "movie":  movie,
                        "score":  weighted_score,
                        "sources": [{
                            "source_id":   rated["movie_id"],
                            "similarity":  movie["similarity_score"],
                            "explanation": movie["explanation"],
                        }],
                    }

        sorted_candidates = sorted(
            candidates.values(), key=lambda x: x["score"], reverse=True
        )[:top_n]

        results = []
        for candidate in sorted_candidates:
            movie = candidate["movie"]
            movie["aggregated_score"]    = round(candidate["score"], 4)
            movie["recommended_because"] = candidate["sources"][:3]
            results.append(movie)

        return results

    # ------------------------------------------------------------------ #
    # UTILITIES                                                            #
    # ------------------------------------------------------------------ #

    def get_movie_from_dataset(self, movie_id: int) -> Optional[Dict]:
        """Return a movie's metadata dict by TMDB ID, or None if not found."""
        if not self.is_loaded:
            return None

        if movie_id not in self.movie_id_indices.index:
            return None

        idx = self.movie_id_indices[movie_id]
        if isinstance(idx, pd.Series):
            idx = idx.iloc[0]

        row = self.movies_df.iloc[idx]
        cast_raw = str(row.get("cast_names", row.get("cast", "")))

        return {
            "id":           int(row["id"]),
            "title":        str(row["title"]),
            "overview":     str(row.get("overview",      "")),
            "genres":       str(row.get("genres",        "")),
            "keywords":     str(row.get("keywords",      "")),
            "director":     str(row.get("director",      "")),
            "cast":         cast_raw,           # alias for backward compat
            "cast_names":   cast_raw,
            "vote_average": float(row.get("vote_average", 0)),
            "vote_count":   float(row.get("vote_count",   0)),
            "popularity":   float(row.get("popularity",   0)),
            "poster_path":  str(row.get("poster_path",   "")),
            "release_date": str(row.get("release_date",  "")),
            "tagline":      str(row.get("tagline",        "")),
            "runtime":      float(row.get("runtime",      0)),
            "original_language": str(row.get("original_language", "")),
        }

    def search_in_dataset(self, query: str, limit: int = 5) -> List[Dict]:
        """Search the local dataset by title substring."""
        if not self.is_loaded:
            return []

        matches = self.movies_df[
            self.movies_df["title"].str.lower().str.contains(query.lower(), na=False)
        ].head(limit)

        return [
            {
                "id":           int(row["id"]),
                "title":        str(row["title"]),
                "genres":       str(row.get("genres", "")),
                "vote_average": float(row.get("vote_average", 0)),
            }
            for _, row in matches.iterrows()
        ]


# Single instance used throughout the app
recommendation_engine = RecommendationEngine()
