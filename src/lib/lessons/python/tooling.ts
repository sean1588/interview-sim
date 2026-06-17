import type { Lesson } from "../types";

export const toolingLessons: Lesson[] = [
  {
    id: "venvs-and-packages",
    module: "tooling",
    title: "Virtual Environments and Packages",
    blurb: "venv, pip, and pyproject vs npm / go mod / maven.",
    content: `Python has no \`node_modules\` and no per-project dependency wall by default. \`pip install requests\` drops the package into the **global** interpreter, where it's shared across every project on the machine. That's the problem virtual environments solve: a venv is a throwaway copy of the interpreter with its own isolated \`site-packages\` directory. Think of it as making \`node_modules\` an explicit, manual step instead of an automatic one.

\`\`\`bash
python -m venv .venv          # create ./.venv
source .venv/bin/activate     # Unix; Windows: .venv\\Scripts\\activate
\`\`\`

Once activated, your shell's \`python\` and \`pip\` point inside \`.venv\`. There's no global resolution algorithm walking up parent directories like Node does — activation just rewrites \`$PATH\`. Run \`deactivate\` to leave. Gitignore \`.venv/\`; it's machine-specific, like \`node_modules\`.

## Installing and pinning

\`\`\`bash
pip install requests
pip freeze > requirements.txt   # exact pins of EVERYTHING installed
pip install -r requirements.txt # reproduce on another machine
\`\`\`

\`requirements.txt\` is the old-school manifest, but note the gap versus \`package.json\`: it has no notion of *direct* vs *transitive* deps and no lockfile/manifest split. \`pip freeze\` dumps the whole flattened tree, so you can't tell what you asked for from what got pulled in.

## pyproject.toml — the modern manifest

\`pyproject.toml\` is Python's \`package.json\`/\`go.mod\`/\`pom.xml\` equivalent: a single declarative file for metadata and dependencies.

\`\`\`toml
[project]
name = "my-app"
version = "0.1.0"
dependencies = ["requests>=2.31", "rich"]
\`\`\`

You declare *intent* here (the loose constraints) and let a tool resolve and lock exact versions — the manifest/lockfile split that \`package.json\` + \`package-lock.json\` gives you.

## uv and poetry

Raw \`pip\` + \`venv\` works but is clunky. The modern stack:

- **uv** — a Rust-based, extremely fast all-in-one tool. \`uv venv\`, \`uv add requests\`, \`uv sync\`, \`uv run script.py\`. It manages the venv, resolves deps, writes a \`uv.lock\`, and even installs Python versions. This is the closest thing to \`npm\`/\`cargo\` ergonomics Python has, and it's where the ecosystem is heading.
- **poetry** — the established predecessor: \`poetry add\`, \`poetry install\`, \`poetry.lock\`. Manifest+lock done right, slower than uv.

## Cross-language cheat sheet

| Concept | Node | Go | Java | Python (modern) |
| --- | --- | --- | --- | --- |
| Manifest | package.json | go.mod | pom.xml | pyproject.toml |
| Lockfile | package-lock.json | go.sum | (Gradle locks) | uv.lock / poetry.lock |
| Isolation | node_modules (auto) | module cache | local repo | venv (manual) |
| Install all | npm install | go mod download | mvn install | uv sync |

**Pythonic default in 2026:** reach for \`uv\`. Use raw \`venv\` + \`pip\` + \`requirements.txt\` only for tiny scripts or when a project predates the tooling.`,
    exercises: [],
  },
  {
    id: "project-layout-tooling",
    module: "tooling",
    title: "Project Layout and Tooling",
    blurb: "src layout, packages, and ruff/black/mypy.",
    content: `Python has no build step and no compiler enforcing structure, so layout and tooling are conventions you opt into — but the idiomatic ones are well established.

## The src/ layout

A mature Python project puts importable code under \`src/\`:

\`\`\`
my-app/
  pyproject.toml
  src/
    my_app/
      __init__.py
      core.py
  tests/
    test_core.py
\`\`\`

Why \`src/\`? It forces you to **install** your package (\`pip install -e .\`) before importing it, so tests run against the same import path users get — not against loose files that happen to sit in the working directory. A flat layout silently imports from CWD and hides packaging bugs. \`src/\` is the equivalent of Go forcing code into a module path or Java's \`src/main/java\`.

## Packages and __init__.py

A directory becomes a **package** when it's importable as a dotted path. \`__init__.py\` marks a directory as a package and runs when the package is first imported — it's the closest analog to a Go package's collected files or a JS \`index.ts\` barrel. It's often empty; use it to expose a clean public API:

\`\`\`python
# src/my_app/__init__.py
from my_app.core import run
__all__ = ["run"]
\`\`\`

Imports resolve against entries on \`sys.path\` (which includes installed packages and, for scripts, the script's directory) — there is no upward directory walk like Node's \`node_modules\` resolution. Prefer **absolute imports** (\`from my_app.core import run\`); relative imports (\`from .core import run\`) work but read worse across a large tree.

## The lint / format / type stack

Unlike TypeScript, none of this is bundled — you assemble it. The 2026 idiomatic stack:

- **ruff** — linter (and now formatter). A Rust-based replacement for flake8/isort/pyflakes/pylint that's orders of magnitude faster. This is your \`eslint\`.
  \`\`\`bash
  ruff check .        # lint
  ruff format .       # format (black-compatible)
  \`\`\`
- **black** — the opinionated, near-zero-config formatter. Your \`prettier\`/\`gofmt\`. Ruff's formatter is black-compatible, so many projects now use ruff for both and drop black.
- **mypy** — the static type checker. Python's type hints are *not* enforced at runtime; mypy is the separate \`tsc\`-style pass that actually checks them. (Alternatives: \`pyright\`, \`ty\`.)
  \`\`\`bash
  mypy src/
  \`\`\`

Key mental shift from TS: types are hints, ignored by the runtime. Checking them is a deliberate, separate command — there's no single tool that bundles transpile + typecheck the way \`tsc\` does.

## pre-commit

\`pre-commit\` is a git-hook manager that runs ruff/black/mypy automatically before each commit, configured in \`.pre-commit-config.yaml\`. It's how teams keep the stack from being optional — the analog to a \`lint-staged\` + \`husky\` setup, but language-agnostic and the Python community standard.

\`\`\`bash
pre-commit install   # wire up the git hook once
pre-commit run --all-files
\`\`\`

**Pythonic default:** \`src/\` layout, absolute imports, \`pyproject.toml\` configuring \`ruff\` + \`mypy\`, enforced via \`pre-commit\`.`,
    exercises: [],
  },
];
