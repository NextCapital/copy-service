const _ = require('lodash');
const React = require('react');

const {
  Formatting,
  Functional,
  Newline,
  Reference,
  RefSubstitute,
  Substitute,
  Switch,
  Verbatim,
  WordBreak,

  Evaluator
} = require('../index.js');

/**
 * Provides an interface that can register copy, determine the existence of copy, and generate copy
 * recursively evaluated with substitutions.
 *
 * @interface
 */
class ReactEvaluator extends Evaluator {
  /**
   * Evaluates the AST with given substitutions.
   *
   * @param  {string} copyPrefix The copy string being recursively built.
   * @param  {SyntaxNode|null} ast
   * The AST to be evaluated. This AST must be constructed by Parser.
   * @param  {Substitutions} substitutions An object containing substitutions for keys specified in
   * the AST.
   * @returns {JSX} The evaluated copy.
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
      copy = React.createElement('br', null);
    } else if (ast instanceof WordBreak) {
      copy = React.createElement('wbr', null);
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
        // because this can return arbitrary JSX, we must wrap in a fragment
        jsx = this._createFragment(method(jsx, ...ast.args));
      }

      copy = jsx;
    } else if (ast instanceof Formatting) {
      const jsx = this.evalAST(this.getInitialResult(), ast.copy, substitutions);

      if (jsx) {
        // unwrap a fragment, otherwise preserve children as-is
        const childContent = (_.isString(jsx) || jsx.type !== React.Fragment) ?
          jsx :
          jsx.props.children;

        copy = React.createElement(ast.tag, null, childContent);
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

  /**
   * Returns the default copy (usually an empty string).
   *
   * @returns {null}
   */
  getInitialResult() {
    return null;
  }

  /**
   * Returns a React fragment without using JSX syntax.
   *
   * @param {JSX} children Valid React children.
   * @returns {JSX}
   */
  _createFragment(...children) {
    return React.createElement(React.Fragment, null, ...children);
  }

  /**
   * Merges two AST results together.
   *
   * If either side is null, returns the other.
   * If both sides are strings, concatenates them.
   * If one side is a string, and the other JSX we:
   * - check if the `jsx` is a fragment. If so, we know it is output of _mergePrefixes or
   * functional copy, and thus has no props on it
   * - If a fragment, we can avoid duplicate tabs by merging children
   * - If not a fragment, we need to wrap in a new fragment to preserve the type
   * If neither side is a string, we have to wrap both in a new fragment
   * - Unless both are fragments, in which case we can merge children.
   *
   * So, in conclusion:
   *
   * - Any top-level fragment tags are specifically added by this method or functional copy
   * - Thus, it is *always* safe to merge the children of two fragments
   * - If either 'left' or 'right' is a non-fragment element, we have to wrap.
   *
   * @param {string|JSX} left The first prefix to merge.
   * @param {string|JSX} right The other prefix the merge.
   * @returns {string|JSX}
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

    // merge the two fragments
    if (left.type === React.Fragment) {
      // both are fragments, merge children into one fragment
      if (right.type === React.Fragment) {
        return this._createFragment(
          left.props.children,
          right.props.children
        );
      }

      return this._createFragment(
        left.props.children,
        right
      );
    }

    if (right.type === React.Fragment) {
      return this._createFragment(
        left,
        right.props.children
      );
    }

    // have to merge both elements under a new react fragment
    return this._createFragment(
      left,
      right
    );
  }
}

module.exports = ReactEvaluator;
