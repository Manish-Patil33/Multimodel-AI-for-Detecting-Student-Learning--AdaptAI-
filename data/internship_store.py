import os
import json
import time
from typing import List, Dict, Any

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
FILE_PATH = os.path.join(DATA_DIR, "internships.json")

INITIAL_INTERNSHIPS = [
    {
        "id": "intern_001",
        "title": "AI & Multimodal Machine Learning Intern",
        "company": "EduAdapt AI Research Labs",
        "location": "Remote / Hybrid",
        "stipend": "₹25,000 / month",
        "deadline": "2026-09-30",
        "target_year": "All Years",
        "target_div": "All Divisions",
        "description": "Work alongside senior AI engineers to develop knowledge tracing, diagnostic models, and multimodal fusion algorithms for personalized education.",
        "apply_url": "https://careers.eduadapt.ai/internship/ai-ml",
        "posted_by": "Dr. Rajesh Sharma (HOD)",
        "timestamp": "2026-08-08 10:00"
    },
    {
        "id": "intern_002",
        "title": "Full-Stack Web Development Intern (FastAPI & React)",
        "company": "TechVision Systems",
        "location": "Pune / Remote",
        "stipend": "₹20,000 / month",
        "deadline": "2026-09-15",
        "target_year": "SY / TY",
        "target_div": "All Divisions",
        "description": "Assist in building high-performance scalable web interfaces, RESTful APIs, and real-time dashboard analytics using Python and modern JavaScript.",
        "apply_url": "https://techvision.io/careers/fullstack",
        "posted_by": "Prof. Sangeeta Verma (Faculty)",
        "timestamp": "2026-08-08 11:30"
    },
    {
        "id": "intern_003",
        "title": "Data Analyst & Educational Telemetry Intern",
        "company": "AnalyticsEdu Global",
        "location": "Mumbai",
        "stipend": "₹18,000 / month",
        "deadline": "2026-10-05",
        "target_year": "TY",
        "target_div": "Division A",
        "description": "Analyze student performance vectors, assessment trends, and behavioral telemetry to optimize learning pathways and class outcomes.",
        "apply_url": "mailto:careers@analyticsedu.org?subject=Internship%20Application",
        "posted_by": "Prof. Amit Kulkarni (Faculty)",
        "timestamp": "2026-08-08 14:15"
    }
]

class InternshipStore:
    def __init__(self, file_path: str = FILE_PATH):
        self.file_path = file_path
        self._ensure_file_exists()

    def _ensure_file_exists(self):
        if not os.path.exists(self.file_path):
            self.save_all(INITIAL_INTERNSHIPS)

    def get_all(self) -> List[Dict[str, Any]]:
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return INITIAL_INTERNSHIPS

    def save_all(self, items: List[Dict[str, Any]]):
        with open(self.file_path, "w", encoding="utf-8") as f:
            json.dump(items, f, indent=2, ensure_ascii=False)

    def create(self, item_data: Dict[str, Any]) -> Dict[str, Any]:
        items = self.get_all()
        new_id = f"intern_{int(time.time() * 1000)}"
        new_item = {
            "id": new_id,
            "title": item_data.get("title", "Untitled Internship"),
            "company": item_data.get("company", "Independent Organization"),
            "location": item_data.get("location", "Remote"),
            "stipend": item_data.get("stipend", "Negotiable"),
            "deadline": item_data.get("deadline", "2026-12-31"),
            "target_year": item_data.get("target_year", "All Years"),
            "target_div": item_data.get("target_div", "All Divisions"),
            "description": item_data.get("description", ""),
            "apply_url": item_data.get("apply_url", "#"),
            "posted_by": item_data.get("posted_by", "Faculty / HOD"),
            "timestamp": time.strftime("%Y-%m-%d %H:%M")
        }
        items.insert(0, new_item)
        self.save_all(items)
        return new_item

    def delete(self, item_id: str) -> bool:
        items = self.get_all()
        filtered = [i for i in items if i.get("id") != item_id]
        if len(filtered) < len(items):
            self.save_all(filtered)
            return True
        return False

# Singleton instance
internship_store = InternshipStore()
