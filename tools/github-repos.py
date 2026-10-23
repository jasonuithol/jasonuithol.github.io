#!/usr/bin/env python3
"""GitHub repos -> data/github-repos.json.

Lists the account's public, non-fork repos (minus this site's own repo) and,
for each, reads its full commit history: first and last commit dates, the
commit count, and the months that had at least one commit (so idle years
between bursts don't count as work). Plus GitHub's language breakdown.

Uses the `gh` CLI for auth, so run `gh auth login` first. Overwrites the
output file; hand-written blurbs and filter tags live in data/repo-notes.json.

    python3 tools/github-repos.py [owner] [out.json]
"""

import json
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


def commit_history(full_name):
    """(first commit date, last commit date, commit count, active months)
    on the default branch. Active months are "YYYY-MM", sorted."""
    out = gh("api", "--paginate", f"repos/{full_name}/commits?per_page=100",
             "--jq", ".[].commit.author.date")
    dates = sorted(line for line in out.split() if line)
    if not dates:
        return None, None, 0, []
    months = sorted({d[:7] for d in dates})
    return dates[0], dates[-1], len(dates), months


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
        first, last, count, months = commit_history(r["nameWithOwner"])
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
            "activeMonths": months,
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
