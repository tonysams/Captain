---
description: Clean raw data files in data/input/ and write normalized CSVs to output/clean/
allowed-tools: Bash, Read, Write, Glob, Task
---

Run the data cleaning phase as a standalone step.

1. Check that `data/input/` contains CSV or log files. If empty, tell the user to drop files in first.

2. Run:
```bash
bash scripts/setup.sh
```

3. Spawn the `data-cleaner` agent:
```
Prompt: Clean all files in data/input/ and write results to output/clean/. The manifest may not exist yet — skip updating it.
subagent_type: agent
agent_name: data-cleaner
```

4. After the agent completes, read and display `output/clean/cleaning_report.md` to the user so they can see a summary of what was done.
