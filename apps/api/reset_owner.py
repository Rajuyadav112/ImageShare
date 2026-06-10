import os
import sys

# Ensure backend path is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, create_engine, select, SQLModel
from app.models.user import User
from app.models.image import Image
from app.core.security import get_password_hash
from app.core.config import settings

# Load the SQLite database engine
engine = create_engine(settings.DATABASE_URL)

def reset_admin():
    email = "rajuyadav84211@gmail.com"
    default_pass = "12345678"
    
    # Ensure all tables are created
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == email)).first()
        if user:
            # If user exists, reset password & verify active/admin rights
            user.hashed_password = get_password_hash(default_pass)
            user.is_superadmin = True
            user.is_active = True
            user.phone = "8421125950"
            session.add(user)
            session.commit()
            print("====================================================")
            print(f"[OK] Owner user '{email}' found in database!")
            print(f"[KEY] Password has been reset to: {default_pass}")
            print("====================================================")
        else:
            # If user does not exist, seed a new superadmin record
            admin_user = User(
                email=email,
                name="Raju Yadav",
                phone="8421125950",
                hashed_password=get_password_hash(default_pass),
                is_superadmin=True,
                is_active=True
            )
            session.add(admin_user)
            session.commit()
            print("====================================================")
            print(f"[OK] Owner user '{email}' was NOT in the database.")
            print(f"[ADMIN] Created new Superadmin account successfully!")
            print(f"[KEY] Default Login Password: {default_pass}")
            print("====================================================")

if __name__ == "__main__":
    reset_admin()
