/**
 * Represents text in an AST.
 */
class Verbatim {
  /**
   * @param  {object} options
   */
  constructor(options) {
    /**
     * @type {string}
     */
    this.text = options.text;
    /**
     * The neighboring AST.
     * @type {Formatting|Functional|Newline|Reference|Substitute|Switch|Verbatim}
     */
    this.sibling = options.sibling;
  }

  /**
   * @returns {boolean} true if this node can be cached after evaluation
   */
  isCacheable() {
    if (this.sibling) {
      return this.sibling.isCacheable();
    }

    return true;
  }
}

export default Verbatim;
