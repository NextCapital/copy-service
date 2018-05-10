/**
 * Represents a substitution mapped to a substitution key in an AST.
 */
class Substitute {
  /**
   * @param  {object} options
   */
  constructor(options) {
    /**
     * The substitution key, with leading and trailing whitespace trimmed.
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

export default Substitute;
