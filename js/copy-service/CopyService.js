import _ from 'lodash';

import SyntaxNode from './SyntaxNode/SyntaxNode';
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
    this._registeredCopy = {};

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

    // Clone deep to avoid mutating `jsonCopyConfig`
    this._registeredCopy = this._mergeParsedCopy(
      this._registeredCopy,
      _.cloneDeep(jsonCopyConfig)
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
    return _.get(this._registeredCopy, key);
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
   * Returns the AST at a given key. Logs error if key is not found in the parsed copy, or if the
   * copy fails to parse. In both cases, `null` will be returned. This is preferable to the page
   * blowing up.
   *
   * @param  {string} key
   * @return {AST}
   */
  getAstForKey(key) {
    const result = _.get(this._registeredCopy, key);

    if (_.isString(result)) { // need to parse to an AST
      try {
        const ast = Parser.parseSingle(result);
        _.set(this._registeredCopy, key, ast);
        return ast;
      } catch (ex) {
        ErrorHandler.handleError('CopyService', `Failed to parse copy key: ${key}. Returning null...`);
        return null;
      }
    }

    if (_.isUndefined(result) || !this.constructor.isAST(result)) {
      ErrorHandler.handleError('CopyService', `No AST found for copy key: ${key}. Returning null...`);
      return null;
    }

    return result;
  }

  getRegisteredCopy(_node = null) {
    const tree = {};

    _.forEach(_node || this._registeredCopy, (node, key) => {
      if (_.isNil(node)) {
        tree[key] = null;
      } else if (_.isString(node)) { // not yet parsed
        tree[key] = node;
      } else if (SyntaxNode.isAST(node)) { // parsed
        tree[key] = node.toSyntax();
      } else if (_.isPlainObject(node)) {
        tree[key] = this.getRegisteredCopy(node);
      }
    });

    return tree;
  }

  getRegisteredCopyForKey(key) {
    const result = _.get(this._registeredCopy, key);

    if (_.isNil(result)) {
      return null;
    }

    if (_.isString(result)) {
      return result;
    }

    if (this.constructor.isAST(result)) {
      return result.toSyntax();
    }

    ErrorHandler.handleError('CopyService', `No AST found for copy key: ${key}. Returning null...`);
    return null;
  }

  /**
   * Parses all copy that has not yet been parsed to an AST.
   *
   * Notably, this will throw an error if any copy fails to parse.
   */
  parseAllCopy() {
    Parser.parseLeaves(this._registeredCopy);
  }

  _mergeParsedCopy(existingCopy, newCopy) {
    if (_.isEmpty(existingCopy)) {
      return newCopy;
    }

    if (_.isEmpty(newCopy)) {
      return existingCopy;
    }

    return _.mergeWith(existingCopy, newCopy, (oldValue, newValue) => {
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
