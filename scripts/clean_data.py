"""
Data cleaning script for the multi-agent analysis pipeline.

Usage:
    python3 scripts/clean_data.py --input-dir data/input/ --output-dir output/clean/
"""

import argparse
import json
import re
import sys
from pathlib import Path

import chardet
import pandas as pd


LOG_PATTERN = re.compile(
    r"(?P<timestamp>\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)"
    r"(?:\s+(?P<level>DEBUG|INFO|WARNING|WARN|ERROR|CRITICAL|FATAL))?"
    r"(?:\s+\[?(?P<source>[^\]]+)\]?)?"
    r"(?:\s+(?P<message>.+))?"
)


def detect_encoding(path: Path) -> str:
    raw = path.read_bytes()
    result = chardet.detect(raw)
    return result.get("encoding") or "utf-8"


def snake_case(name: str) -> str:
    name = re.sub(r"[^\w\s]", "", name)
    name = re.sub(r"\s+", "_", name.strip())
    name = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", name)
    return name.lower()


def clean_csv(path: Path, output_dir: Path) -> dict:
    encoding = detect_encoding(path)
    df = pd.read_csv(path, encoding=encoding, low_memory=False)

    summary = {
        "file": str(path),
        "encoding": encoding,
        "rows_before": len(df),
        "columns_before": list(df.columns),
    }

    # Snake_case column names
    df.columns = [snake_case(c) for c in df.columns]

    # Strip whitespace from string columns
    for col in df.select_dtypes(include="object").columns:
        df[col] = df[col].str.strip()
        df[col] = df[col].replace("", pd.NA)

    # Deduplicate
    before = len(df)
    df = df.drop_duplicates()
    summary["duplicates_removed"] = before - len(df)

    # Parse date-like columns
    date_cols = []
    for col in df.columns:
        if df[col].dtype == object:
            sample = df[col].dropna().head(20)
            parsed = pd.to_datetime(sample, errors="coerce", infer_datetime_format=True)
            if parsed.notna().mean() > 0.7:
                df[col] = pd.to_datetime(df[col], errors="coerce", infer_datetime_format=True)
                df[col] = df[col].dt.strftime("%Y-%m-%d")
                date_cols.append(col)
    summary["date_columns_normalized"] = date_cols

    # Flag rows with >50% null values
    null_frac = df.isnull().mean(axis=1)
    df["_quality_flag"] = (null_frac > 0.5).map({True: "high_null_rate", False: ""})
    flagged = (df["_quality_flag"] == "high_null_rate").sum()
    summary["rows_flagged_high_null"] = int(flagged)

    summary["rows_after"] = len(df)
    summary["columns_after"] = list(df.columns)

    out_path = output_dir / f"{path.stem}_clean.csv"
    df.to_csv(out_path, index=False)
    summary["output_file"] = str(out_path)
    return summary


def parse_log(path: Path, output_dir: Path) -> dict:
    encoding = detect_encoding(path)
    lines = path.read_text(encoding=encoding, errors="replace").splitlines()

    rows = []
    unparsed = 0
    for line in lines:
        line = line.strip()
        if not line:
            continue
        m = LOG_PATTERN.match(line)
        if m:
            rows.append({
                "timestamp": m.group("timestamp"),
                "level": (m.group("level") or "").strip(),
                "source": (m.group("source") or "").strip(),
                "message": (m.group("message") or line).strip(),
            })
        else:
            rows.append({"timestamp": None, "level": None, "source": None, "message": line})
            unparsed += 1

    df = pd.DataFrame(rows)
    if "timestamp" in df.columns:
        df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce", utc=True)
        df["timestamp"] = df["timestamp"].dt.strftime("%Y-%m-%dT%H:%M:%S")

    summary = {
        "file": str(path),
        "rows_parsed": len(df),
        "rows_unparsed": unparsed,
    }

    out_path = output_dir / f"{path.stem}_clean.csv"
    df.to_csv(out_path, index=False)
    summary["output_file"] = str(out_path)
    return summary


def write_cleaning_report(summaries: list, output_dir: Path) -> None:
    lines = ["# Data Cleaning Report\n"]
    for s in summaries:
        lines.append(f"## {Path(s['file']).name}\n")
        if "rows_before" in s:
            lines.append(f"- **Rows before:** {s['rows_before']}")
            lines.append(f"- **Rows after:** {s['rows_after']}")
            lines.append(f"- **Duplicates removed:** {s.get('duplicates_removed', 0)}")
            lines.append(f"- **Rows flagged (>50% null):** {s.get('rows_flagged_high_null', 0)}")
            if s.get("date_columns_normalized"):
                lines.append(f"- **Date columns normalized:** {', '.join(s['date_columns_normalized'])}")
            lines.append(f"- **Encoding detected:** {s.get('encoding', 'unknown')}")
        else:
            lines.append(f"- **Log rows parsed:** {s.get('rows_parsed', 0)}")
            lines.append(f"- **Log rows unparsed:** {s.get('rows_unparsed', 0)}")
        lines.append(f"- **Output:** `{s['output_file']}`")
        lines.append("")

    (output_dir / "cleaning_report.md").write_text("\n".join(lines))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", required=True)
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    summaries = []
    found = False

    for path in sorted(input_dir.iterdir()):
        if path.name.startswith(".") or path.name == ".gitkeep":
            continue
        if path.suffix.lower() == ".csv":
            found = True
            print(f"Cleaning CSV: {path.name}")
            summaries.append(clean_csv(path, output_dir))
        elif path.suffix.lower() in {".log", ".txt"}:
            found = True
            print(f"Parsing log: {path.name}")
            summaries.append(parse_log(path, output_dir))

    if not found:
        print("No CSV or log files found in input directory.", file=sys.stderr)
        sys.exit(1)

    write_cleaning_report(summaries, output_dir)
    print(json.dumps(summaries, indent=2))


if __name__ == "__main__":
    main()
