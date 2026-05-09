"""
scripts/enrich_with_credits.py — Enrich movies_cleaned.csv with director & cast

Reads:
  data/movies_cleaned.csv        (17 k+ movies, numeric TMDB IDs in 'id')
  data/tmdb_5000_credits.csv     (cast + crew JSON for ~4 800 movies)

Writes:
  data/movies_cleaned.csv        (same file, adds 'director' and 'cast_names')
"""

import ast
import os
import sys

import pandas as pd

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
DATA_DIR     = os.path.join(SCRIPT_DIR, "..", "data")
MOVIES_CSV   = os.path.join(DATA_DIR, "movies_cleaned.csv")
CREDITS_CSV  = os.path.join(DATA_DIR, "tmdb_5000_credits.csv")


# ── Parsers ───────────────────────────────────────────────────────────────────

def extract_director(crew_str) -> str:
    """Return the first Director's name from a JSON crew string, else ''."""
    try:
        crew = ast.literal_eval(crew_str)
        for member in crew:
            if member.get("job") == "Director":
                return member.get("name", "")
    except Exception:
        pass
    return ""


def extract_cast(cast_str) -> list:
    """Return the first 3 actor names from a JSON cast string, else []."""
    try:
        cast = ast.literal_eval(cast_str)
        return [member.get("name", "") for member in cast[:3]]
    except Exception:
        return []


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    # ── Step 1: Load ──────────────────────────────────────────────────────────
    for path in (MOVIES_CSV, CREDITS_CSV):
        if not os.path.exists(path):
            sys.exit(f"ERROR: file not found — {path}")

    print(f"Loading movies  : {MOVIES_CSV}")
    df = pd.read_csv(MOVIES_CSV, low_memory=False)
    print(f"  {len(df):,} rows, columns: {df.columns.tolist()}")

    print(f"\nLoading credits : {CREDITS_CSV}")
    credits = pd.read_csv(CREDITS_CSV, low_memory=False)
    print(f"  {len(credits):,} rows")

    # ── Step 2: Show credits columns ──────────────────────────────────────────
    print(f"\nCredits columns: {credits.columns.tolist()}")

    # ── Step 3 & 4: Parse director and cast ───────────────────────────────────
    print("\nParsing director from crew column...")
    credits["director"] = credits["crew"].apply(extract_director)

    print("Parsing cast from cast column...")
    credits["cast_list"]  = credits["cast"].apply(extract_cast)
    credits["cast_names"] = credits["cast_list"].apply(lambda x: ", ".join(x))

    # ── Step 5: Keep only the columns needed for the merge ────────────────────
    credits_slim = credits[["movie_id", "director", "cast_names"]].copy()

    # ── Step 6: Left-join on df['id'] == credits['movie_id'] ─────────────────
    print("\nMerging on df['id'] == credits['movie_id'] (left join)...")
    merged = df.merge(credits_slim, left_on="id", right_on="movie_id", how="left")

    # Drop the redundant movie_id column that came from credits
    merged.drop(columns=["movie_id"], inplace=True)

    # ── Step 8 prep: Fill missing with '' ────────────────────────────────────
    merged["director"]   = merged["director"].fillna("")
    merged["cast_names"] = merged["cast_names"].fillna("")

    # ── Step 7: Merge stats ───────────────────────────────────────────────────
    total          = len(merged)
    got_director   = (merged["director"]   != "").sum()
    got_cast       = (merged["cast_names"] != "").sum()
    no_match       = (merged["director"]   == "").sum()

    print(f"\nMerge stats (out of {total:,} movies):")
    print(f"  Got director data  : {got_director:,}  ({got_director/total*100:.1f}%)")
    print(f"  Got cast data      : {got_cast:,}  ({got_cast/total*100:.1f}%)")
    print(f"  No credits match   : {no_match:,}  ({no_match/total*100:.1f}%)")

    # ── Step 8: Save ──────────────────────────────────────────────────────────
    merged.to_csv(MOVIES_CSV, index=False)
    print(f"\nSaved -> {MOVIES_CSV}")
    print(f"Columns now: {merged.columns.tolist()}")

    # ── Step 9: Sample rows ───────────────────────────────────────────────────
    # Show 5 rows that actually have credits (most interesting)
    has_credits = merged[merged["director"] != ""]
    sample = has_credits[["title", "director", "cast_names"]].sample(
        min(5, len(has_credits)), random_state=42
    )

    print("\n" + "=" * 65)
    print("SAMPLE — 5 movies with credits data")
    print("=" * 65)
    for _, row in sample.iterrows():
        print(f"\n  Title    : {row['title']}")
        print(f"  Director : {row['director']}")
        print(f"  Cast     : {row['cast_names']}")


if __name__ == "__main__":
    main()
