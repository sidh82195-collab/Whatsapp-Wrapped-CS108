import sys
import numpy as np
import random
from datetime import datetime, timedelta

# ----------- LOAD VOCABULARY -----------
def load_vocab(file):
    with open(file, "r", encoding="utf-8") as f:
        words = f.read().split(",")
    return [w.strip() for w in words if w.strip()]

# ----------- USERS WITH PERSONALITIES -----------
# Each user has:
# freq → how often they send messages
# hours → active time range
# msg_len → message length range

users = [
    {"name": "Shreya", "freq": 0.25, "hours": range(0, 24), "msg_len": (3, 8)},   # Chatterbox
    {"name": "Rishabh", "freq": 0.10, "hours": range(0, 4), "msg_len": (2, 5)},    # Night Owl
    {"name": "Rajit", "freq": 0.15, "hours": range(8, 18), "msg_len": (6, 12)}, # Long texter
    {"name": "Arush", "freq": 0.10, "hours": range(10, 22), "msg_len": (1, 3)}, # Short replies
    {"name": "Sudhansh", "freq": 0.15, "hours": range(0, 24), "msg_len": (2, 6)},  # Normal
    {"name": "Praveen", "freq": 0.15, "hours": range(12, 20), "msg_len": (4, 9)}, # Afternoon active
    {"name": "Vishal", "freq": 0.10, "hours": range(0, 24), "msg_len": (1, 2)}, # Dry texter
]

# ----------- GENERATE MESSAGE -----------
def generate_message(vocab, length):
    return " ".join(random.choice(vocab) for _ in range(length))

# ----------- GENERATE CHAT -----------
def generate_chat(vocab, total_messages=250):
    chat = []
    current_time = datetime(2024, 1, 1, 0, 0)

    probs = [u["freq"] for u in users]

    while len(chat) < total_messages:

        # Choose user based on frequency
        user = np.random.choice(users, p=probs)

        # Check time constraint
        if current_time.hour not in user["hours"]:
            current_time += timedelta(minutes=random.randint(5, 30))
            continue

        # Message length behavior
        msg_len = random.randint(user["msg_len"][0], user["msg_len"][1])
        message = generate_message(vocab, msg_len)

        # Format time
        timestamp = current_time.strftime("%d/%m/%y, %H:%M")

        chat.append(f"{timestamp} - {user['name']}: {message}")

        # ----------- GHOSTER / REPLY STREAK -----------
        if random.random() < 0.12:  # 12% chance
            streak = random.randint(2, 4)
            for _ in range(streak):
                msg_len = random.randint(user["msg_len"][0], user["msg_len"][1])
                message = generate_message(vocab, msg_len)
                chat.append(f"{timestamp} - {user['name']}: {message}")

        # Move time forward
        current_time += timedelta(minutes=random.randint(1, 20))

    return chat

# ----------- MAIN -----------
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python chat.py <vocabulary.txt>")
        sys.exit(1)

    vocab_file = sys.argv[1]
    vocab = load_vocab(vocab_file)

    chat = generate_chat(vocab)

    # Save output
    with open("chat.txt", "w", encoding="utf-8") as f:
        for line in chat:
            f.write(line + "\n")

    print("✅ Chat generated successfully → chat.txt")
