/* eslint-disable object-curly-newline */

import _ from 'lodash';

import Formatting from '../Formatting/Formatting';
import Functional from '../Functional/Functional';
import Newline from '../Newline/Newline';
import Reference from '../Reference/Reference';
import RefSubstitute from '../RefSubstitute/RefSubstitute';
import Substitute from '../Substitute/Substitute';
import Switch from '../Switch/Switch';
import Verbatim from '../Verbatim/Verbatim';

import Parser from './Parser';

describe('Parser', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    test('throws error', () => {
      expect(() => new Parser()).toThrow('Parser: Parser is a singleton');
    });
  });

  describe('static parseLeaves', () => {
    describe('when the tree is empty', () => {
      test('returns empty tree', () => {
        expect(Parser.parseLeaves({})).toEqual({});
        expect(Parser.parseLeaves(null)).toEqual(null);
        expect(Parser.parseLeaves(undefined)).toEqual(undefined);
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
                formatting: '<b>some text</b>'
              };
              const expectedTree = {
                formatting: new Formatting({
                  tag: 'b',
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
                tags: '<b><i>${hello}\n#{sub}</i></b>'
              };
              const expectedTree = {
                tags: new Formatting({
                  copy: new Formatting({
                    copy: new Reference({
                      key: 'hello',
                      sibling: new Newline({
                        sibling: new Substitute({
                          key: 'sub',
                          sibling: null
                        })
                      })
                    }),
                    tag: 'i',
                    sibling: null
                  }),
                  tag: 'b',
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
                    text: '<b><i>#{moar}i like copy${level1}\n\non different lines</i></b>'
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
                tag: 'b',
                sibling: null,
                copy: new Formatting({
                  tag: 'i',
                  sibling: null,
                  copy: new Substitute({
                    key: 'moar',
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
            expect(() => Parser.parseLeaves({ bool: true })).toThrow(
              'Parser: Values can only be other objects or strings'
            );
          });
        });

        describe('when the tree contains a number', () => {
          test('throws error', () => {
            expect(() => Parser.parseLeaves({ num: 42 })).toThrow(
              'Parser: Values can only be other objects or strings'
            );
          });
        });

        describe('when the tree contains an array', () => {
          test('throws error', () => {
            expect(() => Parser.parseLeaves({ arr: [] })).toThrow(
              'Parser: Values can only be other objects or strings'
            );
          });
        });

        describe('when the tree contains a function', () => {
          test('throws error', () => {
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
            const tree = { tag: '!{lol}' };

            expect(() => Parser.parseLeaves(tree)).toThrow(
              'Parser: Unexpected token }'
            );
          });
        });

        describe('when the tree contains copy with a nested unknown token', () => {
          test('throws error', () => {
            const tree = { tag: '<b>!{lol}</b>' };

            expect(() => Parser.parseLeaves(tree)).toThrow(
              'Parser: Unexpected restricted token }'
            );
          });
        });

        describe('when the tree contains copy with a missing HTML end tag', () => {
          test('throws error', () => {
            const tree = { tag: '<b>' };

            expect(() => Parser.parseLeaves(tree)).toThrow(
              'Parser: Expected closing >'
            );
          });
        });
      });
    });
  });

  describe('static parseSingle', () => {
    describe('when the value is not a string', () => {
      test('throws an error', () => {
        expect(() => Parser.parseSingle({})).toThrow(
          'Parser: Can only parse strings as copy'
        );
      });
    });

    describe('when the value is a string', () => {
      test('tokenizes and parses the string', () => {
        const result = { some: 'ast' };
        jest.spyOn(Parser, '_parse').mockReturnValue(result);

        const tokens = ['some', 'tokens'];
        jest.spyOn(Parser, '_tokenize').mockReturnValue(tokens);

        const copy = 'some copy';
        expect(Parser.parseSingle(copy)).toBe(result);

        expect(Parser._tokenize).toBeCalledWith(copy);
        expect(Parser._parse).toBeCalledWith(tokens, copy);
      });
    });
  });
});
