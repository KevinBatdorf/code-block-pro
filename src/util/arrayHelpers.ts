export const parseJSONArrayWithRanges = (
    lineNumbers: string,
    startingLineNumber: string,
) => {
    try {
        return (
            JSON.parse(`[${lineNumbers ?? ''}]`)
                .map((inner: number | number[]) => {
                    // offset by startingLineNumber
                    const offset = isNaN(Number(startingLineNumber))
                        ? 0
                        : Math.max(Number(startingLineNumber) - 1, 0);
                    // incoming might look like 1, 3, or [4, 8]
                    if (typeof inner === 'number') return inner - offset;
                    return Array.from(
                        { length: inner[1] - inner[0] + 1 },
                        (_, i) => inner[0] + i - offset,
                    );
                })
                // filter out empty arrays
                .filter((inner: number | number[]) =>
                    Array.isArray(inner) ? inner?.length > 0 : true,
                )
                .flat()
                // filter out negative numbers
                .filter((inner: number) => inner >= 0)
        );
    } catch (e) {
        return [];
    }
};

export const parseStringArrayWithSingleNestedArray = (lineNumbers?: string) => {
    const nums = JSON.parse(`[${lineNumbers ?? ''}]`);
    // Checking for nested arrays
    const nested = nums.filter((n: number | number[]) => Array.isArray(n));
    const doubly = nested.some((n: number[]) =>
        n.some((k) => Array.isArray(k)),
    );
    if (doubly) {
        throw new Error('Nested arrays not allowed');
    }
    if (nested.some((n: number[]) => n[0] >= n[1])) {
        throw new Error('Nested arrays must be in order');
    }
    return true;
};
