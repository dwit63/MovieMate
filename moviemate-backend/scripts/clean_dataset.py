"""
scripts/clean_dataset.py — TMDB Movie Dataset Cleaner (v2)

Input:  data/raw_movies.csv          (Full TMDB Movies Dataset 2024, 1.4M+ rows)
Output: data/movies_cleaned.csv

Filtering pipeline (11 steps):
  1.  status == 'Released'
  2.  original_language in approved list (en, hi, ta, te, ml, kn, bn, mr, ko, ja)
  3.  Drop rows missing title / overview / genres
  4.  Drop duplicate id
  5.  vote_count >= 10 (Indian langs) / >= 50 (en, ko, ja)
  6.  vote_average >= 5.0
  7.  adult == False
  8.  release_year >= 1950
  9.  overview word count >= 20
  10. 40 <= runtime <= 300  (skipped if column absent)
  11. genres is not empty brackets "[]"
"""

import os
import sys

import pandas as pd

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR   = os.path.join(SCRIPT_DIR, "..", "data")
INPUT_CSV  = os.path.join(DATA_DIR, "raw_movies.csv")
OUTPUT_CSV = os.path.join(DATA_DIR, "movies_cleaned.csv")

# ── Config ────────────────────────────────────────────────────────────────────
ALLOWED_LANGUAGES = ["en", "hi", "ta", "te", "ml", "kn", "bn", "mr", "ko", "ja"]

KEEP_COLS = [
    "id", "title", "overview", "genres", "keywords",
    "release_date", "vote_average", "vote_count",
    "popularity", "poster_path", "original_language",
    "tagline", "runtime",
]

STEP = 0


def log(label: str, df: pd.DataFrame) -> None:
    global STEP
    STEP += 1
    print(f"  [{STEP:>2}] {len(df):>8,}  rows   after  {label}")


