from __future__ import annotations

import argparse
import subprocess
import sys
import time
from pathlib import Path

import requests


def wait_for_server(base_url: str, timeout_seconds: int) -> None:
    deadline = time.time() + max(5, timeout_seconds)
    last_error: str | None = None

    while time.time() < deadline:
        try:
            response = requests.get(f"{base_url}/api/bemerged/env/capabilities", timeout=2)
            if response.ok:
                return
            last_error = f"HTTP {response.status_code}"
        except Exception as error:
            last_error = str(error)
        time.sleep(1)

    raise RuntimeError(f"BeMerged server did not become ready in time ({last_error or 'unknown error'}).")


def start_server(repo_root: Path) -> subprocess.Popen[str]:
    server_dir = repo_root / "games" / "bemerged" / "server"
    command = [
        "pnpm",
        "--dir",
        str(server_dir),
        "start",
    ]

    return subprocess.Popen(
        command,
        cwd=str(repo_root),
        stdout=sys.stdout,
        stderr=sys.stderr,
        text=True,
    )


def run_training(repo_root: Path, timesteps: int, planner_mode: str, model: str, replay_dir: Path) -> int:
    train_script = repo_root / "games" / "bemerged" / "ai" / "train_sb3.py"
    command = [
        sys.executable,
        str(train_script),
        "--timesteps",
        str(max(1, timesteps)),
        "--planner-mode",
        planner_mode,
        "--model",
        model,
        "--replay-dir",
        str(replay_dir),
    ]

    return subprocess.run(command, cwd=str(repo_root), check=False).returncode


def main() -> None:
    parser = argparse.ArgumentParser(description="Run BeMerged server + SB3 training + post-analysis in one command.")
    parser.add_argument("--repo-root", default=".", help="Path to the-tower-run-tracker repository root")
    parser.add_argument("--server-url", default="http://localhost:3002", help="BeMerged server base URL")
    parser.add_argument("--server-ready-timeout", type=int, default=60, help="Seconds to wait for server readiness")
    parser.add_argument("--timesteps", type=int, default=20_000, help="SB3 training timesteps")
    parser.add_argument("--planner-mode", choices=["langchain", "instructor", "outlines"], default="langchain")
    parser.add_argument("--model", default="qwen2.5:14b-instruct-q5_K_M")
    parser.add_argument("--replay-dir", default="replays")
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()
    replay_dir = (repo_root / args.replay_dir).resolve()
    replay_dir.mkdir(parents=True, exist_ok=True)

    server_process = start_server(repo_root)

    try:
        wait_for_server(args.server_url, args.server_ready_timeout)
        exit_code = run_training(
            repo_root=repo_root,
            timesteps=args.timesteps,
            planner_mode=args.planner_mode,
            model=args.model,
            replay_dir=replay_dir,
        )
        if exit_code != 0:
            raise SystemExit(exit_code)
    finally:
        if server_process.poll() is None:
            server_process.terminate()
            try:
                server_process.wait(timeout=15)
            except subprocess.TimeoutExpired:
                server_process.kill()
                server_process.wait(timeout=5)


if __name__ == "__main__":
    main()
