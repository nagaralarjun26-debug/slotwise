#!/bin/bash

# ===== Configuration =====
SUBMIT_DIR="./submissions"
BACKUP_DIR="./backup_unique"
REPORT_FILE="./report.txt"
ERROR_LOG="./errors.log"

mkdir -p "$BACKUP_DIR"
> "$REPORT_FILE"
> "$ERROR_LOG"

total=0
duplicates=0
backed_up=0

declare -A seen_hashes

echo "Starting submission processing..." | tee -a "$REPORT_FILE"

# Loop through all entries in submission directory.
# NOTE: "-e" (rather than "-f") is used first so that broken/dangling symlinks
# (a realistic case of a corrupted or missing student submission) are still
# picked up and logged as errors, instead of being silently skipped the way
# a plain "-f" check would (since -f follows symlinks and is false for a
# dangling one).
for file in "$SUBMIT_DIR"/*; do
    if [ -e "$file" ] || [ -L "$file" ]; then
        total=$((total+1))

        if [ ! -r "$file" ]; then
            echo "Error: cannot read submission (missing/broken/unreadable): $file" >> "$ERROR_LOG"
            continue
        fi

        # Compute MD5 hash of file content
        hash=$(md5sum "$file" 2>>"$ERROR_LOG" | awk '{print $1}')

        if [ -z "$hash" ]; then
            echo "Error hashing file: $file" >> "$ERROR_LOG"
            continue
        fi

        if [[ -n "${seen_hashes[$hash]}" ]]; then
            duplicates=$((duplicates+1))
            echo "Duplicate found: $file (same as ${seen_hashes[$hash]})" >> "$REPORT_FILE"
        else
            seen_hashes[$hash]="$file"
            cp "$file" "$BACKUP_DIR/" 2>>"$ERROR_LOG"
            if [ $? -eq 0 ]; then
                backed_up=$((backed_up+1))
            else
                echo "Failed to backup: $file" >> "$ERROR_LOG"
            fi
        fi
    fi
done

# ===== Final Report =====
{
echo "----- Submission Report -----"
echo "Total files processed : $total"
echo "Duplicate files found : $duplicates"
echo "Unique files backed up: $backed_up"
} >> "$REPORT_FILE"

echo "Processing complete. See $REPORT_FILE and $ERROR_LOG"
