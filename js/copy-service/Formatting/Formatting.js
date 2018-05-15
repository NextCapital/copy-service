/**
 * Represents an HTML tag in the AST.
 */
class Formatting {
  /**
   * @param  {object} options
   */
  constructor(options) {
    /**
     * The neighboring AST.
     * @type {Formatting|Functional|Newline|Reference|Substitute|Switch|Verbatim}
     */
    this.sibling = options.sibling;
    /**
     * An AST representing the string displayed inside the HTML tag.
     * @type {Formatting|Functional|Newline|Reference|Substitute|Switch|Verbatim}
     */
    this.copy = options.copy;
    /**
     * The tag as a string.
     * @type {string}
     */
    this.tag = options.tag;
  }
}

export default Formatting;