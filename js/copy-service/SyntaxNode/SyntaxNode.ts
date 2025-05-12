import CopyService from '../CopyService';
import IntlCopyService from '../IntlCopyService';

/**
 * Base class for non-null AST nodes.
 */
class SyntaxNode {
  /**
   * Returns `true` if the param is an AST node.
   */
  static isAST(node: SyntaxNode | null): boolean {
    return node === null || node instanceof SyntaxNode;
  }

  /**
   * If `null`, returns an empty string. Otherwise, calls `toSyntax` on the node.
   */
  static safeToSyntax(node: SyntaxNode | null): string {
    if (node === null) {
      return '';
    }

    return node.toSyntax();
  }

  /**
   * Converts the AST node to the syntax that made it.
   *
   * This method should be overridden in a subclass.
   */
  toSyntax() : string {
    return '';
  }

  /**
   * Shortcut to the static `safeToSyntax` method.
   */
  safeToSyntax(node: SyntaxNode | null) : string {
    return (this.constructor as typeof SyntaxNode).safeToSyntax(node);
  }

  /**
   * When this returns `true`, the node is can be cached. This should `return` false if
   * anything in either it or its child nodes cannot be cached safely (eg: substitution)
   * when evaluated.
   *
   * This method should be overridden in a subclass.
   */
  isCacheable(copyService: CopyService | IntlCopyService) : boolean { // eslint-disable-line no-unused-vars
    return false;
  }
}

export default SyntaxNode;
