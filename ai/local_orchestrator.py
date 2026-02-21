from __future__ import annotations

import argparse
import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import chromadb
import instructor
import numpy as np
import outlines
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama import ChatOllama
from llama_index.core import Document, VectorStoreIndex
from llama_index.core.schema import TextNode
from llama_index.embeddings.ollama import OllamaEmbedding
from llama_index.llms.ollama import Ollama
from llama_index.vector_stores.chroma import ChromaVectorStore
from openai import OpenAI
from pydantic import BaseModel, Field
from sklearn.ensemble import IsolationForest


class EpisodeSummary(BaseModel):
    seed: int
    scenario_id: str = Field(alias="scenarioId")
    done_reason: str = Field(alias="doneReason")
    completion_percent: float
    completed_type_count: int
    score: int
    moves: int
    merges: int
    shatters: int
    total_reward: float


class NextActionPlan(BaseModel):
    mission: str
    scenario_id: str
    rationale: str
    focus_metrics: list[str]


@dataclass
class AnalyzerConfig:
    ollama_model: str = "qwen2.5:14b-instruct-q5_K_M"
    chroma_path: str = "./.bemerged-memory"
    chroma_collection: str = "bemerged-episodes"
    ollama_openai_base_url: str = "http://127.0.0.1:11434/v1"
    ollama_api_key: str = "ollama"


