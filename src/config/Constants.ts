/**
 * Configuration constants for the Postcard extension
 */
export class Config {
	/**
	 * HTTP request timeout in milliseconds
	 */
	public static readonly HTTP_REQUEST_TIMEOUT = 30000;

	/**
	 * Tree refresh delay in milliseconds
	 */
	public static readonly TREE_REFRESH_DELAY = 100;

	/**
	 * Maximum number of results per test
	 */
	public static readonly MAX_RESULTS_PER_TEST = 20;

	/**
	 * Default HTTP ports
	 */
	public static readonly DEFAULT_PORTS = {
		HTTP: 80,
		HTTPS: 443
	} as const;

	/**
	 * Content types for different body types
	 */
	public static readonly CONTENT_TYPES = {
		JSON: 'application/json',
		FORM: 'application/x-www-form-urlencoded',
		XML: 'application/xml',
		TEXT: 'text/plain'
	} as const;

	/**
	 * File and directory paths
	 */
	public static readonly PATHS = {
		APITESTER_FOLDER: '.postcard',
		DOWNLOADS_FOLDER: 'Downloads'
	} as const;

	/**
	 * File extensions
	 */
	public static readonly FILE_EXTENSIONS = {
		HTTP: '.http',
		JSON: '.json',
		XML: '.xml'
	} as const;
}