import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from domain.usage_detector import detect_capacity_error, detect_usage_issue


class TestUsageDetector(unittest.TestCase):
    def test_detect_usage_limit(self):
        self.assertIsNotNone(detect_usage_issue("You've reached your usage limit for today."))

    def test_detect_rate_limit(self):
        self.assertIsNotNone(detect_usage_issue("429 Rate limit exceeded. Try again in 1 hour."))

    def test_detect_quota(self):
        self.assertIsNotNone(detect_usage_issue("API Quota exceeded for model."))

    def test_detect_korean_limit(self):
        self.assertIsNotNone(detect_usage_issue("사용량 한도에 도달했습니다."))

    def test_detect_youve_hit(self):
        self.assertIsNotNone(detect_usage_issue("You've hit the maximum turn count."))

    def test_normal_text_not_detected(self):
        self.assertIsNone(detect_usage_issue("Task finished. All tests passed successfully."))

    def test_capacity_markers_are_separate_from_quota(self):
        self.assertEqual(detect_capacity_error('TTFT_ADMISSION_REFUSED'), 'ttft_admission_refused')
        self.assertEqual(detect_capacity_error('Provider at capacity'), 'at capacity')
        self.assertIsNone(detect_capacity_error('rate limit exceeded'))


if __name__ == '__main__':
    unittest.main()
