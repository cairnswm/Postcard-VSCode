export interface ParsedHttpHeader {
	key: string;
	value: string;
}

export interface ParsedHttpRequest {
	name: string;
	method: string;
	url: string;
	headers: ParsedHttpHeader[];
	body: string;
}

export class HttpFileParser {
	/**
	 * Parses an .http file content and extracts HTTP requests
	 * @param content The content of the .http file
	 * @param filePath The path to the file being parsed (used for naming)
	 * @returns Array of parsed HTTP requests
	 */
	public static parse(content: string, filePath: string): ParsedHttpRequest[] {
		const lines = content.split(/\r?\n/);
		const tests: ParsedHttpRequest[] = [];
		let currentTest: ParsedHttpRequest | null = null;
		let inBody = false;
		let bodyLines: string[] = [];

		for (const line of lines) {
			const trimmedLine = line.trim();
			
			// Check if this is a new HTTP request
			if (this.isHttpRequestLine(trimmedLine)) {
				// Save previous test if it exists
				if (currentTest) {
					currentTest.body = bodyLines.join('\n').trim();
					tests.push(currentTest);
				}
				
				// Start new test
				const [method, url] = trimmedLine.split(/\s+/, 2);
				const fileName = this.extractFileNameFromPath(filePath);
				currentTest = {
					name: fileName,
					method: method,
					url: url || '',
					headers: [],
					body: ''
				};
				inBody = false;
				bodyLines = [];
			} else if (currentTest && !inBody && this.isHeaderLine(trimmedLine)) {
				// This is a header line
				const header = this.parseHeaderLine(trimmedLine);
				if (header) {
					currentTest.headers.push(header);
				}
			} else if (currentTest && this.isBodyTransition(trimmedLine, inBody, bodyLines.length)) {
				// Empty line or start of JSON body indicates transition to body
				if (trimmedLine.startsWith('{')) {
					inBody = true;
					bodyLines.push(line);
				} else if (inBody || bodyLines.length > 0) {
					bodyLines.push(line);
				} else {
					inBody = true; // Empty line after headers
				}
			} else if (currentTest && inBody) {
				// We're in the body section
				bodyLines.push(line);
			}
		}

		// Don't forget the last test
		if (currentTest) {
			currentTest.body = bodyLines.join('\n').trim();
			tests.push(currentTest);
		}

		return tests;
	}

	/**
	 * Checks if a line represents an HTTP request method line
	 * @param line The line to check
	 * @returns True if the line is an HTTP request line
	 */
	private static isHttpRequestLine(line: string): boolean {
		return /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+/.test(line);
	}

	/**
	 * Checks if a line represents an HTTP header
	 * @param line The line to check
	 * @returns True if the line is a header line
	 */
	private static isHeaderLine(line: string): boolean {
		return line.includes(':') && !line.startsWith('{');
	}

	/**
	 * Parses a header line into key-value pair
	 * @param line The header line to parse
	 * @returns Parsed header or null if invalid
	 */
	private static parseHeaderLine(line: string): ParsedHttpHeader | null {
		const colonIndex = line.indexOf(':');
		if (colonIndex > 0) {
			const key = line.substring(0, colonIndex).trim();
			const value = line.substring(colonIndex + 1).trim();
			return { key, value };
		}
		return null;
	}

	/**
	 * Checks if the current line indicates a transition to the request body
	 * @param line The current line
	 * @param inBody Whether we're already in the body section
	 * @param bodyLinesCount Number of body lines already collected
	 * @returns True if this line indicates body transition
	 */
	private static isBodyTransition(line: string, inBody: boolean, bodyLinesCount: number): boolean {
		return line === '' || line.startsWith('{') || inBody || bodyLinesCount > 0;
	}

	/**
	 * Extracts the file name from a file path for naming purposes
	 * @param filePath The full file path
	 * @returns The extracted file name without extension
	 */
	private static extractFileNameFromPath(filePath: string): string {
		return filePath.split(/\\|\//).pop()?.split('.')[0] || 'Unnamed Test';
	}
}