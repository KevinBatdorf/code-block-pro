export function isValidUrl(str: string) {
    try {
        const url = new URL(str);

        return url.host === 'raw.githubusercontent.com' ||
            url.host === 'gist.githubusercontent.com' ||
            url.host === 'github.com';
    } catch (e) {
        return false;
    }
}

export function extractLineNumbers(url) {
    const hashIndex = url.indexOf("#L");
    if (hashIndex === -1) {
        return null;
    }

    const strAfterHash = url.substring(hashIndex + 1);
    const strSplitByDash = strAfterHash.split('-');
    const lineNumbers = strSplitByDash.map(getLineNumberFromToken);

    const isFirstNumberValid = lineNumbers[0] > 0;
    const isSecondNumberValid = lineNumbers[1] > 0;
    if (!isFirstNumberValid) {
        return null;
    }

    return {
        startLine: lineNumbers[0],
        endLine: isSecondNumberValid ? lineNumbers[1] : lineNumbers[0],
    };
}

function getLineNumberFromToken(token: string) {
    const splitByColumn = token.split('C');
    const lineNumber = splitByColumn[0].substring(1);

    return parseInt(lineNumber);
}
