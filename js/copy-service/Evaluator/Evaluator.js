const Substitutions = require('../Substitutions/Substitutions').default;
const ErrorHandler = require('../ErrorHandler/ErrorHandler').default;

/**
 * Provides an interface to recursively generate copy evaluated with substitutions.
 *
 * @interface
 */
class Evaluator {
  /**
   * Takes in a copy service and provide methods for evaluating its ASTs.
   *
   * @param {CopyService|IntlCopyService} copyService
   * @param root0
   * @param root0.allowFunctional
   */
  constructor(copyService, {
    allowFunctional = true
  } = {}) {
    this.copyService = copyService;
    this.evaluationCache = new WeakMap();

    /**
     * When `true`, the functional ^{}{} syntax will run the configured method when evaluating.
     * When `false`, the copy will be returned without passing it through the function.
     *
     * @type {boolean}
     */
    this.allowFunctional = allowFunctional;
  }

  /**
   * Gets the cached evaluation result for the given ast, if it exists.
   *
   * @param {AST} ast
   * @returns {*} The evaluated copy.
   */
  getCached(ast) {
    return this.evaluationCache.get(ast);
  }

  /**
   * Sets the evaluated result for the AST in the cache, if the ast node is cacheable.
   *
   * NOTE: The evaluated result should be the result of fully evaluating the ast with no prefix.
   *
   * @param {AST} ast Node being cached.
   * @param {*} evaluated Fully-evaluated result for the node.
   */
  setCacheIfCacheable(ast, evaluated) {
    if (ast.isCacheable(this.copyService)) {
      this.evaluationCache.set(ast, evaluated);
    }
  }

  /**
   * Returns evaluated copy got the given copy key and substitutions.
   *
   * @param  {string} key
   * @param  {object | Function} [rawSubstitutions] Substitutions to be used by the evaluator when
   * evaluating the AST. Must either be an object or a function returning the object.
   * @returns {*} The evaluated copy.
   */
  getCopy(key, rawSubstitutions) {
    const substitutions = new Substitutions(rawSubstitutions);
    const ast = this.copyService.getAstForKey(key);

    return this.evalAST(this.getInitialResult(), ast, substitutions);
  }

  /* eslint-disable jsdoc/check-param-names */
  /**
   * Evaluates the AST with given substitutions.
   *
   * @abstract
   * @param  {*} copyPrefix The evaluated copy in process of being recursively built.
   * @param  {AST} ast The AST to be evaluated. This AST must be constructed by Parser.
   * @param  {Substitutions} substitutions An object containing substitutions for keys specified in
   * the AST.
   * @returns {*} The evaluated copy.
   */
  evalAST() {
    this._handleError(
      'evalAST is abstract and must be implemented by the extending class',
      { halt: true }
    );
  }

  /**
   * Returns the default copy (usually an empty string).
   *
   * @abstract
   * @returns {*}
   */
  getInitialResult() {
    this._handleError(
      'getInitialResult is abstract and must be implemented by the extending class',
      { halt: true }
    );
  }
  /* eslint-enable jsdoc/check-param-names */

  /**
   * Defers to ErrorHandler.handleError with the constructor name and any args.
   *
   * @param {...any} args
   */
  _handleError(...args) {
    ErrorHandler.handleError(this.constructor.name, ...args);
  }
}

module.exports = Evaluator;
