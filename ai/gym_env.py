from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import gymnasium as gym
import numpy as np
import requests
from gymnasium import spaces


@dataclass
class BemergedBridgeConfig:
    base_url: str = "http://localhost:3002"
    scenario_id: str = "objective-default"


class BemergedGymEnv(gym.Env[np.ndarray, np.int64]):
    metadata = {"render_modes": []}

    def __init__(self, config: BemergedBridgeConfig | None = None):
        self.config = config or BemergedBridgeConfig()
        self._max_actions = 512
        self.observation_space = spaces.Box(low=0, high=999, shape=(8, 14), dtype=np.int32)
        self.action_space = spaces.Discrete(self._max_actions)
        self._valid_actions: list[dict[str, Any]] = []
        self._session_id: str | None = None

    def reset(self, *, seed: int | None = None, options: dict[str, Any] | None = None):
        payload = {
            "scenarioId": (options or {}).get("scenarioId", self.config.scenario_id),
            "seed": seed,
        }
        response = requests.post(f"{self.config.base_url}/api/bemerged/env/reset", json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        self._session_id = str(data.get("sessionId") or "").strip() or None
        self._valid_actions = list(data.get("validActions") or [])
        state = np.array(data["state"]["board"], dtype=np.int32)
        return state, data.get("info", {})

    def step(self, action: np.int64):
        action_id = int(action)
        response = requests.post(
            f"{self.config.base_url}/api/bemerged/env/step",
            json={
                "sessionId": self._session_id,
                "actionId": action_id,
            },
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()
        self._session_id = str(data.get("sessionId") or "").strip() or self._session_id
        self._valid_actions = list(data.get("validActions") or [])
        state = np.array(data["nextState"]["board"], dtype=np.int32)
        reward = float(data["reward"])
        done = bool(data["done"])
        terminated = done
        truncated = False
        info = data.get("info", {})
        return state, reward, terminated, truncated, info

    def get_valid_actions(self) -> list[dict[str, Any]]:
        if not self._session_id:
            return list(self._valid_actions)
        response = requests.get(
            f"{self.config.base_url}/api/bemerged/env/valid-actions",
            params={"sessionId": self._session_id},
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()
        self._valid_actions = list(data.get("validActions") or [])
        return list(self._valid_actions)
