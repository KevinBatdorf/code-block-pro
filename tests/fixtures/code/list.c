#include <stdio.h>
#define MAX 16

typedef struct node {
	int value;
	struct node *next;
} node_t;

int main(void) {
	char buf[MAX] = {0};
	printf("%s\n", buf);
	return 0;
}
