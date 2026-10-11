from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=70, description="Full Name of the student")
    email: EmailStr = Field(..., description="Valid student email address")
    password: str = Field(..., min_length=10, max_length=128, description="Password (at least 10 characters)")
    confirm_password: str = Field(..., min_length=10, max_length=128)
    educational_level: Literal["School", "College"] = Field("College", description="School or College level")
    age_range: str = Field(..., description="Age range or Birth date (e.g. 'Under 13', '13-17', '18-22', '23+')")
    guardian_email: Optional[EmailStr] = None
    consent_given: bool = Field(..., description="Consent checkbox for Terms and Privacy Policy")

    @field_validator("name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        trimmed = " ".join(v.split())
        if len(trimmed) < 2:
            raise ValueError("Name must contain at least 2 characters")
        return trimmed

    @field_validator("consent_given")
    @classmethod
    def validate_consent(cls, v: bool) -> bool:
        if not v:
            raise ValueError("You must agree to the Terms of Service and Privacy Policy to register")
        return v

    @model_validator(mode="after")
    def validate_passwords_and_minor_consent(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        
        # Check minor policy: if student indicates under 13, guardian consent is required
        if self.age_range.lower() in ["under 13", "under-13", "<13"]:
            if not self.guardian_email:
                raise ValueError("Students under 13 must provide a verified guardian email address")
            if str(self.guardian_email).lower() == str(self.email).lower():
                raise ValueError("Guardian email must be different from student email")
        return self

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)
    remember_me: bool = False

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=10, max_length=128)
    confirm_password: str = Field(..., min_length=10, max_length=128)

    @model_validator(mode="after")
    def validate_passwords(self):
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    educational_level: str
    age_range: str
    email_verified: bool
    target_exam: Optional[str] = "GATE / Semester Exam 2026"
    weekly_target_hours: Optional[int] = 20
    created_at: str

class AuthResponse(BaseModel):
    user: UserResponse
    csrf_token: str
    access_token: str
    message: Optional[str] = None

