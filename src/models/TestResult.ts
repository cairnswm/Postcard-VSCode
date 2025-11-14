export interface TestResult {
    testName: string;
    testId: string;
    timestamp: Date;
    url: string;
    method: string;
    duration: number;
    statusCode?: number;
    statusMessage?: string;
    requestHeaders: any;
    requestBody?: string;
    responseHeaders?: any;
    responseBody?: string;
    error?: string;
}