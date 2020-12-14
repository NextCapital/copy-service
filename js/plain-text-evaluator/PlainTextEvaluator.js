const _ = require('lodash');

const {
  Formatting,
  Functional,
  Newline,
  Reference,
  RefSubstitute,
  Substitute,
  Switch,
  Verbatim,

  Evaluator
} = require('../index.js');

/**
 * Provides an interface that can register copy, determine the existence of copy, and generate copy
 * recursively evaluated with substitutions.
 * @interface
 */
class PlainTextEvaluator extends Evaluator {
  /* eslint-disable brace-style */
  /**
   * Evaluates the AST with given substitutions
   * @param  {string} copyPrefix    The copy string being recursively built.
   * @param  {SyntaxNode|null} ast
   *                                The AST to be evaluated. This AST must be constructed by Parser.
   * @param  {object} substitutions An object containing substitutions for keys specified in the
   *                                AST.
   * @return {string}               The evaluated copy.
   */
  evalAST(copyPrefix, ast, substitutions) {
    if (!ast) {
      return copyPrefix;
    }

    const cached = this.getCached(ast);
    if (cached) {
      return copyPrefix + cached;
    }

    let copy;

    // Append a newline character.
    if (ast instanceof Newline) {
      copy = '\n';
    }
    // Append the text of the Verbatim.
    else if (ast instanceof Verbatim) {
      copy = ast.text;
    }
    // Build the copy at the referenced key and append it.
    else if (ast instanceof Reference) {
      copy = this.evalAST(
        this.getInitialResult(), this.copyService.getAstForKey(ast.key), substitutions
      );
    }
    // Perform the substitution and append it.
    else if (ast instanceof Substitute) {
      const value = substitutions.get(ast.key);
      copy = _.isNil(value) ? '' : value.toString();
    }
    else if (ast instanceof RefSubstitute) {
      const copyKey = substitutions.get(ast.key);
      copy = this.evalAST(
        this.getInitialResult(), this.copyService.getAstForKey(copyKey), substitutions
      );
    }
    // Check the decider provided in substitutions, pick the correct branch, evaluate that branch,
    // and append it.
    else if (ast instanceof Switch) {
      const decider = substitutions.getBoolean(ast.key);
      let subtree;

      if (decider) { // singular or truthy
        subtree = ast.left;
      } else { // zero, plural, or falsy
        subtree = ast.right;
      }

      copy = this.evalAST(this.getInitialResult(), subtree, substitutions);
    }
    // Evaluate the copy of the class, ignoring the function, and append the evaluated copy.
    else if (ast instanceof Functional) {
      const method = substitutions.getFunction(ast.key);
      let text = this.evalAST(this.getInitialResult(), ast.copy, substitutions);

      if (this.allowFunctional && method && _.isFunction(method)) {
        text = method(text, ...ast.args);
      }

      copy = text;
    }
    // Evaluate the copy, ignoring the HTML tags, and append the evaluated copy.
    else if (ast instanceof Formatting) {
      copy = this.evalAST(this.getInitialResult(), ast.copy, substitutions);
    }
    // Log error and stop evaluating
    else {
      this._handleError('Unknown node detected');
      return this.getInitialResult();
    }

    // Continue recursing to evaluate the remaining ast with the appended copyPrefix.
    const evaluated = this.evalAST(copy, ast.sibling, substitutions);
    this.setCacheIfCacheable(ast, evaluated);

    return copyPrefix + evaluated;
  }
  /* eslint-enable brace-style */

  /**
   * Returns the default copy (usually an empty string).
   * @return {*}
   */
  getInitialResult() {
    return '';
  }
}

module.exports = PlainTextEvaluator;
