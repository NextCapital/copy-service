/**
 * Represents a logic branch in an AST.
 */
class Switch {
  /**
   * @param  {object} options
   */
  constructor(options) {
    /**
     * The substitution key for the decider, with leading and trailing whitespace trimmed.
     * @type {string}
     */
    this.key = options.key.trim();
    /**
     * The neighboring AST.
     * @type {Formatting|Functional|Newline|Reference|Substitute|Switch|Verbatim}
     */
    this.sibling = options.sibling;
    /**
     * The AST to use when the decider is evaluated to truthy.
     * @type {Formatting|Functional|Newline|Reference|Substitute|Switch|Verbatim}
     */
    this.left = options.left;
    /**
     * The AST to use when the decider is evaluated to falsy.
     * @type {Formatting|Functional|Newline|Reference|Substitute|Switch|Verbatim}
     */
    this.right = options.right;
  }
}

export default Switch;
