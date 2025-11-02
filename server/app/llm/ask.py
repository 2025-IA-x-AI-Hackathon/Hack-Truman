# app/llm/router.py
import os, json, asyncio, httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class AskRequest(BaseModel):
    text: str

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

Verification Result: Classify as one of True / False / Opinion / Uncertain.

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


# ---------------- 공통 유틸 ---------------- #

def _calibrate_confidence(verdict: str, confidence: float) -> float:
    """
    판정이 확정(TRUE/FALSE)인데 confidence가 0 또는 너무 낮으면
    운영 최소치로 보정한다. (환경변수로 조정)
    """
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
    # 코드펜스 제거
    if txt.startswith("```"):
        lines = txt.splitlines()
        if lines and lines[0].lstrip("`").strip().lower().startswith("json"):
            txt = "\n".join(lines[1:])
        else:
            txt = "\n".join(lines[1:]) if len(lines) > 1 else ""
    # JSON 객체만 슬라이스
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
    # 대소문자 관용
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

# ---------------- Ollama ---------------- #

async def call_ollama(model_id: str, claim: str) -> dict:
    host_url = os.getenv("OLLAMA_HOST_URL")
    if not host_url:
        raise HTTPException(500, "OLLAMA_HOST_URL is not set")

    url = f"{host_url}/v1/chat/completions"
    body = {
        "model": model_id,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": "You are a factuality judge. Respond in JSON format."},
            {"role": "user", "content": JSON_PROMPT.format(claim=claim)}
        ],
        "temperature": 0.0,
        "max_tokens": 256
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(url, json=body)
        resp.raise_for_status()
        payload = resp.json()
        content = payload["choices"][0]["message"]["content"]
        if not content:
            raise ValueError("Empty response from Ollama")
        parsed = _safe_json(content)
        return _normalize_judgement(parsed)
    except httpx.HTTPStatusError as e:
        raise HTTPException(e.response.status_code, f"Ollama API error: {e.response.text}")
    except httpx.ConnectError:
        raise HTTPException(504, f"Failed to connect to Ollama server at {host_url}. Check Security Group and if Ollama is running.")
    except Exception as e:
        raise HTTPException(502, f"Ollama request error ({model_id}): {e}")

# ---------------- Google Gemini ---------------- #

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
            # ex) gemini-1.5-flash → gemini-1.5-flash-latest 로 자동 보정
            if not model_id.endswith("-latest"):
                return await _try_once(model_id + "-latest")
            raise
    except httpx.HTTPStatusError as e:
        raise HTTPException(e.response.status_code, f"Gemini API error: {e.response.text}")
    except Exception as e:
        raise HTTPException(502, f"Gemini request error ({model_id}): {e}")


# ---------------- Groq (OpenAI 호환) ---------------- #

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
            "max_tokens": 256,
            "response_format": {"type": "json_object"}
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, headers=headers, json=body)
        if resp.status_code == 400:
            # 모델 폐기 / 스펙 미스 등의 본문 분석
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
            # 권장 폴백 순서(무거운 → 가벼운)
# 기존 fallbacks = [...] 를 아래로 교체
            fallbacks = [
                "llama-3.3-70b-versatile",   # 권장
                "llama-3.1-8b-instant",      # 가벼운 대안(존재 시)
                "mixtral-8x7b-32768",        # 추가 대안(존재 시)
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


# ---------------- /ask 엔드포인트 ---------------- #

@router.post("/ask")
async def ask_llm(req: AskRequest):
    claim = (req.text or "").strip()
    if not claim:
        raise HTTPException(400, "text is required")

    # 환경변수에서 모델 읽기 (기본값 포함)
    ollama_model = os.getenv("OLLAMA_MODEL")
    gemini_model = os.getenv("GEMINI_MODEL") or "gemini-1.5-flash-latest"
    groq_model   = os.getenv("GROQ_MODEL")   or "llama-3.1-70b-versatile"

    tasks = []
    if ollama_model:
        tasks.append(asyncio.create_task(_wrap(f"ollama:{ollama_model}", call_ollama(ollama_model, claim))))
    else:
        # 필요 없다면 생략 가능
        pass

    # Gemini/Groq는 키가 있을 때만 호출
    if os.getenv("GEMINI_API_KEY"):
        tasks.append(asyncio.create_task(_wrap(f"gemini:{gemini_model}", call_gemini(gemini_model, claim))))
    if os.getenv("GROQ_API_KEY"):
        tasks.append(asyncio.create_task(_wrap(f"groq:{groq_model}", call_groq(groq_model, claim))))

    if not tasks:
        raise HTTPException(500, "No providers configured. Set OLLAMA_MODEL or GEMINI_API_KEY or GROQ_API_KEY")

    results = await asyncio.gather(*tasks)

    # 집계
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

    # 간단 설명: 패널 근거 2~3개만 합쳐 요약
    explanation = " | ".join(rationales[:3]) if rationales else "No rationale available."

    return {
        "query": claim,
        "verdict": final,
        "score": score,
        "explanation": explanation,
        "panel": results
    }
