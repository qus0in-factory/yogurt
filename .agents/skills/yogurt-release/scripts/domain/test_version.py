import unittest
from domain.version import health_matches, tag_name, validate_version


class VersionDomainTest(unittest.TestCase):
    def test_valid_versions_pass_and_invalid_fail(self):
        for good in ('0.0.1', '1.2.3', '10.20.30'):
            validate_version(good)
        for bad in ('1.2', 'v1.2.3', '1.2.3.4', 'a.b.c', '', None):
            with self.assertRaises(ValueError):
                validate_version(bad)

    def test_tag_name_prefixes_v_after_validation(self):
        self.assertEqual(tag_name('1.2.3'), 'v1.2.3')
        with self.assertRaises(ValueError):
            tag_name('1.2')

    def test_health_payload_version_must_match(self):
        self.assertTrue(health_matches({'version': '1.2.3'}, '1.2.3'))
        for not_matching in ({'version': '1.2.4'}, {'other': '1.2.3'}, None, ['1.2.3'], '1.2.3'):
            self.assertFalse(health_matches(not_matching, '1.2.3'))


if __name__ == '__main__':
    unittest.main()
