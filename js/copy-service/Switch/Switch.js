const SyntaxNode = require('../SyntaxNode/SyntaxNode').default;

/**
 * Represents a logic branch in an AST.
 */
class Switch extends SyntaxNode {
  /**
   * @param  {object} options
   */
  constructor(options) {
    super(options);

    /**
     * The substitution key for the decider, with leading and trailing whitespace trimmed.
     *
     * @type {string}
     */
    this.key = options.key.trim();
    /**
     * The neighboring AST.
     *
     * @type {SyntaxNode|null}
     */
    this.sibling = options.sibling || null;
    /**
     * The AST to use when the decider is evaluated to truthy.
     *
     * @type {SyntaxNode|null}
     */
    this.left = options.left || null;
    /**
     * The AST to use when the decider is evaluated to falsy.
     *
     * @type {SyntaxNode|null}
     */
    this.right = options.right || null;
  }

  /**
   * @returns {boolean} True if this node can be cached after evaluation.
   */
  isCacheable() {
    return false;
  }

  /**
   * Converts the AST node to the syntax that made it.
   *
   * @returns {string}
   */
  toSyntax() {
    const left = this.safeToSyntax(this.left);
    const right = this.safeToSyntax(this.right);

    return (
      `*{${left}}{${right}}{${this.key}}${this.safeToSyntax(this.sibling)}`
    );
  }
}

module.exports = Switch;
