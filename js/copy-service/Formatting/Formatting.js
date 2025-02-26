const SyntaxNode = require('../SyntaxNode/SyntaxNode');

/**
 * Represents an HTML tag in the AST.
 */
class Formatting extends SyntaxNode {
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
    /**
     * An AST representing the string displayed inside the HTML tag.
     *
     * @type {SyntaxNode|null}
     */
    this.copy = options.copy || null;
    /**
     * The tag as a string.
     *
     * @type {string}
     */
    this.tag = options.tag;
  }

  /**
   * @param copyService
   * @returns {boolean} True if this node can be cached after evaluation.
   */
  isCacheable(copyService) {
    if (this.sibling) {
      if (this.copy) {
        return this.sibling.isCacheable(copyService) && this.copy.isCacheable(copyService);
      }

      return this.sibling.isCacheable(copyService);
    } else if (this.copy) {
      return this.copy.isCacheable(copyService);
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
      `<${this.tag}>${this.safeToSyntax(this.copy)}</${this.tag}>${this.safeToSyntax(this.sibling)}`
    );
  }
}

module.exports = Formatting;
