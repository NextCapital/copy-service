import _ from 'lodash';

/**
 * Base class for non-null AST nodes.
 */
class SyntaxNode {
  /**
   * Returns `true` if the param is an AST node.
   *
   * @param {SyntaxNode|null} node
   * @return {boolean}
   */
  static isAST(node) {
    return node === null || node instanceof SyntaxNode;
  }

  /**
   * If `null`, returns an empty string. Otherwise, calls `toSyntax` on the node.
   *
   * @param {SyntaxNode|null} node
   * @return {string}
   */
  static safeToSyntax(node) {
    if (node === null) {
      return '';
    }

    return node.toSyntax();
  }

  /**
   * Converts the AST node to the syntax that made it.
   *
   * This method should be overridden in a subclass.
   *
   * @return {string}
   */
  toSyntax() {
    return '';
  }

  /**
   * Shortcut to the static `safeToSyntax` method.
   *
   * @param {SyntaxNode|null} node
   * @return {string}
   */
  safeToSyntax(node) {
    return this.constructor.safeToSyntax(node);
  }

  /**
   * When this returns `true`, the node is can be cached. This should `return` false if
   * anything in either it or its child nodes cannot be cached safely (eg: substitution)
   * when evaluated.
   *
   * This method should be overridden in a subclass.
   *
   * @param {CopyService} copyService
   * @return {boolean}
   */
  isCacheable(copyService) { // eslint-disable-line no-unused-vars
    return false;
  }
}

export default SyntaxNode;
