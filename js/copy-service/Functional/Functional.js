/**
 * Represents a function in an AST that can be evaluated with copy and arguments from substitutions.
 */
class Functional {
  /**
   * @param  {object} options
   */
  constructor(options) {
    /**
     * The key locating the function substitution, with leading and trailing whitespace trimmed.
     * @type {string}
     */
    this.key = options.key.trim();
    /**
     * The neighboring AST.
     * @type {Formatting|Functional|Newline|Reference|Substitute|Switch|Verbatim}
     */
    this.sibling = options.sibling;
    /**
     * An AST representing the string that is passed into the function.
     * @type {Formatting|Functional|Newline|Reference|Substitute|Switch|Verbatim}
     */
    this.copy = options.copy;
    /**
     * The string keys corresponding to argument substitutions.
     * @type {Array<string>}
     */
    this.args = options.args || [];
  }
}

export default Functional;
