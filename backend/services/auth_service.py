import jwt
from db import get_db

SECRET_KEY = "secret2611"

def verify_token(token):
    return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
