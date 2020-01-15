/**
 * Represents a substitution of a copy key reference in an AST.
 */
class RefSubstitute {
  /**
   * @param  {object} options
   */
  constructor(options) {
    /**
     * The copy key being referenced, with leading and trailing whitespace trimmed.
     * @type {string}
     */
    this.key = options.key.trim();
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
    return false;
  }
}

export default RefSubstitute;
