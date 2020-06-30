import SyntaxNode from '../SyntaxNode/SyntaxNode';

/**
 * Represents a substitution of a copy key reference in an AST.
 */
class RefSubstitute extends SyntaxNode {
  /**
   * @param  {object} options
   */
  constructor(options) {
    super(options);

    /**
     * The copy key being referenced, with leading and trailing whitespace trimmed.
     * @type {string}
     */
    this.key = options.key.trim();
    /**
     * The neighboring AST.
     * @type {SyntaxNode|null}
     */
    this.sibling = options.sibling;
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
      `%{${this.key}}${this.safeToSyntax(this.sibling)}`
    );
  }
}

export default RefSubstitute;
