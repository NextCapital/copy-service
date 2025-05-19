import SyntaxNode from '../SyntaxNode/SyntaxNode';

/**
 * Represents a logic branch in an AST.
 */
class Switch extends SyntaxNode {
  /**
   * The substitution key for the decider, with leading and trailing whitespace trimmed.
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

  /**
   * The AST to use when the decider is evaluated to truthy.
   *
   * @type {SyntaxNode|null}
   */
  left: SyntaxNode | null;

  /**
   * The AST to use when the decider is evaluated to falsy.
   *
   * @type {SyntaxNode|null}
   */
  right: SyntaxNode | null;

  constructor(options: {
    key: string;
    sibling: SyntaxNode | null;
    left: SyntaxNode | null;
    right: SyntaxNode | null;
  }) {
    super();

    this.key = options.key.trim();
    this.sibling = options.sibling || null;
    this.left = options.left || null;
    this.right = options.right || null;
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
    const left = this.safeToSyntax(this.left);
    const right = this.safeToSyntax(this.right);

    return (
      `*{${left}}{${right}}{${this.key}}${this.safeToSyntax(this.sibling)}`
    );
  }
}

export default Switch;
