import sys
import os
from typing import Dict, List, Any
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from core.student_model import StudentModel
from core.content_recommender import ContentRecommender
from core.learning_optimizer import LearningOptimizer
from core.multimodal_analyzer import MultimodalGapDetector
from data.content_processor import ContentProcessor
from data.student_analyzer import StudentAnalyzer
from assessment.quiz_generator import QuizGenerator
from assessment.progress_tracker import ProgressTracker
from api.endpoints import EduAdaptAPI
from utils.config import Config

class EduAdaptPlatform:
    def __init__(self, config_path: str = "configs/default.yaml"):
        self.config = Config(config_path)
        
        self.student_model = StudentModel(self.config.get('student_model', {}))
        self.content_recommender = ContentRecommender(self.config.get('content', {}))
        self.learning_optimizer = LearningOptimizer(self.config.get('optimization', {}))
        self.content_processor = ContentProcessor(self.config.get('content', {}))
        self.student_analyzer = StudentAnalyzer(self.config.get('students', {}))
        self.quiz_generator = QuizGenerator(self.config.get('assessment', {}))
        self.progress_tracker = ProgressTracker(self.config.get('progress', {}))
        self.multimodal_analyzer = MultimodalGapDetector()
        
        self.initialize_platform()
    
    def initialize_platform(self):
        print("[EduAdapt AI] Initializing platform components...")
        
        sample_content = self.content_processor.generate_sample_content()
        for content in sample_content:
            self.content_recommender.add_content(content['id'], content)
        
        self.content_recommender.fit_content_vectors()
        
        concepts = set()
        for content in sample_content:
            concepts.update(content['concepts'])
        
        self.student_model.concept_mapping = {concept: idx for idx, concept in enumerate(concepts)}
        self.student_model.initialize_knowledge_tracer(len(concepts))
        
        state_size = len(concepts) + 4
        action_size = len(sample_content)
        self.learning_optimizer.initialize_agent(state_size, action_size)
        
        # Pre-seed a sample student profile
        default_interaction = {
            'concepts': ['algebra', 'linear_equations'],
            'performance': 0.75,
            'content_type': 'video',
            'time_spent': 400
        }
        self.student_model.update_student_profile("student_001", default_interaction)
        self.progress_tracker.record_learning_session("student_001", default_interaction)
        
        print(f"[EduAdapt AI] Platform initialized with {len(concepts)} concepts and {len(sample_content)} educational modules.")

    def run_multimodal_diagnosis(
        self,
        student_id: str,
        performance_data: Dict[str, float],
        behavior_data: Dict[str, Any],
        student_question: str = "",
        assessment_errors: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        diagnosis = self.multimodal_analyzer.analyze_multimodal_student_state(
            student_id=student_id,
            performance_data=performance_data,
            behavior_data=behavior_data,
            student_question=student_question,
            assessment_errors=assessment_errors or []
        )
        
        # Update student profile with diagnosis findings
        session_record = {
            'concepts': list(performance_data.keys()),
            'performance': diagnosis.get('overall_mastery_level', 0.5),
            'content_type': behavior_data.get('learning_style', 'visual'),
            'time_spent': behavior_data.get('time_spent', 300)
        }
        self.student_model.update_student_profile(student_id, session_record)
        self.progress_tracker.record_learning_session(student_id, session_record)
        
        return diagnosis

    def get_personalized_recommendations(
        self,
        student_id: str,
        target_concepts: List[str],
        max_recommendations: int = 5
    ) -> List[Dict[str, Any]]:
        knowledge_gaps = self.student_model.get_student_knowledge_gap(student_id, target_concepts)
        
        if student_id in self.student_model.student_profiles:
            student_profile = self.student_model.student_profiles[student_id]
        else:
            student_profile = {
                'learning_style': 'visual',
                'engagement_level': 0.6,
                'learning_pace': 1.0
            }
        
        recommendations = self.content_recommender.recommend_content(
            student_profile, knowledge_gaps, max_recommendations
        )
        return recommendations

    def generate_adaptive_quiz(
        self,
        student_id: str,
        target_concepts: List[str],
        num_questions: int = 5
    ) -> List[Dict[str, Any]]:
        profile = self.student_model.student_profiles.get(student_id, {
            'knowledge_state': {},
            'learning_style': 'visual'
        })
        return self.quiz_generator.generate_adaptive_quiz(
            profile, target_concepts, num_questions
        )

    def evaluate_and_record_quiz(
        self,
        student_id: str,
        quiz_questions: List[Dict[str, Any]],
        student_answers: Dict[int, Any]
    ) -> Dict[str, Any]:
        result = self.quiz_generator.evaluate_quiz_performance(quiz_questions, student_answers)
        self.progress_tracker.record_assessment_result(student_id, result)
        
        # Update knowledge state for concepts in quiz
        for concept, score in result.get('concept_scores', {}).items():
            self.student_model.update_student_profile(student_id, {
                'concepts': [concept],
                'performance': score,
                'time_spent': 180
            })
            
        return result

    def record_learning_session(self, student_id: str, session_data: Dict[str, Any]):
        self.student_model.update_student_profile(student_id, session_data)
        self.progress_tracker.record_learning_session(student_id, session_data)

    def get_student_progress(self, student_id: str) -> Dict[str, Any]:
        insights = self.progress_tracker.get_student_insights(student_id)
        if student_id in self.student_model.student_profiles:
            student_profile = self.student_model.student_profiles[student_id]
            # Convert numpy array in profile if present to list for json serialization
            clean_profile = dict(student_profile)
            if isinstance(clean_profile.get('knowledge_state'), (list, tuple)) or hasattr(clean_profile.get('knowledge_state'), 'tolist'):
                clean_profile['knowledge_state'] = clean_profile['knowledge_state'].tolist()
            insights['current_profile'] = clean_profile
        return insights

def main():
    platform = EduAdaptPlatform()
    print("[EduAdapt AI] Starting API and Dashboard Web Server...")
    api = EduAdaptAPI(platform)
    print("-------------------------------------------------------------------")
    print("  EduAdapt Multimodal AI is ready!")
    print("  Dashboard Web App: http://localhost:8000")
    print("  Health Endpoint:   http://localhost:8000/health/")
    print("-------------------------------------------------------------------")
    api.run(host="0.0.0.0", port=8000)

if __name__ == "__main__":
    main()
