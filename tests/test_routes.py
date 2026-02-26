"""Tests for the Flask API routes."""
import pytest
import json
from app import create_app


@pytest.fixture
def app():
    return create_app({"TESTING": True})


@pytest.fixture
def client(app):
    return app.test_client()


class TestIndexRoute:
    def test_index_returns_200(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        assert b"CrowdLens" in resp.data


class TestTitlesRoute:
    def test_returns_titles_list(self, client):
        resp = client.get("/api/titles")
        assert resp.status_code == 200
        data = resp.get_json()
        assert "titles" in data
        assert isinstance(data["titles"], list)
        assert len(data["titles"]) > 0

    def test_titles_are_strings(self, client):
        resp = client.get("/api/titles")
        data = resp.get_json()
        for title in data["titles"]:
            assert isinstance(title, str)


class TestAnalyzeRoute:
    def test_known_title_returns_200(self, client):
        resp = client.get("/api/analyze?title=Dune: Part Two")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["title"] == "Dune: Part Two"
        assert "sentiment" in data
        assert "reviews" in data

    def test_sentiment_has_required_fields(self, client):
        resp = client.get("/api/analyze?title=Succession")
        data = resp.get_json()
        sentiment = data["sentiment"]
        for key in ("average_compound", "positive_pct", "neutral_pct",
                    "negative_pct", "overall_label", "review_count"):
            assert key in sentiment

    def test_missing_title_returns_400(self, client):
        resp = client.get("/api/analyze")
        assert resp.status_code == 400
        data = resp.get_json()
        assert "error" in data

    def test_unknown_title_returns_404(self, client):
        resp = client.get("/api/analyze?title=xyzzy_unknown_film_12345")
        assert resp.status_code == 404
        data = resp.get_json()
        assert "error" in data

    def test_invalid_limit_returns_400(self, client):
        resp = client.get("/api/analyze?title=Succession&limit=notanumber")
        assert resp.status_code == 400

    def test_limit_parameter_respected(self, client):
        resp = client.get("/api/analyze?title=Succession&limit=3")
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data["reviews"]) <= 3


class TestTrendingRoute:
    def test_returns_rankings(self, client):
        resp = client.get("/api/trending")
        assert resp.status_code == 200
        data = resp.get_json()
        assert "rankings" in data
        assert isinstance(data["rankings"], list)
        assert len(data["rankings"]) > 0

    def test_rankings_are_sorted_by_score(self, client):
        resp = client.get("/api/trending")
        data = resp.get_json()
        scores = [r["sentiment"]["average_compound"] for r in data["rankings"]]
        assert scores == sorted(scores, reverse=True)

    def test_rankings_have_rank_field(self, client):
        resp = client.get("/api/trending")
        data = resp.get_json()
        for i, item in enumerate(data["rankings"], start=1):
            assert item["rank"] == i


class TestAnalyzeTextRoute:
    def test_positive_text(self, client):
        resp = client.post(
            "/api/analyze_text",
            data=json.dumps({"text": "This movie is absolutely fantastic!"}),
            content_type="application/json",
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["sentiment"]["label"] == "positive"

    def test_missing_body_returns_400(self, client):
        resp = client.post("/api/analyze_text", content_type="application/json")
        assert resp.status_code == 400

    def test_missing_text_field_returns_400(self, client):
        resp = client.post(
            "/api/analyze_text",
            data=json.dumps({"wrong_key": "hello"}),
            content_type="application/json",
        )
        assert resp.status_code == 400

    def test_empty_text_returns_400(self, client):
        resp = client.post(
            "/api/analyze_text",
            data=json.dumps({"text": "   "}),
            content_type="application/json",
        )
        assert resp.status_code == 400
