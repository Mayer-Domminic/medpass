from pydantic import BaseModel, constr, confloat
from typing import Optional

class StudentBase(BaseModel):
    random_id: constr(min_length=1)
    cum_total_gpa: Optional[confloat(ge=0.0, le=4.0)] = None
    cum_bcpm_gpa: Optional[confloat(ge=0.0, le=4.0)] = None
    drop_year: Optional[int] = None
    grad_year: Optional[int] = None
    graduated: bool = False

class StudentCreate(StudentBase):
    net_id: constr(min_length=3, max_length=50)

class StudentUpdate(BaseModel):
    cum_total_gpa: Optional[confloat(ge=0.0, le=4.0)] = None
    cum_bcpm_gpa: Optional[confloat(ge=0.0, le=4.0)] = None
    drop_year: Optional[int] = None
    grad_year: Optional[int] = None
    graduated: Optional[bool] = None

class StudentInDBBase(StudentBase):
    net_id: str

    class Config:
        from_attributes = True

class StudentResponse(BaseModel):
    random_id: str
    net_id: str
    cum_total_gpa: Optional[float]
    cum_bcpm_gpa: Optional[float]
    drop_year: Optional[int]
    grad_year: Optional[int]
    graduated: bool

    class Config:
        orm_mode = True