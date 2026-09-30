"""Report actual public-publisher state on the private source commit; never log credentials."""
import json
import os
import re
import sys
import urllib.error
import urllib.request

state = sys.argv[1]
sha = os.environ["SOURCE_SHA"]
if state not in {"pending", "success", "failure"} or not re.fullmatch(r"[0-9a-f]{40}", sha):
    raise SystemExit("Invalid status input")
messages = {
    "pending": "Course checks and Pages delivery are running",
    "success": "All course gates passed; live Pages source SHA verified",
    "failure": "Course validation or delivery failed; inspect publisher run",
}
url = f"https://github.com/{os.environ['GITHUB_REPOSITORY']}/actions/runs/{os.environ['GITHUB_RUN_ID']}"
payload = {"state": state, "context": "course-pages", "description": messages[state], "target_url": url}
request = urllib.request.Request(
    f"https://api.github.com/repos/levshaazz/llm-serving-mastery/statuses/{sha}",
    data=json.dumps(payload).encode(),
    headers={"Authorization": f"Bearer {os.environ['COURSE_TOKEN']}", "Accept": "application/vnd.github+json", "Content-Type": "application/json"},
)
try:
    with urllib.request.urlopen(request, timeout=30) as response:
        if response.status != 201:
            raise SystemExit("Unexpected status reporting response")
except urllib.error.HTTPError as error:
    raise SystemExit(f"Commit status reporting failed: HTTP {error.code}; token needs source-repo commit-status write permission")
print(f"course-pages: {state} for {sha}")
