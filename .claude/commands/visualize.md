---
description: Generate charts from cleaned data in output/clean/
argument-hint: "[optional: chart type — bar, line, scatter, histogram, heatmap, or all]"
allowed-tools: Bash, Read, Write, Glob, Task
---

Run the visualization phase as a standalone step.

Requested chart type(s): $ARGUMENTS (default: all)

1. Check that `output/clean/` contains `*_clean.csv` files. If not, tell the user to run `/clean` first.

2. Run:
```bash
bash scripts/setup.sh
```

3. Spawn the `data-visualizer` agent:
```
Prompt: Generate charts from output/clean/ and save to output/charts/. Chart type preference: <$ARGUMENTS or "all">.
subagent_type: agent
agent_name: data-visualizer
```

4. After completion, list the generated charts:
```bash
ls -la output/charts/
```
