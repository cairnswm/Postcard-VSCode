import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { Config } from '../config/Constants';

export interface HttpHeader {
	key: string;
	value: string;
	enabled: boolean;
}

export interface HttpRequestOptions {
	url: string;
	method: string;
	headers?: HttpHeader[];
	body?: string;
	bodyType?: string;
}

export interface HttpResponse {
	statusCode: number;
	statusMessage: string;
	headers: any;
	body: string;
}

export class HttpClient {
	/**
	 * Makes an HTTP request with the given options
	 * @param options The request options
	 * @returns Promise that resolves to the HTTP response
	 */
	public static async request(options: HttpRequestOptions): Promise<HttpResponse> {
		return new Promise((resolve, reject) => {
			try {
				const urlObj = new URL(options.url);
				const isHttps = urlObj.protocol === 'https:';
				const httpModule = isHttps ? https : http;

				// Prepare request options
				const requestOptions = {
					hostname: urlObj.hostname,
					port: urlObj.port || (isHttps ? Config.DEFAULT_PORTS.HTTPS : Config.DEFAULT_PORTS.HTTP),
					path: urlObj.pathname + urlObj.search,
					method: options.method,
					headers: {} as any
				};

				// Add headers
				if (options.headers) {
					options.headers.forEach(header => {
						if (header.enabled && header.key) {
							requestOptions.headers[header.key] = header.value;
						}
					});
				}

				// Set content length if there's a body
				if (options.body && options.bodyType !== 'none') {
					requestOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
					
					// Set content type if not already set
					if (!requestOptions.headers['Content-Type'] && !requestOptions.headers['content-type']) {
						requestOptions.headers['Content-Type'] = this.getContentType(options.bodyType);
					}
				}

				const req = httpModule.request(requestOptions, (res) => {
					let responseBody = '';
					
					res.on('data', (chunk) => {
						responseBody += chunk;
					});
					
					res.on('end', () => {
						resolve({
							statusCode: res.statusCode || 0,
							statusMessage: res.statusMessage || '',
							headers: res.headers,
							body: responseBody
						});
					});
				});

				req.on('error', (error) => {
					reject(error);
				});

				// Set timeout
				req.setTimeout(Config.HTTP_REQUEST_TIMEOUT, () => {
					req.destroy();
					reject(new Error(`Request timeout (${Config.HTTP_REQUEST_TIMEOUT / 1000}s)`));
				});

				// Write body if present
				if (options.body && options.bodyType !== 'none') {
					req.write(options.body);
				}

				req.end();
				
			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * Gets the appropriate content type for a given body type
	 * @param bodyType The body type
	 * @returns The content type string
	 */
	private static getContentType(bodyType?: string): string {
		switch (bodyType) {
			case 'json':
				return Config.CONTENT_TYPES.JSON;
			case 'form':
				return Config.CONTENT_TYPES.FORM;
			case 'xml':
				return Config.CONTENT_TYPES.XML;
			case 'text':
				return Config.CONTENT_TYPES.TEXT;
			default:
				return Config.CONTENT_TYPES.TEXT;
		}
	}
}