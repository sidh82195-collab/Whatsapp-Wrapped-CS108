import re
import sys
import json
from datetime import datetime
from collections import defaultdict
import numpy as np

# Pattern to parse chat lines
pattern = r"(\d{2}/\d{2}/\d{2}, \d{2}:\d{2}) - (.*?): (.*)"

# Parse chat file
def parse_chat(filename):
    data = []

    try:
        with open(filename, 'r', encoding="utf-8") as f:
            for line in f:
                match = re.match(pattern, line)
                if match:
                    try:
                        time = datetime.strptime(match.group(1), "%d/%m/%y, %H:%M")
                        sender = match.group(2)
                        message = match.group(3)
                        data.append((time, sender, message))
                    except:
                        continue  # skip bad lines
    except FileNotFoundError:
        print(f"❌ File '{filename}' not found")
        sys.exit(1)

    return data


def analyze(data):
    stats = {}

    if not data:
        print("❌ No valid chat data found")
        return {}

    message_count = defaultdict(int)
    word_count = defaultdict(int)
    emoji_count = defaultdict(lambda: defaultdict(int))

    response_times = defaultdict(list)
    silence_gaps = []
    last_time = None

    for i, (time, sender, msg) in enumerate(data):
        message_count[sender] += 1
        word_count[sender] += len(msg.split())

        # Emoji detection
        for ch in msg:
            if ord(ch) > 10000:
                emoji_count[sender][ch] += 1

        # Silence tracking
        if last_time:
            gap = (time - last_time).total_seconds()
            silence_gaps.append(gap)
        last_time = time

        # Response time
        if i > 0:
            prev_time, prev_sender, _ = data[i - 1]
            if sender != prev_sender:
                diff = (time - prev_time).total_seconds() / 60
                response_times[sender].append(diff)

    # 1. Total messages
    stats["total_messages"] = dict(message_count)

    # 2. Total words
    stats["total_words"] = dict(word_count)

    # 3. Night owl
    night_msgs = defaultdict(int)
    for time, sender, _ in data:
        if 0 <= time.hour <= 4:
            night_msgs[sender] += 1
    stats["night_owl"] = max(night_msgs, key=night_msgs.get, default=None)

    # 4. Ghost
    stats["ghost"] = min(message_count, key=message_count.get)

    # 5. Conversation starter
    starters = defaultdict(int)
    for i in range(1, len(data)):
        gap = (data[i][0] - data[i-1][0]).total_seconds()
        if gap > 3600:
            starters[data[i][1]] += 1
    stats["conversation_starter"] = max(starters, key=starters.get, default=None)

    # 6. Top emojis
    stats["most_used_emoji"] = {
        user: sorted(emojis, key=emojis.get, reverse=True)[:3]
        for user, emojis in emoji_count.items()
    }

    # 7. Busiest day
    day_count = defaultdict(int)
    for time, _, _ in data:
        day_count[time.date()] += 1
    stats["busiest_day"] = str(max(day_count, key=day_count.get))

    # 8. Longest silence
    stats["longest_silence"] = max(silence_gaps) if silence_gaps else 0

    # 9. Avg response time (median)
    stats["avg_response_time"] = {
        user: float(np.median(times)) if times else 0
        for user, times in response_times.items()
    }

    # 10. Hype person
    stats["hype_person"] = min(
        stats["avg_response_time"],
        key=stats["avg_response_time"].get,
        default=None
    )

    # 11. Most active hour
    hour_count = defaultdict(int)
    for time, _, _ in data:
        hour_count[time.hour] += 1
    stats["most_active_hour"] = max(hour_count, key=hour_count.get)

    return stats


if __name__ == "__main__":
    # ✅ FIX: handle missing argument
    if len(sys.argv) < 2:
        print("Usage: python chat.py <chat_file>")
        sys.exit(1)

    filename = sys.argv[1]

    chat_data = parse_chat(filename)
    stats = analyze(chat_data)

    with open("data.json", "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=4, default=str)

    print("✅ Analysis complete. Output saved to data.json")