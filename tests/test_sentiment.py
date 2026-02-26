"""Tests for the sentiment analysis module."""
import pytest
from app.sentiment import analyze_text, aggregate_sentiments


class TestAnalyzeText:
    def test_positive_text(self):
        result = analyze_text("This movie is absolutely fantastic and wonderful!")
        assert result["label"] == "positive"
        assert result["compound"] > 0.05

    def test_negative_text(self):
        result = analyze_text("This is a terrible, awful, horrible film.")
        assert result["label"] == "negative"
        assert result["compound"] < -0.05

    def test_neutral_text(self):
        result = analyze_text("The movie came out in 2023.")
        assert result["label"] == "neutral"

    def test_empty_string(self):
        result = analyze_text("")
        assert result["label"] == "neutral"
        assert result["compound"] == 0.0

    def test_whitespace_only(self):
        result = analyze_text("   ")
        assert result["label"] == "neutral"
        assert result["compound"] == 0.0

    def test_returns_required_keys(self):
        result = analyze_text("Great film!")
        assert set(result.keys()) == {"compound", "pos", "neu", "neg", "label"}

    def test_compound_in_range(self):
        for text in ["amazing", "terrible", "ok"]:
            result = analyze_text(text)
            assert -1.0 <= result["compound"] <= 1.0


class TestAggregateSentiments:
    def test_empty_list(self):
        result = aggregate_sentiments([])
        assert result["review_count"] == 0
        assert result["average_compound"] == 0.0
        assert result["overall_label"] == "neutral"

    def test_all_positive(self):
        texts = [
            "Absolutely brilliant and outstanding!",
            "Loved every single moment of it.",
            "Masterpiece! Cannot recommend enough.",
        ]
        result = aggregate_sentiments(texts)
        assert result["overall_label"] == "positive"
        assert result["average_compound"] > 0.05
        assert result["positive_pct"] > 0
        assert result["review_count"] == 3

    def test_all_negative(self):
        texts = [
            "Terrible and awful. Hated every second.",
            "Worst film I have ever seen. Disgusting.",
        ]
        result = aggregate_sentiments(texts)
        assert result["overall_label"] == "negative"
        assert result["average_compound"] < -0.05

    def test_percentages_sum_to_100(self):
        texts = [
            "Amazing film!",
            "Horrible movie.",
            "It was okay I guess.",
        ]
        result = aggregate_sentiments(texts)
        total = result["positive_pct"] + result["neutral_pct"] + result["negative_pct"]
        assert abs(total - 100.0) < 0.2  # allow tiny floating-point slack

    def test_returns_required_keys(self):
        result = aggregate_sentiments(["Good movie."])
        expected_keys = {
            "average_compound", "positive_pct", "neutral_pct",
            "negative_pct", "overall_label", "review_count",
        }
        assert expected_keys.issubset(set(result.keys()))
