const SyntaxNode = require('../SyntaxNode/SyntaxNode').default;

/**
 * Represents text in an AST.
 */
class Verbatim extends SyntaxNode {
  /**
   * @param  {object} options
   */
  constructor(options) {
    super(options);

    /**
     * @type {string}
     */
    this.text = options.text;
    /**
     * The neighboring AST.
     *
     * @type {SyntaxNode|null}
     */
    this.sibling = options.sibling || null;
  }

  /**
   * @param copyService
   * @returns {boolean} True if this node can be cached after evaluation.
   */
  isCacheable(copyService) {
    if (this.sibling) {
      return this.sibling.isCacheable(copyService);
    }

    return true;
  }

  /**
   * Converts the AST node to the syntax that made it.
   *
   * @returns {string}
   */
  toSyntax() {
    return (
      `${this.text}${this.safeToSyntax(this.sibling)}`
    );
  }
}

module.exports = Verbatim;
