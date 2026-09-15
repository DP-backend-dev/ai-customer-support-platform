"""Idempotently seed the public demo with `python -m app.seed_demo`."""

import secrets

from sqlalchemy import select

from app.auth import hash_password
from app.database import Base, SessionLocal, engine
from app.models import Chatbot, KnowledgeEntry, User
from app.routers.demo import DEMO_CHATBOT_NAME, DEMO_USER_EMAIL

DEMO_ENTRIES = (
    ("Where are you located?", "Harbor & Hearth Bistro is at 18 Bay Street in Portland, Maine, two blocks from the waterfront."),
    ("What are your opening hours?", "We are open Tuesday through Thursday from 11:30 AM to 9 PM, Friday and Saturday from 11:30 AM to 10 PM, and Sunday from 10 AM to 8 PM. We are closed on Monday."),
    ("Do I need a reservation?", "Walk-ins are welcome, but reservations are recommended for dinner and weekend brunch. Reservations can be made by phone up to 30 days ahead."),
    ("What kind of food do you serve?", "We serve seasonal New England comfort food with seafood, vegetarian dishes, house-made pasta, and locally sourced ingredients."),
    ("Do you accommodate dietary restrictions?", "Yes. We offer vegetarian and gluten-aware options, and the kitchen can accommodate many allergies. Please tell your server about any allergy before ordering. We cannot guarantee a completely allergen-free kitchen."),
    ("How much does a meal cost?", "Lunch entrees are typically $16–$24, dinner entrees are $24–$38, and weekend brunch dishes are $14–$22."),
    ("Do you offer takeout?", "Yes. Takeout is available during regular opening hours, with last orders accepted 30 minutes before closing."),
    ("Is parking available?", "Metered street parking is available on Bay Street, and the Harbor Garage is one block east. The restaurant validates one hour of garage parking for dinner guests."),
    ("Can I book a private event?", "Our upstairs dining room hosts private groups of 12 to 40 guests. Event menus start at $55 per person and require at least two weeks' notice."),
)


def seed_demo() -> int:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        user = db.scalar(select(User).where(User.email == DEMO_USER_EMAIL))
        if user is None:
            user = User(
                email=DEMO_USER_EMAIL,
                name="Demo Owner",
                hashed_password=hash_password(secrets.token_urlsafe(32)),
            )
            db.add(user)
            db.flush()

        chatbot = db.scalar(
            select(Chatbot).where(
                Chatbot.owner_id == user.id,
                Chatbot.name == DEMO_CHATBOT_NAME,
            )
        )
        if chatbot is None:
            chatbot = Chatbot(
                owner_id=user.id,
                name=DEMO_CHATBOT_NAME,
                business_info=(
                    "Harbor & Hearth Bistro is a fictional neighborhood restaurant in "
                    "Portland, Maine. It focuses on seasonal New England food, warm "
                    "hospitality, and practical answers for diners planning a visit."
                ),
                tone="Warm, welcoming, concise, and practical",
                welcome_message="Welcome to Harbor & Hearth! What can I help you plan today?",
                primary_color="#d97706",
            )
            db.add(chatbot)
            db.flush()

        existing_questions = set(
            db.scalars(
                select(KnowledgeEntry.question).where(
                    KnowledgeEntry.chatbot_id == chatbot.id
                )
            ).all()
        )
        for question, answer in DEMO_ENTRIES:
            if question not in existing_questions:
                db.add(
                    KnowledgeEntry(
                        chatbot_id=chatbot.id,
                        question=question,
                        answer=answer,
                    )
                )
        db.commit()
        return chatbot.id
    except Exception as exc:
        db.rollback()
        raise RuntimeError("Demo data could not be seeded") from exc
    finally:
        db.close()


if __name__ == "__main__":
    seeded_id = seed_demo()
    print(f"Demo chatbot ready with id {seeded_id}")
