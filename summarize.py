import os

def summarize_repo(root_dir="."):
    summary = []
    summary.append("# Repo Summary\n")

    # Collect metadata
    summary.append("## Overview\n")
    summary.append("Brief description of the repo purpose goes here.\n")

    # Walk through repo structure
    summary.append("## Structure\n")
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Skip hidden folders
        if any(part.startswith(".") for part in dirpath.split(os.sep)):
            continue
        indent = "  " * dirpath.count(os.sep)
        summary.append(f"{indent}- {os.path.basename(dirpath)}/")
        for f in filenames:
            if not f.startswith("."):
                summary.append(f"{indent}  - {f}")

    # Dependencies (optional: parse requirements.txt or package.json)
    if os.path.exists("requirements.txt"):
        summary.append("\n## Dependencies\n")
        with open("requirements.txt") as req:
            for line in req:
                summary.append(f"- {line.strip()}")

    if os.path.exists("package.json"):
        import json
        with open("package.json") as pkg:
            data = json.load(pkg)
            deps = data.get("dependencies", {})
            summary.append("\n## Dependencies\n")
            for dep, ver in deps.items():
                summary.append(f"- {dep}: {ver}")

    # Usage placeholder
    summary.append("\n## Usage\n")
    summary.append("Explain how to run or use the project here.\n")

    return "\n".join(summary)

if __name__ == "__main__":
    md_content = summarize_repo(".")
    with open("README-summary.md", "w") as f:
        f.write(md_content)
    print("README-summary.md generated!")
