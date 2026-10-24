# Question 2: Preventing Zombie Processes & Terminating Unresponsive Children

## Design Overview
`process_manager.c` forks 3 child processes. Two finish quickly (simulating normal
requests); one is deliberately made to sleep far longer (simulating an unresponsive
child). The parent monitors all children with `waitpid(..., WNOHANG)` to reap finished
children immediately (preventing zombies), and after a timeout, sends `SIGTERM` (and
`SIGKILL` if needed) to any child still running.

## Commands Executed & Explanations

```bash
gcc process_manager.c -o process_manager
```
Compiled the C source into an executable using GCC. Compilation succeeded with no
warnings or errors.

```bash
./process_manager
```
Ran the program. Observed output showing:
- The parent forking 3 children and printing each child's PID.
- Children 0 and 2 (fast tasks) finished within ~2 seconds and were immediately
  **reaped** by the parent's `waitpid(WNOHANG)` loop — printed as
  "Reaped child PID ... (avoided zombie)".
- Child 1 (deliberately slow) was still running after the 5-second timeout, so the
  parent sent it `SIGTERM` to terminate it gracefully.
- Final line "All children handled. No zombies remain." confirmed the loop completed
  and every child was accounted for.

```bash
ps aux | grep defunct
```
Checked (in a separate terminal, while the program was running) for any zombie
(`<defunct>`) processes. None were found, confirming that `waitpid()` successfully
reaped every child — including the one that had to be forcibly terminated — instead of
leaving it as a zombie entry in the process table.

## Explanation: How fork(), wait(), and Signals Work Together

- **`fork()`** duplicates the calling process, creating an independent child that runs
  the same program but can take a different code path (here, each child runs
  `child_task()` with a different simulated workload).
- **`waitpid(pid, &status, WNOHANG)`** performs a *non-blocking* check on a specific
  child. Using `WNOHANG` lets the parent poll all children in a loop without stalling on
  any single one — critical for a server handling many concurrent children. As soon as a
  child exits, `waitpid()` reaps it, removing its zombie entry from the process table
  immediately rather than after all children finish.
- **Signal handling (`SIGTERM` → `SIGKILL`)**: `SIGTERM` is sent first because it is a
  *catchable* signal that gives the target process a chance to shut down gracefully
  (close files, flush buffers, etc.). If the child is truly unresponsive and ignores
  `SIGTERM`, the parent escalates to `SIGKILL`, which the kernel delivers unconditionally
  and cannot be caught, blocked, or ignored — guaranteeing termination.
- Together these three mechanisms form a **complete process lifecycle**: creation
  (`fork`) → non-blocking monitoring (`waitpid` + `WNOHANG`) → graceful termination
  attempt (`SIGTERM`) → forced termination if needed (`SIGKILL`) → final reap
  (`waitpid` blocking call after `SIGKILL`). This is the same general pattern used by
  real web servers (e.g., pre-forking models like Apache's prefork MPM) to prevent
  runaway child processes from exhausting system resources or leaving zombies behind.

## Screenshots
- `screenshots/01_compile.png` — compiling with `gcc` and confirming a clean exit code
- `screenshots/02_run_process_manager.png` — running the program and observing forking, reaping, and `SIGTERM` handling
- `screenshots/03_verify_no_zombies.png` — checking `ps aux | grep defunct` to confirm no zombies remained

### A note on a real buffering bug found while testing
The first version of this program produced **duplicated** "Parent created child ..."
lines in `output.txt` when stdout was redirected to a file (as opposed to a terminal).
This is a classic `stdio`-buffering-across-`fork()` gotcha: when stdout isn't a TTY, C
switches to full buffering, so text printed by the parent before a child's `fork()` call
can still be sitting unflushed in the buffer. `fork()` duplicates that buffer into the
child's memory space, so when the child later calls `exit()` (which flushes stdio
buffers), it flushes its own **copy** of the parent's still-unflushed text too —
producing duplicate output. The fix was to call `setvbuf(stdout, NULL, _IOLBF, 0)` at
the very start of `main()`, forcing line-buffered output regardless of whether stdout is
a terminal or a file, so each line is flushed immediately after it's printed and never
sits around to be duplicated by a child. `output.txt` and the screenshots reflect the
corrected, non-duplicated output.

## Files in this folder
- `process_manager.c` — the source code
- `process_manager` — compiled executable
- `output.txt` — captured program output from a sample run
- `screenshots/` — command execution screenshots
