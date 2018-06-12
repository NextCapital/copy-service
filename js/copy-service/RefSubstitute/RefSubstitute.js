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
}

export default RefSubstitute;
