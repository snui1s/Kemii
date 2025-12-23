from fastapi import APIRouter
from skills_data import DEPARTMENTS

router = APIRouter()

@router.get("/skills")
def get_skills():
    """Get all skill departments and skills"""
    return {"departments": DEPARTMENTS}
