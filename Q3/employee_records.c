#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/stat.h>

#define RECORD_SIZE sizeof(struct Employee)

struct Employee {
    int id;
    char name[30];
    float salary;
};

void write_records(int fd) {
    struct Employee emps[3] = {
        {1, "Alice", 50000.0},
        {2, "Bob",   45000.0},
        {3, "Carol", 60000.0}
    };
    write(fd, emps, sizeof(emps));
    printf("3 employee records written.\n");
}

void update_record(int fd, int record_index, struct Employee new_data) {
    off_t offset = record_index * RECORD_SIZE;
    lseek(fd, offset, SEEK_SET);          // jump directly to the record
    write(fd, &new_data, RECORD_SIZE);    // overwrite only that record
    printf("Record %d updated in place.\n", record_index);
}

void read_record(int fd, int record_index) {
    struct Employee e;
    off_t offset = record_index * RECORD_SIZE;
    lseek(fd, offset, SEEK_SET);           // seek directly without scanning
    if (read(fd, &e, RECORD_SIZE) == RECORD_SIZE) {
        printf("Record %d -> ID:%d Name:%s Salary:%.2f\n",
               record_index, e.id, e.name, e.salary);
    } else {
        printf("Failed to read record %d\n", record_index);
    }
}

int main() {
    int fd = open("employees.dat", O_CREAT | O_RDWR | O_TRUNC, 0644);
    if (fd < 0) {
        perror("open failed");
        exit(1);
    }

    write_records(fd);

    struct Employee updated = {2, "Bobby", 47000.0};
    update_record(fd, 1, updated);   // update 2nd record (index 1)

    read_record(fd, 0);
    read_record(fd, 1);
    read_record(fd, 2);

    close(fd);
    return 0;
}
