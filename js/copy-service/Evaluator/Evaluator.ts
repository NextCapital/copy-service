/* eslint-disable @typescript-eslint/no-explicit-any */

import _ from 'lodash';

import CopyService from '../CopyService';
import ErrorHandler from '../ErrorHandler/ErrorHandler';
import IntlCopyService from '../IntlCopyService';
import Substitutions from '../Substitutions/Substitutions';
import SyntaxNode from '../SyntaxNode/SyntaxNode';

/**
 * Provides an interface to recursively generate copy evaluated with substitutions.
 *
 * @interface
 */
class Evaluator {
  /**
   * The copy service used for evaluation.
   */
  copyService: CopyService | IntlCopyService;

  /**
   * A cache for previously evaluated copy.
   */
  evaluationCache: WeakMap<SyntaxNode, any>;

  /**
   * When `true`, the functional ^{}{} syntax will run the configured method when evaluating.
   * When `false`, the copy will be returned without passing it through the function.
   */
  allowFunctional: boolean;

  constructor(
    copyService: CopyService | IntlCopyService,
    {
      allowFunctional = true
    }: {
      allowFunctional?: boolean;
    } = {}
  ) {
    this.copyService = copyService;

    this.evaluationCache = new WeakMap();

    this.allowFunctional = allowFunctional;
  }

  /**
   * Gets the cached evaluation result for the given ast, if it exists.
   */
  getCached(ast: SyntaxNode | null): any {
    return _.isNil(ast) ? null : this.evaluationCache.get(ast);
  }

  /**
   * Sets the evaluated result for the ast in the cache, if the ast node is cacheable.
   *
   * NOTE: The evaluated result should be the result of fully evaluating the ast with no prefix.
   */
  setCacheIfCacheable(ast: SyntaxNode | null, evaluated: any): void {
    if (!_.isNil(ast) && ast.isCacheable(this.copyService)) {
      this.evaluationCache.set(ast, evaluated);
    }
  }

  /**
   * Returns evaluated copy for the given copy key and substitutions. Substitutions provided must
   * either be an object or a function returning an object to be used by the evaluator.
   */
  getCopy(key: string, rawSubstitutions: object | (() => any)): any {
    const substitutions = new Substitutions(rawSubstitutions);
    const ast = this.copyService.getAstForKey(key);

    return this.evalAST(this.getInitialResult(), ast, substitutions);
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  /**
   * Evaluates the AST with the given substitutions and returns the evaluated copy prefixed with the
   * given evaluated copy in the process of being recursively built.
   *
   * Note: the AST provided must be constructed by Parser.
   */
  evalAST(copyPrefix: string, ast: SyntaxNode | null, substitutions: Substitutions) {
    this._handleError(
      'evalAST is abstract and must be implemented by the extending class',
      { halt: true }
    );
  }

  /**
   * Returns the default copy (usually an empty string).
   */
  getInitialResult(): any {
    this._handleError(
      'getInitialResult is abstract and must be implemented by the extending class',
      { halt: true }
    );
  }

  /**
   * Defers to ErrorHandler.handleError with the constructor name, error message adn
   * halt options.
   */
  _handleError(error: string, options: { halt: boolean; }): void | never {
    ErrorHandler.handleError(this.constructor.name, error, options);
  }
}

export default Evaluator;
