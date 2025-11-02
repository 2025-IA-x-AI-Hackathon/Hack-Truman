import asyncio
import os
from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.whisperx.service import WhisperXService
from app.whisperx.graph_service import ArgumentGraphService
from app.whisperx.schemas import (
    STTRequest, 
    STTResponse, 
    STTWithGraphResponse,
    TranscriptionSegment
)
from app.whisperx.system_prompt import get_classification_prompt
import google.generativeai as genai
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
# 싱글톤 인스턴스 사용
key = os.getenv("GEMINI_API_KEY")
whisperx_service = WhisperXService.get_instance()
graph_service = ArgumentGraphService(key=key)

client = genai.configure(api_key=key)

async def get_classify_text(text: str):
    """
    텍스트를 주장/사실로 분류
    """
    try:
        system_prompt = get_classification_prompt()
        prompt = f"{system_prompt}\n\n분류할 텍스트:\n{text}"
        
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt
        )
        return response.text
    except Exception as e:
        print(f"분류 오류: {e}")
        return "분류 실패"

@router.post("/transcribe", response_model=STTResponse)
async def transcribe_audio(request: STTRequest):
    """
    오디오 파일을 텍스트로 변환하고 각 세그먼트를 분류
    """
    try:
        # 기존 STT 변환 파일 체크
        existing_result = exist_text_translate(request.file_path, request.language)
        
        if existing_result:
            # 기존 결과 사용
            result = existing_result
        else:
            # 새로 STT 변환 수행
            result: STTResponse = await whisperx_service.transcribe_audio(
                file_path=request.file_path,
                language=request.language
            )
            
            # 결과를 캐시에 저장
            from app.whisperx.cache_service import STTCacheService
            cache_service = STTCacheService()
            cache_service.save_result(request.file_path, request.language, result)
        
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"STT 변환 중 오류가 발생했습니다: {str(e)}"
        )

def exist_text_translate(file_path: str, language: str) -> Optional[STTResponse]:
    """
    기존 STT 변환 파일이 있는지 체크하고 있으면 해당 데이터 반환
    
    Args:
        file_path: 오디오 파일 경로
        language: 언어 코드
        
    Returns:
        Optional[STTResponse]: 기존 STT 결과 (없으면 None)
    """
    from app.whisperx.cache_service import STTCacheService
    
    cache_service = STTCacheService()
    
    # 캐시된 결과가 있는지 확인
    if cache_service.exists_cached_result(file_path, language):
        print(f"기존 STT 변환 파일 발견: {file_path}")
        cached_result = cache_service.get_cached_result(file_path, language)
        if cached_result:
            print("캐시된 STT 결과 사용")
            return cached_result
    
    print("기존 STT 변환 파일 없음 - 새로 변환 진행")
    return None

async def extract_transcribe_with_graph(result: STTResponse, segments: List[TranscriptionSegment]):
     # 각 세그먼트 분류
    classification_tasks = [get_classify_text(seg.text) for seg in segments]
    classification_results = await asyncio.gather(*classification_tasks)
    
    # 논증 그래프 구성
    argument_graph = await graph_service.build_argument_graph(
        segments, classification_results
    )
    
    # CLAIM-EVIDENCE 매핑 생성
    from app.whisperx.convert_claim_fact_mapped import (
        convert_to_claim_evidence, 
        get_claim_evidence_summary,
        format_claim_evidence_text
    )
    
    claim_evidence = convert_to_claim_evidence(argument_graph)
    claim_evidence_summary = get_claim_evidence_summary(argument_graph)
    claim_evidence_text = format_claim_evidence_text(argument_graph)
    
    # 결과 출력 (로깅용)
    # print("==== CLAIM-EVIDENCE 매핑 =====")
    # print(claim_evidence_text)
    
    # 분석 요약 생성
    summary = graph_service.generate_graph_summary(argument_graph)    
    # print("=== 논증 그래프 분석 결과 ===")
    # print(f"총 세그먼트: {summary['total_segments']}")
    # print(f"주장(CLAIM): {summary['claims']}")
    # print(f"사실(FACT): {summary['facts']}")
    # print(f"관계: {summary['relationships']}")
    # print(f"관계 유형: {summary['relationship_types']}")
    # print(f"평균 신뢰도: {summary['avg_confidence']:.2f}")
    
    # print("\n=== 그래프 노드 ===")
    # for node in argument_graph.nodes:
    #     print(f"{node.id} ({node.classification}): {node.text}")
    
    # print("\n=== 그래프 엣지 ===")
    # for edge in argument_graph.edges:
    #     print(f"{edge.source_id} --[{edge.relationship}({edge.confidence:.2f})]-> {edge.target_id}")

    # 요약에 CLAIM-EVIDENCE 정보 추가
    summary.update({
        "claim_evidence_mapping": claim_evidence,
        "claim_evidence_summary": claim_evidence_summary
    })
   
    return STTWithGraphResponse(
        full_text=result.full_text,
        argument_graph=argument_graph,
        summary=summary
    )

async def extract_with_graph(request) -> STTWithGraphResponse:
    try:
        segments: List[TranscriptionSegment] = request.segments
        return await extract_transcribe_with_graph(request, segments)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"STT + 그래프 분석 중 오류가 발생했습니다: {str(e)}"
        )
    
@router.post("/transcribe-with-graph", response_model=STTWithGraphResponse)
async def transcribe_with_graph(request: STTRequest):
    """
    오디오 파일을 텍스트로 변환하고 논증 그래프 생성
    """
    try:
        # 기존 STT 변환 파일 체크
        existing_result = exist_text_translate(request.file_path, request.language)
        
        if existing_result:
            # 기존 결과 사용
            result = existing_result
        else:
            # 새로 STT 변환 수행
            result: STTResponse = await whisperx_service.transcribe_audio(
                file_path=request.file_path,
                language=request.language
            )
            
            # 결과를 캐시에 저장
            from app.whisperx.cache_service import STTCacheService
            cache_service = STTCacheService()
            cache_service.save_result(request.file_path, request.language, result)
        
        segments: List[TranscriptionSegment] = result.segments
        return await extract_transcribe_with_graph(result, segments)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"STT + 그래프 분석 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/models/info")
async def get_models_info():
    """
    로드된 모델 정보 조회
    """
    try:
        info = whisperx_service.get_loaded_models_info()
        return info
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"모델 정보 조회 중 오류가 발생했습니다: {str(e)}"
        )

@router.get("/cache/info")
async def get_cache_info():
    """
    STT 캐시 정보 조회
    """
    try:
        from app.whisperx.cache_service import STTCacheService
        cache_service = STTCacheService()
        info = cache_service.get_cache_info()
        return info
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"캐시 정보 조회 중 오류가 발생했습니다: {str(e)}"
        )

@router.delete("/cache/clear")
async def clear_cache():
    """
    STT 캐시 모두 삭제
    """
    try:
        from app.whisperx.cache_service import STTCacheService
        cache_service = STTCacheService()
        success = cache_service.clear_cache()
        if success:
            return {"message": "Cache cleared successfully"}
        else:
            raise HTTPException(status_code=500, detail="캐시 삭제 실패")
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"캐시 삭제 중 오류가 발생했습니다: {str(e)}"
        )

@router.delete("/cleanup")
async def cleanup_models():
    """
    메모리에서 모델 정리
    """
    try:
        whisperx_service.cleanup_models()
        return {"message": "Models cleaned up successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"모델 정리 중 오류가 발생했습니다: {str(e)}"
        )