class BemergedEpisodeAnalyzer:
    def __init__(self, config: AnalyzerConfig):
        self.config = config
        self.chroma_client = chromadb.PersistentClient(path=config.chroma_path)
        self.chroma_collection = self.chroma_client.get_or_create_collection(config.chroma_collection)

    def _to_summary(self, replay_payload: dict[str, Any]) -> EpisodeSummary:
        summary = replay_payload.get("summary") or {}
        steps = replay_payload.get("steps") or []
        total_reward = float(sum(float(step.get("reward") or 0.0) for step in steps))

        payload = {
            "seed": int(replay_payload.get("seed") or 0),
            "scenarioId": str(replay_payload.get("scenarioId") or "objective-default"),
            "doneReason": str(replay_payload.get("doneReason") or "unknown"),
            "completion_percent": float(summary.get("completionPercent") or 0.0),
            "completed_type_count": int(summary.get("completedTypeCount") or 0),
            "score": int(summary.get("score") or 0),
            "moves": int(summary.get("moves") or 0),
            "merges": int(summary.get("merges") or 0),
            "shatters": int(summary.get("shatters") or 0),
            "total_reward": total_reward,
        }
        return EpisodeSummary.model_validate(payload)

    def ingest_replays(self, replay_paths: list[Path]) -> list[EpisodeSummary]:
        summaries: list[EpisodeSummary] = []

        for replay_path in replay_paths:
            raw = json.loads(replay_path.read_text(encoding="utf-8"))
            summary = self._to_summary(raw)
            summaries.append(summary)

            replay_id = f"{summary.scenario_id}:{summary.seed}:{replay_path.stem}"
            replay_text = (
                f"scenario={summary.scenario_id} seed={summary.seed} done={summary.done_reason} "
                f"completion={summary.completion_percent} completedTypes={summary.completed_type_count} "
                f"score={summary.score} moves={summary.moves} merges={summary.merges} "
                f"shatters={summary.shatters} totalReward={summary.total_reward}"
            )

            self.chroma_collection.upsert(
                ids=[replay_id],
                documents=[replay_text],
                metadatas=[summary.model_dump(by_alias=True)],
            )

        return summaries

    def detect_outliers(self, summaries: list[EpisodeSummary]) -> list[EpisodeSummary]:
        if len(summaries) < 4:
            return []

        feature_rows = np.array(
            [
                [
                    summary.completion_percent,
                    summary.score,
                    summary.moves,
                    summary.merges,
                    summary.shatters,
                    summary.total_reward,
                ]
                for summary in summaries
            ],
            dtype=np.float64,
        )

        detector = IsolationForest(random_state=1337, contamination="auto")
        labels = detector.fit_predict(feature_rows)
        return [summary for summary, label in zip(summaries, labels, strict=True) if label == -1]

    def build_retrieval_engine(self):
        vector_store = ChromaVectorStore(chroma_collection=self.chroma_collection)
        llm = Ollama(model=self.config.ollama_model, request_timeout=120.0)
        embed_model = OllamaEmbedding(
            model_name=self.config.ollama_model,
            base_url=self.config.ollama_openai_base_url.replace('/v1', ''),
        )

        docs = [
            Document(text=text)
            for text in (self.chroma_collection.get(include=["documents"]).get("documents") or [])
            if text
        ]

        if not docs:
            docs = [Document(text="No episodes indexed yet.")]

        nodes = [TextNode(text=doc.text) for doc in docs]
        try:
            index = VectorStoreIndex(nodes=nodes, vector_store=vector_store, embed_model=embed_model)
            return index.as_query_engine(llm=llm)
        except Exception:
            documents = [node.text for node in nodes]

            class _FallbackQueryEngine:
                def __init__(self, docs: list[str]):
                    self._docs = docs

                def query(self, query_text: str):
                    lowered = str(query_text or '').lower()
                    ranked = sorted(
                        self._docs,
                        key=lambda text: text.lower().count(lowered) if lowered else 0,
                        reverse=True,
                    )
                    return '\n'.join(ranked[:5]) if ranked else 'No indexed episode data.'

            return _FallbackQueryEngine(documents)

    @staticmethod
    def _extract_json_object(raw_text: str) -> dict[str, Any] | None:
        source = (raw_text or "").strip()
        if not source:
            return None

        decoder = json.JSONDecoder()
        for match in re.finditer(r"\{", source):
            try:
                parsed, _ = decoder.raw_decode(source[match.start() :])
            except json.JSONDecodeError:
                continue
            if isinstance(parsed, dict):
                return parsed
        return None

    @staticmethod
    def _default_focus_metrics() -> list[str]:
        return ["completionPercent", "completedTypeCount", "total_reward", "loopCount"]

    @staticmethod
    def _is_meaningful_mission(mission_text: str) -> bool:
        text = (mission_text or "").strip()
        if len(text) < 12:
            return False
        letter_count = sum(1 for char in text if char.isalpha())
        return letter_count >= 6

    @classmethod
    def _coerce_plan(
        cls,
        candidate: dict[str, Any],
        summaries: list[EpisodeSummary],
        outliers: list[EpisodeSummary],
        repair_note: str,
    ) -> NextActionPlan:
        scenario_id = str(candidate.get("scenario_id") or candidate.get("scenarioId") or "objective-default")
        fallback_mission = f"Run {scenario_id} in normal mode for 200 turns, then rerun in dev mode for targeted probes."
        mission_candidate = str(candidate.get("mission") or "")
        mission = mission_candidate if cls._is_meaningful_mission(mission_candidate) else fallback_mission

        focus_metrics_raw = candidate.get("focus_metrics") or candidate.get("focusMetrics")
        if isinstance(focus_metrics_raw, list):
            focus_metrics = [str(metric) for metric in focus_metrics_raw if str(metric).strip()]
        else:
            focus_metrics = []
        if not focus_metrics:
            focus_metrics = cls._default_focus_metrics()

        completion_avg = float(np.mean([s.completion_percent for s in summaries])) if summaries else 0.0
        rationale = str(
            candidate.get("rationale")
            or (
                f"{repair_note} Based on {len(summaries)} episodes, completion_avg={completion_avg:.2f}, "
                f"outlier_count={len(outliers)}."
            )
        )

        return NextActionPlan(
            mission=mission,
            scenario_id=scenario_id,
            rationale=rationale,
            focus_metrics=focus_metrics,
        )

    def _repair_plan_from_text(
        self,
        raw_text: str,
        summaries: list[EpisodeSummary],
        outliers: list[EpisodeSummary],
        repair_note: str,
    ) -> NextActionPlan | None:
        candidate = self._extract_json_object(raw_text)
        if not candidate:
            return None

        try:
            return NextActionPlan.model_validate(candidate)
        except Exception:
            return self._coerce_plan(candidate, summaries, outliers, repair_note=repair_note)

    def propose_next_plan_langchain(self, summaries: list[EpisodeSummary], outliers: list[EpisodeSummary]) -> NextActionPlan:
        llm = ChatOllama(model=self.config.ollama_model, temperature=0)
        structured_llm = llm.with_structured_output(NextActionPlan)

        completion_avg = float(np.mean([s.completion_percent for s in summaries])) if summaries else 0.0
        score_avg = float(np.mean([s.score for s in summaries])) if summaries else 0.0

        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are a deterministic BeMerged QA planner. "
                    "Primary objective is one 5-star copy for each module type. "
                    "Bonus objective: maximize shards and minimize elapsed turns. "
                    "In normal mode dev/testing controls are blocked; in dev mode they are allowed.",
                ),
                (
                    "human",
                    "Episode sample size: {count}. Average completion: {completion_avg:.2f}. "
                    "Average score: {score_avg:.2f}. Outlier count: {outlier_count}. "
                    "Return one concrete next mission.",
                ),
            ]
        )

        chain = prompt | structured_llm
        payload = {
            "count": len(summaries),
            "completion_avg": completion_avg,
            "score_avg": score_avg,
            "outlier_count": len(outliers),
        }
        try:
            return chain.invoke(payload)
        except Exception as first_error:
            repaired = self._repair_plan_from_text(
                str(first_error),
                summaries,
                outliers,
                repair_note="Recovered from malformed structured output.",
            )
            if repaired:
                return repaired

            retry_prompt = ChatPromptTemplate.from_messages(
                [
                    (
                        "system",
                        "Return strict JSON object only with keys: mission, scenario_id, rationale, focus_metrics. "
                        "No markdown, no prose.",
                    ),
                    (
                        "human",
                        "Episode sample size: {count}. Average completion: {completion_avg:.2f}. "
                        "Average score: {score_avg:.2f}. Outlier count: {outlier_count}. "
                        "Plan one next mission for BeMerged objective completion.",
                    ),
                ]
            )
            retry_message = llm.invoke(retry_prompt.format_messages(**payload))
            retry_text = getattr(retry_message, "content", "")
            repaired_retry = self._repair_plan_from_text(
                str(retry_text),
                summaries,
                outliers,
                repair_note="Recovered from malformed retry JSON output.",
            )
            if repaired_retry:
                return repaired_retry

            raise RuntimeError(
                "langchain planner failed and repair strategy could not recover output"
            ) from first_error

    def propose_next_plan_instructor(self, summaries: list[EpisodeSummary], outliers: list[EpisodeSummary]) -> NextActionPlan:
        completion_avg = float(np.mean([s.completion_percent for s in summaries])) if summaries else 0.0
        score_avg = float(np.mean([s.score for s in summaries])) if summaries else 0.0

        base_client = OpenAI(
            base_url=self.config.ollama_openai_base_url,
            api_key=self.config.ollama_api_key,
        )
        client = instructor.from_openai(base_client)

        response = client.chat.completions.create(
            model=self.config.ollama_model,
            response_model=NextActionPlan,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a BeMerged objective-focused QA planner. "
                        "Primary objective is one 5-star copy for each module type. "
                        "Bonus objective: maximize shards and reduce turns."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Episode count={len(summaries)}, completion_avg={completion_avg:.2f}, "
                        f"score_avg={score_avg:.2f}, outlier_count={len(outliers)}. "
                        "Return one actionable next mission."
                    ),
                },
            ],
            max_retries=2,
        )

        return response

    def propose_next_plan_outlines(self, summaries: list[EpisodeSummary], outliers: list[EpisodeSummary]) -> NextActionPlan:
        completion_avg = float(np.mean([s.completion_percent for s in summaries])) if summaries else 0.0
        score_avg = float(np.mean([s.score for s in summaries])) if summaries else 0.0

        model = outlines.models.openai(
            model_name=self.config.ollama_model,
            api_key=self.config.ollama_api_key,
            base_url=self.config.ollama_openai_base_url,
        )
        generator = outlines.generate.json(model, NextActionPlan)

        prompt = (
            "You are a BeMerged QA planner. "
            "Primary objective is one 5-star copy for each module type; "
            "bonus objective is maximize shards and reduce turns. "
            f"episode_count={len(summaries)} completion_avg={completion_avg:.2f} "
            f"score_avg={score_avg:.2f} outlier_count={len(outliers)}."
        )

        result = generator(prompt)
        if isinstance(result, NextActionPlan):
            return result
        return NextActionPlan.model_validate(result)


