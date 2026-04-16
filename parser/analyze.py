import sys
import datetime
import pathlib
import re
import numpy as np
import json

#getting chat.txt from terminal.
input_file = sys.argv[1]

#reading and parsing each line.
messages = []

with open(input_file , "r") as file:
    for line in file:
        line = line.strip() #to remove \n at last of line.
        if line == "":
            continue # here we skip empty lines.

        #splitting the time stamps
        parts = line.split(" - ",1)
        if len(parts) < 2:
            continue # here we skip unusal lines.
        
        timestamp_string = parts[0]
        rest = parts[1]

        #split rest in sender and messages
        parts2 = rest.split(": ",1)
        if len(parts2)<2:
            continue

        sender = parts2[0]
        message = parts2[1]

        # converting the timestamp string to a real time object
        dt = datetime.datetime.strptime(timestamp_string, "%d/%m/%y, %H:%M")

        # storing it as a dictionary
        messages.append({
            "datetime": dt,
            "sender": sender,
            "message": message
        })

print(f"Total messages loaded: {len(messages)}")
print("First message:", messages[0])
print("Last message:", messages[-1])
 
 # total messages - no of messages each person sent 
total_messages = {}

for m in messages:
    sender = m["sender"]
    if sender not in total_messages:
        total_messages[sender] = 0
    total_messages[sender] += 1

print("total messages", total_messages)
 
# total words each person had typed
total_words = {}

for m in messages:
    sender = m["sender"]
    word_count = len(m["message"].split())
    if sender not in total_words:
        total_words[sender] = 0
    total_words[sender] += word_count

print("Total_words",total_words)

# Night owl - most messages between 12 and 4 am

nightowl_count = {}
for m in messages:
    if m["datetime"].hour < 4:
        sender = m["sender"]
        if sender not in nightowl_count:
            nightowl_count[sender] = 0
        nightowl_count[sender] += 1

#picking the night owl
night_owl = max(nightowl_count,key= lambda x: nightowl_count[x])

print("Night owl counts ",nightowl_count)
print("Night owl: ",night_owl)

#ghost : person with least replies
reply_count = {}
for name in total_messages:
    reply_count[name] = 0
 
for i in range(len(messages)-1):
    current = messages[i]
    next_msg = messages[i+1]
    time_diff = (next_msg["datetime"]- current["datetime"]).total_seconds() / 60
    if next_msg["sender"] != current["sender"] and time_diff <= 30:
        reply_count[current["sender"]] += 1


ghost = min(reply_count, key=lambda x: reply_count[x])
print("Reply counts:", reply_count)
print("Ghost:", ghost)

#conversation starter
starter_count = {}
for name in total_messages:
    starter_count[name] = 0

for i in range(1, len(messages)):
    current = messages[i]
    prev = messages[i - 1]
    time_diff = (current["datetime"] - prev["datetime"]).total_seconds() / 60
    if time_diff > 60:
        starter_count[current["sender"]] += 1

conversation_starter = max(starter_count, key=lambda x: starter_count[x])
print("Starter counts:", starter_count)
print("Conversation starter:", conversation_starter)

#most used emoji


emoji_pattern = re.compile("["
    u"\U0001F600-\U0001F64F"
    u"\U0001F300-\U0001F5FF"
    u"\U0001F680-\U0001F6FF"
    u"\U0001F1E0-\U0001F1FF"
    u"\U00002700-\U000027BF"
    u"\U0001F900-\U0001F9FF"
    "]+", flags=re.UNICODE)

emoji_counts = {}
for name in total_messages:
    emoji_counts[name] = {}

for m in messages:
    sender = m["sender"]
    emojis_found = emoji_pattern.findall(m["message"])
    for e in emojis_found:
        if e not in emoji_counts[sender]:
            emoji_counts[sender][e] = 0
        emoji_counts[sender][e] += 1

#top 3 emoji's per person
top_emojis = {}
for name in emoji_counts:
    sorted_emojis = sorted(emoji_counts[name], key=lambda x: emoji_counts[name][x], reverse=True)
    top_emojis[name] = sorted_emojis[:3]

