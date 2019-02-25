import Substitutions from '../Substitutions/Substitutions';
import ErrorHandler from '../ErrorHandler/ErrorHandler';

/**
 * Provides an interface to recursively generate copy evaluated with substitutions.
 * @interface
 */
class Evaluator {
  /**
   * Takes in a copy service and provide methods for evaluating its ASTs.
   * @param {CopyService} copyService
   */
  constructor(copyService) {
    this.copyService = copyService;
  }

  /**
   * Returns evalauted copy got the given copy key and substitutions.
   * @param  {string} key
   * @param  {object|function} [rawSubstitutions] Substitutions to be used by the evaluator when
   * evaluating the AST. Must either be an object or a fucntion returning the object.
   * @return {*} The evaluated copy
   */
  getCopy(key, rawSubstitutions) {
    const substitutions = new Substitutions(rawSubstitutions);
    const ast = this.copyService.getAstForKey(key);

    return this.evalAST(this.getInitialResult(), ast, substitutions);
  }

  /**
   * Evaluates the AST with given substitutions
   * @param  {*} copyPrefix The evaluated copy in process of being recursively built.
   * @param  {AST} ast The AST to be evaluated. This AST must be constructed by Parser.
   * @param  {Substitutions} substitutions An object containing substitutions for keys specified in
   * the AST.
   * @return {*} The evaluated copy.
   * @abstract
   */
  evalAST() {
    this._handleError(
      'evalAST is abstract and must be implemented by the extending class',
      { halt: true }
    );
  }
  /* eslint-enable brace-style */

  /**
   * Returns the default copy (usually an empty string).
   * @return {*}
   * @abstract
   */
  getInitialResult() {
    this._handleError(
      'getInitialResult is abstract and must be implemented by the extending class',
      { halt: true }
    );
  }

  /**
   * Defers to ErrorHandler.handleError with the constructor name and any args.
   */
  _handleError(...args) {
    ErrorHandler.handleError(this.constructor.name, ...args);
  }
}

export default Evaluator;
