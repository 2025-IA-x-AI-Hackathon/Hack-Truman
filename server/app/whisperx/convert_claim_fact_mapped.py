from app.whisperx.schemas import ArgumentGraph, SentenceType
from typing import Dict, List

def convert_to_claim_evidence(graph: ArgumentGraph) -> Dict[str, List[str]]:
    """
    ArgumentGraph를 CLAIM-EVIDENCE 매핑으로 변환
    
    Args:
        graph: 논증 그래프
        
    Returns:
        Dict[str, List[str]]: CLAIM ID를 키로 하고, 해당 CLAIM을 지지하는 FACT ID들의 리스트를 값으로 하는 딕셔너리
    """
    claim_evidence = {}
    
    # 노드 ID별 타입 매핑 생성
    node_types = {node.id: node.classification for node in graph.nodes}
    
    print(f"노드 타입 매핑: {node_types}")
    print(f"엣지 수: {len(graph.edges)}")
    
    # 엣지를 순회하며 CLAIM-FACT 관계 추출
    for edge in graph.edges:
        source_id = edge.source_id
        target_id = edge.target_id
        relationship = edge.relationship
        
        source_type = node_types.get(source_id)
        target_type = node_types.get(target_id)
        
        print(f"엣지: {source_id}({source_type}) --[{relationship}]-> {target_id}({target_type})")
        
        # supports 관계만 처리 (FACT가 CLAIM을 지지하는 경우)
        if relationship == "supports":
            if source_type == SentenceType.FACT and target_type == SentenceType.CLAIM:
                # FACT가 CLAIM을 지지
                claim_evidence.setdefault(target_id, []).append(source_id)
            elif source_type == SentenceType.CLAIM and target_type == SentenceType.FACT:
                # CLAIM이 FACT를 지지 (역방향 - 일반적이지 않지만 처리)
                claim_evidence.setdefault(source_id, []).append(target_id)
        
        # relates 관계도 처리 (관련성이 있는 경우)
        elif relationship == "relates":
            if source_type == SentenceType.FACT and target_type == SentenceType.CLAIM:
                claim_evidence.setdefault(target_id, []).append(source_id)
            elif source_type == SentenceType.CLAIM and target_type == SentenceType.FACT:
                claim_evidence.setdefault(source_id, []).append(target_id)
    
    print(f"CLAIM-EVIDENCE 매핑 결과: {claim_evidence}")
    return claim_evidence

def get_claim_evidence_summary(graph: ArgumentGraph) -> Dict:
    """
    CLAIM-EVIDENCE 관계 요약 정보 생성
    
    Args:
        graph: 논증 그래프
        
    Returns:
        Dict: 요약 정보
    """
    claim_evidence = convert_to_claim_evidence(graph)
    
    # CLAIM 노드들
    claims = [node for node in graph.nodes if node.classification == SentenceType.CLAIM]
    facts = [node for node in graph.nodes if node.classification == SentenceType.FACT]
    
    # 지지받는 CLAIM 수
    supported_claims = len([claim_id for claim_id, evidences in claim_evidence.items() if evidences])
    
    # 사용된 EVIDENCE 수
    used_evidences = len(set(evidence_id for evidences in claim_evidence.values() for evidence_id in evidences))
    
    return {
        "total_claims": len(claims),
        "total_facts": len(facts),
        "supported_claims": supported_claims,
        "unsupported_claims": len(claims) - supported_claims,
        "used_evidences": used_evidences,
        "unused_evidences": len(facts) - used_evidences,
        "claim_evidence_pairs": sum(len(evidences) for evidences in claim_evidence.values()),
        "claim_evidence_mapping": claim_evidence
    }

def format_claim_evidence_text(graph: ArgumentGraph) -> str:
    """
    CLAIM-EVIDENCE 관계를 텍스트로 포맷팅
    
    Args:
        graph: 논증 그래프
        
    Returns:
        str: 포맷팅된 텍스트
    """
    claim_evidence = convert_to_claim_evidence(graph)
    
    # 노드 ID별 텍스트 매핑
    node_texts = {node.id: node.text for node in graph.nodes}
    
    result = []
    result.append("=== CLAIM-EVIDENCE 관계 ===\n")
    
    for claim_id, evidence_ids in claim_evidence.items():
        claim_text = node_texts.get(claim_id, "Unknown")
        result.append(f"주장 ({claim_id}): {claim_text}")
        
        if evidence_ids:
            result.append("  지지 근거:")
            for evidence_id in evidence_ids:
                evidence_text = node_texts.get(evidence_id, "Unknown")
                result.append(f"    - ({evidence_id}): {evidence_text}")
        else:
            result.append("  지지 근거: 없음")
        
        result.append("")
    
    # 지지받지 못한 CLAIM들
    all_claim_ids = {node.id for node in graph.nodes if node.classification == SentenceType.CLAIM}
    unsupported_claims = all_claim_ids - set(claim_evidence.keys())
    
    if unsupported_claims:
        result.append("=== 지지받지 못한 주장들 ===")
        for claim_id in unsupported_claims:
            claim_text = node_texts.get(claim_id, "Unknown")
            result.append(f"주장 ({claim_id}): {claim_text}")
        result.append("")
    
    return "\n".join(result)