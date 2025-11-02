import os, json, asyncio, httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv(usecwd=True), override=True)

router = APIRouter()

# ---------------- 입력 스키마 (변경됨) ---------------- #
class Node(BaseModel):
    id: str
    start: float | None = None
    end: float | None = None
    text: str
    classification: str = Field(..., description="e.g., FACT / CLAIM / OPINION ...")

class ArgumentGraph(BaseModel):
    nodes: list[Node]
    edges: list[dict] | None = []

class AskRequest(BaseModel):
    argument_graph: ArgumentGraph


# ---------------- 프롬프트/유틸 (기존 유지) ---------------- #
JSON_PROMPT = """You are a factuality judge.
Return STRICT JSON ONLY with keys: verdict, confidence, rationale.
[Input Format]

Provide the URL of the YouTube Shorts video and, if possible, the video transcript (captions or manually transcribed text).

[Role]

You act as an “Information Verification Expert.”

Your purpose is to prevent harm from misinformation, and your judgment must rely solely on credible, official sources (e.g., government agencies, international organizations, major news outlets, peer-reviewed academic papers).

[Goal]

For each distinct claim made in the video (by sentence or logical unit), perform the following tasks:

Summary: Condense the claim into one clear sentence.

Verification Result: Classify as one of True / False / claim / Uncertain.

Detailed Evidence: Provide the supporting source(s) — including source name, title of the document/article, publication date, and link — and summarize the evidence in no more than two sentences.

Credibility Score (0–100): Assign a score based on the number and authority of sources, and briefly describe the scoring logic.

Recommended Message: Write a short, plain-language summary (1–2 sentences) suitable for explaining to an elderly person — empathetic and easy to understand.

[Permitted Sources (Examples)]

Government and public agencies (e.g., CDC, Ministry of Health and Welfare)

International organizations (e.g., WHO, UN)

Major domestic or international news outlets (e.g., KBS, YTN, Reuters, BBC, The New York Times)

Peer-reviewed academic journals or papers

Exclude blogs, social media posts, and personal websites unless no official records exist. In that case, mark the result as “Uncertain.”

[Verification Procedure]

Break down the video into individual claims.

Extract keywords / core sentences.

Search for approved, authoritative sources (preferably within the last 5 years).

Collect and summarize evidence.

Record classification, evidence, credibility, and public-friendly summary.

[Output Format]

Translate all the contents into Korean, return STRICT JSON ONLY with keys: verdict, confidence, rationale.

[Cautions]

Do not disclose any personal or private information.

For medical or legal guidance, simply note: “Consult a qualified professional is recommended.”

CLAIM: {claim}
"""

def _calibrate_confidence(verdict: str, confidence: float) -> float:
    try:
        floor_val = float(os.getenv("MIN_CONFIDENCE_FOR_DECISION", "0"))
    except Exception:
        floor_val = 0.0
    if verdict in ("TRUE", "FALSE"):
        if confidence is None or confidence <= 0.0:
            return max(floor_val, 0.0)
    return max(0.0, min(1.0, confidence))

def _safe_json(s: str) -> dict:
    if not isinstance(s, str):
        raise HTTPException(500, f"Model returned non-text payload: {type(s)}")
    txt = s.strip()
    if txt.startswith("```"):
        lines = txt.splitlines()
        if lines and lines[0].lstrip("`").strip().lower().startswith("json"):
            txt = "\n".join(lines[1:])
        else:
            txt = "\n".join(lines[1:]) if len(lines) > 1 else ""
    a, b = txt.find("{"), txt.rfind("}")
    candidate = txt[a:b+1] if (a >= 0 and b > a) else txt
    try:
        data = json.loads(candidate)
    except Exception:
        cleaned = candidate.strip("\ufeff \n\r\t")
        data = json.loads(cleaned)
    if not isinstance(data, dict):
        raise HTTPException(500, f"Model JSON is not an object: {type(data)}")
    return data

def _normalize_judgement(data: dict) -> dict:
    lower = {str(k).strip().lower(): v for k, v in data.items()}
    verdict = lower.get("verdict", "UNCERTAIN")
    confidence = lower.get("confidence", 0)
    rationale = lower.get("rationale", "")
    if isinstance(verdict, str):
        verdict = verdict.strip().upper()
    else:
        verdict = "UNCERTAIN"
    try:
        confidence = float(confidence)
    except Exception:
        confidence = 0.0
    confidence = max(0.0, min(1.0, confidence))
    if verdict not in ("TRUE", "FALSE", "UNCERTAIN"):
        verdict = "UNCERTAIN"
    confidence = _calibrate_confidence(verdict, confidence)
    return {"verdict": verdict, "confidence": confidence, "rationale": str(rationale)}

async def _wrap(provider_name: str, coro):
    try:
        out = await coro
        return {"provider": provider_name, **out}
    except HTTPException as he:
        return {"provider": provider_name, "error": he.detail}
    except Exception as e:
        return {"provider": provider_name, "error": str(e)}

