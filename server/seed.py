from app.database import Base, engine
from app.seed_data import seed_personas

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    seed_personas()
    print("Database initialized and personas seeded.")
