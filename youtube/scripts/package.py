"""Build console-editable classroom ZIPs using Lambda's included AWS SDK v3."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path(__file__).resolve().parents[1]
for name in ("user", "song", "playlist", "frontend"):
    folder = root / name
    with ZipFile(folder / "index.zip", "w", ZIP_DEFLATED) as archive:
        for path in sorted(folder.iterdir()):
            if path.suffix in (".mjs", ".html", ".css", ".js"):
                archive.write(path, path.name)
    print(f"Built {name}/index.zip")
