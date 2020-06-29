import _ from 'lodash';

import ErrorHandler from '../ErrorHandler/ErrorHandler';

/**
 * Class for handling the substitution object/function passed into `getCopy`.
 */
class Substitutions {
  /**
   * @param {object|function} substitutions The substitutions. If a function, it should return an
   * object.
   */
  constructor(substitutions) {
    this._substitutions = substitutions;
  }

  /**
   * If the substitutions are a function, evalautes it and replaces the function with the result.
   * This way, the function does not get called until substititions are used, and the function
   * only ever gets called once. This allows expensive substitutions not to be called unless needed.
   * @type {object}
   */
  get substitutions() {
    if (_.isFunction(this._substitutions)) {
      this._substitutions = this._substitutions();
    }

    return this._substitutions;
  }

  /**
   * Returns a substitution at the given key from the substitutions object. If not found, an
   * empty string will be returned.
   * @param {string} key path to substitution on the substititions object
   * @return {*} The value from the substitutions
   */
  get(key) {
    const value = _.result(this.substitutions, key);

    if (_.isUndefined(value)) {
      return this._handleMissing(key);
    }

    return value;
  }

  getFunction(key) {
    const value = _.get(this.substitutions, key);

    if (_.isUndefined(value)) {
      return this._handleMissing(key);
    }

    if (!_.isFunction(value)) {
      ErrorHandler.handleError(
        'Substitutions',
        `Expected substitution at key '${key}' to be a function`
      );
    }

    return value;
  }

  _handleMissing(key) {
    ErrorHandler.handleError(
      'Substitutions',
      `No value for substitution at key '${key}' provided`
    );

    return '';
  }

  /**
   * Finds the substitutions, then return true if the number 1 (singular) or truthy, and false
   * otherwise. Useful for evaluating Switch AST nodes.
   * @param {string} key path to substitution on the substititions object
   * @return {Boolean} The evaluated boolean value of the substitution
   */
  getBoolean(key) {
    const value = this.get(key);

    if (_.isNumber(value)) {
      return value === 1; // true if singular
    }

    return Boolean(value);
  }
}

export default Substitutions;
