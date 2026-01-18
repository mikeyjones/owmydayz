#!/bin/bash

claude --permission-mode acceptEdits "\
1. Run 'bd ready' to find the next available task. \
2. If no tasks are ready, list open issues with 'bd list --status=open'. \
3. Pick ONE task and implement it completely. \
4. Use jj to commit your changes (jj describe -m 'message'). \
5. Close the completed task with 'bd close <id>'. \
6. Run 'bd sync' to sync beads changes. \
ONLY DO ONE TASK AT A TIME. Work is not complete until you run bd sync."
