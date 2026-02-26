---
description: Run the full data analysis pipeline on files in data/input/
argument-hint: "[optional: describe what the data is about]"
allowed-tools: Bash, Read, Write, Glob, Task
---

You are the orchestrator for a multi-agent data analysis pipeline.

**User context:** $ARGUMENTS

## Step 1: Check for input files

```bash
ls data/input/
```

If the directory is empty or only has `.gitkeep`, stop and tell the user:
> "No input files found. Please drop CSV or log files into `data/input/` and try again."

## Step 2: Install dependencies

```bash
bash scripts/setup.sh
```

## Step 3: Initialize the manifest

Write `output/manifest.json` with this structure (fill in actual input file paths and timestamp):

```json
{
  "run_timestamp": "<ISO 8601 timestamp>",
  "user_context": "<$ARGUMENTS or empty string>",
  "inputs": ["data/input/<file1>", "data/input/<file2>"],
  "clean_files": [],
  "charts": [],
  "insights_file": null,
  "report_file": null
}
```

## Step 4: Phase 1 — Data Cleaning (wait for completion before proceeding)

Use the Task tool to spawn the `data-cleaner` agent:

```
Prompt: You are the data-cleaner agent. Clean all files in data/input/ and write results to output/clean/. Update output/manifest.json to set "clean_files" to the list of cleaned file paths. User context: <$ARGUMENTS>
subagent_type: agent
agent_name: data-cleaner
```

Wait for the task to complete. If it fails, stop and report the error to the user.

## Step 5: Phase 2 — Visualization + Anomaly Detection (launch both in parallel)

Spawn TWO Task agents simultaneously in a single response (do not wait between them):

**Task A — data-visualizer:**
```
Prompt: You are the data-visualizer agent. Generate charts from output/clean/ and save PNGs to output/charts/. Update output/manifest.json to set "charts" to the list of chart file paths. User context: <$ARGUMENTS>
subagent_type: agent
agent_name: data-visualizer
```

**Task B — anomaly-detector:**
```
Prompt: You are the anomaly-detector agent. Detect anomalies in output/clean/ and write output/insights/anomalies.json and output/insights/insights.md. Update output/manifest.json to set "insights_file" to "output/insights/insights.md". User context: <$ARGUMENTS>
subagent_type: agent
agent_name: anomaly-detector
```

Wait for both tasks to complete before proceeding.

## Step 6: Phase 3 — Report Writing (wait for completion)

Spawn the `report-writer` agent:

```
Prompt: You are the report-writer agent. Read output/insights/insights.md, output/clean/cleaning_report.md, and output/manifest.json. Write a comprehensive narrative report to output/report/final_report.md. Update output/manifest.json to set "report_file" to "output/report/final_report.md". User context: <$ARGUMENTS>
subagent_type: agent
agent_name: report-writer
```

## Step 7: Print final summary

Read `output/manifest.json` and print:

```
Analysis complete!

  Final report:   output/report/final_report.md
  Insights:       output/insights/insights.md
  Charts:         output/charts/  (N charts)
  Cleaned data:   output/clean/

Input files processed:
  - data/input/<file1>
  - data/input/<file2>
```
