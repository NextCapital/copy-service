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
      copy = <span><br /></span>;
    } else if (ast instanceof Verbatim) {
      copy = <span>{ ast.text }</span>;
    } else if (ast instanceof Reference) {
      copy = this.evalAST(
        this.getInitialResult(), this.copyService.getAstForKey(ast.key), substitutions
      );
    } else if (ast instanceof Substitute) {
      const value = substitutions.get(ast.key);

      if (!_.isNil(value) && value !== '') {
        const jsx = (<span>{ value.toString() }</span>);
        copy = jsx;
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
        jsx = (
          <span>{ method(jsx, ...ast.args) }</span>
        );
      }

      copy = jsx;
    } else if (ast instanceof Formatting) {
      const jsx = this.evalAST(this.getInitialResult(), ast.copy, substitutions);

      if (jsx) {
        const tag = React.createElement(ast.tag, {}, jsx.props.children);
        copy = <span>{ tag }</span>;
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

  _mergePrefixes(left, right) {
    if (!right) {
      return left;
    } else if (!left) {
      return right;
    }

    // single child preferable to multiple ones, as it avoids array alloc
    if (_.isString(left.props.children) && _.isString(right.props.children)) {
      return (
        <span>
          { left.props.children + right.props.children }
        </span>
      );
    }

    return (
      <span>
        { left.props.children }
        { right.props.children }
      </span>
    );
  }
}

export default ReactEvaluator;
