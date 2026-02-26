---
description: Write the final narrative report from existing pipeline outputs
allowed-tools: Bash, Read, Write, Glob, Task
---

Run the report writing phase as a standalone step.

1. Check that `output/insights/insights.md` exists. If not, tell the user to run `/detect-anomalies` (or `/analyze`) first.

2. Spawn the `report-writer` agent:
```
Prompt: Read output/insights/insights.md, output/clean/cleaning_report.md, and output/manifest.json (if it exists). Write a comprehensive narrative report to output/report/final_report.md.
subagent_type: agent
agent_name: report-writer
```

3. After completion, tell the user:
```
Report complete: output/report/final_report.md
```
And display the executive summary section of the report.
