import SyntaxNode from '../SyntaxNode/SyntaxNode';

/**
 * Represents a substitution of a copy key reference in an AST.
 */
class RefSubstitute extends SyntaxNode {
  /**
   * The copy key being referenced, with leading and trailing whitespace trimmed.
   *
   * @type {string}
   */
  key: string;

  /**
   * The neighboring AST.
   *
   * @type {SyntaxNode|null}
   */
  sibling: SyntaxNode | null;

  constructor(options: {
    key: string;
    sibling: SyntaxNode | null;
  }) {
    super();

    this.key = options.key.trim();
    this.sibling = options.sibling || null;
  }

  /**
   * @returns {boolean} True if this node can be cached after evaluation.
   */
  override isCacheable(): boolean {
    return false;
  }

  /**
   * Converts the AST node to the syntax that made it.
   *
   * @returns {string}
   */
  override toSyntax(): string {
    return (
      `%{${this.key}}${this.safeToSyntax(this.sibling)}`
    );
  }
}

export default RefSubstitute;
