from similarity import allocate_guides

guides = [
    {"id": 1, "name": "Guide A", "domains": ["NLP", "ML"],
     "expertise": "natural language processing, machine learning, deep learning"},
    {"id": 2, "name": "Guide B", "domains": ["Web", "Data"],
     "expertise": "web development, databases, cloud computing"},
    {"id": 3, "name": "Guide C", "domains": ["IoT", "Networks", "CV"],
     "expertise": "computer vision, IoT, embedded systems, sensors, networks"},
]

teams = [
    {"id": 1, "name": "Team 1", "title": "Sentiment analysis of feedback",
     "description": "Classify course feedback using NLP.", "domain": "NLP"},
    {"id": 2, "name": "Team 2", "title": "Chatbot for college queries",
     "description": "Answer student questions using language models.", "domain": "NLP"},
    {"id": 3, "name": "Team 3", "title": "Fake news detection",
     "description": "Classify news text as real or fake.", "domain": "NLP"},
    {"id": 4, "name": "Team 4", "title": "Smart parking",
     "description": "Detect free parking spots with sensors.", "domain": "IoT"},
    {"id": 5, "name": "Team 5", "title": "Event portal",
     "description": "Web app with a database for event registration.", "domain": "Web"},
    {"id": 6, "name": "Team 6", "title": "Face recognition attendance",
     "description": "Mark attendance from camera images.", "domain": "CV"},
]

result = allocate_guides(teams, guides, max_teams=2)
for a in result["allocations"]:
    print(a)
print("Unassigned:", result["unassigned"])
print("Loads:", result["loads"])