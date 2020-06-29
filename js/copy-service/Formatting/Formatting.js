import SyntaxNode from '../SyntaxNode/SyntaxNode';

/**
 * Represents an HTML tag in the AST.
 */
class Formatting extends SyntaxNode {
  /**
   * @param  {object} options
   */
  constructor(options) {
    super();

    /**
     * The neighboring AST.
     * @type {SyntaxNode|null}
     */
    this.sibling = options.sibling;
    /**
     * An AST representing the string displayed inside the HTML tag.
     * @type {SyntaxNode|null}
     */
    this.copy = options.copy;
    /**
     * The tag as a string.
     * @type {string}
     */
    this.tag = options.tag;
  }

  /**
   * @returns {boolean} true if this node can be cached after evaluation
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
}

export default Formatting;
