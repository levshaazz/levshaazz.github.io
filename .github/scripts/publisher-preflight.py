"""Bound repeated publisher failures without declaring an unverified release successful.

Only trusted main uses this cache. It contains public source/run identifiers and
timestamps, never credentials, private source, student data or response bodies.
Manual dispatch and publisher changes always bypass the scheduled cooldown.
"""
import json
import os
from pathlib import Path
import re
import sys
import time
import urllib.error
import urllib.request

COOLDOWN = 24 * 60 * 60
SOURCE_API = "https://api.github.com/repos/levshaazz/llm-serving-mastery/commits/main"
SHA = re.compile(r"[0-9a-f]{40}")


class PublisherError(Exception):
    """Safe diagnostic: never includes a token or an API response body."""


def read_state(path):
    if not path.exists():
        return {}
    if path.stat().st_size > 4096:
        raise PublisherError("Publisher state exceeds its size limit")
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
        if (not isinstance(value, dict) or value.get("version") != 1
                or value.get("result") not in {"success", "failure"}
                or type(value.get("at")) is not int
                or not re.fullmatch(r"https://github\.com/levshaazz/levshaazz\.github\.io/actions/runs/[0-9]+", value.get("run_url", ""))
                or value.get("source_sha") is not None and not SHA.fullmatch(value["source_sha"])):
            raise ValueError()
        return value
    except (ValueError, TypeError):
        raise PublisherError("Invalid publisher state; inspect the cache") from None


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, sort_keys=True) + "\n", encoding="utf-8")


def source_head(token, opener=urllib.request.urlopen):
    if not token:
        raise PublisherError("COURSE_REPO_TOKEN is missing; restore private-source access")
    request = urllib.request.Request(SOURCE_API, headers={
        "Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json",
        "User-Agent": "course-publisher-preflight",
    })
    try:
        with opener(request, timeout=20) as response:
            body = response.read(1024 * 1024 + 1)
            if len(body) > 1024 * 1024:
                raise PublisherError("Private-source metadata exceeds its size limit")
        sha = json.loads(body)["sha"]
        if not isinstance(sha, str) or not SHA.fullmatch(sha):
            raise ValueError()
        return sha
    except urllib.error.HTTPError as error:
        if error.code in {401, 403, 404}:
            raise PublisherError(f"Private-source access failed (HTTP {error.code}); check COURSE_REPO_TOKEN expiry and repository permissions") from None
        raise PublisherError(f"Private-source metadata unavailable (HTTP {error.code})") from None
    except (urllib.error.URLError, TimeoutError, ValueError, KeyError):
        raise PublisherError("Private-source metadata unavailable or invalid") from None


def admission(state, event, now, get_head):
    cooling = (event == "schedule" and state.get("result") == "failure"
               and 0 <= now - state["at"] < COOLDOWN)
    # With broken access there is no reliable source SHA to compare. A manual
    # dispatch after rotating the secret retries immediately; the poll retries daily.
    if cooling and state.get("source_sha") is None:
        return {"allowed": False, "source_sha": None, "retry_failed": False}
    sha = get_head()
    if cooling and sha == state.get("source_sha"):
        return {"allowed": False, "source_sha": sha, "retry_failed": False}
    return {"allowed": True, "source_sha": sha,
            "retry_failed": state.get("result") == "failure" and sha == state.get("source_sha")}


def output(values):
    with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as handle:
        for key, value in values.items():
            handle.write(f"{key}={str(value).lower() if isinstance(value, bool) else value or ''}\n")


def main():
    folder = Path(".course-publisher")
    state_path, attempt_path = folder / "state.json", folder / "attempt.json"
    if sys.argv[1:] == ["preflight"]:
        state = read_state(state_path)
        attempt = {"blocked": False, "source_sha": None}
        write_json(attempt_path, attempt)
        decision = admission(state, os.environ["GITHUB_EVENT_NAME"], int(time.time()),
                             lambda: source_head(os.environ.get("COURSE_TOKEN")))
        attempt.update(blocked=not decision["allowed"], source_sha=decision["source_sha"])
        write_json(attempt_path, attempt)
        output(decision)
        if not decision["allowed"]:
            retry_at = time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime(state["at"] + COOLDOWN))
            message = ("Scheduled publication deferred after the recorded failure. "
                       f"Next automatic retry: {retry_at}. New source (when access works), "
                       "workflow changes or Run workflow retry immediately. "
                       "No checks ran and no release success was reported.")
            print("::warning::" + message)
            with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as handle:
                handle.write("### Publication deferred\n\n" + message + "\n\n"
                             + f"Original failed run: {state['run_url']}\n")
        else:
            print("Private-source access verified; publication admission passed")
    elif sys.argv[1:] == ["record"]:
        if not attempt_path.exists():
            return
        attempt = json.loads(attempt_path.read_text(encoding="utf-8"))
        if attempt["blocked"]:
            return  # Do not extend cooldown on every scheduled poll.
        result = os.environ["RESULT"]
        if result not in {"success", "failure", "cancelled"}:
            raise PublisherError("Unexpected publisher result")
        sha = os.environ.get("SOURCE_SHA") or attempt["source_sha"]
        if sha is not None and not SHA.fullmatch(sha):
            raise PublisherError("Invalid source SHA in publisher result")
        run = os.environ["GITHUB_RUN_ID"]
        if not run.isdecimal():
            raise PublisherError("Invalid publisher run ID")
        old = read_state(state_path)
        if result == "success" and old.get("result") == "success" and old.get("source_sha") == sha:
            return  # Ordinary unchanged polls do not create redundant cache entries.
        write_json(state_path, {"version": 1, "result": "success" if result == "success" else "failure",
                               "source_sha": sha, "at": int(time.time()),
                               "run_url": f"https://github.com/levshaazz/levshaazz.github.io/actions/runs/{run}"})
        output({"recorded": True})
    else:
        raise PublisherError("Use preflight or record")


if __name__ == "__main__":
    try:
        main()
    except PublisherError as error:
        print(f"::error::{error}", file=sys.stderr)
        raise SystemExit(1)
