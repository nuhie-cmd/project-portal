from flask import Flask, request, jsonify
from flask_cors import CORS
from similarity import find_similar, recommend_guides, allocate_guides

app = Flask(__name__)
CORS(app)

SAMPLE_PROJECTS = [
    {"id": 1, "title": "Forecasting leftover meals in university cafeterias",
     "description": "Predict how much food will be left over each day using past data."},
    {"id": 2, "title": "Attendance using face recognition",
     "description": "Mark student attendance automatically from classroom camera images."},
    {"id": 3, "title": "Library book recommendation system",
     "description": "Recommend books to students based on their borrowing history."},
    {"id": 4, "title": "Campus bus tracking app",
     "description": "Show live location of college buses on a map."},
]


@app.route("/similar", methods=["POST"])
def similar():
    data = request.get_json()
    title = data.get("title", "")
    description = data.get("description", "")
    projects = data.get("projects", SAMPLE_PROJECTS)

    matches = find_similar(title + ". " + description, projects)
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