#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

for ((i=1; i<=$1; i++)); do
  echo "=== Iteration $i/$1 ==="

  result=$(docker sandbox run claude --permission-mode acceptEdits -p "\
  1. Run 'bd ready' to find the next available task. \
  2. If no tasks are ready, list open issues with 'bd list --status=open'. \
  3. Pick ONE task and implement it completely. \
  4. Run quality gates: bun run typecheck && bun run lint && bun run test. \
  5. Use jj to commit your changes (jj describe -m 'message'). \
  6. Close the completed task with 'bd close <id>'. \
  7. Run 'bd sync' to sync beads changes. \
  ONLY WORK ON A SINGLE TASK. Work is not complete until you run bd sync. \
  If there are no more tasks available, output <promise>COMPLETE</promise>.")

  echo "$result"

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo "All tasks complete after $i iterations."
    exit 0
  fi

  echo ""
done

echo "Completed $1 iterations. Check 'bd ready' for remaining work."
