import os
import sqlite3
from sentence_transformers import SentenceTransformer, util

try:
    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2", local_files_only=True)
except Exception:
    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "server", "data.sqlite"))


def get_previous_projects():
    """Fetch previous projects from the previous_projects table in the database."""
    if not os.path.exists(DB_PATH):
        return []
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute(
            """SELECT id, title,
                      TRIM(COALESCE(problem_statement, '') || ' ' || COALESCE(objectives, '')) AS description
               FROM previous_projects"""
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def find_similar(new_text, projects, top_k=3, min_score=0.45, new_title=None):
    if not projects:
        return []

    texts = [p["title"] + ". " + (p.get("description") or "") for p in projects]
    new_embedding = model.encode(new_text, convert_to_tensor=True)
    embeddings = model.encode(texts, convert_to_tensor=True)
    full_scores = util.cos_sim(new_embedding, embeddings)[0]

    title_scores = None
    norm_new_title = (new_title or "").strip().lower()
    if norm_new_title:
        titles = [p["title"] for p in projects]
        t_new = model.encode(new_title.strip(), convert_to_tensor=True)
        t_emb = model.encode(titles, convert_to_tensor=True)
        title_scores = util.cos_sim(t_new, t_emb)[0]

    results = []
    for idx, (project, full_score) in enumerate(zip(projects, full_scores)):
        score = float(full_score)
        if title_scores is not None:
            t_score = float(title_scores[idx])
            if norm_new_title == project["title"].strip().lower():
                t_score = 1.0
            score = max(score, t_score)
        score = round(min(score, 1.0), 3)
        if score >= min_score:
            results.append({
                "id": project["id"],
                "title": project["title"],
                "score": score,
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
    sample_projects = get_previous_projects()

    new_proposal = "Predicting food wastage in college canteens. Estimate daily surplus food."

    for match in find_similar(new_proposal, sample_projects):
        print(match)