import _ from 'lodash';

import Formatting from './Formatting/Formatting';
import Functional from './Functional/Functional';
import Newline from './Newline/Newline';
import Reference from './Reference/Reference';
import RefSubstitute from './RefSubstitute/RefSubstitute';
import Substitute from './Substitute/Substitute';
import Switch from './Switch/Switch';
import Verbatim from './Verbatim/Verbatim';

import Parser from './Parser/Parser';

/**
 * An AST class.
 * @typedef {Formatting|Functional|Newline|Reference|RefSubstitute|Substitute|Switch|Verbatim} AST
 */

/**
 * Provides the ability to register, parse, and evaluate copy.
 */
class CopyService {
  /**
   * Determines if a passed object is an instance of an AST class
   * @param  {AST|object}  object
   * @return {Boolean}
   */
  static isAST(object) {
    return _.isNil(object) ||
      object instanceof Formatting ||
      object instanceof Functional ||
      object instanceof Newline ||
      object instanceof Reference ||
      object instanceof RefSubstitute ||
      object instanceof Substitute ||
      object instanceof Switch ||
      object instanceof Verbatim;
  }

  constructor(options = {}) {
    if (!options.evaluator) {
      this._handleError('CopyService requires an evaluator', { halt: true });
    }

    this.getAstForKey = this.getAstForKey.bind(this);

    /**
     * The store of parsed copy.
     * @type {object}
     */
    this._parsedCopy = {};

    if (options.copy) {
      const copyAsArray = _.castArray(options.copy);
      _.forEach(copyAsArray, (copy) => this.registerCopy(copy));
    }

    /**
     * Evaluates the parsed copy.
     * @type {Evaluator}
     */
    this.evaluator = options.evaluator;
  }

  /**
   * Parses copy into ASTs and stores it.
   * @param  {object} jsonCopyConfig A json object containing copy.
   */
  registerCopy(jsonCopyConfig) {
    if (!_.isPlainObject(jsonCopyConfig)) {
      this._handleError('Copy provided in wrong format.');
      return;
    }

    this._mergeParsedCopy(this._parsedCopy, Parser.parseLeaves(jsonCopyConfig));
  }

  /**
   * Evaluates the copy AST at a given key using passed substitutions, returning a plain string of
   * copy. The evaluator will not include HTML tags and will not evaluate functions. Instead, it
   * will simply return the copy of an Formatting or Functional classes.
   * @param  {string} key
   * @param  {object} [substitutions] Substitutions to be used by the evaluator when evaluating the
   *                                    AST.
   * @return {string} The evaluated plain-text copy string.
   */
  getCopy(key, substitutions) {
    const ast = this.getAstForKey(key);
    return this.evaluator.evalAST(
      this.evaluator._getInitialResult(), ast, this.getAstForKey, substitutions
    );
  }

  /**
   * Recursivey builds all subkeys at which copy exists.
   * @param  {string} key
   * @return {Object} An object of the same structure where the value is the copy key path.
   */
  buildSubkeys(key) {
    const subkeys = this.getSubkeys(key);

    return _.mapValues(subkeys, (obj, path) => {
      const subPath = `${key}.${path}`;
      if (_.isPlainObject(obj)) {
        return this.buildSubkeys(subPath);
      }

      return subPath;
    });
  }

  /**
   * Returns the value at a passed key
   * @param  {string} key
   * @return {object|string} The copy object or copy AST at a given key.
   */
  getSubkeys(key) {
    return _.get(this._parsedCopy, key);
  }

  /**
   * Determines if the key exists in the registered copy.
   * @param  {string} key
   * @return {boolean}
   */
  hasKey(key) {
    return !_.isNil(this.getSubkeys(key));
  }

  /**
   * Returns the AST at a given key. Logs error if key is not found in the parsed copy.
   * @param  {string} key
   * @return {AST}
   */
  getAstForKey(key) {
    const result = _.get(this._parsedCopy, key);

    if (_.isUndefined(result) || !this.constructor.isAST(result)) {
      this._handleError(`No AST found for copy key: ${key}`);
      return null;
    }

    return result;
  }

  _mergeParsedCopy(existingCopy, newCopy) {
    _.mergeWith(existingCopy, newCopy, (oldValue, newValue) => {
      if (this.constructor.isAST(newValue)) {
        return newValue;
      }
    });
  }

  /**
   * When in dev mode, log errors to the console.
   * @param {string} error            The error message to display
   * @param {object} [options]
   * @param {boolean} [options.halt]  Whether or not to throw a halting error.
   * @private
   */
  _handleError(error, options = {}) {
    const message = `CopyService: ${error}`;
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
  _isInDevMode() {
    return DEV_MODE;
  }
}

export default CopyService;
