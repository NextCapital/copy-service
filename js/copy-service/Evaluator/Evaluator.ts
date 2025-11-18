import Substitutions from '../Substitutions/Substitutions';
import ErrorHandler from '../ErrorHandler/ErrorHandler';
import SyntaxNode from '../SyntaxNode/SyntaxNode';
import CopyService from '../CopyService';
import IntlCopyService from '../IntlCopyService';

type AST = SyntaxNode | null;

/**
 * Provides an interface to recursively generate copy evaluated with substitutions.
 *
 * @interface
 */
abstract class Evaluator<T> {
  readonly copyService: CopyService | IntlCopyService;

  private evaluationCache: WeakMap<SyntaxNode, T>;

  /**
   * When `true`, the functional ^{}{} syntax will run the configured method when evaluating.
   * When `false`, the copy will be returned without passing it through the function.
   *
   * @type {boolean}
   */
  allowFunctional: boolean;

  /**
   * Takes in a copy service and provide methods for evaluating its ASTs.
   *
   * @param {CopyService|IntlCopyService} copyService
   * @param {object} options
   * @param {boolean} options.allowFunctional
   */
  constructor(
    copyService: CopyService | IntlCopyService,
    {
      allowFunctional = true
    }: { allowFunctional?: boolean; } = {}
  ) {
    this.copyService = copyService;
    this.evaluationCache = new WeakMap();
    this.allowFunctional = allowFunctional;
  }

  /**
   * Gets the cached evaluation result for the given ast, if it exists.
   *
   * @param {AST} ast
   * @returns {*} The evaluated copy.
   */
  getCached(ast: SyntaxNode): T | undefined {
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
  setCacheIfCacheable(ast: SyntaxNode, evaluated: T): void {
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
  getCopy(key: string, rawSubstitutions?: object | (() => object)): T {
    const substitutions = new Substitutions(rawSubstitutions || {});
    const ast = this.copyService.getAstForKey(key);

    return this.evalAST(this.getInitialResult(), ast, substitutions);
  }

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
  abstract evalAST(copyPrefix: T, ast: AST, substitutions: Substitutions): T;

  /**
   * Returns the default copy (usually an empty string).
   *
   * @abstract
   * @returns {*}
   */
  abstract getInitialResult(): T;

  /**
   * Defers to ErrorHandler.handleError with the constructor name and any args.
   *
   * @param {string} error
   * @param {object} options
   * @param {boolean} options.halt
   */
  private _handleError(error: string, options?: { halt: false; } | object): void;
  private _handleError(error: string, options?: { halt: true; }): never;
  private _handleError(error: string, options?: { halt?: boolean; }): void | never {
    ErrorHandler.handleError(this.constructor.name, error, options);
  }
}

export default Evaluator;