def main():
    global STEP
    STEP = 0

    # ── Load ──────────────────────────────────────────────────────────────────
    print(f"Loading: {INPUT_CSV}")
    try:
        df = pd.read_csv(INPUT_CSV, low_memory=False)
    except FileNotFoundError:
        sys.exit(f"\nERROR: file not found — {INPUT_CSV}")

    print(f"\nTotal rows loaded : {len(df):,}")
    print(f"Columns ({len(df.columns)}): {df.columns.tolist()}\n")

    print("=" * 65)
    print("FILTERING PIPELINE")
    print("=" * 65)
    print(f"  [ 0] {len(df):>8,}  rows   raw (starting point)")

    # ── Filter 1: Released only ───────────────────────────────────────────────
    df = df[df["status"] == "Released"]
    log("status == 'Released'", df)

    # ── Filter 2: Allowed languages ───────────────────────────────────────────
    df = df[df["original_language"].isin(ALLOWED_LANGUAGES)]
    log(f"original_language in {ALLOWED_LANGUAGES}", df)

    # ── Filter 3: Drop missing title / overview / genres ─────────────────────
    for col in ["title", "overview", "genres"]:
        df = df[df[col].notna() & (df[col].astype(str).str.strip() != "")]
    log("drop missing/empty title, overview, genres", df)

    # ── Filter 4: Drop duplicate ids ─────────────────────────────────────────
    df.drop_duplicates(subset=["id"], keep="first", inplace=True)
    log("drop duplicate id", df)

    # ── Filter 5: Language-aware vote count ──────────────────────────────────
    # Indian-language films are under-represented on TMDB, so they get a
    # lower threshold (10) while English / Korean / Japanese use the standard (50).
    indian_languages  = ["hi", "ta", "te", "ml", "kn", "bn", "mr"]
    western_languages = ["en", "ko", "ja"]

    vote_num = pd.to_numeric(df["vote_count"], errors="coerce").fillna(0)
    indian_mask  = df["original_language"].isin(indian_languages)
    western_mask = df["original_language"].isin(western_languages)

    indian_movies  = df[indian_mask  & (vote_num >= 10)]
    western_movies = df[western_mask & (vote_num >= 50)]

    df = pd.concat([indian_movies, western_movies]).reset_index(drop=True)
    log("vote_count >= 10 (Indian langs) / >= 50 (en, ko, ja)", df)

    # ── Filter 6: Minimum vote average ───────────────────────────────────────
    df = df[pd.to_numeric(df["vote_average"], errors="coerce").fillna(0) >= 5.0]
    log("vote_average >= 5.0", df)

    # ── Filter 7: No adult content ────────────────────────────────────────────
    if df["adult"].dtype == object:
        df = df[df["adult"].astype(str).str.strip().str.lower() == "false"]
    else:
        df = df[df["adult"] == False]  # noqa: E712
    log("adult == False", df)

    # ── Filter 8: Release year >= 1950 ────────────────────────────────────────
    df["_year"] = pd.to_datetime(df["release_date"], errors="coerce").dt.year
    df = df[df["_year"].notna() & (df["_year"] >= 1950)]
    log("release_year >= 1950  (drops missing/malformed dates too)", df)

    # ── Filter 9: Overview word count >= 20 ──────────────────────────────────
    df = df[df["overview"].astype(str).str.split().str.len() >= 20]
    log("overview word count >= 20", df)

    # ── Filter 10: Runtime 40–300  (skipped if column absent) ────────────────
    if "runtime" in df.columns:
        runtime_num = pd.to_numeric(df["runtime"], errors="coerce")
        df = df[runtime_num.notna() & (runtime_num >= 40) & (runtime_num <= 300)]
        log("40 <= runtime <= 300", df)
    else:
        print("  [--]     SKIP   runtime column not present — filter skipped")

    # ── Filter 11: Genres must be meaningful (not "[]") ──────────────────────
    genres_clean = df["genres"].astype(str).str.strip()
    df = df[~genres_clean.isin(["[]", ""])]
    log("genres != '[]' (meaningful genres only)", df)

    # ── Keep target columns ───────────────────────────────────────────────────
    final_cols  = [c for c in KEEP_COLS if c in df.columns]
    dropped_sys = [c for c in KEEP_COLS if c not in df.columns]
    df = df[final_cols]

    if dropped_sys:
        print(f"\n  (columns in keep-list but not in dataset: {dropped_sys})")

    # ── Reset index ───────────────────────────────────────────────────────────
    df.reset_index(drop=True, inplace=True)

    # ── Save ──────────────────────────────────────────────────────────────────
    os.makedirs(DATA_DIR, exist_ok=True)
    df.to_csv(OUTPUT_CSV, index=False)

    # ── Final stats ───────────────────────────────────────────────────────────
    print()
    print("=" * 65)
    print("RESULTS")
    print("=" * 65)
    print(f"  Final movie count : {len(df):,}")
    print(f"  Columns saved     : {final_cols}")

    # Language distribution
    print("\n  Language distribution:")
    lang_counts = df["original_language"].value_counts()
    lang_names = {
        "en": "English", "hi": "Hindi",   "ta": "Tamil",
        "te": "Telugu",  "ml": "Malayalam","kn": "Kannada",
        "bn": "Bengali", "mr": "Marathi",  "ko": "Korean",
        "ja": "Japanese",
    }
    for lang, count in lang_counts.items():
        name = lang_names.get(lang, lang)
        bar  = "#" * (count * 30 // max(lang_counts))
        print(f"    {lang} ({name:<10})  {count:>6,}  {bar}")

    # Year distribution
    year_col = pd.to_datetime(df["release_date"], errors="coerce").dt.year
    buckets = {
        "1950–1999": ((year_col >= 1950) & (year_col < 2000)).sum(),
        "2000–2009": ((year_col >= 2000) & (year_col < 2010)).sum(),
        "2010–2019": ((year_col >= 2010) & (year_col < 2020)).sum(),
        "2020–2025": ((year_col >= 2020) & (year_col <= 2025)).sum(),
    }
    print("\n  Year distribution:")
    total_bucketed = sum(buckets.values())
    for era, count in buckets.items():
        pct = count / total_bucketed * 100 if total_bucketed else 0
        bar = "#" * int(pct / 2)
        print(f"    {era}  {count:>6,}  ({pct:5.1f}%)  {bar}")

    # 5 sample Indian-language movies
    indian_sample = df[df["original_language"] != "en"][
        ["title", "original_language", "release_date", "genres", "vote_count"]
    ].sample(min(5, (df["original_language"] != "en").sum()), random_state=42)

    print("\n  Sample Indian / non-English movies that passed the filter:")
    for _, row in indian_sample.iterrows():
        year  = str(row["release_date"])[:4]
        lname = lang_names.get(row["original_language"], row["original_language"])
        print(f"    Title      : {row['title']}")
        print(f"    Language   : {row['original_language']} ({lname})  |  Year: {year}  |  Votes: {int(row['vote_count']):,}")
        print(f"    Genres     : {row['genres']}")
        print()


if __name__ == "__main__":
    main()
