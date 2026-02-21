# BeMerged RL Stack (Gymnasium + SB3 + CleanRL + RLlib)

This folder provides a mandatory external RL integration scaffold using the requested libraries:

- `gymnasium`
- `stable-baselines3`
- `cleanrl`
- `ray[rllib]`

## Setup

```bash
python -m venv .venv
.venv\\Scripts\\activate
python -m pip install -U pip
python -m pip install -r requirements.txt
```

## Environment contract

`gym_env.py` expects these HTTP endpoints (served by BeMerged server on port `3002`):

- `POST /api/bemerged/env/reset` -> `{ sessionId, state, validActions, info, capabilities }`
- `POST /api/bemerged/env/step` -> `{ sessionId, nextState, reward, rewardBreakdown, done, info, validActions }`
- `GET /api/bemerged/env/valid-actions?sessionId=...` -> `{ validActions }`
- `POST /api/bemerged/env/dispose` -> `{ ok }`

State board shape is fixed `(8, 14)` and action is an integer `actionId` over the valid action list.

## Run server + train

In one terminal:

```bash
pnpm --dir games/bemerged/server dev
```

In another terminal:

```bash
python train_sb3.py
```

## SB3 training

```bash
python train_sb3.py
```

### End-to-end orchestration loop

`train_sb3.py` now does all of the following in one run:

1. Trains DQN on the BeMerged env.
2. Logs episode replay JSON files to `./replays`.
3. Builds vector memory over episodes (Chroma + LlamaIndex).
4. Runs anomaly detection (scikit-learn IsolationForest).
5. Produces a structured next-mission plan via selected planner backend:
	- `langchain` (default, ChatOllama structured output)
	- `instructor` (OpenAI-compatible Ollama endpoint)
	- `outlines` (OpenAI-compatible structured generation)
6. Writes `analysis-latest.json`.

Example:

```bash
python train_sb3.py --timesteps 20000 --planner-mode langchain
python train_sb3.py --timesteps 20000 --planner-mode instructor
python train_sb3.py --timesteps 20000 --planner-mode outlines
```

## Standalone replay analysis

```bash
python local_orchestrator.py --replay-dir ./replays --planner-mode langchain
python local_orchestrator.py --replay-dir ./replays --planner-mode instructor
python local_orchestrator.py --replay-dir ./replays --planner-mode outlines
```

If using `instructor` or `outlines`, ensure Ollama OpenAI-compatible endpoint is reachable at `http://127.0.0.1:11434/v1`.

## One-command full pipeline

This starts the BeMerged server, waits for health readiness, runs SB3 training + replay logging + orchestration analysis, then shuts down the server:

```bash
python run_pipeline.py --repo-root ../.. --timesteps 20000 --planner-mode langchain
```

You can switch planner backends the same way:

```bash
python run_pipeline.py --repo-root ../.. --timesteps 20000 --planner-mode instructor
python run_pipeline.py --repo-root ../.. --timesteps 20000 --planner-mode outlines
```

## CleanRL / RLlib

Use the same `BemergedGymEnv` adapter with your chosen CleanRL or RLlib training scripts; this keeps one deterministic environment path and avoids duplicated game logic.
