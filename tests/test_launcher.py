import tempfile
import unittest
from pathlib import Path

from launcher import AppHandler, is_allowed_resource


class LauncherTests(unittest.TestCase):
    def test_is_allowed_resource_whitelist(self):
        self.assertTrue(is_allowed_resource(Path("index.html")))
        self.assertTrue(is_allowed_resource(Path("demo.icc")))
        self.assertFalse(is_allowed_resource(Path("README.md")))

    def test_translate_path_blocks_non_whitelisted_resource_files(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            (root / "index.html").write_text("ok", encoding="utf-8")
            (root / "README.md").write_text("blocked", encoding="utf-8")

            handler = AppHandler.__new__(AppHandler)
            handler.resource_root = root
            handler.external_root = root

            self.assertEqual(Path(handler.translate_path("/")), root)
            self.assertEqual(Path(handler.translate_path("/index.html")), root / "index.html")
            self.assertEqual(Path(handler.translate_path("/README.md")), root / "__missing__")

    def test_translate_path_allows_external_icc_files_only(self):
        with tempfile.TemporaryDirectory() as resource_dir, tempfile.TemporaryDirectory() as external_dir:
            resources = Path(resource_dir)
            external = Path(external_dir)
            (resources / "index.html").write_text("ok", encoding="utf-8")
            (external / "profile.icc").write_bytes(b"icc")
            (external / "secret.txt").write_text("nope", encoding="utf-8")

            handler = AppHandler.__new__(AppHandler)
            handler.resource_root = resources
            handler.external_root = external

            self.assertEqual(Path(handler.translate_path("/profile.icc")), external / "profile.icc")
            self.assertEqual(Path(handler.translate_path("/secret.txt")), resources / "__missing__")


if __name__ == "__main__":
    unittest.main()
