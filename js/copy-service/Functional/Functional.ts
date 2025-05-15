import SyntaxNode from '../SyntaxNode/SyntaxNode';

/**
 * Represents a function in an AST that can be evaluated with copy and arguments from substitutions.
 */
class Functional extends SyntaxNode {
  /**
   * The key locating the function substitution, with leading and trailing whitespace trimmed.
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
   * An AST representing the string that is passed into the function.
   *
   * @type {SyntaxNode|null}
   */
  copy: SyntaxNode | null;

  /**
   * The string keys corresponding to argument substitutions.
   *
   * @type {string[]}
   */
  args: string[];

  constructor(options: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    super();

    this.key = options.key.trim();
    this.sibling = options.sibling || null;
    this.copy = options.copy || null;
    this.args = options.args || [];
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
    const args = this.args.length === 0 ? '' : `[${this.args.join(',')}]`;

    return (
      `^{${this.safeToSyntax(this.copy)}}{${this.key}}${args}${this.safeToSyntax(this.sibling)}`
    );
  }
}

export default Functional;
