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

def recommend_guides(proposal_text, guides, top_k=3):
    if not guides:
        return []

    texts = [g["name"] + ". " + g["expertise"] for g in guides]
    proposal_embedding = model.encode(proposal_text, convert_to_tensor=True)
    guide_embeddings = model.encode(texts, convert_to_tensor=True)
    scores = util.cos_sim(proposal_embedding, guide_embeddings)[0]

    results = []
    for guide, score in zip(guides, scores):
        results.append({
            "id": guide["id"],
            "name": guide["name"],
            "score": round(float(score), 3),
        })

    results.sort(key=lambda r: r["score"], reverse=True)
    return results[:top_k]

def allocate_guides(teams, guides, max_teams=4, domain_bonus=0.3):
    if not teams or not guides:
        return {"allocations": [], "unassigned": [t["id"] for t in teams], "loads": {}}

    team_texts = [t["title"] + ". " + t["description"] for t in teams]
    guide_texts = [g["expertise"] for g in guides]
    team_emb = model.encode(team_texts, convert_to_tensor=True)
    guide_emb = model.encode(guide_texts, convert_to_tensor=True)
    scores = util.cos_sim(team_emb, guide_emb)

    pairs = []
    for i, team in enumerate(teams):
        for j, guide in enumerate(guides):
            match = team.get("domain") in guide.get("domains", [])
            total = float(scores[i][j]) + (domain_bonus if match else 0)
            pairs.append((total, i, j, match))
    pairs.sort(reverse=True)

    loads = {g["id"]: g.get("current", 0) for g in guides}
    assigned = {}
    for total, i, j, match in pairs:
        team, guide = teams[i], guides[j]
        if team["id"] in assigned or loads[guide["id"]] >= max_teams:
            continue
        assigned[team["id"]] = {
            "team_id": team["id"],
            "guide_id": guide["id"],
            "guide_name": guide["name"],
            "score": round(total, 3),
            "domain_match": match,
        }
        loads[guide["id"]] += 1

    unassigned = [t["id"] for t in teams if t["id"] not in assigned]
    return {
        "allocations": list(assigned.values()),
        "unassigned": unassigned,
        "loads": loads,
    }

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