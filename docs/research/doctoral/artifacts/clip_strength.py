"""Thm III helper — weak vs strong clip (mirrors createClipLoop)."""

from __future__ import annotations

import re


def is_strong_clip(
    title: str | None,
    summary: str | None,
    url: str | None = None,
    ambient_title: str | None = None,
) -> bool:
    raw = (summary or "").strip()
    stub = bool(
        re.match(r"^Clip hotkey", raw, re.I)
        or re.match(r"^Marked with clip", raw, re.I)
        or re.match(r"^Clipped while in\b", raw, re.I)
    )
    clip = "" if stub else re.sub(r"^Clipboard:\s*", "", raw, flags=re.I).strip()
    explicit = (title or "").strip()
    ambient = (ambient_title or "").strip()
    fallback = (
        not explicit
        or bool(re.match(r"^Clipped (while in|from)\b", explicit, re.I))
        or explicit == ambient
    )
    url_ok = bool(url) and len(ambient) >= 3
    return len(clip) >= 8 or url_ok or (len(explicit) >= 8 and not fallback)


if __name__ == "__main__":
    assert not is_strong_clip(
        "Clipped while in Norton", "Clip hotkey — mark current context as a loop"
    )
    assert is_strong_clip(
        None, "Clipboard: Please sign the lease addendum tonight"
    )
    print("clip_strength ok")
