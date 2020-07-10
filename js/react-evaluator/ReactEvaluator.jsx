import _ from 'lodash';
import React from 'react';

import {
  Formatting,
  Functional,
  Newline,
  Reference,
  RefSubstitute,
  Substitute,
  Switch,
  Verbatim,

  Evaluator
} from '../index.js';

/**
 * Provides an interface that can register copy, determine the existance of copy, and generate copy
 * recursively evaluated with substitutions.
 * @interface
 */
class ReactEvaluator extends Evaluator {
  /**
   * Evaluates the AST with given substitutions
   * @param  {string} copyPrefix The copy string being recursively built.
   * @param  {SyntaxNode|null} ast
   * The AST to be evaluated. This AST must be constructed by Parser.
   * @param  {Substitutions} substitutions An object containing substitutions for keys specified in
   * the AST.
   * @return {JSX} The evaluated copy.
   */
  evalAST(copyPrefix, ast, substitutions) {
    if (!ast) {
      return copyPrefix;
    }

    const cached = this.getCached(ast);
    if (cached) {
      return this._mergePrefixes(copyPrefix, cached);
    }

    let copy;

    if (ast instanceof Newline) {
      copy = <br />;
    } else if (ast instanceof Verbatim) {
      copy = ast.text;
    } else if (ast instanceof Reference) {
      copy = this.evalAST(
        this.getInitialResult(), this.copyService.getAstForKey(ast.key), substitutions
      );
    } else if (ast instanceof Substitute) {
      const value = substitutions.get(ast.key);

      if (!_.isNil(value) && value !== '') {
        copy = value.toString();
      } else {
        copy = null;
      }
    } else if (ast instanceof RefSubstitute) {
      const copyKey = substitutions.get(ast.key);
      copy = this.evalAST(
        this.getInitialResult(), this.copyService.getAstForKey(copyKey), substitutions
      );
    } else if (ast instanceof Switch) {
      const decider = substitutions.getBoolean(ast.key);
      let subtree;

      if (decider) { // singular or truthy
        subtree = ast.left;
      } else { // zero, plural, or falsy
        subtree = ast.right;
      }

      copy = this.evalAST(
        this.getInitialResult(), subtree, substitutions
      );
    } else if (ast instanceof Functional) {
      const method = substitutions.getFunction(ast.key);
      let jsx = this.evalAST(this.getInitialResult(), ast.copy, substitutions);

      if (this.allowFunctional && method && _.isFunction(method)) {
        // because this can return arbitrary JSX, we must wrap in a span
        jsx = (
          <span>
            { method(jsx, ...ast.args) }
          </span>
        );
      }

      copy = jsx;
    } else if (ast instanceof Formatting) {
      const jsx = this.evalAST(this.getInitialResult(), ast.copy, substitutions);

      if (jsx) {
        copy = React.createElement(ast.tag, {}, jsx);
      } else { // empty formatting, skip tag
        copy = null;
      }
    } else {
      this._handleError('Unknown node detected');
      return this.getInitialResult();
    }

    const evaluated = this.evalAST(copy, ast.sibling, substitutions);
    this.setCacheIfCacheable(ast, evaluated);

    return this._mergePrefixes(copyPrefix, evaluated);
  }
  /* eslint-enable brace-style */

  /**
   * Returns the default copy (usually an empty string).
   * @return {null}
   */
  getInitialResult() {
    return null;
  }

  /**
   * Merges two AST results together.
   *
   * If either side is null, returns the other.
   * If both sides are strings, concatenates them.
   * If one side is a string, and the other JSX we:
   *  - check if the `jsx` is a span. If so, we know it is output of _mergePrefixes or functional
   *    copy, and thus has no props on it
   *  - If a span, we can avoid duplicate tabs by merging children
   *  - If not a span, we need to wrap in a new span to preserve the type
   * If neither side is a string, we have to wrap both in a new span
   *  - Unless both are spans, in which case we can merge children
   *
   * So, in conclusion:
   *
   *  - Any top-level span tags are specifically added by this method or functional copy
   *  - Thus, it is *always* safe to merge the children of two spans
   *  - If either 'left' or 'right' is a non-span element, we have to wrap
   */
  _mergePrefixes(left, right) {
    if (!right) {
      return left;
    } else if (!left) {
      return right;
    }

    // happy path: both sides are strings
    if (_.isString(left) && _.isString(right)) {
      return left + right;
    }

    // merge the two spans
    if (left.type === 'span') {
      // both are spans, merge children into one span
      if (right.type === 'span') {
        return (
          <span>
            { left.props.children }
            { right.props.children }
          </span>
        );
      }

      return (
        <span>
          { left.props.children }
          { right }
        </span>
      );
    }

    if (right.type === 'span') {
      return (
        <span>
          { left }
          { right.props.children }
        </span>
      );
    }

    // have to merge both elements under a new span tag
    return (
      <span>
        { left }
        { right }
      </span>
    );
  }
}

export default ReactEvaluator;
