import random
from typing import Dict, List, Any, Tuple

class QuizGenerator:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.question_bank = {}
        self._populate_default_question_bank()
        
    def _populate_default_question_bank(self):
        default_questions = {
            "algebra": [
                {
                    "id": "q_alg_1",
                    "question": "What is the value of x if 3x + 9 = 24?",
                    "options": ["x = 5", "x = 3", "x = 6", "x = 4"],
                    "correct_answer": "x = 5",
                    "concepts": ["algebra"],
                    "type": "text"
                },
                {
                    "id": "q_alg_2",
                    "question": "Which of the following represents a linear equation?",
                    "options": ["y = 2x + 5", "y = x^2 - 4", "y = 1/x", "y = 2^x"],
                    "correct_answer": "y = 2x + 5",
                    "concepts": ["algebra"],
                    "type": "text"
                }
            ],
            "linear_equations": [
                {
                    "id": "q_lin_1",
                    "question": "What is the slope of the line given by y = -4x + 7?",
                    "options": ["-4", "7", "4", "-7"],
                    "correct_answer": "-4",
                    "concepts": ["linear_equations"],
                    "type": "text"
                }
            ],
            "derivatives": [
                {
                    "id": "q_der_1",
                    "question": "What is the derivative of f(x) = 3x^2 + 5x?",
                    "options": ["6x + 5", "3x + 5", "6x^2", "5x"],
                    "correct_answer": "6x + 5",
                    "concepts": ["derivatives"],
                    "type": "text"
                }
            ],
            "partial_derivatives": [
                {
                    "id": "q_pder_1",
                    "question": "Find the partial derivative with respect to x of f(x, y) = x^2 * y + 3y.",
                    "options": ["2xy", "x^2 + 3", "2x + 3", "2xy + 3"],
                    "correct_answer": "2xy",
                    "concepts": ["partial_derivatives"],
                    "type": "text"
                }
            ],
            "optimization": [
                {
                    "id": "q_opt_1",
                    "question": "In gradient descent, what does a large learning rate cause?",
                    "options": ["Overshooting the minimum", "Faster exact convergence", "Zero gradient", "Vanishing weights"],
                    "correct_answer": "Overshooting the minimum",
                    "concepts": ["optimization"],
                    "type": "interactive"
                }
            ],
            "matrix_operations": [
                {
                    "id": "q_mat_1",
                    "question": "What are the dimensions of the matrix product A (2x3) and B (3x4)?",
                    "options": ["2x4", "3x3", "4x2", "Undefined"],
                    "correct_answer": "2x4",
                    "concepts": ["matrix_operations"],
                    "type": "text"
                }
            ],
            "neural_networks": [
                {
                    "id": "q_nn_1",
                    "question": "What algorithm calculates gradient of loss with respect to weights using chain rule?",
                    "options": ["Backpropagation", "Forward pass", "K-Means clustering", "PCA"],
                    "correct_answer": "Backpropagation",
                    "concepts": ["neural_networks"],
                    "type": "interactive"
                }
            ]
        }
        for concept, q_list in default_questions.items():
            self.add_questions(concept, q_list)

    def add_questions(self, concept: str, questions: List[Dict[str, Any]]):
        if concept not in self.question_bank:
            self.question_bank[concept] = []
        self.question_bank[concept].extend(questions)
    
    def generate_adaptive_quiz(self, student_profile: Dict[str, Any],
                             target_concepts: List[str],
                             num_questions: int = 10) -> List[Dict[str, Any]]:
        knowledge_state = student_profile.get('knowledge_state', {})
        learning_style = student_profile.get('learning_style', 'reading_writing')
        
        quiz_questions = []
        concept_weights = self.calculate_concept_weights(target_concepts, knowledge_state)
        
        for concept in target_concepts:
            weight = concept_weights.get(concept, 1.0)
            num_concept_questions = max(1, int(num_questions * weight))
            
            if concept in self.question_bank:
                available_questions = self.question_bank[concept]
                selected_questions = self.select_questions_by_style(
                    available_questions, learning_style, num_concept_questions
                )
                quiz_questions.extend(selected_questions)
        
        if len(quiz_questions) > num_questions:
            quiz_questions = random.sample(quiz_questions, num_questions)
        
        random.shuffle(quiz_questions)
        return quiz_questions
    
    def calculate_concept_weights(self, concepts: List[str], knowledge_state: Dict[str, float]) -> Dict[str, float]:
        weights = {}
        for concept in concepts:
            knowledge_level = knowledge_state.get(concept, 0)
            weights[concept] = 1.0 - knowledge_level
        return weights
    
    def select_questions_by_style(self, questions: List[Dict[str, Any]],
                                learning_style: str,
                                num_questions: int) -> List[Dict[str, Any]]:
        style_preferences = {
            'visual': ['diagram', 'image_based'],
            'auditory': ['audio_question', 'listening'],
            'kinesthetic': ['interactive', 'simulation'],
            'reading_writing': ['text', 'multiple_choice']
        }
        
        preferred_types = style_preferences.get(learning_style, ['multiple_choice'])
        
        preferred_questions = [q for q in questions if q.get('type') in preferred_types]
        other_questions = [q for q in questions if q.get('type') not in preferred_types]
        
        selected = preferred_questions[:num_questions]
        if len(selected) < num_questions:
            selected.extend(other_questions[:num_questions - len(selected)])
        
        return selected
    
    def evaluate_quiz_performance(self, quiz_questions: List[Dict[str, Any]],
                                student_answers: Dict[int, Any]) -> Dict[str, Any]:
        correct_count = 0
        concept_performance = {}
        total_questions = len(quiz_questions)
        
        for i, question in enumerate(quiz_questions):
            correct_answer = question.get('correct_answer')
            student_answer = student_answers.get(i)
            
            is_correct = student_answer == correct_answer
            if is_correct:
                correct_count += 1
            
            for concept in question.get('concepts', []):
                if concept not in concept_performance:
                    concept_performance[concept] = {'correct': 0, 'total': 0}
                concept_performance[concept]['total'] += 1
                if is_correct:
                    concept_performance[concept]['correct'] += 1
        
        overall_score = correct_count / total_questions if total_questions > 0 else 0
        
        concept_scores = {}
        for concept, stats in concept_performance.items():
            concept_scores[concept] = stats['correct'] / stats['total']
        
        return {
            'overall_score': overall_score,
            'concept_scores': concept_scores,
            'correct_answers': correct_count,
            'total_questions': total_questions,
            'weak_concepts': [c for c, s in concept_scores.items() if s < 0.6]
        }