from flask import Flask, request, jsonify
from flask_cors import CORS
from similarity import find_similar

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


if __name__ == "__main__":
    app.run(port=5001, debug=False)