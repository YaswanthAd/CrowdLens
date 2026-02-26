"""Tests for the social media fetcher module."""
import pytest
from app.fetcher import fetch_reviews, list_demo_titles, DEMO_REVIEWS


class TestListDemoTitles:
    def test_returns_list(self):
        titles = list_demo_titles()
        assert isinstance(titles, list)
        assert len(titles) > 0

    def test_returns_strings(self):
        for title in list_demo_titles():
            assert isinstance(title, str)


class TestFetchReviews:
    def test_known_title_returns_reviews(self):
        reviews = fetch_reviews("Dune: Part Two")
        assert isinstance(reviews, list)
        assert len(reviews) > 0

    def test_partial_title_match(self):
        reviews = fetch_reviews("Dune")
        assert len(reviews) > 0

    def test_unknown_title_returns_empty(self):
        reviews = fetch_reviews("xyzzy_unknown_film_99999")
        assert reviews == []

    def test_limit_is_respected(self):
        reviews = fetch_reviews("Succession", limit=3)
        assert len(reviews) <= 3

    def test_case_insensitive_match(self):
        reviews = fetch_reviews("succession")
        assert len(reviews) > 0

    def test_all_demo_titles_have_reviews(self):
        for title in DEMO_REVIEWS:
            reviews = fetch_reviews(title)
            assert len(reviews) > 0, f"No reviews for '{title}'"