def collect_replay_paths(replay_dir: Path) -> list[Path]:
    return sorted(replay_dir.glob("*.json"))


def run_orchestration_pipeline(
    replay_dir: Path,
    config: AnalyzerConfig,
    query: str,
    planner_mode: str = "langchain",
) -> dict[str, Any]:
    analyzer = BemergedEpisodeAnalyzer(config)
    replay_paths = collect_replay_paths(replay_dir)
    summaries = analyzer.ingest_replays(replay_paths)
    outliers = analyzer.detect_outliers(summaries)

    query_engine = analyzer.build_retrieval_engine()
    retrieval_answer = query_engine.query(query)

    planner_mode_normalized = planner_mode.strip().lower()
    planner_error: str | None = None
    try:
        if planner_mode_normalized == "instructor":
            plan = analyzer.propose_next_plan_instructor(summaries, outliers)
        elif planner_mode_normalized == "outlines":
            plan = analyzer.propose_next_plan_outlines(summaries, outliers)
        else:
            plan = analyzer.propose_next_plan_langchain(summaries, outliers)
    except Exception as error:
        planner_error = str(error)
        plan = NextActionPlan(
            mission="Run objective-default in normal mode for 200 turns, then rerun in dev mode for targeted exploit probes.",
            scenario_id="objective-default",
            rationale="Planner backend returned invalid structured output; using deterministic fallback mission.",
            focus_metrics=["completionPercent", "completedTypeCount", "total_reward", "loopCount"],
        )

    return {
        "plannerMode": planner_mode_normalized,
        "plannerError": planner_error,
        "replayCount": len(replay_paths),
        "outlierCount": len(outliers),
        "outliers": [item.model_dump(by_alias=True) for item in outliers],
        "retrievalAnswer": str(retrieval_answer),
        "nextPlan": plan.model_dump(),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Run BeMerged local QA orchestration over replay files.")
    parser.add_argument("--replay-dir", required=True, help="Directory containing replay JSON files")
    parser.add_argument("--model", default="qwen2.5:14b-instruct-q5_K_M", help="Ollama model name")
    parser.add_argument("--query", default="What failure pattern appears most often?", help="Retrieval query")
    parser.add_argument(
        "--planner-mode",
        default=os.getenv("BEMERGED_PLANNER_MODE", "langchain"),
        choices=["langchain", "instructor", "outlines"],
        help="Structured planning backend",
    )
    args = parser.parse_args()

    replay_dir = Path(args.replay_dir)
    if not replay_dir.exists():
        raise FileNotFoundError(f"Replay directory not found: {replay_dir}")

    payload = run_orchestration_pipeline(
        replay_dir=replay_dir,
        config=AnalyzerConfig(ollama_model=args.model),
        query=args.query,
        planner_mode=args.planner_mode,
    )

    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
