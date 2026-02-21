from __future__ import annotations

import json
from pathlib import Path

from local_orchestrator import AnalyzerConfig, run_orchestration_pipeline


def main() -> None:
    replay_dir = Path("./replays")
    replay_dir.mkdir(parents=True, exist_ok=True)

    payload = run_orchestration_pipeline(
        replay_dir=replay_dir,
        config=AnalyzerConfig(),
        query='Summarize recurring failure patterns and next best objective mission.',
        planner_mode='langchain',
    )

    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
