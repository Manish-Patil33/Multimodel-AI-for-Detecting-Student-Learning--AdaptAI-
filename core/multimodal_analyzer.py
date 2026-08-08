import re
import numpy as np
from typing import Dict, List, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer

class MultimodalGapDetector:
    """
    Multimodal AI Analyzer for Student Learning Gap Detection.
    Combines:
      1. Performance Metrics (quiz scores, concept accuracy)
      2. Behavioral Telemetry (engagement, time spent, focus index, learning style)
      3. Question NLP Analysis (student text questions mapped to prerequisite concept gaps)
      4. Assessment Error Patterns (classification into root error causes)
    """
    def __init__(self, concept_taxonomy: Dict[str, List[str]] = None):
        self.concept_keywords = {
            "algebra": ["equation", "variable", "solve for x", "coefficient", "polynomial", "linear", "quadratic"],
            "linear_equations": ["slope", "intercept", "graphing", "substitution", "elimination", "system of equations"],
            "derivatives": ["tangent", "rate of change", "slope of curve", "derivative", "dy/dx", "differentiate", "gradient"],
            "partial_derivatives": ["multivariable", "partial derivative", "gradient vector", "del", "jacobian", "hessian"],
            "optimization": ["local minima", "global maxima", "critical points", "gradient descent", "learning rate", "loss function"],
            "matrix_operations": ["dot product", "matrix multiplication", "eigenvalue", "eigenvector", "transpose", "determinant"],
            "neural_networks": ["backpropagation", "activation function", "weights", "biases", "layer", "forward pass"],
            "probability": ["bayes theorem", "conditional probability", "distribution", "random variable", "expectation", "variance"],
            "python_basics": ["loop", "function", "dictionary", "list comprehension", "class", "object", "recursion"]
        }
        
        self.prerequisites = {
            "linear_equations": ["algebra"],
            "derivatives": ["algebra", "linear_equations"],
            "partial_derivatives": ["derivatives"],
            "optimization": ["partial_derivatives", "derivatives"],
            "matrix_operations": ["algebra"],
            "neural_networks": ["optimization", "matrix_operations", "partial_derivatives"],
            "probability": ["algebra"]
        }
        
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self._fit_vectorizer()

    def _fit_vectorizer(self):
        corpus = [" ".join(keywords) for keywords in self.concept_keywords.values()]
        if corpus:
            self.vectorizer.fit(corpus)

    def analyze_multimodal_student_state(
        self,
        student_id: str,
        performance_data: Dict[str, float],
        behavior_data: Dict[str, Any],
        student_question: str = "",
        assessment_errors: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Fuses all 4 modalities to generate a holistic learning gap diagnosis & intervention plan.
        """
        assessment_errors = assessment_errors or []
        
        # 1. Performance Modality Analysis
        perf_gaps = {}
        for concept, score in performance_data.items():
            if score < 0.7:
                gap_severity = round(1.0 - score, 2)
                perf_gaps[concept] = gap_severity

        # 2. Behavioral Modality Analysis
        time_spent = behavior_data.get('time_spent', 300)
        focus_index = behavior_data.get('focus_index', 0.8)
        interaction_count = behavior_data.get('interaction_count', 5)
        learning_style = behavior_data.get('learning_style', 'visual')
        
        behavior_risk = 0.0
        if focus_index < 0.5:
            behavior_risk += 0.4
        if time_spent > 600 and max(performance_data.values(), default=1.0) < 0.6:
            behavior_risk += 0.4  # Frustration / struggle sign
        elif time_spent < 60 and max(performance_data.values(), default=1.0) < 0.5:
            behavior_risk += 0.3  # Rush / guess sign

        # 3. NLP Question & Doubt Modality Analysis
        nlp_detected_gaps = self._analyze_question_nlp(student_question) if student_question else {}

        # 4. Assessment Pattern Modality Analysis
        error_pattern_summary = self._analyze_error_patterns(assessment_errors)

        # 5. Composite Concept Gap & Root Cause Fusion
        all_concepts = set(performance_data.keys()).union(nlp_detected_gaps.keys())
        combined_gaps = {}

        for concept in all_concepts:
            p_score = performance_data.get(concept, 0.5)
            perf_gap = 1.0 - p_score
            nlp_gap = nlp_detected_gaps.get(concept, 0.0)
            
            # Weighted multi-modal fusion
            fused_gap = (perf_gap * 0.45) + (nlp_gap * 0.35) + (behavior_risk * 0.20)
            fused_gap = float(np.clip(fused_gap, 0.0, 1.0))
            
            if fused_gap > 0.35:
                combined_gaps[concept] = round(fused_gap, 2)

        # Identify Root Prerequisite Gaps
        root_gaps = self._identify_root_prerequisites(combined_gaps)

        # Generate Personalized Interventions
        interventions = self._generate_interventions(
            root_gaps, combined_gaps, learning_style, student_question, error_pattern_summary
        )

        return {
            "student_id": student_id,
            "detected_learning_style": learning_style,
            "overall_mastery_level": round(float(np.mean(list(performance_data.values()))) if performance_data else 0.5, 2),
            "behavior_status": {
                "focus_index": focus_index,
                "struggle_indicator": behavior_risk > 0.4,
                "learning_pace_type": "thorough" if time_spent > 450 else "fast"
            },
            "conceptual_gaps": combined_gaps,
            "root_prerequisite_gaps": root_gaps,
            "nlp_question_insights": {
                "question_analyzed": student_question,
                "detected_concepts": list(nlp_detected_gaps.keys())
            },
            "error_patterns": error_pattern_summary,
            "personalized_interventions": interventions
        }

    def _analyze_question_nlp(self, question: str) -> Dict[str, float]:
        """Uses keyword matching and text relevance to detect concept confusion from text."""
        q_lower = question.lower()
        concept_scores = {}
        
        for concept, keywords in self.concept_keywords.items():
            matches = sum(1 for kw in keywords if re.search(r'\b' + re.escape(kw) + r'\b', q_lower))
            if matches > 0:
                # Confusion words increase gap severity confidence
                confusion_words = ["why", "how", "don't get", "confused", "error", "stuck", "problem", "difficult", "what is"]
                confusion_boost = 0.3 if any(cw in q_lower for cw in confusion_words) else 0.1
                score = min(1.0, (matches * 0.35) + confusion_boost)
                concept_scores[concept] = score
                
        return concept_scores

    def _analyze_error_patterns(self, assessment_errors: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Categorizes quiz errors into root mistake types."""
        error_counts = {
            "foundational_gap": 0,
            "conceptual_misconception": 0,
            "calculation_error": 0,
            "memory_slip": 0
        }
        
        for err in assessment_errors:
            err_type = err.get("type", "conceptual_misconception")
            if err_type in error_counts:
                error_counts[err_type] += 1
            else:
                error_counts["conceptual_misconception"] += 1
                
        total_errors = sum(error_counts.values())
        primary_pattern = max(error_counts, key=error_counts.get) if total_errors > 0 else "None"
        
        return {
            "error_distribution": error_counts,
            "total_errors": total_errors,
            "primary_error_reason": primary_pattern
        }

    def _identify_root_prerequisites(self, concept_gaps: Dict[str, float]) -> List[Dict[str, Any]]:
        """Traces concept gaps back to root prerequisite weaknesses."""
        root_causes = []
        
        for concept, gap_severity in concept_gaps.items():
            prereqs = self.prerequisites.get(concept, [])
            blocking_prereqs = [p for p in prereqs if concept_gaps.get(p, 0.0) > 0.3]
            
            if blocking_prereqs:
                for bp in blocking_prereqs:
                    root_causes.append({
                        "target_concept": concept,
                        "root_prerequisite": bp,
                        "reason": f"Mastery of '{concept}' is blocked by foundational gap in '{bp}'",
                        "severity": max(gap_severity, concept_gaps.get(bp, 0.5))
                    })
            elif gap_severity > 0.5:
                root_causes.append({
                    "target_concept": concept,
                    "root_prerequisite": concept,
                    "reason": f"Direct conceptual difficulty in '{concept}'",
                    "severity": gap_severity
                })
                
        return root_causes

    def _generate_interventions(
        self,
        root_gaps: List[Dict[str, Any]],
        concept_gaps: Dict[str, float],
        learning_style: str,
        student_question: str,
        error_summary: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generates tailored multi-modal learning action items."""
        interventions = []
        
        target_concepts = list(concept_gaps.keys()) if concept_gaps else ["algebra"]
        
        for concept in target_concepts[:3]:
            format_recommendation = {
                "visual": "Interactive Animated Diagrams & Video Walkthroughs",
                "auditory": "Audio Explanations & Podcast-style Breakdowns",
                "kinesthetic": "Step-by-Step Hands-On Interactive Code Sandbox",
                "reading_writing": "Structured Concise Reading Guides & Formula Sheets"
            }.get(learning_style, "Multi-Modal Interactive Practice")
            
            ai_tutor_hint = f"Focus on understanding the core foundation of {concept.replace('_', ' ')}. "
            if student_question:
                ai_tutor_hint += f"Addressing your doubt: '{student_question[:60]}...'"
                
            interventions.append({
                "concept": concept,
                "gap_severity": concept_gaps.get(concept, 0.5),
                "recommended_format": format_recommendation,
                "title": f"Remedial Module: Mastering {concept.replace('_', ' ').title()}",
                "action_type": "remedial_lesson",
                "ai_tutor_guidance": ai_tutor_hint,
                "estimated_minutes": 15
            })
            
        return interventions