# ---------------- 모델 호출 (기존 유지) ---------------- #
async def call_openai(model_id: str, claim: str) -> dict:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(500, "OPENAI_API_KEY is not set")

    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    body = {
        "model": model_id,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": "You are a factuality judge. Respond in JSON format."},
            {"role": "user", "content": JSON_PROMPT.format(claim=claim)}
        ],
        "temperature": 0.0,
        "max_tokens": 1024
    }

    try:
        async with httpx.AsyncClient(timeout=120.0, trust_env=False) as client:
            resp = await client.post(url, headers=headers, json=body)
        resp.raise_for_status()
        payload = resp.json()
        content = payload["choices"][0]["message"]["content"]
        if not content:
            raise ValueError("Empty response from OpenAI")
        parsed = _safe_json(content)
        return _normalize_judgement(parsed)
    except httpx.HTTPStatusError as e:
        raise HTTPException(e.response.status_code, f"OpenAI API error: {e.response.text}")
    except httpx.ConnectError:
        raise HTTPException(504, "Failed to connect to OpenAI API.")
    except Exception as e:
        raise HTTPException(502, f"OpenAI request error ({model_id}): {e}")

async def call_gemini(model_id: str, claim: str) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(500, "GEMINI_API_KEY is not set")

    async def _try_once(mid: str):
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{mid}:generateContent?key={api_key}"
        body = {
            "contents": [{"role": "user", "parts": [{"text": JSON_PROMPT.format(claim=claim)}]}],
            "generationConfig": {"responseMimeType": "application/json"},
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, json=body)
        if resp.status_code == 404:
            raise KeyError("NOT_FOUND")
        resp.raise_for_status()
        data = resp.json()
        parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
        if not parts or not parts[0].get("text"):
            raise HTTPException(502, f"Gemini empty response: {data}")
        return _normalize_judgement(_safe_json(parts[0]["text"]))

    try:
        try:
            return await _try_once(model_id)
        except KeyError:
            if not model_id.endswith("-latest"):
                return await _try_once(model_id + "-latest")
            raise
    except httpx.HTTPStatusError as e:
        raise HTTPException(e.response.status_code, f"Gemini API error: {e.response.text}")
    except Exception as e:
        raise HTTPException(502, f"Gemini request error ({model_id}): {e}")

async def call_groq(model_id: str, claim: str) -> dict:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(500, "GROQ_API_KEY is not set")

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    async def _try_once(mid: str):
        body = {
            "model": mid,
            "messages": [
                {"role": "system", "content": "You are a factuality judge. Respond in JSON."},
                {"role": "user", "content": JSON_PROMPT.format(claim=claim)}
            ],
            "temperature": 0.0,
            "max_tokens": 1024,
            "response_format": {"type": "json_object"}
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, headers=headers, json=body)
        if resp.status_code == 400:
            try:
                err = resp.json().get("error", {})
                if err.get("code") in ("model_decommissioned", "model_not_found"):
                    raise KeyError(err.get("code"))
            except Exception:
                pass
        resp.raise_for_status()
        payload = resp.json()
        content = payload["choices"][0]["message"]["content"]
        if not content:
            raise HTTPException(502, f"Groq empty response: {payload}")
        return _normalize_judgement(_safe_json(content))

    try:
        try:
            return await _try_once(model_id)
        except KeyError:
            fallbacks = [
                "llama-3.3-70b-versatile",
                "llama-3.1-8b-instant",
                "mixtral-8x7b-32768",
            ]
            for alt in fallbacks:
                try:
                    return await _try_once(alt)
                except KeyError:
                    continue
            raise HTTPException(502, f"Groq model decommissioned and no fallback available for: {model_id}")
    except httpx.HTTPStatusError as e:
        raise HTTPException(e.response.status_code, f"Groq API error: {e.response.text}")
    except Exception as e:
        raise HTTPException(502, f"Groq request error ({model_id}): {e}")


# ---------------- 결과 구성/소켓 전송 ---------------- #
def _build_output_entry(node: Node, score: float, explanation: str) -> dict:
    """
    원하는 OUTPUT 스펙으로 변환:
    {
      trustScore: 88,
      id: "seg_1",
      reasoning: "...",
      references: [...]
    }
    """
    return {
        "trustScore": int(round(max(0.0, min(1.0, score)) * 100)),
        "id": node.id,
        "reasoning": explanation or "",
        "references": []  # 현재 모델 응답 포맷에서는 근거 출처 링크를 직접적으로 받지 않으므로 빈 배열
    }

