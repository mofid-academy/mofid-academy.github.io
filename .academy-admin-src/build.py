"""Assemble the approved standalone Admin v2; never modify the candidate form."""
from pathlib import Path
import base64
import hashlib
import json
import re
import subprocess
import tempfile
import urllib.request

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
BASE_COMMIT = "26e3371375ba6c8ad2222ab1580eb9045ccef72b"
BASE_BLOB = "69f52ed5d49cedc7af2d9dc86b84a9ba402ac027"
EXPECTED_BUNDLE = "da6c98aa613a70d9ab321cabd8fcb5f4e6fa436ebc41975e2b016c7a5016758b"
VENDOR_SHA = "fdb08546776ec6228b03e8d02b40d4ab3255bae5f401adba7ff5dad927ac5c9c"


def checked(data, expected, label):
    actual = hashlib.sha256(data).hexdigest()
    if actual != expected:
        raise RuntimeError(f"Integrity check failed for {label}: {actual} != {expected}")
    return data


def text(name, digest, trailing=1):
    value = (HERE / name).read_text(encoding="utf-8").rstrip("\n") + "\n" * trailing
    if name == "template.html":
        # Repair a staging transcription typo, verified against the approved wrapper.
        value = value.replace("solid(var(--line))", "solid var(--line)")
    return checked(value.encode("utf-8"), digest, name).decode("utf-8")


def main():
    form = ROOT / "Academy-Exam/index.html"
    before = form.read_bytes()
    baseline = subprocess.check_output(["git", "show", BASE_COMMIT + ":Academy-Exam/index.html"], cwd=ROOT)
    blob = hashlib.sha1(b"blob " + str(len(baseline)).encode() + b"\0" + baseline).hexdigest()
    if blob != BASE_BLOB:
        raise RuntimeError("The approved offline reference does not match its Git blob.")
    local_vendor = HERE / "acorn-vendor.js"
    if local_vendor.is_file():
        vendor = local_vendor.read_bytes()
    else:
        url = "https://cdn.jsdelivr.net/npm/acorn@8.15.0/dist/acorn.js"
        request = urllib.request.Request(url, headers={"User-Agent": "Academy-Admin-Reproducible-Build"})
        with urllib.request.urlopen(request, timeout=40) as response:
            vendor = response.read(500000)
    checked(vendor, VENDOR_SHA, "Acorn 8.15.0")
    license_text = text("acorn-license.txt", "3278e1e84cf384d2d9a122392710881a7e2195c6e535bd84fc855990e7df3d27")
    app = "".join([
        text("app-1.js", "a0bcef8797e1dbd88278d9436134d6fa3f04405ba1e5b23fd71d60ffe9e7e40d"),
        text("app-2.js", "841749bec260c558ed7739b9d4620a89e49382280979efed441ff35319c25b36"),
        text("app-3.js", "f11c1d4992354e0b13c43a194efa94071466a68264205960dd205006106e5e86"),
    ]).replace("__ACADEMY_OFFLINE_BASE64__", base64.b64encode(baseline).decode("ascii"))
    modules = {
        "ACORN": license_text + vendor.decode("utf-8"),
        "QUESTIONS": text("questions.js", "c9eca4d1b60f3c58a09b592030b602e73ee53c14f0bf972505bb838dcdf43ba2"),
        "MODEL": text("model.js", "9d4d6ef6e08e76fd5359513c8d1f4c0d8c9fd7621bc50f9aa57aea78f4c89cdf"),
        "PREVIEW": text("preview.js", "a48743474b177f804fc86b1cc298d560c97ddc4096b8cc1952c9699100626775", 0),
        "APP": app,
    }
    html = text("template.html", "e1742715e3f802565df3e617687bd8157fc405fd648cb38a4c63ecf34fdfa3e3", 0)
    for name in modules:
        marker = "__ACADEMY_" + name + "__"
        if html.count(marker) != 1:
            raise RuntimeError("Missing or duplicate bundle marker: " + marker)
    html = re.sub(r"__ACADEMY_(ACORN|QUESTIONS|MODEL|PREVIEW|APP)__",
                  lambda match: modules[match.group(1)], html)
    output = checked(html.encode("utf-8"), EXPECTED_BUNDLE, "approved Admin v2 HTML")
    with tempfile.TemporaryDirectory() as tmp:
        for name, source in modules.items():
            js = Path(tmp) / (name.lower() + ".js")
            js.write_text(source, encoding="utf-8")
            subprocess.run(["node", "--check", str(js)], check=True, timeout=20)
    destination = ROOT / "Academy-Exam/Admin"
    destination.mkdir(parents=True, exist_ok=True)
    (destination / "index.html").write_bytes(output)
    report = {
        "version": "Academy Studio 2",
        "path": "/Academy-Exam/Admin/",
        "bundle_sha256": EXPECTED_BUNDLE,
        "bytes": len(output),
        "offline_reference_blob": BASE_BLOB,
        "candidate_blob_at_build": hashlib.sha1(b"blob " + str(len(before)).encode() + b"\0" + before).hexdigest(),
        "scripts_syntax_checked": len(modules),
        "publication_requires_github_write_permission": True,
        "custom_question_submissions_require_n8n_setup": True,
    }
    (destination / "build-info.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    if form.read_bytes() != before:
        raise RuntimeError("Candidate form changed during Admin build.")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
