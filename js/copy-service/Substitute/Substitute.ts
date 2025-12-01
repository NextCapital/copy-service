import SyntaxNode from '../SyntaxNode/SyntaxNode.js';

/**
 * Represents a substitution mapped to a substitution key in an AST.
 */
class Substitute extends SyntaxNode {
  /**
   * The substitution key, with leading and trailing whitespace trimmed.
   *
   * @type {string}
   */
  readonly key: string;

  /**
   * The neighboring AST.
   *
   * @type {SyntaxNode|null}
   */
  readonly sibling: SyntaxNode | null;

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
      `#{${this.key}}${this.safeToSyntax(this.sibling)}`
    );
  }
}

export default Substitute;
