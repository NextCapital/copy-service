import _ from 'lodash';
import React from 'react';

import Evaluator from '../copy-service/Evaluator/Evaluator.js';
import Formatting from '../copy-service/Formatting/Formatting.js';
import Functional from '../copy-service/Functional/Functional.js';
import Newline from '../copy-service/Newline/Newline.js';
import Reference from '../copy-service/Reference/Reference.js';
import RefSubstitute from '../copy-service/RefSubstitute/RefSubstitute.js';
import Substitute from '../copy-service/Substitute/Substitute.js';
import Substitutions from '../copy-service/Substitutions/Substitutions.js';
import Switch from '../copy-service/Switch/Switch.js';
import SyntaxNode from '../copy-service/SyntaxNode/SyntaxNode.js';
import Verbatim from '../copy-service/Verbatim/Verbatim.js';
import WordBreak from '../copy-service/WordBreak/WordBreak.js';

type AST = SyntaxNode | null;

/**
 * Provides an interface that can register copy, determine the existence of copy, and generate copy
 * recursively evaluated with substitutions.
 */
class ReactEvaluator extends Evaluator<React.ReactNode> {
  /**
   * Evaluates the AST with given substitutions.
   */
  evalAST(
    copyPrefix: React.ReactNode,
    ast: AST,
    substitutions: Substitutions
  ): React.ReactNode {
    if (!ast) {
      return copyPrefix;
    }

    const cached = this.getCached(ast);
    if (cached) {
      return this._mergePrefixes(copyPrefix, cached);
    }

    let copy: React.ReactNode;

    if (ast instanceof Newline) {
      copy = React.createElement('br', null);
    } else if (ast instanceof WordBreak) {
      copy = React.createElement('wbr', null);
    } else if (ast instanceof Verbatim) {
      copy = ast.text;
    } else if (ast instanceof Reference) {
      copy = this.evalAST(
        this.getInitialResult(), this.copyService.getAstForKey(ast.key) ?? null, substitutions
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
        this.getInitialResult(), this.copyService.getAstForKey(copyKey) ?? null, substitutions
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
      const method = substitutions.getFunction(ast.key) as (...args: unknown[]) => unknown;
      let jsx = this.evalAST(this.getInitialResult(), ast.copy, substitutions);

      if (this.allowFunctional && method && _.isFunction(method)) {
        // because this can return arbitrary JSX, we must wrap in a fragment
        jsx = this._createFragment(method(jsx, ...ast.args) as React.ReactNode);
      }

      copy = jsx;
    } else if (ast instanceof Formatting) {
      const jsx = this.evalAST(this.getInitialResult(), ast.copy, substitutions);

      if (jsx) {
        // unwrap a fragment, otherwise preserve children as-is
        let childContent: React.ReactNode = jsx;
        if (React.isValidElement(jsx) && jsx.type === React.Fragment) {
          childContent = jsx.props.children;
        }

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
   */
  getInitialResult(): null {
    return null;
  }

  /**
   * Returns a React fragment without using JSX syntax.
   */
  private _createFragment(...children: React.ReactNode[]): React.ReactElement {
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
   */
  private _mergePrefixes(
    left: React.ReactNode,
    right: React.ReactNode
  ): React.ReactNode {
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
    if (React.isValidElement(left) && left.type === React.Fragment) {
      // both are fragments, merge children into one fragment
      if (React.isValidElement(right) && right.type === React.Fragment) {
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

    if (React.isValidElement(right) && right.type === React.Fragment) {
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

export default ReactEvaluator;
