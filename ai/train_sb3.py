from __future__ import annotations

import argparse
import json
from pathlib import Path

from stable_baselines3 import DQN

from episode_logger import BemergedEpisodeLogger
from gym_env import BemergedGymEnv, BemergedBridgeConfig
from local_orchestrator import AnalyzerConfig, run_orchestration_pipeline


def main() -> None:
    parser = argparse.ArgumentParser(description='Train BeMerged SB3 agent and run post-training orchestration analysis.')
    parser.add_argument('--timesteps', type=int, default=100_000)
    parser.add_argument('--planner-mode', choices=['langchain', 'instructor', 'outlines'], default='langchain')
    parser.add_argument('--model', default='qwen2.5:14b-instruct-q5_K_M')
    parser.add_argument('--replay-dir', default='replays')
    args = parser.parse_args()

    env = BemergedGymEnv(BemergedBridgeConfig())
    model = DQN("MlpPolicy", env, verbose=1, learning_starts=1000, buffer_size=50_000)

    replay_dir = Path(args.replay_dir)
    replay_dir.mkdir(parents=True, exist_ok=True)
    logger_callback = BemergedEpisodeLogger(replay_dir=str(replay_dir))

    model.learn(total_timesteps=max(1, int(args.timesteps)), callback=logger_callback)
    model.save("bemerged_dqn_objective_default")

    analysis = run_orchestration_pipeline(
        replay_dir=replay_dir,
        config=AnalyzerConfig(ollama_model=args.model),
        query='Summarize recurring failure patterns and highest leverage next test mission.',
        planner_mode=args.planner_mode,
    )

    Path('analysis-latest.json').write_text(json.dumps(analysis, indent=2), encoding='utf-8')
    print(json.dumps(analysis, indent=2))


if __name__ == "__main__":
    main()
