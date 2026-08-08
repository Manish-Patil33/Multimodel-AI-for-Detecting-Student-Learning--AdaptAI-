import json
import pandas as pd
from typing import Dict, List, Any
import numpy as np

class ContentProcessor:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.content_db = {}
        
    def load_educational_content(self, content_file: str):
        with open(content_file, 'r') as f:
            content_data = json.load(f)
        
        for content in content_data:
            content_id = content['id']
            self.content_db[content_id] = {
                'title': content['title'],
                'description': content.get('description', ''),
                'concepts': content['concepts'],
                'difficulty': content.get('difficulty', 0.5),
                'type': content.get('type', 'text'),
                'duration': content.get('duration', 300),
                'prerequisites': content.get('prerequisites', [])
            }
    
    def generate_sample_content(self):
        sample_content = [
            {
                'id': 'math_alg_101',
                'title': 'Foundations of Algebra & Equations',
                'description': 'Master variables, coefficients, and linear polynomial expressions.',
                'concepts': ['algebra'],
                'difficulty': 0.3,
                'type': 'video',
                'duration': 600,
                'prerequisites': []
            },
            {
                'id': 'math_lin_102',
                'title': 'Linear Equations & Systems',
                'description': 'Solve multi-variable linear equations and plot line slopes.',
                'concepts': ['linear_equations', 'algebra'],
                'difficulty': 0.45,
                'type': 'interactive',
                'duration': 450,
                'prerequisites': ['math_alg_101']
            },
            {
                'id': 'calc_der_201',
                'title': 'Single-Variable Calculus & Derivatives',
                'description': 'Understand rates of change, tangents, and derivative rules.',
                'concepts': ['derivatives', 'linear_equations'],
                'difficulty': 0.6,
                'type': 'animation',
                'duration': 500,
                'prerequisites': ['math_lin_102']
            },
            {
                'id': 'calc_pder_202',
                'title': 'Multivariable Calculus & Partial Derivatives',
                'description': 'Compute gradients, partial derivatives, and Jacobian matrices.',
                'concepts': ['partial_derivatives', 'derivatives'],
                'difficulty': 0.7,
                'type': 'text',
                'duration': 550,
                'prerequisites': ['calc_der_201']
            },
            {
                'id': 'ai_opt_301',
                'title': 'Gradient Descent & Convex Optimization',
                'description': 'Optimize loss functions using gradient descent algorithms.',
                'concepts': ['optimization', 'partial_derivatives'],
                'difficulty': 0.8,
                'type': 'interactive',
                'duration': 600,
                'prerequisites': ['calc_pder_202']
            },
            {
                'id': 'math_mat_203',
                'title': 'Matrix Algebra & Linear Transformations',
                'description': 'Matrix multiplication, dot products, eigenvalues, and vectors.',
                'concepts': ['matrix_operations', 'algebra'],
                'difficulty': 0.55,
                'type': 'video',
                'duration': 480,
                'prerequisites': ['math_alg_101']
            },
            {
                'id': 'ai_nn_401',
                'title': 'Deep Neural Networks & Backpropagation',
                'description': 'Build multi-layer perceptrons and apply backpropagation.',
                'concepts': ['neural_networks', 'optimization', 'matrix_operations'],
                'difficulty': 0.85,
                'type': 'interactive',
                'duration': 700,
                'prerequisites': ['ai_opt_301', 'math_mat_203']
            },
            {
                'id': 'stat_prob_103',
                'title': 'Probability & Bayes Theorem',
                'description': 'Conditional probability, random variables, and Bayesian inference.',
                'concepts': ['probability', 'algebra'],
                'difficulty': 0.5,
                'type': 'audio',
                'duration': 420,
                'prerequisites': ['math_alg_101']
            },
            {
                'id': 'cs_py_101',
                'title': 'Python Programming & Data Structures',
                'description': 'Master lists, dictionaries, functions, and algorithmic logic.',
                'concepts': ['python_basics'],
                'difficulty': 0.35,
                'type': 'interactive',
                'duration': 400,
                'prerequisites': []
            }
        ]
        
        for content in sample_content:
            self.content_db[content['id']] = content
        
        return sample_content
    
    def get_content_by_concept(self, concept: str) -> List[Dict[str, Any]]:
        matching_content = []
        for content_id, content_data in self.content_db.items():
            if concept in content_data['concepts']:
                matching_content.append(content_data)
        return matching_content
    
    def analyze_content_coverage(self, concepts: List[str]) -> Dict[str, List[str]]:
        coverage = {}
        for concept in concepts:
            coverage[concept] = []
            for content_id, content_data in self.content_db.items():
                if concept in content_data['concepts']:
                    coverage[concept].append(content_id)
        return coverage