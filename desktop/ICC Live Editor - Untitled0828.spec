# -*- mode: python ; coding: utf-8 -*-

from pathlib import Path


ROOT = Path.cwd()
WEB_ROOT = ROOT / "build" / "web"
LAUNCHER = ROOT / "launcher.py"
VERSION_FILE = ROOT / "desktop" / "version_info.txt"
ICON_FILE = ROOT / "assets" / "icons" / "favicon.ico"

datas = []
for path in WEB_ROOT.rglob("*"):
    if not path.is_file():
        continue
    destination = path.relative_to(WEB_ROOT).parent.as_posix()
    datas.append((str(path), "." if destination == "." else destination))


a = Analysis(
    [str(LAUNCHER)],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='ICC Live Editor - Untitled0828',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=str(ICON_FILE),
    version=str(VERSION_FILE),
)
