"""
scripts/build_model.py — Build the ML recommendation model.

Run this ONCE after generating data/movies_processed.csv:
  cd moviemate-backend
  python scripts/build_model.py

What it does:
  1. Loads data/movies_processed.csv  (17 620 movies, pre-built feature soup)
  2. Fits a TF-IDF matrix  (15 000 features, bigrams)
  3. Computes sparse cosine similarity — top-50 per movie, in batches of 500
  4. Saves to data/precomputed/:
       tfidf_matrix.pkl
       top_similar.pkl
       movies_df.pkl
       vectorizer.pkl

Expected runtime: 10-20 minutes for 17 620 movies.
Memory peak:      ~1-2 GB during batch similarity computation.
"""

import sys
import os
import time

# Add the project root to sys.path so we can import from services/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.recommendation_engine import recommendation_engine

if __name__ == "__main__":
    print("=" * 60)
    print("MovieMate ML Model Builder")
    print("=" * 60)

    start_time = time.time()

    # Force a fresh build — delete stale pickle files if they exist
    precomputed_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "data", "precomputed"
    )
    stale = ["tfidf_matrix.pkl", "top_similar.pkl",
             "cosine_sim.pkl",   "movies_df.pkl",   "vectorizer.pkl"]
    for fname in stale:
        fpath = os.path.join(precomputed_dir, fname)
        if os.path.exists(fpath):
            os.remove(fpath)
            print(f"Removed stale file: {fname}")

    # Build from CSV and save
    recommendation_engine.initialize()

    elapsed = round(time.time() - start_time, 1)
    mins, secs = divmod(int(elapsed), 60)
    print(f"\nTotal build time: {mins}m {secs}s")

    # ── Verification test ──────────────────────────────────────────
    if recommendation_engine.is_loaded:
        n_movies = len(recommendation_engine.movies_df)
        n_indexed = len(recommendation_engine.top_similar)
        print(f"\nDataset size    : {n_movies:,} movies")
        print(f"Movies indexed  : {n_indexed:,}")

        first_id    = int(recommendation_engine.movies_df.iloc[0]["id"])
        first_title = recommendation_engine.movies_df.iloc[0]["title"]
        print(f"\nTesting with: '{first_title}'  (ID: {first_id})")

        similar = recommendation_engine.get_similar_movies(movie_id=first_id, top_n=5)

        if similar:
            print(f"Top-5 similar movies:")
            for m in similar:
                print(
                    f"  {m['match_percentage']:>3}%  {m['title']:<45}"
                    f"  [{m['explanation']}]"
                )
        else:
            print("  No similar movies found — check that the movie ID is in the dataset.")

    print("\nModel build complete!")
