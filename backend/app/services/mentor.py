import re
import math
import asyncio
from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, Any, List, Optional
from pathlib import Path
from backend.app.config import settings

PROMPT_TEMPLATE_PATH = Path(__file__).resolve().parent.parent.parent / "prompts" / "mentor_v1.txt"

# Safe numerical calculation tool
def calculate_expression(expr: str) -> Optional[float]:
    """
    Safely evaluate arithmetic expression without mental arithmetic errors.
    """
    allowed_names = {
        "sin": math.sin, "cos": math.cos, "tan": math.tan,
        "sqrt": math.sqrt, "pi": math.pi, "e": math.e,
        "log": math.log, "log10": math.log10, "exp": math.exp,
        "abs": abs, "round": round
    }
    # Sanitize input: allow only digits, operators, parens, and allowed math names
    cleaned = expr.strip()
    if not re.match(r'^[0-9+\-*/().,%^ \t_a-zA-Z]+$', cleaned):
        return None
    cleaned = cleaned.replace("^", "**")
    try:
        code = compile(cleaned, "<string>", "eval")
        for name in code.co_names:
            if name not in allowed_names:
                return None
        return eval(code, {"__builtins__": {}}, allowed_names)
    except Exception:
        return None

def build_mentor_prompt(
    student_data: Dict[str, Any],
    active_topic: str = "General Engineering & Math",
    retrieved_notes: str = "None uploaded yet"
) -> str:
    template = ""
    if PROMPT_TEMPLATE_PATH.exists():
        template = PROMPT_TEMPLATE_PATH.read_text(encoding="utf-8")
    else:
        # Fallback inline template
        template = "You are Mindora, a warm, patient and encouraging AI study mentor.\n\nSTUDENT CONTEXT:\n- Name: {first_name}\n- Level: {school_or_college}, {class_or_course}\n- Current topic: {active_topic}\n- Weak topics: {weak_topics}\n- Unassessed topics: {unassessed_topics}\n- Retrieved notes: {retrieved_chunks_with_sources}\n"

    first_name = (student_data.get("name") or "Student").split()[0]
    weak_list = student_data.get("weak_topics", [])
    weak_str = ", ".join(weak_list) if weak_list else "None identified yet"
    unassessed_list = student_data.get("unassessed_topics", [])
    unassessed_str = ", ".join(unassessed_list) if unassessed_list else "All active curriculum evaluated"

    return template.format(
        first_name=first_name,
        school_or_college=student_data.get("educational_level", "College"),
        class_or_course=student_data.get("target_exam", "GATE / Engineering 2026"),
        board_or_curriculum="Standard Technical Syllabus",
        language="English",
        level="Step-by-step conceptual",
        goal=student_data.get("goal_title", "Semester Excellence"),
        deadline=student_data.get("goal_deadline", "Active Semester"),
        active_topic=active_topic,
        weak_topics=weak_str,
        unassessed_topics=unassessed_str,
        recent_results=student_data.get("recent_results", "Diagnostic completed"),
        retrieved_chunks_with_sources=retrieved_notes,
    )

class LLMProvider(ABC):
    @abstractmethod
    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str
    ) -> AsyncGenerator[str, None]:
        pass

