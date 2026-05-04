import functools
import json
import mimetypes
import posixpath
import socket
import sys
import threading
import time
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote


APP_NAME = "ICC Live Editor"
APP_SIGNATURE = "Untitled0828"
DEFAULT_PROFILE = "Untitled.icc"
PROFILE_DIRNAME = "profiles"
PORT_START = 8766
ALLOWED_RESOURCE_FILES = {
    "index.html",
    "app.js",
    "icc-core.js",
    "styles.css",
    "favicon.svg",
}
ALLOWED_PROFILE_SUFFIXES = {".icc", ".icm"}


def is_relative_to(path: Path, root: Path) -> bool:
    try:
        path.relative_to(root)
        return True
    except ValueError:
        return False


def resource_dir() -> Path:
    if hasattr(sys, "_MEIPASS"):
        return Path(sys._MEIPASS)
    root = Path(__file__).resolve().parent
    built = root / "build" / "web"
    return built if built.exists() else root


def external_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


def is_port_free(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.2)
        return sock.connect_ex(("127.0.0.1", port)) != 0


def choose_port() -> int:
    for port in range(PORT_START, PORT_START + 50):
        if is_port_free(port):
            return port
    raise RuntimeError("No free local port found.")


def is_allowed_resource(path: Path) -> bool:
    return path.name in ALLOWED_RESOURCE_FILES or (
        path.suffix.lower() in ALLOWED_PROFILE_SUFFIXES and PROFILE_DIRNAME in path.parts
    )


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, resource_root: Path, external_root: Path, **kwargs):
        self.resource_root = resource_root
        self.external_root = external_root
        super().__init__(*args, directory=str(resource_root), **kwargs)

    def log_message(self, format, *args):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def do_GET(self):
        if self.path.split("?", 1)[0] == f"/{PROFILE_DIRNAME}/manifest.json":
            self.send_profiles()
            return
        super().do_GET()

    def translate_path(self, path):
        clean = unquote(path.split("?", 1)[0].split("#", 1)[0])
        clean = clean.replace("\\", "/")
        clean = posixpath.normpath(clean).lstrip("/")
        clean_path = Path(*[part for part in clean.split("/") if part and part != ".."])
        external_root = self.external_root.resolve()
        resource_root = self.resource_root.resolve()
        external_candidate = (external_root / clean_path).resolve()
        resource_candidate = (resource_root / clean_path).resolve()
        fallback = resource_root / "__missing__"

        if clean_path == Path("."):
            return str(resource_root)

        if (
            is_relative_to(external_candidate, external_root)
            and external_candidate.is_file()
            and external_candidate.suffix.lower() in ALLOWED_PROFILE_SUFFIXES
            and PROFILE_DIRNAME in external_candidate.relative_to(external_root).parts
        ):
            return str(external_candidate)
        if (
            is_relative_to(resource_candidate, resource_root)
            and resource_candidate.is_file()
            and is_allowed_resource(resource_candidate)
        ):
            return str(resource_candidate)
        if is_relative_to(resource_candidate, resource_root) and resource_candidate.is_dir():
            return str(resource_candidate)
        return str(fallback)

    def send_profiles(self):
        names = set()
        for root in (self.resource_root, self.external_root):
            profile_root = root / PROFILE_DIRNAME
            if not profile_root.exists():
                continue
            for path in profile_root.iterdir():
                if path.is_file() and path.suffix.lower() in ALLOWED_PROFILE_SUFFIXES:
                    names.add(path.name)
        profiles = sorted(names, key=lambda name: (name != DEFAULT_PROFILE, name.lower()))
        payload = json.dumps(profiles, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


def main():
    mimetypes.add_type("application/vnd.iccprofile", ".icc")
    mimetypes.add_type("application/vnd.iccprofile", ".icm")

    port = choose_port()
    resources = resource_dir()
    external = external_dir()
    handler = functools.partial(AppHandler, resource_root=resources, external_root=external)
    server = ThreadingHTTPServer(("127.0.0.1", port), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    url = f"http://127.0.0.1:{port}/"
    print(f"{APP_NAME} ({APP_SIGNATURE})")
    print(f"Serving {url}")
    webbrowser.open(url)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        server.shutdown()


if __name__ == "__main__":
    main()