async def _judge_once(claim: str) -> tuple[str, float, str, list[dict]]:
    """
    기존 패널 합의 로직을 그대로 재사용해 단일 claim에 대한
    최종 verdict, score, explanation, raw panel을 반환
    """
    openai_model = os.getenv("OPENAI_MODEL") or "gpt-4o-mini"
    gemini_model = os.getenv("GEMINI_MODEL") or "gemini-1.5-flash-latest"
    groq_model   = os.getenv("GROQ_MODEL")   or "llama-3.1-70b-versatile"

    tasks = []
    if os.getenv("OPENAI_API_KEY"):
        tasks.append(asyncio.create_task(_wrap(f"openai:{openai_model}", call_openai(openai_model, claim))))
    if os.getenv("GEMINI_API_KEY"):
        tasks.append(asyncio.create_task(_wrap(f"gemini:{gemini_model}", call_gemini(gemini_model, claim))))
    if os.getenv("GROQ_API_KEY"):
        tasks.append(asyncio.create_task(_wrap(f"groq:{groq_model}", call_groq(groq_model, claim))))

    if not tasks:
        raise HTTPException(500, "No providers configured. Set OPENAI_API_KEY or GEMINI_API_KEY or GROQ_API_KEY")

    results = await asyncio.gather(*tasks)

    counts = {"TRUE": 0, "FALSE": 0, "UNCERTAIN": 0}
    confs = []
    rationales = []
    for r in results:
        if "error" in r:
            continue
        v = r.get("verdict", "UNCERTAIN").upper()
        counts[v] += 1
        try:
            confs.append(float(r.get("confidence", 0)))
        except:
            pass
        if r.get("rationale"):
            rationales.append(f"[{r.get('provider')}] {r.get('rationale')}")

    final = max(counts.items(), key=lambda kv: (kv[1], kv[0] == "UNCERTAIN"))[0]
    score = round(sum(confs) / max(len(confs), 1), 3)
    explanation = " | ".join(rationales[:3]) if rationales else "No rationale available."
    return final, score, explanation, results

async def _emit_to_socket(payload: dict) -> dict:
    """
    1) HTTP POST 우선 시도 (기본: http://localhost:5174/api/socket)
    2) 실패 시 websockets로 ws://localhost:5173 전송 시도
    """
    post_url = os.getenv("SOCKET_POST_URL", "http://localhost:5174/api/socket")
    ws_url   = os.getenv("SOCKET_WS_URL", "ws://localhost:5174")

    sent_via = None
    last_error = None

    # Try HTTP POST
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(post_url, json=payload)
        if 200 <= resp.status_code < 300:
            sent_via = f"HTTP:{post_url}"
            return {"sent": True, "via": sent_via}
        last_error = f"HTTP status {resp.status_code}"
    except Exception as e:
        last_error = f"HTTP error: {e}"

    # Try WebSocket (optional)
    try:
        import websockets  # type: ignore
        async with websockets.connect(ws_url, max_size=10_000_000) as ws:
            await ws.send(json.dumps(payload, ensure_ascii=False))
            sent_via = f"WS:{ws_url}"
            return {"sent": True, "via": sent_via}
    except Exception as e:
        if last_error:
            last_error += f" | WS error: {e}"
        else:
            last_error = f"WS error: {e}"

    return {"sent": False, "via": None, "error": last_error}


class AskRequest(BaseModel):
    # 새로 추가: text(레거시 입력)도 허용
    text: str | None = None
    argument_graph: ArgumentGraph | None = None

@router.post("/ask")
async def ask_llm(req: AskRequest):
    # 1) 신규 포맷 정상 케이스
    ag = req.argument_graph

    # 2) 레거시 포맷(text 안에 JSON 문자열)
    if ag is None and req.text:
        try:
            maybe = json.loads(req.text)
            if not isinstance(maybe, dict) or "argument_graph" not in maybe:
                raise ValueError("`text`에 argument_graph가 없습니다.")
            ag = ArgumentGraph(**maybe["argument_graph"])
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"레거시 입력 파싱 실패: {e}. "
                       "body에 {\"argument_graph\": {...}} 형식으로 보내거나, "
                       "text에는 해당 JSON을 정확히 넣어주세요."
            )

    if ag is None or not ag.nodes:
        raise HTTPException(
            status_code=400,
            detail="argument_graph.nodes 가 비어있습니다. "
                   "최상위에 {\"argument_graph\": {\"nodes\": [...], \"edges\": []}} 형태로 보내주세요."
        )

    nodes = ag.nodes

    # 이하 기존 로직 동일 -------------------------
    result_map: dict[str, dict] = {}
    per_node_debug: dict[str, dict] = {}

    for idx, node in enumerate(nodes, start=1):
        cls = (node.classification or "").strip().upper()
        key_prefix = "fact" if cls == "FACT" else "claim"
        out_key = f"{key_prefix}_{idx}"

        final, score, explanation, panel = await _judge_once(node.text)

        result_map[out_key] = _build_output_entry(node, score, explanation)
        per_node_debug[out_key] = {
            "node_id": node.id,
            "classification": cls,
            "model_verdict": final,
            "model_score_mean": score,
            "panel": panel
        }

    payload_for_socket = result_map
    socket_report = await _emit_to_socket(payload_for_socket)

    return {
        "ok": True,
        "sent_to_socket": socket_report,
        "result": result_map,
        # "debug": per_node_debug
    }
