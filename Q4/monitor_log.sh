#!/bin/bash

LOG_FILE="system.log"
REPORT_FILE="error_report.txt"

touch "$LOG_FILE"
echo "Monitoring $LOG_FILE for ERROR entries... (Ctrl+C to stop)"

tail -f "$LOG_FILE" 2>/dev/null | grep --line-buffered "ERROR" | tee -a "$REPORT_FILE"
