const _ = require('lodash');

const SyntaxNode = require('./SyntaxNode/SyntaxNode');
const Parser = require('./Parser/Parser');

const ErrorHandler = require('./ErrorHandler/ErrorHandler');

/**
 * An AST class.
 *
 * @typedef {SyntaxNode|null} AST
 */

/**
 * Provides the ability to register, parse, and evaluate copy.
 */
class CopyService {
  /**
   * Constructor for the `CopyService`.
   *
   * @param {object} [options]
   * @param {object} [options.copy] Initial copy to register.
   * @param {boolean} [options.language] If specified, defines the language this is for from
   * `IntlCopyService`. Will be `null` otherwise.
   */
  constructor(options = {}) {
    /**
     * The store of registered copy.
     *
     * @type {object}
     */
    this._registeredCopy = {};
    this.language = options.language || null;

    if (options.copy) {
      this.registerCopy(options.copy);
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
   * Recursively builds all subkeys at which copy exists.
   *
   * @param  {string} key
   * @returns {object} An object of the same structure where the value is the copy key path.
   */
  buildSubkeys(key) {
    const subkeys = this.getSubkeys(key);

    return _.mapValues(subkeys, (obj, path) => {
      const subPath = `${key}${Parser.KEY_DELIMITER}${path}`;
      if (_.isPlainObject(obj)) {
        return this.buildSubkeys(subPath);
      }

      return subPath;
    });
  }

  /**
   * Returns the value at a passed key.
   *
   * @param  {string} key
   * @returns {object|string} The copy object or copy AST at a given key.
   */
  getSubkeys(key) {
    return _.get(this._registeredCopy, key);
  }

  /**
   * Determines if the key exists in the registered copy.
   *
   * @param  {string} key
   * @returns {boolean}
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
   * @returns {AST|undefined}
   */
  getAstForKey(key) {
    const result = _.get(this._registeredCopy, key);

    if (_.isString(result)) { // need to parse to an AST
      try {
        const ast = Parser.parseSingle(key, result);
        _.set(this._registeredCopy, key, ast);
        return ast;
      } catch {
        ErrorHandler.handleError('CopyService', `Failed to parse copy key: ${key}. Returning null...`);
        return null;
      }
    }

    if (_.isUndefined(result) || !SyntaxNode.isAST(result)) {
      if (!this.language) {
        ErrorHandler.handleError(
          'CopyService',
          `No AST found for copy key: ${key}. Returning null...`
        );
      }

      // return undefined when a language is specified so that `IntlCopyService` can differentiate
      // between no result and a result of null.
      return this.language ? undefined : null;
    }

    return result;
  }

  /**
   * Returns the current merged set of of registered copy. This is helpful to get the current
   * set of registered copy when copy is registered via many sources.
   *
   * @param {AST} _node [PRIVATE] Node of the registered copy to get keys from when recursing.
   * @returns {object} The registered copy, in un-parsed form.
   */
  getRegisteredCopy(_node = null) {
    const tree = {};

    _.forEach(_node || this._registeredCopy, (node, key) => {
      if (_.isNil(node)) {
        tree[key] = '';
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

  /**
   * Gets the registered copy for a given copy key.
   *
   * @param {string} key
   * @returns {string|null} Registered copy at the key, or null if none.
   */
  getRegisteredCopyForKey(key) {
    const result = _.get(this._registeredCopy, key);

    if (result === null) {
      return '';
    }

    if (_.isString(result)) {
      return result;
    }

    if (SyntaxNode.isAST(result)) {
      return result.toSyntax();
    }

    if (!this.language) {
      ErrorHandler.handleError('CopyService', `No AST found for copy key: ${key}. Returning null...`);
    }

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

  /**
   * Merges the new registered copy into the old registered copy. This will force any
   * strings or AST nodes to replace rather than merge.
   *
   * @param {object} existingCopy
   * @param {object} newCopy
   * @returns {object}
   * @private
   */
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

      if (SyntaxNode.isAST(newValue)) { // AST always replaces
        return newValue;
      }
    });
  }
}

module.exports = CopyService;
