from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


def find_similar(new_text, projects, top_k=3):
    if not projects:
        return []

    texts = [p["title"] + ". " + p["description"] for p in projects]
    new_embedding = model.encode(new_text, convert_to_tensor=True)
    embeddings = model.encode(texts, convert_to_tensor=True)
    scores = util.cos_sim(new_embedding, embeddings)[0]

    results = []
    for project, score in zip(projects, scores):
        results.append({
            "id": project["id"],
            "title": project["title"],
            "score": round(float(score), 3),
        })

    results.sort(key=lambda r: r["score"], reverse=True)
    return results[:top_k]


if __name__ == "__main__":
    sample_projects = [
        {"id": 1, "title": "Forecasting leftover meals in university cafeterias",
         "description": "Predict how much food will be left over each day using past data."},
        {"id": 2, "title": "Attendance using face recognition",
         "description": "Mark student attendance automatically from classroom camera images."},
        {"id": 3, "title": "Library book recommendation system",
         "description": "Recommend books to students based on their borrowing history."},
        {"id": 4, "title": "Campus bus tracking app",
         "description": "Show live location of college buses on a map."},
    ]

    new_proposal = "Predicting food wastage in college canteens. Estimate daily surplus food."

    for match in find_similar(new_proposal, sample_projects):
        print(match)