---
description: Run the full qualitative research analysis pipeline on the AI Symposium documents
argument-hint: [optional: path to source documents directory]
allowed-tools: Bash, Read, Write, Glob, Task
---

# Qualitative Research Analysis Orchestrator

You are the orchestrator for the AI Symposium qualitative research pipeline.
Your job is to coordinate document ingestion, theme extraction, visualization,
and report writing — producing a full pipeline-style narrative report from
qualitative research documents.

**Source directory:** $ARGUMENTS (if empty, use the default below)

**Default source path:**
```
/Users/tony/Library/Mobile Documents/com~apple~CloudDocs/CoWork/AI_Symposium
```

## Step 1: Resolve the source directory

If `$ARGUMENTS` is provided and non-empty, use it as the source directory.
Otherwise use the default path above.

Verify the source directory exists:
```bash
ls "$SOURCE_DIR"
```

If it doesn't exist, stop and tell the user:
"Source directory not found: [path]. Please provide the correct path as an argument."

## Step 2: Initialize the manifest

Create (or overwrite) `output/manifest.json`:
```json
{
  "run_timestamp": "<ISO timestamp>",
  "user_context": "AI Symposium qualitative research — co-chair interviews, thematic analysis",
  "source_dir": "<resolved source directory>",
  "inputs": [],
  "clean_files": [],
  "charts": [],
  "insights_file": null,
  "report_file": null
}
```

Also ensure all output directories exist:
```bash
mkdir -p output/clean output/charts output/insights output/report
```

## Step 3: Phase 1 — Document Ingestion (blocking)

Spawn the `qualitative-ingester` agent. Wait for it to complete before proceeding.

Task prompt:
```
Ingest all research documents from this source directory: [SOURCE_DIR]

Write extracted text files to output/clean/.
Then run extract_structured_data.py to produce the 4 research CSVs.
Write output/clean/cleaning_report.md.
Update output/manifest.json clean_files key.
```

Use subagent_type: agent, agent_name: qualitative-ingester.

After it completes, verify `output/clean/` contains files:
```bash
ls output/clean/
```

## Step 4: Phase 2 — Visualization + Theme Extraction (parallel)

Spawn TWO Tasks in parallel (launch both simultaneously, do not wait between them):

**Task A** — data-visualizer agent (existing):
```
Read cleaned CSVs from output/clean/ — specifically:
  - code_frequency.csv (31 codes × 4 co-chairs)
  - domain_totals.csv (8 domains)
  - theme_convergence.csv (7 themes × 4 co-chairs)
  - narrative_types.csv (4 co-chairs)

Generate charts appropriate for qualitative research data:
- Stacked bar chart of code frequency by domain (code_frequency.csv)
- Bar chart of domain totals (domain_totals.csv)
- Heatmap of theme convergence across co-chairs (theme_convergence.csv)
- Horizontal bar chart showing top 10 codes by total frequency

Save all charts to output/charts/.
Update output/manifest.json charts key.

Note: theme_convergence.csv uses 1/0 values for presence/absence.
narrative_types.csv is categorical — use it as a table in the report, not a chart.
```

**Task B** — theme-extractor agent (new):
```
Read all ingested documents from output/clean/ and extract insights.
Specifically read: thematic-analysis-codebook.md, co-chair-interview-synthesis.md,
narrative-discourse-analysis.md, findings-section-outline.md, summary-for-dr-frost.md

Produce output/insights/insights.md with all 7 findings.
Produce output/insights/themes.json.
Update output/manifest.json insights_file key.
```

Wait for BOTH tasks to complete before continuing.

## Step 5: Phase 3 — Report Writing (blocking)

Spawn the `report-writer` agent. Wait for it to complete.

Task prompt:
```
Read output/insights/insights.md, output/clean/cleaning_report.md, and output/manifest.json.

Write a comprehensive narrative report to output/report/final_report.md.

This report is for AI Symposium qualitative research. The audience is academic collaborators
(co-authors and Dr. Frost). The report should cover:
- What was analyzed (the documents, the research context)
- Data quality (what was ingested, what couldn't be read)
- All 7 key findings with supporting evidence
- Logan's counter-narrative (important theoretical nuance)
- Code frequency highlights and what they mean
- Charts reference list
- Recommended next steps for the paper

Tone: professional academic, but readable. Same structure as the standard pipeline report.
Update output/manifest.json report_file key.
```

## Step 6: Print final summary

Read `output/manifest.json` and print:

```
Qualitative analysis complete.

Source: [source_dir]
Documents ingested: [count from clean_files]

Outputs:
  Final report:     output/report/final_report.md   ← start here
  Insights:         output/insights/insights.md
  Charts:           output/charts/  ([N] charts)
  Structured data:  output/clean/code_frequency.csv (and 3 more CSVs)
  Ingestion log:    output/clean/cleaning_report.md
```
