#!/usr/bin/env python3
"""GitHub repos -> data/github-repos.json.

Lists the account's public, non-fork repos (minus this site's own repo) and,
for each, reads its commit history for the first and last commit dates and
the commit count, plus GitHub's language breakdown.

Uses the `gh` CLI for auth, so run `gh auth login` first. Overwrites the
output file; hand-written blurbs and filter tags live in data/repo-notes.json.

    python3 tools/github-repos.py [owner] [out.json]
"""

import json
import re
import subprocess
import sys
from datetime import datetime, timezone

OWNER = sys.argv[1] if len(sys.argv) > 1 else "jasonuithol"
OUT = sys.argv[2] if len(sys.argv) > 2 else "data/github-repos.json"
SKIP = {f"{OWNER}.github.io"}


def gh(*args):
    return subprocess.run(["gh", *args], check=True, capture_output=True, text=True).stdout


def api(path):
    return json.loads(gh("api", path))


def commit_date(commit):
    return commit["commit"]["author"]["date"]


def commit_span(full_name):
    """(first commit date, last commit date, commit count) on the default branch.

    With per_page=1 the last page number is the commit count, and that page
    holds the oldest commit.
    """
    out = gh("api", "-i", f"repos/{full_name}/commits?per_page=1")
    head, _, body = out.partition("\r\n\r\n")
    if not body:
        head, _, body = out.partition("\n\n")
    newest = json.loads(body)
    if not newest:
        return None, None, 0
    m = re.search(r'[?&]page=(\d+)>; rel="last"', head)
    if not m:
        return commit_date(newest[0]), commit_date(newest[0]), 1
    count = int(m.group(1))
    oldest = api(f"repos/{full_name}/commits?per_page=1&page={count}")
    return commit_date(oldest[0]), commit_date(newest[0]), count


def main():
    repos = json.loads(gh(
        "repo", "list", OWNER, "--visibility", "public", "--no-archived",
        "--source", "--limit", "500",
        "--json", "name,nameWithOwner,url,description,repositoryTopics"))
    result = []
    for r in sorted(repos, key=lambda r: r["name"].lower()):
        if r["name"] in SKIP:
            continue
        print(f"  {r['name']}", file=sys.stderr)
        first, last, count = commit_span(r["nameWithOwner"])
        languages = api(f"repos/{r['nameWithOwner']}/languages")
        result.append({
            "name": r["name"],
            "url": r["url"],
            "description": r["description"] or None,
            "topics": [t["name"] for t in (r["repositoryTopics"] or [])],
            "languages": languages,
            "firstCommit": first,
            "lastCommit": last,
            "commits": count,
        })
    data = {
        "source": f"https://github.com/{OWNER}",
        "scrapedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "repos": result,
    }
    with open(OUT, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"{len(result)} repos -> {OUT}", file=sys.stderr)


if __name__ == "__main__":
    main()
