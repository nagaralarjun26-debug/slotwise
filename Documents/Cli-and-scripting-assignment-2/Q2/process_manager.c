#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>
#include <signal.h>
#include <time.h>

#define NUM_CHILDREN 3
#define TIMEOUT_SECONDS 5

pid_t children[NUM_CHILDREN];

void child_task(int id) {
    printf("Child %d (PID %d) starting work...\n", id, getpid());
    // Simulate a child that might hang (e.g., child 1 hangs deliberately)
    if (id == 1) {
        sleep(20); // simulate unresponsive process
    } else {
        sleep(2);  // simulate normal quick task
    }
    printf("Child %d finished.\n", id);
    exit(0);
}

int main() {
    // Use line-buffered stdout instead of the default full-buffering (which applies
    // when stdout isn't a terminal, e.g. when redirected to a file). Without this,
    // any buffered-but-unflushed output at the time of fork() gets duplicated when
    // each child later flushes its inherited copy of that same buffer.
    setvbuf(stdout, NULL, _IOLBF, 0);

    for (int i = 0; i < NUM_CHILDREN; i++) {
        pid_t pid = fork();
        if (pid < 0) {
            perror("fork failed");
            exit(1);
        } else if (pid == 0) {
            child_task(i);
        } else {
            children[i] = pid;
            printf("Parent created child %d with PID %d\n", i, pid);
        }
    }

    // Monitor children with timeout to prevent them becoming zombies
    time_t start = time(NULL);
    int remaining = NUM_CHILDREN;

    while (remaining > 0) {
        for (int i = 0; i < NUM_CHILDREN; i++) {
            if (children[i] == -1) continue; // already reaped

            int status;
            pid_t result = waitpid(children[i], &status, WNOHANG);

            if (result == children[i]) {
                printf("Reaped child PID %d (avoided zombie)\n", children[i]);
                children[i] = -1;
                remaining--;
            } else if (difftime(time(NULL), start) > TIMEOUT_SECONDS) {
                // Child unresponsive beyond timeout -> terminate it
                printf("Child PID %d unresponsive. Sending SIGTERM...\n", children[i]);
                kill(children[i], SIGTERM);
                sleep(1);
                // Force kill if still alive
                if (waitpid(children[i], &status, WNOHANG) == 0) {
                    printf("Child PID %d still alive. Sending SIGKILL...\n", children[i]);
                    kill(children[i], SIGKILL);
                    waitpid(children[i], &status, 0); // reap after kill
                }
                children[i] = -1;
                remaining--;
            }
        }
        sleep(1);
    }

    printf("All children handled. No zombies remain.\n");
    return 0;
}
