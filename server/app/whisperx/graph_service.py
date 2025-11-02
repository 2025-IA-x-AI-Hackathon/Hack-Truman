"""
논증 그래프 분석 서비스
CLAIM과 FACT 간의 관계를 분석하여 그래프로 구성
"""

import re
import os
from typing import List, Tuple
# from google import genai
import google.generativeai as genai
from app.whisperx.schemas import (
    ClassifiedSegment, 
    GraphEdge, 
    ArgumentGraph,
    SentenceType
)
from app.whisperx.system_prompt import RELATIONSHIP_PROMPT

class ArgumentGraphService:
    def __init__(self, key):
        """그래프 분석 서비스 초기화"""
        self.client = genai.configure(api_key=key)
    
    def parse_classification_result(self, classification_text: str) -> SentenceType:
        """
        Gemini 분류 결과를 파싱하여 SentenceType 반환
        
        Args:
            classification_text: Gemini API 응답 텍스트
            
        Returns:
            SentenceType: 분류 결과
        """
        if 'CLAIM' in classification_text.upper():
            return SentenceType.CLAIM
        elif 'FACT' in classification_text.upper():
            return SentenceType.FACT
        else:
            return SentenceType.FACT  # 기본값
    
    async def analyze_relationship(self, segment1: ClassifiedSegment, segment2: ClassifiedSegment) -> Tuple[str, float]:
        """
        두 세그먼트 간의 관계 분석
        
        Args:
            segment1: 첫 번째 세그먼트
            segment2: 두 번째 세그먼트
            
        Returns:
            Tuple[str, float]: (관계 유형, 신뢰도)
        """
        try:
            prompt = f"""{RELATIONSHIP_PROMPT}

                문장 1 ({segment1.classification}): {segment1.text}
                문장 2 ({segment2.classification}): {segment2.text}

                두 문장 간의 관계를 분석해주세요.
            """

            response = self.client.models.generate_content(
                model=os.getenv("GEMINI_MODEL"),
                contents=prompt
            )
            
            # 응답 파싱
            result_text = response.text
            
            # 관계 추출
            relationship_match = re.search(r'관계:\s*(supports|contradicts|relates|none)', result_text)
            relationship = relationship_match.group(1) if relationship_match else "none"
            
            # 신뢰도 추출
            confidence_match = re.search(r'신뢰도:\s*([0-9.]+)', result_text)
            confidence = float(confidence_match.group(1)) if confidence_match else 0.5
            
            return relationship, confidence
            
        except Exception as e:
            print(f"관계 분석 오류: {e}")
            return "none", 0.0
    
    async def build_argument_graph(
        self, 
        segments: List[dict], 
        classification_results: List[str]
    ) -> ArgumentGraph:
        """
        세그먼트들과 분류 결과로부터 논증 그래프 구성
        
        Args:
            segments: 원본 세그먼트들
            classification_results: Gemini 분류 결과들
            
        Returns:
            ArgumentGraph: 구성된 논증 그래프
        """
        # 분류된 세그먼트 노드 생성
        nodes = []
        for i, (segment, classification_text) in enumerate(zip(segments, classification_results)):
            classification = self.parse_classification_result(classification_text)
            
            node = ClassifiedSegment(
                id=f"seg_{i+1}",
                start=segment.start,
                end=segment.end,
                text=segment.text,
                classification=classification
            )
            nodes.append(node)
        
        # 엣지 생성 (모든 노드 쌍에 대해 관계 분석)
        edges = []
        
        # 인접한 세그먼트들과 CLAIM-FACT 쌍들에 대해서만 관계 분석
        for i in range(len(nodes)):
            for j in range(i+1, min(i+3, len(nodes))):  # 최대 2개 뒤까지만 확인
                node1, node2 = nodes[i], nodes[j]
                
                # CLAIM과 FACT 간의 관계만 분석 (또는 인접한 세그먼트)
                should_analyze = (
                    (node1.classification != node2.classification) or  # 다른 타입
                    (j == i + 1)  # 인접한 세그먼트
                )
                
                if should_analyze:
                    relationship, confidence = await self.analyze_relationship(node1, node2)
                    
                    # 의미있는 관계만 엣지로 추가
                    if relationship != "none" and confidence > 0.3:
                        edge = GraphEdge(
                            source_id=node1.id,
                            target_id=node2.id,
                            relationship=relationship,
                            confidence=confidence
                        )
                        edges.append(edge)
        
        return ArgumentGraph(nodes=nodes, edges=edges)
    
    def generate_graph_summary(self, graph: ArgumentGraph) -> dict:
        """
        그래프 분석 요약 생성
        
        Args:
            graph: 논증 그래프
            
        Returns:
            dict: 분석 요약
        """
        claims = [node for node in graph.nodes if node.classification == SentenceType.CLAIM]
        facts = [node for node in graph.nodes if node.classification == SentenceType.FACT]
        
        # 관계 유형별 통계
        relationship_counts = {}
        for edge in graph.edges:
            relationship_counts[edge.relationship] = relationship_counts.get(edge.relationship, 0) + 1
        
        return {
            "total_segments": len(graph.nodes),
            "claims": len(claims),
            "facts": len(facts),
            "relationships": len(graph.edges),
            "relationship_types": relationship_counts,
            "avg_confidence": sum(edge.confidence for edge in graph.edges) / len(graph.edges) if graph.edges else 0.0
        }