import _ from 'lodash';

import {
  Formatting,
  Functional,
  Newline,
  Reference,
  Substitute,
  Switch,
  Verbatim,

  Evaluator
} from '@nextcapital/copy-service';

/**
 * Provides an interface that can register copy, determine the existance of copy, and generate copy
 * recursively evaluated with substitutions.
 * @interface
 */
class PlainTextEvaluator extends Evaluator {
  /* eslint-disable brace-style */
  /**
   * Evaluates the AST with given substitutions
   * @param  {string} copyPrefix    The copy string being recursively built.
   * @param  {Formatting|Functional|Newline|Reference|Substitute|Switch|Verbatim} ast
   *                                The AST to be evaluated. This AST must be constructed by Parser.
   * @param  {function} getASTForKey Reference to the parsed copy from the copy service.
   * @param  {object} substitutions An object containing substitutions for keys specified in the
   *                                AST.
   * @return {string}               The evaluated copy.
   */
  static evalAST(copyPrefix, ast, getASTForKey, substitutions) {
    if (!ast) {
      return copyPrefix;
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
      copy = this.evalAST('', this.astForKey(ast.key), substitutions);
    }
    // Perform the substitution and append it.
    else if (ast instanceof Substitute) {
      const value = this._trySubstitution(substitutions, ast.key);
      copy = (value == null) ? '' : value.toString();
    }
    // Check the decider provided in substitutions, pick the correct branch, evaluate that branch,
    // and append it.
    else if (ast instanceof Switch) {
      const decider = this._trySubstitution(substitutions, ast.key);
      let subtree;

      if (decider === 1 || decider === true) { // singular or true
        subtree = ast.left;
      } else { // zero, plural, or false
        subtree = ast.right;
      }

      copy = this.evalAST('', subtree, substitutions);
    }
    // Evaluate the copy of the class, ignoring the function, and append the evaluated copy.
    else if (ast instanceof Functional) {
      copy = this.evalAST('', ast.copy, substitutions);
    }
    // Evaluate the copy, ignoring the HTML tags, and append the evaluated copy.
    else if (ast instanceof Formatting) {
      copy = this.evalAST('', ast.copy, substitutions);
    }

    else {
      this._handleError('Unknown node detected');
      return '';
    }

    // Continue recursing to evaluate the remaining ast with the appended copyPrefix.
    return this.evalAST(copyPrefix + copy, ast.sibling, substitutions);
  }
  /* eslint-enable brace-style */

  /**
   * Returns the default copy (usually an empty string).
   * @return {*}
   * @abstract
   */
  static _getInitialResult() {
    return '';
  }
}

export default PlainTextEvaluator;
