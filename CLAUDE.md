# Data Analysis Pipeline

## Purpose
Multi-agent data analysis pipeline. Drop CSV or log files into `data/input/` and run `/analyze` to produce cleaned data, visualizations, anomaly reports, and a final narrative summary.

## Directory Layout
- `data/input/`          — Drop raw CSV and log files here before running
- `output/clean/`        — Cleaned/normalized CSVs + `cleaning_report.md`
- `output/charts/`       — PNG charts
- `output/insights/`     — `anomalies.json` + `insights.md`
- `output/report/`       — `final_report.md`
- `output/manifest.json` — Pipeline handoff ledger (updated by each agent)

## Running the Pipeline
```bash
# Drop files into data/input/, then in Claude Code:
/analyze

# With optional context about your data:
/analyze Monthly sales data from our CRM, Jan–Jun 2024
```

## Standalone Commands
- `/clean`             — Run only the data cleaning phase
- `/visualize`         — Re-generate charts from already-cleaned data
- `/detect-anomalies`  — Re-run anomaly detection on already-cleaned data
- `/report`            — Re-generate the final report from existing outputs

## Agent Roles (do not modify these contracts)
- `data-cleaner`     — reads `data/input/`, writes `output/clean/`; never modifies `data/input/`
- `data-visualizer`  — reads `output/clean/` only, writes PNGs to `output/charts/`
- `anomaly-detector` — reads `output/clean/` only, writes to `output/insights/`
- `report-writer`    — reads `output/insights/` + `output/manifest.json`, writes `output/report/final_report.md`

## Python Environment
Python 3.12 at `/Library/Frameworks/Python.framework/Versions/3.12/bin/python3`.
Run `bash scripts/setup.sh` to install required packages.
Use `pip3`, not `pip`.

## Key Conventions
- All dates normalized to ISO 8601 (YYYY-MM-DD)
- Chart filenames: `<dataset_name>_<chart_type>.png`
- Column names: snake_case
- `data/input/` is read-only — agents must never write to it
- `output/manifest.json` keys: `run_timestamp`, `user_context`, `inputs`, `clean_files`, `charts`, `insights_file`, `report_file`

---

# Qualitative Research Pipeline — AI Symposium Extension

## Purpose
Processes qualitative research documents (PDF, DOCX, PPTX, MD, Pages) from the
University of Utah AI Symposium project. Extracts text, structured data, themes,
and visualizations — then produces a full narrative report.

## Running the Qualitative Pipeline
```bash
# Uses default source path (iCloud AI_Symposium folder):
/qualitative-analyze

# With explicit path:
/qualitative-analyze /path/to/AI_Symposium/
```

## Source Documents
Default source: `/Users/tony/Library/Mobile Documents/com~apple~CloudDocs/CoWork/AI_Symposium/`

Key documents:
- `Paper/Co-Chair_findings 2/*.md` — thematic codebook, narrative analysis, interview synthesis
- `Paper/AI Symposium Interviews.pdf` — raw interview transcripts
- `*.pdf / *.docx / *.pptx / *.pages` — supplementary materials

## Qualitative Agent Roles (do not modify these contracts)
- `qualitative-ingester` — reads source docs, extracts text to `output/clean/`, produces 4 research CSVs
- `theme-extractor`      — reads ingested text, produces `output/insights/insights.md` with 7 findings
- `data-visualizer`      — reused from CSV pipeline; reads 4 research CSVs, produces charts
- `report-writer`        — reused from CSV pipeline; synthesizes everything into `output/report/final_report.md`

## Structured Data Extracted
The `extract_structured_data.py` script produces these CSVs in `output/clean/`:
- `code_frequency.csv`   — 31-code × 4-co-chair frequency matrix
- `domain_totals.csv`    — 8 domains aggregated
- `theme_convergence.csv`— 7 themes × 4 co-chairs (binary)
- `narrative_types.csv`  — 4 co-chairs with narrative type and arc

## Python Dependencies
Document ingestion requires: `pypdf pdfplumber python-docx python-pptx`
Pages files: converted via macOS `textutil` (no install needed)
