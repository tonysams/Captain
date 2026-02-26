---
description: Detect anomalies and surface insights from cleaned data in output/clean/
allowed-tools: Bash, Read, Write, Glob, Task
---

Run anomaly detection as a standalone step.

1. Check that `output/clean/` contains `*_clean.csv` files. If not, tell the user to run `/clean` first.

2. Run:
```bash
bash scripts/setup.sh
```

3. Spawn the `anomaly-detector` agent:
```
Prompt: Detect anomalies in output/clean/ and write output/insights/anomalies.json and output/insights/insights.md.
subagent_type: agent
agent_name: anomaly-detector
```

4. After completion, read and display `output/insights/insights.md` to the user.
