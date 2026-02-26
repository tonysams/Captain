"""
Visualization script for the multi-agent analysis pipeline.

Usage:
    python3 scripts/visualize_data.py --input-dir output/clean/ --output-dir output/charts/
"""

import argparse
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

sns.set_theme(style="whitegrid")
FIGSIZE = (12, 6)
DPI = 150
MAX_CHARTS_PER_DATASET = 6


def infer_column_types(df: pd.DataFrame) -> dict:
    types = {"datetime": [], "numeric": [], "categorical": []}
    for col in df.columns:
        if col == "_quality_flag":
            continue
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            types["datetime"].append(col)
        elif df[col].dtype == object:
            # Try to parse as datetime
            sample = df[col].dropna().head(30)
            parsed = pd.to_datetime(sample, errors="coerce", infer_datetime_format=True)
            if parsed.notna().mean() > 0.7:
                df[col] = pd.to_datetime(df[col], errors="coerce", infer_datetime_format=True)
                types["datetime"].append(col)
            elif df[col].nunique() < 50:
                types["categorical"].append(col)
        elif pd.api.types.is_numeric_dtype(df[col]):
            types["numeric"].append(col)
    return types


def safe_name(stem: str, chart_type: str) -> str:
    return f"{stem}_{chart_type}.png"


def save(fig, path: Path) -> str:
    fig.savefig(path, dpi=DPI, bbox_inches="tight")
    plt.close(fig)
    print(f"  Saved: {path.name}")
    return str(path)


def chart_timeseries(df: pd.DataFrame, date_col: str, num_cols: list, stem: str, out: Path) -> list:
    paths = []
    cols_to_plot = num_cols[:4]  # cap at 4 series
    if not cols_to_plot:
        return paths
    df_sorted = df[[date_col] + cols_to_plot].dropna(subset=[date_col]).sort_values(date_col)
    fig, ax = plt.subplots(figsize=FIGSIZE)
    for col in cols_to_plot:
        ax.plot(df_sorted[date_col], df_sorted[col], label=col, marker="o", markersize=3)
    ax.set_title(f"{stem} — Time Series")
    ax.set_xlabel(date_col)
    ax.set_ylabel("Value")
    ax.legend()
    fig.autofmt_xdate()
    paths.append(save(fig, out / safe_name(stem, "timeseries")))
    return paths


def chart_bar(df: pd.DataFrame, cat_col: str, num_col: str, stem: str, out: Path) -> list:
    counts = df[cat_col].value_counts().head(20)
    fig, ax = plt.subplots(figsize=FIGSIZE)
    sns.barplot(x=counts.index, y=counts.values, ax=ax, palette="Blues_d")
    ax.set_title(f"{stem} — {cat_col} counts")
    ax.set_xlabel(cat_col)
    ax.set_ylabel("Count")
    ax.tick_params(axis="x", rotation=45)
    return [save(fig, out / safe_name(stem, f"{cat_col}_bar"))]


def chart_histogram(df: pd.DataFrame, num_col: str, stem: str, out: Path) -> list:
    fig, ax = plt.subplots(figsize=FIGSIZE)
    sns.histplot(df[num_col].dropna(), bins=30, kde=True, ax=ax)
    ax.set_title(f"{stem} — Distribution of {num_col}")
    ax.set_xlabel(num_col)
    return [save(fig, out / safe_name(stem, f"{num_col}_hist"))]


def chart_scatter(df: pd.DataFrame, x_col: str, y_col: str, stem: str, out: Path) -> list:
    fig, ax = plt.subplots(figsize=FIGSIZE)
    sns.scatterplot(data=df, x=x_col, y=y_col, ax=ax, alpha=0.5, s=30)
    ax.set_title(f"{stem} — {x_col} vs {y_col}")
    return [save(fig, out / safe_name(stem, f"{x_col}_vs_{y_col}_scatter"))]


def chart_heatmap(df: pd.DataFrame, num_cols: list, stem: str, out: Path) -> list:
    if len(num_cols) < 3:
        return []
    corr = df[num_cols].corr()
    fig, ax = plt.subplots(figsize=(max(8, len(num_cols)), max(6, len(num_cols) - 1)))
    sns.heatmap(corr, annot=True, fmt=".2f", cmap="coolwarm", ax=ax)
    ax.set_title(f"{stem} — Correlation Heatmap")
    return [save(fig, out / safe_name(stem, "correlation_heatmap"))]


def visualize_dataset(path: Path, out_dir: Path) -> list:
    df = pd.read_csv(path, low_memory=False)
    stem = path.stem.replace("_clean", "")
    col_types = infer_column_types(df)
    charts = []
    count = 0

    # Time series first (most valuable)
    if col_types["datetime"] and col_types["numeric"] and count < MAX_CHARTS_PER_DATASET:
        new = chart_timeseries(df, col_types["datetime"][0], col_types["numeric"], stem, out_dir)
        charts.extend(new)
        count += len(new)

    # Bar charts for categorical columns
    for cat_col in col_types["categorical"][:2]:
        if count >= MAX_CHARTS_PER_DATASET:
            break
        num_col = col_types["numeric"][0] if col_types["numeric"] else None
        new = chart_bar(df, cat_col, num_col, stem, out_dir)
        charts.extend(new)
        count += len(new)

    # Histograms for top numeric columns
    for num_col in col_types["numeric"][:2]:
        if count >= MAX_CHARTS_PER_DATASET:
            break
        new = chart_histogram(df, num_col, stem, out_dir)
        charts.extend(new)
        count += len(new)

    # Scatter for first two numeric columns
    if len(col_types["numeric"]) >= 2 and count < MAX_CHARTS_PER_DATASET:
        new = chart_scatter(df, col_types["numeric"][0], col_types["numeric"][1], stem, out_dir)
        charts.extend(new)
        count += len(new)

    # Correlation heatmap
    if count < MAX_CHARTS_PER_DATASET:
        new = chart_heatmap(df, col_types["numeric"], stem, out_dir)
        charts.extend(new)
        count += len(new)

    return charts


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", required=True)
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    all_charts = []
    found = False

    for path in sorted(input_dir.glob("*_clean.csv")):
        found = True
        print(f"Visualizing: {path.name}")
        charts = visualize_dataset(path, output_dir)
        all_charts.extend(charts)

    if not found:
        print("No cleaned CSV files found. Run /clean first.", file=sys.stderr)
        sys.exit(1)

    print(f"\nGenerated {len(all_charts)} charts:")
    for c in all_charts:
        print(f"  {c}")


if __name__ == "__main__":
    main()