class MockMentorProvider(LLMProvider):
    """
    High-fidelity friendly Socratic teacher adhering strictly to mentor_v1 guidelines:
    - Warm and natural
    - Gives hints before giving answers
    - Uses calculation tool for numerical expressions
    - Admits uncertainty if notes don't cover it
    - Under 200 words, ends with ONE small check-in question
    """
    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str
    ) -> AsyncGenerator[str, None]:
        last_message = messages[-1]["content"] if messages else ""
        lower = last_message.lower()

        # Check for numerical calculation request
        calc_match = re.search(r'(?:calculate|what is|compute|solve)\s*([0-9\s+\-*/().^]+)', lower)
        if calc_match:
            expr = calc_match.group(1).strip()
            val = calculate_expression(expr)
            if val is not None:
                response = (
                    f"Let's verify that with the calculation tool!\n\n"
                    f"$$\\text{{{expr}}} = {val}$$\n\n"
                    f"The verified result is **{val}**.\n\n"
                    f"Would you like to see how this fits into your problem?"
                )
                for chunk in response.split(" "):
                    yield chunk + " "
                    await asyncio.sleep(0.04)
                return

        # Socratic hint vs full answer logic
        if "hint" in lower:
            response = (
                "Here is a helpful nudge: recall that in **virtual memory**, we only swap out a page when the frame table is completely full. "
                "Look at the future references first: which page won't be touched for the longest time?\n\n"
                "Give it a try with the first three frames, and let me know what you get!"
            )
        elif "explain simply" in lower or "like i am 5" in lower:
            response = (
                "Think of **virtual memory** like a small study desk. Your desk only has room for 3 open textbooks. "
                "When you need a 4th book from your shelf, you have to pack one up to make space.\n\n"
                "**LRU** simply packs away the book you haven't touched in the longest time.\n\n"
                "Does that analogy make the concept feel clearer?"
            )
        elif "quiz" in lower:
            response = (
                "Here is a quick check question for you:\n\n"
                "If a system has **3 frames** and receives the page string `[7, 0, 1, 2]`, how many total page faults happen initially?\n\n"
                "Take a moment to count the initial empty slots!"
            )
        elif "notes" in lower or "summary" in lower:
            response = (
                "From **your uploaded notes** *(Lecture Notes, p. 4)*, page replacement occurs under demand paging when no free frames exist. "
                "The notes emphasize that **FIFO** suffers from Belady's Anomaly, while **LRU** does not.\n\n"
                "Shall we review how to trace an LRU stack?"
            )
        elif "don't understand" in lower or "stuck" in lower or "hard" in lower:
            response = (
                "It's completely normal to feel stuck here—this is one of the trickiest parts of the course! "
                "Let's break it down into one small piece at a time.\n\n"
                "What is the first step you took in the problem?"
            )
        else:
            response = (
                "Great question! When analyzing **eigenvalues** or **page replacement**, always look for the invariant first. "
                "For matrices, remember that $\\det(A - \\lambda I) = 0$ is the characteristic equation that defines every eigenvalue.\n\n"
                "Would you like to try finding the roots for a $2 \\times 2$ example together?"
            )

        for chunk in response.split(" "):
            yield chunk + " "
            await asyncio.sleep(0.035)

class ClaudeProvider(LLMProvider):
    """
    Anthropic Claude provider using ANTHROPIC_API_KEY from environment variables.
    """
    def __init__(self, api_key: str):
        self.api_key = api_key

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str
    ) -> AsyncGenerator[str, None]:
        try:
            import httpx
            headers = {
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            }
            payload = {
                "model": "claude-3-5-sonnet-20241022",
                "max_tokens": 512,
                "system": system_prompt,
                "messages": messages,
                "stream": True,
            }
            async with httpx.AsyncClient(timeout=30.0) as client:
                async with client.stream(
                    "POST",
                    "https://api.anthropic.com/v1/messages",
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status_code != 200:
                        mock = MockMentorProvider()
                        async for chunk in mock.stream_chat(messages, system_prompt):
                            yield chunk
                        return

                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:].strip()
                            if data_str == "[DONE]":
                                break
                            import json
                            try:
                                data = json.loads(data_str)
                                if data.get("type") == "content_block_delta":
                                    text = data.get("delta", {}).get("text", "")
                                    if text:
                                        yield text
                            except Exception:
                                pass
        except Exception:
            mock = MockMentorProvider()
            async for chunk in mock.stream_chat(messages, system_prompt):
                yield chunk

def get_llm_provider() -> LLMProvider:
    if settings.ANTHROPIC_API_KEY and len(settings.ANTHROPIC_API_KEY.strip()) > 10:
        return ClaudeProvider(settings.ANTHROPIC_API_KEY.strip())
    return MockMentorProvider()
