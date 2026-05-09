"""
scripts/preprocess_dataset.py — Build TF-IDF Feature Soup

Input:  data/movies_cleaned.csv
Output: data/movies_processed.csv   (all original columns + 'feature_soup')

Feature soup per movie is one combined string built from:
  genres   (join_names, weight x2)
  keywords (clean_text)
  director (join_names, weight x3) — skipped if column absent
  cast     (join_names, top-3)     — skipped if column absent
  overview (clean_text, first 150 words)
"""

import os
import re
import sys

import nltk
import pandas as pd
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# ── NLTK data ─────────────────────────────────────────────────────────────────
nltk.download("stopwords", quiet=True)
nltk.download("wordnet",   quiet=True)
nltk.download("omw-1.4",   quiet=True)

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR   = os.path.join(SCRIPT_DIR, "..", "data")
INPUT_CSV  = os.path.join(DATA_DIR, "movies_cleaned.csv")
OUTPUT_CSV = os.path.join(DATA_DIR, "movies_processed.csv")

# ── NLP tools (initialised once) ─────────────────────────────────────────────
_lemmatizer  = WordNetLemmatizer()
_stop_words  = set(stopwords.words("english"))
_punct_re    = re.compile(r"[^a-z\s]")     # keep only lowercase letters + spaces


# ── Text helpers ──────────────────────────────────────────────────────────────

def clean_text(text) -> str:
    """
    Lowercase → strip punctuation → remove stopwords → lemmatize.
    Returns a single cleaned string, or '' if input is null/empty.
    """
    if not isinstance(text, str) or not text.strip():
        return ""
    text = text.lower()
    text = _punct_re.sub(" ", text)
    tokens = [
        _lemmatizer.lemmatize(w)
        for w in text.split()
        if w not in _stop_words and len(w) > 1
    ]
    return " ".join(tokens)


def join_names(text) -> str:
    """
    Turn a comma-separated list of names into underscore-joined tokens.

    "Christopher Nolan, Tom Hardy" -> "christopher_nolan tom_hardy"

    Each name becomes one token so TF-IDF treats it as a single feature
    rather than splitting 'Christopher' and 'Nolan' apart.
    """
    if not isinstance(text, str) or not text.strip():
        return ""
    parts = [p.strip().lower().replace(" ", "_") for p in text.split(",") if p.strip()]
    return " ".join(parts)


def build_feature_soup(row) -> str:
    """
    Build one combined feature string for a single movie row.

    Weights:
      director × 3  (strongest signal)
      genres   × 2  (strong signal)
      cast     × 1
      keywords × 1
      overview × 1
    """
    parts = []

    # genres — repeated twice for extra weight
    if "genres" in row.index and isinstance(row["genres"], str):
        g = join_names(row["genres"])
        parts += [g, g]                         # weight × 2

    # keywords
    if "keywords" in row.index and isinstance(row["keywords"], str):
        parts.append(clean_text(row["keywords"]))

    # director — repeated three times (highest weight)
    if "director" in row.index and isinstance(row["director"], str):
        d = join_names(row["director"])
        parts += [d, d, d]                      # weight × 3

    # cast — top 3 names only
    if "cast_names" in row.index and isinstance(row["cast_names"], str):
        top3 = ", ".join(row["cast_names"].split(",")[:3])
        parts.append(join_names(top3))

    # overview — clean text, capped at 150 words
    if "overview" in row.index and isinstance(row["overview"], str):
        words = clean_text(row["overview"]).split()
        parts.append(" ".join(words[:150]))

    return " ".join(p for p in parts if p).strip()


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print(f"Loading: {INPUT_CSV}")
    try:
        df = pd.read_csv(INPUT_CSV, low_memory=False)
    except FileNotFoundError:
        sys.exit(f"\nERROR: file not found — {INPUT_CSV}")

    print(f"Rows loaded: {len(df):,}")

    # Fill NaN in text columns so row-level checks don't raise
    text_cols = ["genres", "keywords", "overview", "director", "cast_names", "tagline"]
    for col in text_cols:
        if col in df.columns:
            df[col] = df[col].fillna("")

    skipped = [c for c in ["director", "cast_names"] if c not in df.columns]
    if skipped:
        print(f"Note: column(s) {skipped} not in dataset — skipped in feature soup")

    # Build feature soup
    print("Building feature soups...")
    df["feature_soup"] = df.apply(build_feature_soup, axis=1)

    # Drop rows with too-short soups (< 10 chars = essentially empty)
    before = len(df)
    df = df[df["feature_soup"].str.len() >= 10].reset_index(drop=True)
    dropped = before - len(df)
    if dropped:
        print(f"Dropped {dropped:,} rows with feature_soup < 10 chars")

    # Save
    os.makedirs(DATA_DIR, exist_ok=True)
    df.to_csv(OUTPUT_CSV, index=False)

    # Summary
    print(f"\nSaved -> {OUTPUT_CSV}")
    print(f"Total movies processed: {len(df):,}")
    print(f"Columns: {df.columns.tolist()}")

    # Sample 3 feature soups
    print("\n" + "=" * 65)
    print("SAMPLE FEATURE SOUPS (3 movies)")
    print("=" * 65)
    sample = df[["title", "feature_soup"]].sample(3, random_state=7)
    for _, row in sample.iterrows():
        soup_preview = row["feature_soup"][:300]
        if len(row["feature_soup"]) > 300:
            soup_preview += "..."
        print(f"\nTitle : {row['title']}")
        print(f"Soup  : {soup_preview}")


if __name__ == "__main__":
    main()
