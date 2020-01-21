/**
 * Represents a newline in an AST.
 */
class Newline {
  /**
   * @param  {object} options
   */
  constructor(options) {
    /**
     * The neighboring AST.
     * @type {Formatting|Functional|Newline|Reference|Substitute|Switch|Verbatim}
     */
    this.sibling = options.sibling;
  }

  /**
   * @returns {boolean} true if this node can be cached after evaluation
   */
  isCacheable(copyService) {
    if (this.sibling) {
      return this.sibling.isCacheable(copyService);
    }

    return true;
  }
}

export default Newline;
