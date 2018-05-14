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
}

export default Newline;
