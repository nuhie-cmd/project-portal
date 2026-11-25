from sentence_transformers import util
from similarity import model

# (project A, project B, label) -> 1 = similar idea, 0 = different idea
PAIRS = [
    ("Predicting food wastage in college canteens", "Forecasting leftover meals in university cafeterias", 1),
    ("Face recognition based attendance system", "Automated student attendance using classroom camera images", 1),
    ("Library book recommendation system using borrowing history", "Suggesting books to students based on past loans", 1),
    ("Live bus tracking app for college buses", "Real-time GPS location of campus transport on a map", 1),
    ("Chatbot for answering admission queries", "Virtual assistant that replies to students' admission questions", 1),
    ("Fake news detection using machine learning", "Classifying misleading news articles with NLP", 1),
    ("Crop disease detection from leaf images", "Identifying plant diseases using photos of leaves", 1),
    ("Online examination system with auto grading", "Web portal for conducting exams and grading them automatically", 1),
    ("Student placement prediction using academic records", "Predicting whether a student will get placed from past marks", 1),
    ("Smart parking system using sensors", "Detecting free parking slots with IoT sensors", 1),

    ("Predicting food wastage in college canteens", "Campus bus tracking app", 0),
    ("Face recognition based attendance system", "Library book recommendation system", 0),
    ("Fake news detection using machine learning", "Smart parking system using sensors", 0),
    ("Crop disease detection from leaf images", "Online examination system with auto grading", 0),
    ("Chatbot for answering admission queries", "Student placement prediction using academic records", 0),
    ("Library book recommendation system", "Library seat booking system", 0),
    ("Live bus tracking app for college buses", "Bus ticket booking website", 0),
    ("Online examination system with auto grading", "Online fee payment portal", 0),
    ("Face recognition based attendance system", "Face mask detection in public places", 0),
    ("Weather forecasting using machine learning", "Stock price prediction using machine learning", 0),
]


def similarity(a, b):
    ea = model.encode(a, convert_to_tensor=True)
    eb = model.encode(b, convert_to_tensor=True)
    return float(util.cos_sim(ea, eb))


scores = [similarity(a, b) for a, b, _ in PAIRS]
labels = [l for _, _, l in PAIRS]

print("Scores:")
for (a, b, l), s in zip(PAIRS, scores):
    print(f"  label={l}  score={s:.3f}  {a[:40]} | {b[:40]}")

print("\nThreshold  Precision  Recall  F1")
for i in range(30, 85, 5):
    t = i / 100
    tp = fp = fn = 0
    for s, l in zip(scores, labels):
        pred = 1 if s >= t else 0
        if pred == 1 and l == 1:
            tp += 1
        elif pred == 1 and l == 0:
            fp += 1
        elif pred == 0 and l == 1:
            fn += 1
    precision = tp / (tp + fp) if (tp + fp) else 0
    recall = tp / (tp + fn) if (tp + fn) else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0
    print(f"  {t:.2f}      {precision:.2f}       {recall:.2f}    {f1:.2f}")