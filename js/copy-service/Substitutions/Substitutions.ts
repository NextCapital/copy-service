import _ from 'lodash';

import ErrorHandler from '../ErrorHandler/ErrorHandler.js';

/**
 * Class for handling the substitution object/function passed into `getCopy`.
 */
class Substitutions {
  private _substitutions: object | (() => object);

  /**
   * @param {object | Function} substitutions The substitutions. If a function, it should return an
   * object.
   */
  constructor(substitutions: object | (() => object)) {
    this._substitutions = substitutions;
  }

  /**
   * If the substitutions are a function, evaluates it and replaces the function with the result.
   * This way, the function does not get called until substitutions are used, and the function
   * only ever gets called once. This allows expensive substitutions not to be called unless needed.
   *
   * @type {object}
   */
  get substitutions(): object {
    if (_.isFunction(this._substitutions)) {
      this._substitutions = this._substitutions();
    }

    return this._substitutions;
  }

  /**
   * Returns a substitution at the given key from the substitutions object. If not found, an
   * empty string will be returned.
   *
   * If the value at the substitutions key is a function, it will be evaluated to a value.
   *
   * @param {string} key Path to substitution on the substitutions object.
   * @returns {*} The value from the substitutions.
   */
  get(key: string): any { // eslint-disable-line @typescript-eslint/no-explicit-any
    const value = _.result(this.substitutions, key);

    if (_.isUndefined(value)) {
      return this._handleMissing(key);
    }

    return value;
  }

  /**
   * Works like `get`, but if the value is a function, it will not be called. Will also print a
   * warning if the value is not a function.
   *
   * @param {string} key Path to substitution on the substitutions object.
   * @returns {*} The function from the substitutions.
   */
  getFunction(
    key: string
  ): (() => unknown) | undefined {
    const value = _.get(this.substitutions, key);

    if (_.isUndefined(value)) {
      this._handleMissing(key);
      return;
    }

    if (!_.isFunction(value)) {
      ErrorHandler.handleError(
        'Substitutions',
        `Expected substitution at key '${key}' to be a function`
      );
    }

    return value;
  }

  /**
   * Prints a warning then returns an empty string.
   *
   * @param {string} key
   * @returns {string} An empty string.
   * @private
   */
  private _handleMissing(key: string): string {
    ErrorHandler.handleError(
      'Substitutions',
      `No value for substitution at key '${key}' provided`
    );

    return '';
  }

  /**
   * Finds the substitutions, then return true if the number 1 (singular) or truthy, and false
   * otherwise. Useful for evaluating Switch AST nodes.
   *
   * @param {string} key Path to substitution on the substitutions object.
   * @returns {boolean} The evaluated boolean value of the substitution.
   */
  getBoolean(key: string): boolean {
    const value = this.get(key);

    if (_.isNumber(value)) {
      return value === 1; // true if singular
    }

    return Boolean(value);
  }
}

export default Substitutions;
