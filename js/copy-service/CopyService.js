import _ from 'lodash';

import SyntaxNode from './SyntaxNode/SyntaxNode';
import Formatting from './Formatting/Formatting';
import Functional from './Functional/Functional';
import Newline from './Newline/Newline';
import Reference from './Reference/Reference';
import RefSubstitute from './RefSubstitute/RefSubstitute';
import Substitute from './Substitute/Substitute';
import Switch from './Switch/Switch';
import Verbatim from './Verbatim/Verbatim';

import Parser from './Parser/Parser';

import ErrorHandler from './ErrorHandler/ErrorHandler';

/**
 * An AST class.
 * @typedef {SyntaxNode|null} AST
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
    return SyntaxNode.isAST(object);
  }

  constructor(options = {}) {
    /**
     * The store of parsed copy.
     * @type {object}
     */
    this._parsedCopy = {};

    if (options.copy) {
      const copyAsArray = _.castArray(options.copy);
      _.forEach(copyAsArray, (copy) => this.registerCopy(copy));
    }
  }

  /**
   * Stores the new copy into the copy set. Copy will not be parsed immediately by default. To
   * immediately parse copy into an AST, call `parseAllCopy`.
   *
   * @param  {object} jsonCopyConfig A json object containing copy.
   */
  registerCopy(jsonCopyConfig) {
    if (!_.isPlainObject(jsonCopyConfig)) {
      ErrorHandler.handleError(
        'CopyService',
        'Copy provided in wrong format.'
      );

      return;
    }

    this._mergeParsedCopy(this._parsedCopy, Parser.parseLeaves(jsonCopyConfig));
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
      ErrorHandler.handleError('CopyService', `No AST found for copy key: ${key}`);
      return null;
    }

    return result;
  }

  /**
   * Parses all copy that has not yet been parsed to an AST.
   */
  parseAllCopy() {
    this._mergeParsedCopy(this._parsedCopy, Parser.parseLeaves(this._parsedCopy));
  }

  _mergeParsedCopy(existingCopy, newCopy) {
    _.mergeWith(existingCopy, newCopy, (oldValue, newValue) => {
      if (_.isString(newValue)) { // strings always replace
        return newValue;
      }

      if (this.constructor.isAST(newValue)) { // AST always replaces
        return newValue;
      }
    });
  }
}

export default CopyService;
