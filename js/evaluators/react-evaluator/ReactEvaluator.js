import _ from 'lodash';
import React from 'react';

import Parser from '../Parser/Parser';

/**
 * Provides an interface that can register copy, determine the existance of copy, and generate copy
 * recursively evaluated with substitutions.
 * @interface
 */
class ReactEvaluator {
  /**
   * Evaluates the AST with given substitutions
   * @param  {string} copyPrefix    The copy string being recursively built.
   * @param  {Formatting|Functional|Newline|Reference|Substitute|Switch|Verbatim} ast
   *                                The AST to be evaluated. This AST must be constructed by Parser.
   * @param  {object} substitutions An object containing substitutions for keys specified in the
   *                                AST.
   * @return {string}               The evaluated copy.
   * @abstract
   */
  static evalAST(copyPrefix, ast, getASTForKey, substitutions) {
    if (!ast) {
      return copyPrefix;
    }

    let copy;

    if (ast instanceof Newline) {
      copy = this._mergePrefixes(copyPrefix, <span><br /></span>);

    } else if (ast instanceof Verbatim) {
      copy = this._mergePrefixes(copyPrefix, <span>{ ast.text }</span>);

    } else if (ast instanceof Reference) {
      const referencedCopy = this.evalAST(this._getInitialResult(), getASTForKey(ast.key), getASTForKey, substitutions);
      copy = this._mergePrefixes(copyPrefix, referencedCopy);

    } else if (ast instanceof Substitute) {
      const value = this._trySubstitution(substitutions, ast.key);

      if (_.some(value)) {
        const jsx = (<span>{ value.toString() }</span>);
        copy = this._mergePrefixes(copyPrefix, jsx);
      }
    } else if (ast instanceof Switch) {
      const decider = this._trySubstitution(substitutions, ast.key);
      let subtree;

      if (decider === 1 || decider === true) { // singular or true
        subtree = ast.left;
      } else { // zero, plural, or false
        subtree = ast.right;
      }

      const switchJsx = this.evalAST(this._getInitialResult(), subtree, getASTForKey, substitutions);
      copy = this._mergePrefixes(copyPrefix, switchJsx);

    } else if (ast instanceof Functional) {
      const method = _.get(substitutions, ast.key);
      let jsx = this.evalAST(this._getInitialResult(), ast.copy, getASTForKey, substitutions);

      if (method && _.isFunction(method)) {
        jsx = (
          <span>{ method(jsx, ...ast.args) }</span>
        );
      }

      copy = this._mergePrefixes(copyPrefix, jsx);

    } else if (ast instanceof Formatting) {
      const jsx = this.evalAST(this._getInitialResult(), ast.copy, getASTForKey, substitutions);
      const tag = React.createElement(ast.tag, {}, jsx.props.children);

      copy = this._mergePrefixes(copyPrefix, <span>{ tag }</span>);

    } else {
      this._handleError('Unknown node detected');
      return this._getInitialResult();
    }

    return this.evalAST(copyPrefix + copy, ast.sibling, getASTForKey, substitutions);
  }
  /* eslint-enable brace-style */

  /**
   * Returns the default copy (usually an empty string).
   * @return {*}
   * @abstract
   */
  static _getInitialResult() {
    return (<span></span>);
  }

  static _mergePrefixes(left, right) {
    if (!right) {
      return left;
    } else if (!left) {
      return right;
    }

    let key = 0;
    const addKeyToChild = (child) => {
      if (!_.isString(child)) {
        child = React.cloneElement(child, { key });
        key++;
      }

      return child;
    };

    const keyedLeftChildren = React.Children.map(left.props.children, addKeyToChild);
    const keyedRightChildren = React.Children.map(right.props.children, addKeyToChild);

    if (!keyedLeftChildren) {
      return right;
    }

    if (!keyedRightChildren) {
      return left;
    }

    const allChildren = _.compact(
      _.concat(
        _.castArray(keyedLeftChildren),
        _.castArray(keyedRightChildren)
      )
    );

    return (
      <span>
        { allChildren }
      </span>
    );
  }
}

export default ReactEvaluator;
