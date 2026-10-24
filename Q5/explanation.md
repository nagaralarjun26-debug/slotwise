# Question 5: vi Recovery Mechanisms After a Crash

## Scenario
A software developer is editing a critical configuration file using `vi`. During editing,
the system crashes before the file is saved. This document evaluates the recovery
mechanisms available in vi/vim and proposes the most reliable recovery strategy.

## Recovery Mechanisms Compared

| Mechanism | How it works | Reliability after a crash |
|---|---|---|
| **Swap file (`.filename.swp`)** | vi periodically writes unsaved buffer changes to a hidden swap file in the same directory. On restart, `vi -r filename` (or plain `vi filename`) detects and offers to recover from it. | **Highest reliability** for crash recovery — captures changes made *since the last save*, which is exactly what is lost in a crash. |
| **Undo history (`.filename.un~` / persistent undo)** | If `set undofile` is enabled in `.vimrc`, vim saves the undo tree to disk, allowing undo across sessions. | Useful for reverting *saved* changes after reopening, but only if persistent undo was explicitly enabled beforehand — not enabled by default. |
| **Registers** | Hold copied/deleted/yanked text in memory during a session (e.g., `"a`, `"0`). | Lost entirely on crash since registers are **not persisted to disk** by default — not useful for crash recovery. |
| **Backup files (`filename~`)** | If `set backup` is enabled, vi saves a copy of the file *before* the last write. | Only protects against a bad *save* overwriting a good version — does not recover unsaved edits present at the time of the crash. |
| **Auto-recovery (`vi -r`)** | Automatically checks for a matching swap file when reopening the same filename and prompts the user to recover. | This is the *mechanism* that actually uses the swap file — effectively the same protection as above, just the recovery workflow/command. |

## Demonstration Commands

```bash
vi criticalconfig.conf
# (make edits, then simulate a crash: kill -9 <vi_pid> or close the terminal forcibly)

vi -r criticalconfig.conf     # reopen and recover from swap file
:recover                      # alternative in-session recovery command

diff criticalconfig.conf.swp criticalconfig.conf   # inspect what differs
```

**Explanation:** Running `vi -r criticalconfig.conf` after the crash causes vi to detect
the leftover `.criticalconfig.conf.swp` file and prompt to recover the unsaved buffer,
restoring the edits that existed right before the crash. Comparing the recovered
version with the last saved version using `diff` confirms exactly what was recovered.

## Evaluation

Registers and standard backup files are **not reliable** for this scenario: registers
vanish the moment the process dies, and backup files (`filename~`) only protect against
overwriting a good version during a *save* operation — they do nothing for unsaved work
lost during a *crash*. Persistent undo history helps for reverting to earlier *saved*
states later, but it does not capture unsaved, in-progress edits either, unless it was
proactively enabled beforehand.

## Recommended Strategy

**The swap file combined with vi's auto-recovery (`vi -r`) is the most reliable
strategy**, because it is the only mechanism specifically designed to capture the
in-progress, unsaved state of the editing buffer at short, regular intervals — which is
precisely the data lost in a crash.

Recommended recovery workflow:
1. Reopen the file with `vi -r filename` (or plain `vi filename`, which auto-detects the
   swap file and prompts for recovery).
2. Review the recovered content against the last saved version using `diff`.
3. Save the recovered version, then remove the stale `.swp` file to avoid future
   "swap file already exists" warnings on the next edit.

For long-term protection beyond a single crash, this should be paired with **regular
manual saves (`:w`)** and enabling **persistent undo** (`set undofile` in `.vimrc`),
since no single mechanism alone covers both "unsaved edits at the moment of a crash"
and "the ability to revert further back in edit history."

## Screenshots
- `screenshots/01_editing_before_crash.png` — editing `criticalconfig.conf` in vi's insert
  mode before the simulated crash (change not yet saved with `:w`)
- `screenshots/02_swap_file_recovery_prompt.png` — reopening the file with `vi -r`, showing
  vi's `E325: ATTENTION` prompt detecting the leftover swap file and offering recovery
- `screenshots/03_recovery_completed_and_cleanup.png` — the buffer after recovery
  (showing the unsaved line restored), saving with `:w`, and removing the stale `.swp` file

## Files in this folder
- `explanation.md` — this write-up
- `screenshots/` — illustrative screenshots of the crash/recovery workflow
