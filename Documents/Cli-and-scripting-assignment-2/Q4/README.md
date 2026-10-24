# Question 4: Real-Time Log Monitoring Pipeline

## Design Overview
`monitor_log.sh` continuously watches a growing log file, filters out only `ERROR`
lines in real time, displays them live, and simultaneously appends them to a persistent
report file — while suppressing irrelevant/harmless stderr noise.

## Commands Executed & Explanations

```bash
chmod +x monitor_log.sh
touch system.log
```
Ensured the log file exists and the script is executable before monitoring begins,
avoiding a "file not found" error from `tail`.

```bash
./monitor_log.sh   # started in the background for this test / normally run in Terminal 1
```
Started real-time monitoring. The pipeline stayed active and continuously watched
`system.log` for new lines, printing only ERROR lines as they were appended.

```bash
echo "$(date) INFO: Server started" >> system.log
echo "$(date) ERROR: Disk space low" >> system.log
echo "$(date) ERROR: Connection timeout" >> system.log
echo "$(date) INFO: Request handled" >> system.log
echo "$(date) ERROR: Database connection failed" >> system.log
```
Simulated a live application writing log entries (normally run from a second terminal).
As each line was appended, the monitor picked it up immediately: the two `INFO` lines
were ignored, while all three `ERROR` lines appeared in the monitor's live output within
about half a second of being written — confirming true real-time filtering rather than
batch processing.

```bash
cat error_report.txt
```
Verified that all three ERROR messages were also permanently saved to a separate report
file (`error_report.txt`), not just displayed on screen, satisfying the "maintain a
separate report file" requirement.

## Explanation of the Pipeline Design

- **`tail -f`**: Continuously monitors the log file for newly appended lines rather than
  reading it once and exiting — this is what makes "real time" monitoring possible on a
  file that a running application keeps writing to.
- **Pipe (`|`)**: Streams `tail -f`'s output directly into `grep` without creating any
  intermediate temporary files, so filtering happens on the fly with minimal memory and
  disk overhead — the Unix philosophy of connecting small tools via streams.
- **`grep --line-buffered "ERROR"`**: Filters for only error lines. The
  `--line-buffered` flag forces `grep` to flush its output after every line instead of
  waiting to fill an internal block buffer, which is essential in a live pipeline —
  without it, output could lag or arrive in delayed batches instead of immediately.
- **`tee -a`**: Splits the filtered stream two ways simultaneously — showing it live on
  the terminal **and** appending it to the persistent `error_report.txt` file — meeting
  both the "real-time view" and "separate report file" requirements with a single
  command instead of duplicating the pipeline.
- **`2>/dev/null`**: Redirects `tail`'s stderr (e.g., harmless warnings if the file is
  briefly rotated or temporarily inaccessible) to the null device, discarding it
  entirely. This keeps the terminal output clean of irrelevant noise, satisfying the
  "suppress unnecessary output" requirement.

This design is efficient because each stage processes data as a continuous **stream**
with no intermediate files and a low memory footprint, and each tool does exactly one
job (Unix philosophy): `tail` for real-time reading, `grep` for filtering, `tee` for
dual-output, and `/dev/null` for suppression.

## Screenshots
- `screenshots/01_terminal1_monitor_running.png` — Terminal 1: the monitor script actively streaming filtered ERROR lines
- `screenshots/02_terminal2_simulated_activity.png` — Terminal 2: simulated log writes from "another process"
- `screenshots/03_verify_report_vs_full_log.png` — comparing `error_report.txt` (ERROR-only) against the full `system.log`

## Files in this folder
- `monitor_log.sh` — the pipeline script
- `system.log` — sample log file with simulated INFO/ERROR entries
- `error_report.txt` — output: only the ERROR lines, captured persistently
- `monitor_output.txt` — captured terminal output from the monitor while running
- `screenshots/` — command execution screenshots (from both simulated terminals)
