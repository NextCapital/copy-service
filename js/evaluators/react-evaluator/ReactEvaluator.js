import _ from 'lodash';

import Parser from '../Parser/Parser';

/**
 * Provides an interface that can register copy, determine the existance of copy, and generate copy
 * recursively evaluated with substitutions.
 * @interface
 */
class Evaluator {
  /**
   * Evaluates the AST with given substitutions
   * @param  {string} copyPrefix    The copy string being recursively built.
   * @param  {Formatting|Functional|Newline|Reference|Substitute|Switch|Verbatim} ast
   *                                The AST to be evaluated. This AST must be constructed by Parser.
   * @param  {object} substitutions An object containing substitutions for keys specified in the
   *                                AST.
   * @return {string}               The evaluated copy.
   * @abstract
   */
  static evalAST() {
    this._handleError(
      'evalAST is abstract and must be implemented by the extending class', { halt: true }
    );
  }
  /* eslint-enable brace-style */

  /**
   * Returns the default copy (usually an empty string).
   * @return {*}
   * @abstract
   */
  static _getInitialResult() {
    this._handleError(
      '_getInitialResult is abstract and must be implemented by the extending class', { halt: true }
    );
  }

  /**
   * Retrieves the item at a key from a given substitutions object. Logs an error and returns empty
   * string if no substitution is found.
   * @param  {object} substitutions
   * @param  {string} substitutionKey
   * @return {*}
   * @private
   */
  static _trySubstitution(substitutions, substitutionKey) {
    const value = _.get(substitutions, substitutionKey);

    if (_.isUndefined(value)) {
      this._handleError(`No value for substitution at key ${substitutionKey} provided`);
      return '';
    }

    return value;
  }

  /**
   * When in dev mode, log errors to the console.
   * @param {string} error            The error message to display
   * @param {object} [options]
   * @param {boolean} [options.halt]  Whether or not to throw a halting error.
   * @private
   */
  static _handleError(error, options) {
    const message = `Evaluator: ${error}`;
    if (options.halt) {
      throw new Error(message);
    } else if (this._isInDevMode()) {
      console.error(message); // eslint-disable-line no-console
    }
  }

  /**
   * Returns the global boolean DEV_MODE set via webpack.
   * @return {boolean} DEV_MODE
   */
  static _isInDevMode() {
    return DEV_MODE;
  }

  /**
   * Evaluator is a singleton and will error when trying to create an instance.
   * @throws {Error}
   */
  constructor() {
    this.constructor._handleError('Evaluator is a singleton', { halt: true });
  }
}

export default Evaluator;
