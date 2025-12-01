import _ from 'lodash';

import Formatting from '../Formatting/Formatting.js';
import Functional from '../Functional/Functional.js';
import Newline from '../Newline/Newline.js';
import Reference from '../Reference/Reference.js';
import RefSubstitute from '../RefSubstitute/RefSubstitute.js';
import Substitute from '../Substitute/Substitute.js';
import Switch from '../Switch/Switch.js';
import Verbatim from '../Verbatim/Verbatim.js';
import WordBreak from '../WordBreak/WordBreak.js';

import Parser from './Parser.js';

describe('Parser', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Note: Parser constructor is private, preventing instantiation at compile-time.
  // No runtime test needed as TypeScript enforces this constraint.

  describe('static parseLeaves', () => {
    describe('when the tree is empty', () => {
      test('returns empty tree', () => {
        expect(Parser.parseLeaves({})).toEqual({});
      });
    });

    describe('when the tree is populated', () => {
      describe('when the tree contains only valid copy', () => {
        describe('trees with simple copy', () => {
          describe('when the tree contains only simple text', () => {
            test('completes a parse with an AST containing Verbatim nodes', () => {
              const initialTree = { hello: 'hello from the other side' };
              const expectedTree = {
                hello: new Verbatim({
                  text: initialTree.hello,
                  sibling: null
                })
              };

              expect(Parser.parseLeaves(initialTree)).toEqual(expectedTree);
            });
          });

          describe('when the tree contains a reference', () => {
            test('completes a parse with an AST containing a Reference node', () => {
              const initialTree = {
                hello: 'hello from the other side',
                reference: '${hello}'
              };
              const expectedTree = {
                hello: new Verbatim({
                  text: initialTree.hello,
                  sibling: null
                }),
                reference: new Reference({
                  key: 'hello',
                  sibling: null
                })
              };

              expect(Parser.parseLeaves(initialTree)).toEqual(expectedTree);
            });
          });

          describe('when the tree contains a substitution', () => {
            test('completes a parse with an AST containing a Substitute node', () => {
              const initialTree = {
                substitution: '#{hello}'
              };
              const expectedTree = {
                substitution: new Substitute({
                  key: 'hello',
                  sibling: null
                })
              };

              expect(Parser.parseLeaves(initialTree)).toEqual(expectedTree);
            });
          });

          describe('when the tree contains a reference substitution', () => {
            test('completes a parse with an AST containing a RefSubstitute node', () => {
              const initialTree = {
                substitution: '%{hello}'
              };
              const expectedTree = {
                substitution: new RefSubstitute({
                  key: 'hello',
                  sibling: null
                })
              };

              expect(Parser.parseLeaves(initialTree)).toEqual(expectedTree);
            });
          });

          describe('when the tree contains a newline', () => {
            test('completes a parse with an AST containing a Newline node', () => {
              const initialTree = {
                newline: '\n'
              };
              const expectedTree = {
                newline: new Newline({
                  sibling: null
                })
              };

              expect(Parser.parseLeaves(initialTree)).toEqual(expectedTree);
            });
          });

          describe('when the tree contains a wordbreak', () => {
            test('completes a parse with an AST containing a WordBreak node', () => {
              const initialTree = {
                wordbreak: '\b'
              };
              const expectedTree = {
                wordbreak: new WordBreak({
                  sibling: null
                })
              };

              expect(Parser.parseLeaves(initialTree)).toEqual(expectedTree);
            });
          });

          describe('when the tree contains a switch', () => {
            test('completes a parse with an AST containing a Switch node', () => {
              const initialTree = {
                switch: '*{left text}{right text}{decider}'
              };
              const expectedTree = {
                switch: new Switch({
                  left: new Verbatim({
                    text: 'left text',
                    sibling: null
                  }),
                  right: new Verbatim({
                    text: 'right text',
                    sibling: null
                  }),
                  key: 'decider',
                  sibling: null
                })
              };

              expect(Parser.parseLeaves(initialTree)).toEqual(expectedTree);
            });
          });

          describe('when the tree contains a valid HTML tag', () => {
            test('completes a parse with an AST containing a Formatting node', () => {
              const initialTree = {
                formatting: '<strong>some text</strong>'
              };
              const expectedTree = {
                formatting: new Formatting({
                  tag: 'strong',
                  copy: new Verbatim({
                    text: 'some text',
                    sibling: null
                  }),
                  sibling: null
                })
              };

              expect(Parser.parseLeaves(initialTree)).toEqual(expectedTree);
            });
          });

          describe('when the tree contains a function with arguments', () => {
            test('completes a parse with an AST containing a Functional node', () => {
              const initialTree = {
                functional: '^{some copy}{functionKey}[arg1, arg2, arg3]'
              };
              const expectedTree = {
                functional: new Functional({
                  args: ['arg1', 'arg2', 'arg3'],
                  key: 'functionKey',
                  copy: new Verbatim({
                    text: 'some copy',
                    sibling: null
                  }),
                  sibling: null
                })
              };

              expect(Parser.parseLeaves(initialTree)).toEqual(expectedTree);
            });
          });

          describe('when the tree contains a function without arguments', () => {
            test('completes a parse with an AST containing a Functional node', () => {
              const initialTree = {
                functional: '^{some copy}{functionKey}'
              };
              const expectedTree = {
                functional: new Functional({
                  key: 'functionKey',
                  copy: new Verbatim({
                    text: 'some copy',
                    sibling: null
                  }),
                  sibling: null
                })
              };

              expect(Parser.parseLeaves(initialTree)).toEqual(expectedTree);
            });
          });
        });

        describe('trees with complex copy', () => {
          describe('what a tree contains nested keys', () => {
            test('parses the copy correctly and returns a tree with the same structure', () => {
              const initialTree = {
                text: 'some text',
                level1: {
                  text: 'some text',
                  level2: {
                    text: 'some text'
                  }
                }
              };

              const expectedTree = {
                text: new Verbatim({
                  text: 'some text',
                  sibling: null
                }),
                level1: {
                  text: new Verbatim({
                    text: 'some text',
                    sibling: null
                  }),
                  level2: {
                    text: new Verbatim({
                      text: 'some text',
                      sibling: null
                    })
                  }
                }
              };

              expect(Parser.parseLeaves(initialTree)).toEqual(expectedTree);
            });
          });

          describe('when a tree contains copy with nested switches', () => {
            test('parses the nested switch successfully', () => {
              const initialTree = {
                switch: '*{*{ll}{lr}{leftDecider}}{*{rl}{rr}{rightDecider}}{decider}'
              };
              const expectedTree = {
                switch: new Switch({
                  left: new Switch({
                    left: new Verbatim({
                      text: 'll',
                      sibling: null
                    }),
                    right: new Verbatim({
                      text: 'lr',
                      sibling: null
                    }),
                    key: 'leftDecider',
                    sibling: null
                  }),
                  right: new Switch({
                    left: new Verbatim({
                      text: 'rl',
                      sibling: null
                    }),
                    right: new Verbatim({
                      text: 'rr',
                      sibling: null
                    }),
                    key: 'rightDecider',
                    sibling: null
                  }),
                  key: 'decider',
                  sibling: null
                })
              };

              expect(Parser.parseLeaves(initialTree)).toEqual(expectedTree);
            });
          });

          describe('when a tree contains copy nested inside HTML tags', () => {
            test('parses the nested copy successfully', () => {
              const initialTree = {
                tags: '<strong><em>${hello}\n#{sub}\bgood bye</em></strong>'
              };
              const expectedTree = {
                tags: new Formatting({
                  copy: new Formatting({
                    copy: new Reference({
                      key: 'hello',
                      sibling: new Newline({
                        sibling: new Substitute({
                          key: 'sub',
                          sibling: new WordBreak({
                            sibling: new Verbatim({
                              text: 'good bye',
                              sibling: null
                            })
                          })
                        })
                      })
                    }),
                    tag: 'em',
                    sibling: null
                  }),
                  tag: 'strong',
                  sibling: null
                })
              };

              expect(Parser.parseLeaves(initialTree)).toEqual(expectedTree);
            });
          });

          describe('when a tree contains copy with a nested function with arguments', () => {
            test('parses the nested copy successfully', () => {
              const initialTree = {
                tags: '*{^{copy}{key}[arg]}{right}{decider}'
              };
              const expectedTree = {
                tags: new Switch({
                  left: new Functional({
                    key: 'key',
                    copy: new Verbatim({
                      text: 'copy',
                      sibling: null
                    }),
                    args: ['arg'],
                    sibling: null
                  }),
                  right: new Verbatim({
                    text: 'right',
                    sibling: null
                  }),
                  key: 'decider',
                  sibling: null
                })
              };

              expect(Parser.parseLeaves(initialTree)).toEqual(expectedTree);
            });
          });

          describe('when a tree contains copy with a nested function without arguments', () => {
            test('parses the nested copy successfully', () => {
              const initialTree = {
                tags: '*{^{copy}{key}}{right}{decider}'
              };
              const expectedTree = {
                tags: new Switch({
                  left: new Functional({
                    key: 'key',
                    copy: new Verbatim({
                      text: 'copy',
                      sibling: null
                    }),
                    sibling: null
                  }),
                  right: new Verbatim({
                    text: 'right',
                    sibling: null
                  }),
                  key: 'decider',
                  sibling: null
                })
              };

              expect(Parser.parseLeaves(initialTree)).toEqual(expectedTree);
            });
          });

          describe('when the tree contains several pieces of complex copy', () => {
            test('parses the tree\'s copy correctly', () => {
              const initialTree = {
                level1: '*{${level2.text}}{#{level1SubKey}}{decider}',
                level2: {
                  text: '^{some copy}{functionKey}',
                  more: {
                    text: '<strong><em>#{more}i like copy${level1}\n\non different lines</em></strong>'
                  }
                }
              };

              const level1Parsed = new Switch({
                left: new Reference({
                  key: 'level2.text',
                  sibling: null
                }),
                right: new Substitute({
                  key: 'level1SubKey',
                  sibling: null
                }),
                key: 'decider',
                sibling: null
              });

              const level2TextParsed = new Functional({
                key: 'functionKey',
                copy: new Verbatim({
                  text: 'some copy',
                  sibling: null
                }),
                sibling: null
              });

              const moreTextParsed = new Formatting({
                tag: 'strong',
                sibling: null,
                copy: new Formatting({
                  tag: 'em',
                  sibling: null,
                  copy: new Substitute({
                    key: 'more',
                    sibling: new Verbatim({
                      text: 'i like copy',
                      sibling: new Reference({
                        key: 'level1',
                        sibling: new Newline({
                          sibling: new Newline({
                            sibling: new Verbatim({
                              text: 'on different lines',
                              sibling: null
                            })
                          })
                        })
                      })
                    })
                  })
                })
              });

              const expectedTree = {
                level1: level1Parsed,
                level2: {
                  text: level2TextParsed,
                  more: {
                    text: moreTextParsed
                  }
                }
              };

              expect(Parser.parseLeaves(initialTree)).toEqual(expectedTree);
            });
          });
        });
      });

      describe('when the tree contains invalid copy', () => {
        describe('when the tree contains a boolean', () => {
          test('throws error', () => {
            // @ts-expect-error to test runtime error handling
            expect(() => Parser.parseLeaves({ bool: true })).toThrow(
              'Parser: Values can only be other objects or strings'
            );
          });
        });

        describe('when the tree contains a number', () => {
          test('throws error', () => {
            // @ts-expect-error to test runtime error handling
            expect(() => Parser.parseLeaves({ num: 42 })).toThrow(
              'Parser: Values can only be other objects or strings'
            );
          });
        });

        describe('when the tree contains an array', () => {
          test('throws error', () => {
            // @ts-expect-error to test runtime error handling
            expect(() => Parser.parseLeaves({ arr: [] })).toThrow(
              'Parser: Values can only be other objects or strings'
            );
          });
        });

        describe('when the tree contains a function', () => {
          test('throws error', () => {
            // @ts-expect-error to test runtime error handling
            expect(() => Parser.parseLeaves({ func: _.identity })).toThrow(
              'Parser: Values can only be other objects or strings'
            );
          });
        });

        describe('when the tree contains copy with an invalid HTML tag', () => {
          test('throws error', () => {
            const tree = { tag: '<invalid></invalid>' };

            expect(() => Parser.parseLeaves(tree)).toThrow(
              'Parser: Unknown HTML tag \'<invalid>\' found in formatting'
            );
          });
        });

        describe('when the tree contains copy with missing text', () => {
          test('throws error', () => {
            const tree = { tag: '${}' };

            expect(() => Parser.parseLeaves(tree)).toThrow(
              'Parser: Expected text value'
            );
          });
        });

        describe('when the tree contains copy with a missing close tag', () => {
          test('throws error', () => {
            const tree = { tag: '#{key' };

            expect(() => Parser.parseLeaves(tree)).toThrow(
              'Parser: Expected close character }'
            );
          });
        });

        describe('when the tree contains copy with a token in a function\'s arguments', () => {
          test('throws error', () => {
            const tree = { tag: '^{copy}{key}[arg, #{badIdea}]' };

            expect(() => Parser.parseLeaves(tree)).toThrow(
              'Parser: Unexpected token #{ in arguments'
            );
          });
        });

        describe('when the tree contains copy with an unknown token', () => {
          test('throws error', () => {
            const tree = { tag: '!{word}' };

            expect(() => Parser.parseLeaves(tree)).toThrow(
              'Parser: Unexpected token }'
            );
          });
        });

        describe('when the tree contains copy with a nested unknown token', () => {
          test('throws error', () => {
            const tree = { tag: '<strong>!{word}</strong>' };

            expect(() => Parser.parseLeaves(tree)).toThrow(
              'Parser: Unexpected restricted token }'
            );
          });
        });

        describe('when the tree contains copy with a missing HTML end tag', () => {
          test('throws error', () => {
            const tree = { tag: '<strong>' };

            expect(() => Parser.parseLeaves(tree)).toThrow(
              'Parser: Expected closing >'
            );
          });
        });
      });
    });
  });

  describe('static parseSingle', () => {
    describe('when the value is a string', () => {
      test('tokenizes and parses the string', () => {
        const key = 'key';
        const copy = '<b>hello</b>';
        const tokens = [{ tag: 'b', type: '<' }, { text: 'hello', type: 'text' }, { tag: 'b', type: '>' }];
        const result = new Formatting({
          copy: new Verbatim({
            sibling: null,
            text: 'hello'
          }),
          sibling: null,
          tag: 'b'
        });

        // @ts-expect-error - Accessing private method for testing
        jest.spyOn(Parser, '_tokenize');
        // @ts-expect-error - Accessing private method for testing
        expect(Parser._tokenize(copy)).toEqual(tokens);

        // @ts-expect-error - Accessing private method for testing
        jest.spyOn(Parser, '_parse');
        expect(Parser.parseSingle(key, copy)).toEqual(result);
        // @ts-expect-error - Accessing private method for testing
        expect(Parser._tokenize).toHaveBeenCalledWith(copy);
        // @ts-expect-error - Accessing private method for testing
        expect(Parser._parse).toHaveBeenCalledWith(tokens, key, copy);
      });
    });
  });
});