print("Top emojis:", top_emojis)

#busisest day
day_counts = {}
for m in messages:
    day = m["datetime"].strftime("%d/%m/%y")
    if day not in day_counts:
        day_counts[day] = 0
    day_counts[day] += 1

busiest_day = max(day_counts, key=lambda x: day_counts[x])
print("Busiest day:", busiest_day, "with", day_counts[busiest_day], "messages")

# longest silence

longest_silence = 0
silence_start = None
silence_end = None

for i in range(1, len(messages)):
    gap = (messages[i]["datetime"] - messages[i-1]["datetime"]).total_seconds() / 3600  # in hours
    if gap > longest_silence:
        longest_silence = gap
        silence_start = messages[i-1]["datetime"].strftime("%d/%m/%y, %H:%M")
        silence_end = messages[i]["datetime"].strftime("%d/%m/%y, %H:%M")

print(f"Longest silence: {longest_silence:.2f} hours, from {silence_start} to {silence_end}")

#average reponse time


response_times = {}
for name in total_messages:
    response_times[name] = []

for i in range(len(messages) - 1):
    current = messages[i]
    next_msg = messages[i + 1]
    time_diff = (next_msg["datetime"] - current["datetime"]).total_seconds() / 60
    if next_msg["sender"] != current["sender"] and time_diff <= 30:
        response_times[current["sender"]].append(time_diff)

avg_response_time = {}
for name in response_times:
    if len(response_times[name]) > 0:
        avg_response_time[name] = round(float(np.median(response_times[name])), 2)
    else:
        avg_response_time[name] = None

print("Avg response times:", avg_response_time)

# hype person 

reply_speeds = {}
for name in total_messages:
    reply_speeds[name] = []

for i in range(1, len(messages)):
    current = messages[i]
    prev = messages[i - 1]
    time_diff = (current["datetime"] - prev["datetime"]).total_seconds() / 60
    if current["sender"] != prev["sender"] and time_diff <= 30:
        reply_speeds[current["sender"]].append(time_diff)

hype_scores = {}
for name in reply_speeds:
    if len(reply_speeds[name]) > 0:
        hype_scores[name] = round(float(np.median(reply_speeds[name])), 2)

hype_person = min(hype_scores, key=lambda x: hype_scores[x])
print("Hype scores:", hype_scores)
print("Hype person:", hype_person)

# most consecutive messages

max_streak = {}
for name in total_messages:
    max_streak[name] = 0

current_streak_sender = messages[0]["sender"]
current_streak = 1

for i in range(1, len(messages)):
    if messages[i]["sender"] == current_streak_sender:
        current_streak += 1
    else:
        if current_streak > max_streak[current_streak_sender]:
            max_streak[current_streak_sender] = current_streak
        current_streak_sender = messages[i]["sender"]
        current_streak = 1

print("Max consecutive streak:", max_streak)

# writing data into json file


script_dir = pathlib.Path(__file__).parent
root_dir = script_dir.parent
output_path = root_dir / "data.json"

data = {
    "group_stats": {
        "busiest_day": busiest_day,
        "busiest_day_count": day_counts[busiest_day],
        "longest_silence_hours": round(longest_silence, 2),
        "longest_silence_from": silence_start,
        "longest_silence_to": silence_end,
        "night_owl": night_owl,
        "ghost": ghost,
        "conversation_starter": conversation_starter,
        "hype_person": hype_person
    },
    "per_person": {}
}


for name in total_messages:
    data["per_person"][name] = {
        "total_messages": total_messages[name],
        "total_words": total_words.get(name, 0),
        "night_owl_messages": nightowl_count.get(name, 0),
        "reply_count": reply_count.get(name, 0),
        "conversation_starts": starter_count.get(name, 0),
        "top_emojis": top_emojis.get(name, []),
        "avg_response_time": avg_response_time.get(name, None),
        "hype_score": hype_scores.get(name, None),
        "max_consecutive_streak": max_streak.get(name, 0)
    }

with open(output_path, 'w') as f:
    json.dump(data, f, indent=2)

print(f"data.json written to {output_path} ✅")
