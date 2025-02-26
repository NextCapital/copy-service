const SyntaxNode = require('../SyntaxNode/SyntaxNode');

/**
 * Represents a word break in an AST.
 */
class WordBreak extends SyntaxNode {
  /**
   * @param  {object} options
   */
  constructor(options) {
    super(options);

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
    return `\b${this.safeToSyntax(this.sibling)}`;
  }
}

module.exports = WordBreak;
