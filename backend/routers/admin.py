from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from database import engine
from models import User
from auth import get_current_admin
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["admin"])

class RoleUpdate(BaseModel):
    role: str # "user" or "admin"

@router.put("/users/{user_id}/role")
def update_user_role(user_id: int, role_data: RoleUpdate, admin: User = Depends(get_current_admin)):
    with Session(engine) as session:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prevent removing own admin status (safety check) - optional but good practice
        if user.id == admin.id and role_data.role != "admin":
             # Allow but maybe warn? For now let's allow it but UI should handle care.
             pass

        user.role = role_data.role
        session.add(user)
        session.commit()
        session.refresh(user)
        return user

@router.delete("/users/{user_id}")
def delete_user(user_id: int, admin: User = Depends(get_current_admin)):
    with Session(engine) as session:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        session.delete(user)
        session.commit()
        return {"message": "User deleted successfully"}
