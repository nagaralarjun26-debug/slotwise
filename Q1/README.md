# Question 1: Duplicate Submission Detection & Backup

## Design Overview
`submission_manager.sh` scans a directory of student submissions, uses MD5 checksums
to detect duplicate file content (regardless of filename), backs up only unique files,
and produces a report of totals while logging any errors separately.

## Commands Executed & Explanations

```bash
mkdir submissions
```
Created the directory to hold sample student submission files for testing the script.

```bash
# (5 sample .txt files placed into submissions/, 2 of which are duplicate content
#  of another file under a different filename)
```
Simulated a realistic scenario where different students submit files with the same
content but different names — the kind of duplication `md5sum` should catch that a
simple filename comparison would miss.

```bash
ln -s /nonexistent/missing_original.txt submissions/student_F_asg1.txt
```
Added a **genuinely broken submission** (a dangling symlink pointing to a file that
doesn't exist) to simulate a corrupted or incompletely-uploaded student file. This is
what actually exercises the error-handling path — a clean batch of files alone produces
no errors, which wouldn't demonstrate that the error-logging path works.

```bash
chmod +x submission_manager.sh
```
Gave the script execute permission so it can be run directly with `./submission_manager.sh`.

```bash
./submission_manager.sh
```
Executed the script. It hashed each readable file's content with `md5sum`, compared
hashes against previously seen ones using an associative array, copied unique files into
`backup_unique/`, and logged the unreadable/broken submission separately.

```bash
cat report.txt
```
Displayed the summary. Output confirmed: **6 total files processed** (5 valid + 1
broken), **2 duplicates found, 3 unique files backed up**.

```bash
cat errors.log
```
Confirmed the error log now genuinely contains an entry —
`Error: cannot read submission (missing/broken/unreadable): ./submissions/student_F_asg1.txt`
— proving the script correctly detects and separately logs unreadable submissions
instead of silently skipping or crashing on them.

```bash
ls backup_unique/
```
Confirmed only the 3 unique, successfully-read files (`student_A_asg1.txt`,
`student_C_asg1.txt`, `student_E_asg1.txt`) were backed up. The two duplicates were
correctly excluded, and the broken submission was excluded too since it never produced
a valid hash.

### A note on script correctness
The first version of this script checked `[ -f "$file" ]` before processing each entry.
That check silently **skipped** dangling symlinks entirely (`-f` follows symlinks and is
false for a broken one), so a corrupted submission would vanish from processing without
ever reaching the error-logging code — an unreadable file should be *counted and logged*,
not ignored. The script was corrected to check `[ -e "$file" ] || [ -L "$file" ]` (so
broken symlinks are still picked up) followed by an explicit `[ ! -r "$file" ]`
readability check that logs the failure to `errors.log` before moving on. This is why
`errors.log` is now genuinely populated in this submission.

## Justification of Commands, Redirection Operators, and Techniques

- **`[ -e "$file" ] || [ -L "$file" ]` followed by `[ ! -r "$file" ]`**: Detects and
  counts *every* entry in the submissions folder — including broken symlinks — rather
  than silently skipping unreadable ones the way a plain `[ -f "$file" ]` test would.
  Unreadable submissions are logged to `errors.log` and excluded from hashing/backup,
  so a single corrupted file can't crash or silently drop out of the batch.
- **`md5sum`**: Used to fingerprint file *content* rather than filenames, so duplicates
  are detected even if a student renames their submission.
- **Associative array (`declare -A`)**: Acts as an in-memory hash table mapping each
  checksum to the first file that produced it, giving O(1) duplicate lookups instead of
  comparing every file against every other file (O(n²)).
- **`cp` instead of `mv`**: Keeps the original submissions folder untouched — the
  backup is non-destructive, which matters for an audit trail of hundreds of student
  submissions.
- **Redirection operators**:
  - `>` truncates/initializes `report.txt` and `errors.log` at the start of each run so
    old data doesn't leak into a fresh report.
  - `>>` appends subsequent output without overwriting earlier lines in the same run.
  - `2>>` redirects **stderr only** (e.g., from a failed `md5sum` or `cp`) into
    `errors.log`, keeping error output cleanly separated from the normal report —
    standard Linux practice of treating stdout and stderr as distinct streams.
- **`tee -a`**: Used for the "Starting..." message so it is shown on screen live **and**
  simultaneously logged to the report file, without needing two separate commands.

## Screenshots
- `screenshots/01_setup_submissions.png` — creating the test directory and sample files, then making the script executable
- `screenshots/02_run_script.png` — running `submission_manager.sh`
- `screenshots/03_report_and_errors.png` — viewing `report.txt` and `errors.log`
- `screenshots/04_backup_verification.png` — confirming only unique files were backed up

## Files in this folder
- `submission_manager.sh` — the script
- `submissions/` — sample input files (including duplicates)
- `backup_unique/` — output: unique files backed up
- `report.txt` — output: processing summary
- `errors.log` — output: error log (contains one entry for the intentionally broken submission)
- `screenshots/` — command execution screenshots
