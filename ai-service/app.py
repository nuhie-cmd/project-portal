from flask import Flask, request, jsonify
from flask_cors import CORS
from similarity import find_similar, recommend_guides, allocate_guides, get_previous_projects

app = Flask(__name__)
CORS(app)


@app.route("/similar", methods=["POST"])
def similar():
    data = request.get_json()
    title = data.get("title", "")
    description = data.get("description", "")
    projects = data.get("projects")
    if not projects:
        projects = get_previous_projects()

    matches = find_similar(title + ". " + description, projects, min_score=0.45, new_title=title)
    return jsonify({"matches": matches})

SAMPLE_GUIDES = [
    {"id": 1, "name": "Guide A",
     "expertise": "machine learning, natural language processing, deep learning"},
    {"id": 2, "name": "Guide B",
     "expertise": "web development, databases, cloud computing"},
    {"id": 3, "name": "Guide C",
     "expertise": "computer networks, IoT, embedded systems, sensors"},
]


@app.route("/recommend-guide", methods=["POST"])
def recommend_guide():
    data = request.get_json()
    text = data.get("title", "") + ". " + data.get("description", "")
    guides = data.get("guides", SAMPLE_GUIDES)
    return jsonify({"guides": recommend_guides(text, guides)})

@app.route("/allocate", methods=["POST"])
def allocate():
    data = request.get_json()
    result = allocate_guides(
        data.get("teams", []),
        data.get("guides", []),
        max_teams=data.get("max_teams", 4),
    )
    return jsonify(result)

if __name__ == "__main__":
    app.run(port=5001, debug=False)