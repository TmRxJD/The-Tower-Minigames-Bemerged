from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

from stable_baselines3.common.callbacks import BaseCallback


class BemergedEpisodeLogger(BaseCallback):
    def __init__(self, replay_dir: str = "replays", verbose: int = 0):
        super().__init__(verbose)
        self.replay_dir = Path(replay_dir)
        self.replay_dir.mkdir(parents=True, exist_ok=True)
        self.current_steps: list[dict[str, Any]] = []
        self.current_seed = 0
        self.current_scenario_id = "objective-default"

    def _on_step(self) -> bool:
        infos = self.locals.get("infos") or []
        rewards = self.locals.get("rewards") or []
        dones = self.locals.get("dones") or []

        if not infos:
            return True

        info = infos[0] if len(infos) > 0 else {}
        reward = float(rewards[0]) if len(rewards) > 0 else 0.0
        done = bool(dones[0]) if len(dones) > 0 else False

        self.current_seed = int(info.get("seed") or self.current_seed or 1337)
        self.current_scenario_id = str(info.get("scenarioId") or self.current_scenario_id)

        self.current_steps.append(
            {
                "turn": int(info.get("turn") or len(self.current_steps) + 1),
                "actionId": int(info.get("actionId") or -1),
                "reward": reward,
                "rewardBreakdown": info.get("rewardBreakdown") or {},
                "loopCount": int(info.get("loopCount") or 0),
            }
        )

        if done:
            self._flush_episode(info)

        return True

    def _flush_episode(self, info: dict[str, Any]) -> None:
        summary = {
            "completionPercent": float(info.get("completionPercent") or 0.0),
            "completedTypeCount": int(info.get("completedTypeCount") or 0),
            "score": int(info.get("score") or 0),
            "moves": int(info.get("moves") or 0),
            "merges": int(info.get("merges") or 0),
            "shatters": int(info.get("shatters") or 0),
        }

        payload = {
            "replayFormatVersion": "bemerged-replay-v1",
            "seed": self.current_seed,
            "scenarioId": self.current_scenario_id,
            "goal": "objective-progress",
            "startedAtIso": datetime.utcnow().isoformat() + "Z",
            "finishedAtIso": datetime.utcnow().isoformat() + "Z",
            "doneReason": str(info.get("reason") or "unknown"),
            "steps": list(self.current_steps),
            "summary": summary,
        }

        replay_name = f"episode-{self.num_timesteps}-{self.current_seed}.json"
        replay_path = self.replay_dir / replay_name
        replay_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        self.current_steps = []
