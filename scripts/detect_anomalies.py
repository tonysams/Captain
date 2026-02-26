"""
Anomaly detection script for the multi-agent analysis pipeline.

Usage:
    python3 scripts/detect_anomalies.py --input-dir output/clean/ --output-dir output/insights/
"""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats


def detect_zscore_outliers(df: pd.DataFrame, col: str, threshold: float = 3.0) -> list:
    series = df[col].dropna()
    if len(series) < 10:
        return []
    z = np.abs(stats.zscore(series))
    outlier_idx = series.index[z > threshold]
    results = []
    for idx in outlier_idx:
        results.append({
            "type": "outlier_zscore",
            "column": col,
            "row_index": int(idx),
            "value": float(df.at[idx, col]),
            "z_score": round(float(z[series.index == idx][0]), 2),
            "description": f"{col} value {df.at[idx, col]:.4g} is {z[series.index == idx][0]:.1f} std devs from mean",
        })
    return results


def detect_iqr_outliers(df: pd.DataFrame, col: str) -> list:
    series = df[col].dropna()
    if len(series) < 10:
        return []
    q1, q3 = series.quantile(0.25), series.quantile(0.75)
    iqr = q3 - q1
    if iqr == 0:
        return []
    lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    outlier_mask = (series < lower) | (series > upper)
    outlier_idx = series.index[outlier_mask]
    results = []
    for idx in outlier_idx[:10]:  # cap at 10 per column
        val = float(df.at[idx, col])
        results.append({
            "type": "outlier_iqr",
            "column": col,
            "row_index": int(idx),
            "value": val,
            "iqr_bounds": [round(lower, 4), round(upper, 4)],
            "description": f"{col} value {val:.4g} is outside IQR bounds [{lower:.4g}, {upper:.4g}]",
        })
    return results


def detect_trends(df: pd.DataFrame, col: str) -> list:
    series = df[col].dropna().reset_index(drop=True)
    if len(series) < 10:
        return []
    rho, pval = stats.spearmanr(range(len(series)), series)
    if abs(rho) < 0.6 or pval > 0.05:
        return []
    direction = "increasing" if rho > 0 else "decreasing"
    return [{
        "type": f"trend_{direction}",
        "column": col,
        "spearman_rho": round(float(rho), 3),
        "p_value": round(float(pval), 4),
        "description": f"{col} shows a monotonic {direction} trend (ρ={rho:.2f}, p={pval:.4f})",
    }]


def detect_missing_patterns(df: pd.DataFrame) -> list:
    results = []
    for col in df.columns:
        null_rate = df[col].isnull().mean()
        if null_rate > 0.3:
            results.append({
                "type": "high_missing_rate",
                "column": col,
                "null_rate": round(float(null_rate), 3),
                "description": f"{col} has {null_rate:.1%} missing values",
            })
    return results


def analyze_dataset(path: Path) -> dict:
    df = pd.read_csv(path, low_memory=False)
    num_cols = [c for c in df.select_dtypes(include=[np.number]).columns if c != "_quality_flag"]

    anomalies = []
    trends = []

    # Z-score and IQR outliers
    for col in num_cols:
        anomalies.extend(detect_zscore_outliers(df, col))
        # Only use IQR for additional outliers not caught by z-score
        iqr_results = detect_iqr_outliers(df, col)
        z_idx = {a["row_index"] for a in anomalies if a["column"] == col}
        anomalies.extend([r for r in iqr_results if r["row_index"] not in z_idx])

    # Trends
    for col in num_cols:
        trends.extend(detect_trends(df, col))

    # Missing data patterns
    anomalies.extend(detect_missing_patterns(df))

    # Deduplicate anomalies by (type, column, row_index)
    seen = set()
    unique_anomalies = []
    for a in anomalies:
        key = (a["type"], a["column"], a.get("row_index", -1))
        if key not in seen:
            seen.add(key)
            unique_anomalies.append(a)

    return {
        "file": str(path),
        "row_count": len(df),
        "column_count": len(df.columns),
        "anomalies": unique_anomalies,
        "trends": trends,
    }


def write_insights_md(datasets: list, output_dir: Path) -> None:
    lines = [
        "# Data Insights Report\n",
        "## Executive Summary\n",
    ]

    total_anomalies = sum(len(d["anomalies"]) for d in datasets)
    total_trends = sum(len(d["trends"]) for d in datasets)
    lines.append(
        f"Analyzed {len(datasets)} dataset(s) containing "
        f"{sum(d['row_count'] for d in datasets):,} total rows. "
        f"Found {total_anomalies} anomalies and {total_trends} notable trend(s).\n"
    )

    lines.append("## Dataset Overview\n")
    for d in datasets:
        lines.append(f"- **{Path(d['file']).name}**: {d['row_count']:,} rows, {d['column_count']} columns")
    lines.append("")

    lines.append("## Key Findings\n")
    finding_num = 1
    for d in datasets:
        for trend in d["trends"]:
            lines.append(f"### Finding {finding_num}: {trend['column']} trend")
            lines.append(f"- **What**: {trend['description']}")
            lines.append(f"- **Dataset**: `{Path(d['file']).name}`")
            lines.append(f"- **Significance**: Statistically significant trend (p={trend['p_value']})")
            lines.append("")
            finding_num += 1

    lines.append("## Anomalies Detected\n")
    for d in datasets:
        if not d["anomalies"]:
            continue
        lines.append(f"### {Path(d['file']).name}\n")
        for a in d["anomalies"][:20]:  # cap display at 20
            lines.append(f"- {a['description']}")
        if len(d["anomalies"]) > 20:
            lines.append(f"- *(and {len(d['anomalies']) - 20} more — see anomalies.json)*")
        lines.append("")

    lines.append("## Recommended Next Steps\n")
    if total_anomalies > 0:
        lines.append("1. Review flagged outliers to determine if they are data entry errors or genuine events.")
    if total_trends > 0:
        lines.append("2. Investigate trend drivers — are the trends expected or surprising?")
    for d in datasets:
        high_null = [a for a in d["anomalies"] if a["type"] == "high_missing_rate"]
        if high_null:
            cols = ", ".join(a["column"] for a in high_null)
            lines.append(f"3. Address high missing-value rates in columns: {cols}")
    lines.append("4. Share the final report with stakeholders for business context on findings.")
    lines.append("")

    (output_dir / "insights.md").write_text("\n".join(lines))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", required=True)
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    datasets = []
    found = False

    for path in sorted(input_dir.glob("*_clean.csv")):
        found = True
        print(f"Analyzing: {path.name}")
        datasets.append(analyze_dataset(path))

    if not found:
        print("No cleaned CSV files found. Run /clean first.", file=sys.stderr)
        sys.exit(1)

    output = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "datasets": datasets,
    }

    anomalies_path = output_dir / "anomalies.json"
    anomalies_path.write_text(json.dumps(output, indent=2))
    print(f"Written: {anomalies_path}")

    write_insights_md(datasets, output_dir)
    print(f"Written: {output_dir / 'insights.md'}")

    total = sum(len(d["anomalies"]) for d in datasets)
    print(f"\nTotal anomalies found: {total}")


if __name__ == "__main__":
    main()
