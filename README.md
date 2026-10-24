# Graded Lab Assignment (Modules 5–10)

This repository contains the complete solutions for all 5 questions of the graded lab
assignment. Each question has its own folder containing the commands/scripts/code,
the actual outputs produced, and explanations after each command as required.

## Repository Structure

```
.
├── Q1/   Duplicate submission detection & backup (Shell script)
│   ├── submission_manager.sh
│   ├── submissions/         (sample input files, incl. one intentionally broken)
│   ├── backup_unique/       (output: unique files)
│   ├── report.txt           (output: summary report)
│   ├── errors.log           (output: error log)
│   ├── screenshots/         (command execution screenshots)
│   └── README.md            (commands + explanations)
│
├── Q2/   Zombie-process prevention & signal handling (C program)
│   ├── process_manager.c
│   ├── process_manager       (compiled binary)
│   ├── output.txt            (sample run output)
│   ├── screenshots/          (command execution screenshots)
│   └── README.md             (commands + explanations)
│
├── Q3/   File processing with Linux system calls (C program)
│   ├── employee_records.c
│   ├── employee_records      (compiled binary)
│   ├── employees.dat         (binary data file produced)
│   ├── output.txt            (sample run output)
│   ├── hexdump.txt           (od -c inspection of the binary file)
│   ├── screenshots/          (command execution screenshots)
│   └── README.md             (commands + explanations)
│
├── Q4/   Real-time log monitoring pipeline (Shell/command pipeline)
│   ├── monitor_log.sh
│   ├── system.log            (sample log with INFO/ERROR entries)
│   ├── error_report.txt      (output: filtered ERROR entries)
│   ├── monitor_output.txt    (captured live terminal output)
│   ├── screenshots/          (command execution screenshots)
│   └── README.md             (commands + explanations)
│
└── Q5/   vi recovery mechanisms after a crash (Written evaluation)
    ├── explanation.md
    └── screenshots/           (illustrative recovery-workflow screenshots)
```

## How to Use This Repository

Each `Qn/README.md` documents:
1. The exact commands executed.
2. The observed output.
3. A 1–2 sentence explanation of what was done and observed after each command.
4. A justification section covering the relevant Linux concepts, commands, and
   redirection/system-call techniques used.

Each `Qn/screenshots/` folder contains terminal screenshots for the commands and
outputs documented in that folder's README. For Q1–Q4, screenshots correspond exactly
to real commands that were executed and whose actual output is shown. For Q5 (a
written evaluation of vi crash recovery, where no script produces output to capture),
the screenshots are illustrative reconstructions of the standard vi swap-file recovery
workflow (`vi -r`, the `E325: ATTENTION` prompt, and post-recovery cleanup) to visually
support the written explanation.

**Note:** If your instructor requires screenshots taken directly from your own machine
rather than reconstructed terminal captures, simply run the same commands shown in each
`README.md` on your own Linux system/VM and replace the images in the corresponding
`screenshots/` folder — the commands and expected output are already documented for you.

## Notes From Testing

Every script and program in this repository was actually executed (not just written)
to produce the outputs and screenshots included here. That process surfaced two real
bugs worth being aware of, both documented in their respective folder's README:

- **Q1**: The original duplicate-detection script used `[ -f "$file" ]` to identify
  submissions, which silently skips broken symlinks (a realistic stand-in for a
  corrupted/incomplete upload) instead of logging them as errors. Fixed to detect and
  log unreadable submissions explicitly — see `Q1/README.md`.
- **Q2**: The original process-manager program produced duplicated log lines when
  stdout was redirected to a file, due to a classic `stdio`-buffering-across-`fork()`
  issue. Fixed with `setvbuf(stdout, NULL, _IOLBF, 0)` — see `Q2/README.md`.

## Summary of Each Solution

| Question | Topic | Key Techniques |
|---|---|---|
| Q1 | Duplicate submission detection & backup | `md5sum`, associative arrays, `cp`, `>`/`>>`/`2>>` redirection, `tee` |
| Q2 | Preventing zombie processes in a web server | `fork()`, `waitpid(WNOHANG)`, `SIGTERM`/`SIGKILL` |
| Q3 | Secure file processing with system calls | `open()`, `read()`, `write()`, `lseek()`, `close()` |
| Q4 | Real-time log monitoring | `tail -f`, pipes, `grep --line-buffered`, `tee -a`, `/dev/null` |
| Q5 | vi crash recovery | Swap files, `vi -r`, undo history, backup files, registers |
