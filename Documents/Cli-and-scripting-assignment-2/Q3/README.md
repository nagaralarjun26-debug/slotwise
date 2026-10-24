# Question 3: Secure File Processing with Linux System Calls

## Design Overview
`employee_records.c` avoids stdio functions (`fopen`/`fprintf`) entirely and instead
uses raw system calls (`open`, `read`, `write`, `lseek`, `close`) to create a file,
write fixed-size employee records, update one record in place without rewriting the
whole file, and read back any record directly by its offset.

## Commands Executed & Explanations

```bash
gcc employee_records.c -o employee_records
```
Compiled the program. It links only against the C library's thin system-call wrappers
(no stdio buffering involved for file I/O).

```bash
./employee_records
```
Ran the program. Output confirmed:
- `3 employee records written.` — the initial write of Alice, Bob, and Carol.
- `Record 1 updated in place.` — Bob's record (index 1) was overwritten with
  "Bobby"/47000.00 without touching records 0 or 2.
- Reading back all three records showed Record 0 = Alice/50000, **Record 1 = Bobby/47000
  (updated)**, Record 2 = Carol/60000 — proving the update did not disturb neighboring
  records.

```bash
od -c employees.dat | head -20
```
(Used `od -c` as a portable alternative to `xxd`, since `xxd` was not available in this
environment.) The hex/character dump showed the raw fixed-size binary layout: each
120-byte file contains three 40-byte struct records back-to-back, with "Bobby" visible
in the second record's byte range in place of the original "Bob" — visually confirming
the in-place update happened at the binary level, not by rewriting the file.

## Explanation of System Calls Used

- **`open()`** with flags `O_CREAT | O_RDWR | O_TRUNC` creates the file if it doesn't
  exist, opens it for both reading and writing, and truncates any prior content — giving
  precise control over file-creation semantics that `fopen()` mode strings only
  approximate.
- **`write()`** writes raw bytes from a struct directly to the file descriptor's current
  offset, without the extra buffering layer that stdio's `fwrite()` adds — appropriate
  for a "secure," low-level utility where the program controls exactly when data hits
  the kernel.
- **`lseek()`** is the mechanism that enables **random access**: by computing
  `record_index * RECORD_SIZE`, the program moves the file offset directly to any
  record's start position without reading through the records before it. This is what
  makes both the update and the retrieval operations O(1) in terms of I/O positioning,
  rather than requiring a sequential scan.
- **`read()`** retrieves exactly `RECORD_SIZE` bytes from the current offset into a
  struct, enabling structured, efficient retrieval of a single record from anywhere in
  the file.
- **`close()`** releases the file descriptor, signaling the kernel to flush any pending
  data and reclaim the resources associated with the open file.

Together, `open()` + `lseek()` + `write()`/`read()` + `close()` let this utility perform
**in-place record updates** and **direct-access retrieval** — capabilities that are
awkward and inefficient to achieve with stream-oriented stdio functions when working
with fixed-size structured records.

## Screenshots
- `screenshots/01_compile_and_run.png` — compiling and running the program, showing the write/update/read sequence
- `screenshots/02_hexdump_verification.png` — `od -c` dump proving the in-place update at the byte level
- `screenshots/03_file_size_check.png` — confirming the file size matches 3 fixed-size records

## Files in this folder
- `employee_records.c` — the source code
- `employee_records` — compiled executable
- `output.txt` — captured program output
- `employees.dat` — the binary data file produced by the program
- `hexdump.txt` — `od -c` inspection of the binary file
- `screenshots/` — command execution screenshots
