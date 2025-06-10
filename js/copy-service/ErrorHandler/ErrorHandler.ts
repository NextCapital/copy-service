class ErrorHandler {
  /**
   * When in dev mode, log errors to the console.
   *
   * @param {string} name Name of the component with an error.
   * @param {string} error The error message to display.
   * @param {object} [options]
   * @param {boolean} [options.halt]  Whether or not to throw a halting error.
   * @private
   */
  static handleError(name: string, error: string, options?: { halt: false; } | object): void;
  static handleError(name: string, error: string, options?: { halt: true; }): never;
  static handleError(name: string, error: string, options: { halt?: boolean; } = {}): void | never {
    const message = `${name}: ${error}`;
    if (options.halt) {
      throw new Error(message);
    } else if (this.isInDevMode() && process.env.NODE_ENV !== 'test') {
      console.error(message); // eslint-disable-line no-console
    }
  }

  /**
   * Returns the whether process.env.NODE_ENV is not production as set via webpack.
   *
   * @returns {boolean} DEV_MODE.
   */
  static isInDevMode(): boolean {
    return process.env.NODE_ENV !== 'production';
  }
}

export default ErrorHandler;
