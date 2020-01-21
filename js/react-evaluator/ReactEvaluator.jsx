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
   * @param  {Formatting|Functional|Newline|Reference|Substitute|Switch|Verbatim} ast
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
      const method = substitutions.get(ast.key);
      let jsx = this.evalAST(this.getInitialResult(), ast.copy, substitutions);

      if (method && _.isFunction(method)) {
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

    let key = 0;
    const addKeyToChild = (child) => {
      let newChild;
      if (!_.isString(child)) {
        newChild = React.cloneElement(child, { key });
        key += 1;
      }

      return newChild || child;
    };

    const keyedLeftChildren = React.Children.map(left.props.children, addKeyToChild);
    const keyedRightChildren = React.Children.map(right.props.children, addKeyToChild);

    if (!keyedLeftChildren) {
      return right;
    }

    if (!keyedRightChildren) {
      return left;
    }

    return (
      <span>
        { keyedLeftChildren }
        { keyedRightChildren }
      </span>
    );
  }
}

export default ReactEvaluator;
