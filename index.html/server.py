import csv
import json
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, HTTPServer

SERVER_CONFIG = ("localhost", 8000)
STOP_WORDS = (
    "is", "the", "a", "an", "in", "of", "to", "for", "and", "or",
    "what", "how", "where", "can", "i", "my", "me", "are", "tell", "about"
)

def load_faqs(filename="faqs.csv"):
    faq_list = []
    with open(filename, mode="r", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            faq_list.append(row)
    return faq_list

FAQS = load_faqs()

def extract_keywords(text):
    cleaned = ""
    for char in text.lower():
        if char.isalnum() or char.isspace():
            cleaned += char
    words = cleaned.split()
    return {w for w in words if w not in STOP_WORDS}

def find_best_answer(user_question):
    user_words = extract_keywords(user_question)
    if not user_words:
        return "Please enter a valid question.", 0.0, "General"

    best_match = None
    highest_score = 0.0

    for faq in FAQS:
        faq_words = extract_keywords(faq["question"] + " " + faq["keywords"])
        common_words = user_words.intersection(faq_words)
        all_words = user_words.union(faq_words)

        if len(all_words) > 0:
            score = (len(common_words) / len(all_words)) * 100
        else:
            score = 0.0

        if score > highest_score:
            highest_score = score
            best_match = faq

    if best_match and highest_score >= 10.0:
        return best_match["answer"], round(highest_score, 1), best_match["category"]
    else:
        return (
            "I couldn't find an exact match. Try asking about courses, hostel, exams, fees, scholarships, or placements.",
            0.0,
            "Unknown"
        )

def log_chat(question, answer, score):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open("chat_log.txt", mode="a", encoding="utf-8") as log_file:
        log_file.write(f"[{timestamp}] USER: {question}\n")
        log_file.write(f"[{timestamp}] BOT ({score}% match): {answer}\n")
        log_file.write("-" * 50 + "\n")

class UniBotHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/api/faqs":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(FAQS).encode("utf-8"))
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == "/api/chat":
            content_length = int(self.headers["Content-Length"])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode("utf-8"))

            question = data.get("question", "")
            answer, score, category = find_best_answer(question)
            log_chat(question, answer, score)

            response = {
                "answer": answer,
                "confidence": score,
                "category": category
            }

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response).encode("utf-8"))

if __name__ == "__main__":
    server = HTTPServer(SERVER_CONFIG, UniBotHandler)
    print(f"UniBot running at http://{SERVER_CONFIG[0]}:{SERVER_CONFIG[1]}")
    server.serve_forever()