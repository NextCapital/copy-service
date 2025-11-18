import _ from 'lodash';

import ErrorHandler from '../copy-service/ErrorHandler/ErrorHandler';
import Evaluator from '../copy-service/Evaluator/Evaluator';
import Formatting from '../copy-service/Formatting/Formatting';
import Functional from '../copy-service/Functional/Functional';
import Newline from '../copy-service/Newline/Newline';
import Reference from '../copy-service/Reference/Reference';
import RefSubstitute from '../copy-service/RefSubstitute/RefSubstitute';
import Substitute from '../copy-service/Substitute/Substitute';
import Substitutions from '../copy-service/Substitutions/Substitutions';
import Switch from '../copy-service/Switch/Switch';
import SyntaxNode from '../copy-service/SyntaxNode/SyntaxNode';
import Verbatim from '../copy-service/Verbatim/Verbatim';
import WordBreak from '../copy-service/WordBreak/WordBreak';

/**
 * Provides an interface that can register copy, determine the existence of copy, and generate copy
 * recursively evaluated with substitutions.
 *
 * @interface
 */
class PlainTextEvaluator extends Evaluator<string> {
  /* eslint-disable @stylistic/brace-style */
  /**
   * Evaluates the AST with given substitutions.
   */
  evalAST(copyPrefix: string, ast: SyntaxNode | null, substitutions: Substitutions): string {
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
      copy = this.getNewline();
    }
    // Append a WordBreak character.
    else if (ast instanceof WordBreak) {
      copy = this.getWordBreak();
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
    } else if (ast instanceof RefSubstitute) {
      const copyKey = substitutions.get(ast.key);
      copy = this.evalAST(
        this.getInitialResult(), this.copyService.getAstForKey(copyKey as string), substitutions
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
        text = String((method as (...args: unknown[]) => unknown)(text, ...ast.args));
      }

      copy = text;
    }
    // Evaluate the copy, ignoring the HTML tags, and append the evaluated copy.
    else if (ast instanceof Formatting) {
      const text = this.evalAST(this.getInitialResult(), ast.copy, substitutions);

      if (text && this.allowsFormattingTags()) {
        copy = `<${ast.tag}>${text}</${ast.tag}>`;
      } else {
        copy = text;
      }
    }
    // Log error and stop evaluating
    else {
      ErrorHandler.handleError(this.constructor.name, 'Unknown node detected');
      return this.getInitialResult();
    }

    // Continue recursing to evaluate the remaining ast with the appended copyPrefix.
    const evaluated = this.evalAST(copy, ast.sibling, substitutions);
    this.setCacheIfCacheable(ast, evaluated);

    return copyPrefix + evaluated;
  }
  /* eslint-enable @stylistic/brace-style */

  /**
   * Allows `HtmlEvaluator` to set this to true, enabling formatting tags to appear in the
   * result.
   */
  allowsFormattingTags(): boolean {
    return false;
  }

  /**
   * The output for the `Newline` AST node. Overridden by `HtmlEvaluator`.
   */
  getNewline(): string {
    return '\n';
  }

  /**
   * The output for the `WordBreak` AST node. Overridden by `HtmlEvaluator`.
   */
  getWordBreak(): string {
    return '';
  }

  /**
   * Returns the default copy (usually an empty string).
   */
  getInitialResult(): string {
    return '';
  }
}

export default PlainTextEvaluator;
