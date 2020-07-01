import SyntaxNode from '../SyntaxNode/SyntaxNode';

/**
 * Represents a substitution mapped to a substitution key in an AST.
 */
class Substitute extends SyntaxNode {
  /**
   * @param  {object} options
   */
  constructor(options) {
    super(options);

    /**
     * The substitution key, with leading and trailing whitespace trimmed.
     * @type {string}
     */
    this.key = options.key.trim();
    /**
     * The neighboring AST.
     * @type {SyntaxNode|null}
     */
    this.sibling = options.sibling || null;
  }

  /**
   * @returns {boolean} true if this node can be cached after evaluation
   */
  isCacheable() {
    return false;
  }

  /**
   * Converts the AST node to the syntax that made it.
   *
   * @return {string}
   */
  toSyntax() {
    return (
      `#{${this.key}}${this.safeToSyntax(this.sibling)}`
    );
  }
}

export default Substitute;
