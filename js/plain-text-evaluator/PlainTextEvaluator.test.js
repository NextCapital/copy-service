const {
  Formatting,
  Functional,
  Newline,
  Reference,
  RefSubstitute,
  Substitute,
  Switch,
  Verbatim,
  Substitutions,
  CopyService,
  WordBreak
} = require('../index.js');

const PlainTextEvaluator = require('./PlainTextEvaluator');

describe('PlainTextEvaluator', () => {
  let evaluator, copyService, substitutions;

  beforeEach(() => {
    copyService = new CopyService();
    evaluator = new PlainTextEvaluator(copyService);

    substitutions = new Substitutions({});
    jest.spyOn(substitutions, 'get');
    jest.spyOn(substitutions, 'getBoolean');
  });

  describe('getInitialResult', () => {
    test('returns empty string', () => {
      expect(evaluator.getInitialResult()).toBe('');
    });
  });

  describe('evalAST', () => {
    beforeEach(() => {
      jest.spyOn(copyService, 'getAstForKey');
    });

    describe('when no AST is passed', () => {
      test('returns copyPrefix', () => {
        const copyPrefix = 'hello';

        expect(evaluator.evalAST(copyPrefix, null)).toBe(copyPrefix);
      });
    });

    describe('when the ast is cached', () => {
      test('combines the cached result with the prefix', () => {
        const copyPrefix = 'hello';
        const suffix = 'world';
        const ast = new Newline({});

        jest.spyOn(evaluator, 'getCached').mockReturnValue(suffix);
        expect(evaluator.evalAST(copyPrefix, ast)).toBe(copyPrefix + suffix);
        expect(evaluator.getCached).toBeCalledWith(ast);
      });
    });

    describe('when the ast is not cached', () => {
      test('caches the fully evaluated ast, without the prefix', () => {
        const copyPrefix = 'hello';
        const ast = new Verbatim({
          text: 'world',
          sibling: new Verbatim({ text: '!' })
        });

        jest.spyOn(evaluator, 'setCacheIfCacheable').mockImplementation();
        expect(evaluator.evalAST(copyPrefix, ast)).toBe('helloworld!');
        expect(evaluator.setCacheIfCacheable).toBeCalledWith(ast, 'world!');
      });
    });

    describe('when an AST is passed', () => {
      describe('when the AST is simple and has no sibling', () => {
        describe('when the AST is a Newline', () => {
          test('returns a newline character', () => {
            const ast = new Newline({});

            const newlineResult = 'newline';
            jest.spyOn(evaluator, 'getNewline').mockReturnValue(newlineResult);

            expect(evaluator.evalAST('', ast)).toBe(newlineResult);
            expect(evaluator.getNewline).toBeCalled();
          });
        });

        describe('when the AST is a WordBreak', () => {
          test('defers to getWordBreak', () => {
            const ast = new WordBreak({});

            const wordbreakResult = '';
            jest.spyOn(evaluator, 'getWordBreak').mockReturnValue(wordbreakResult);

            expect(evaluator.evalAST('', ast)).toBe(wordbreakResult);
            expect(evaluator.getWordBreak).toBeCalled();
          });
        });

        describe('when the AST is a Verbatim', () => {
          test('returns text from Verbatim', () => {
            const text = 'some really cool text';
            const ast = new Verbatim({ text });

            expect(evaluator.evalAST('', ast)).toBe(text);
          });
        });

        describe('when the AST is a Reference', () => {
          test('returns the evaluated copy from the referenced key', () => {
            const referencedAST = new Newline({});
            copyService.getAstForKey.mockReturnValue(referencedAST);

            const key = 'some.key';
            const ast = new Reference({ key });

            expect(evaluator.evalAST('', ast)).toBe('\n');
          });
        });

        describe('when the AST is a Substitute', () => {
          describe('when the substitution is not found', () => {
            test('returns empty string', () => {
              substitutions.get.mockReturnValue(null);
              const ast = new Substitute({ key: 'does.not.exist' });

              expect(evaluator.evalAST('', ast, substitutions)).toBe('');
            });
          });

          describe('when the substitution is found', () => {
            test('returns the substitution as a string', () => {
              const text = 'substitution';
              substitutions.get.mockReturnValue(text);
              const ast = new Substitute({ key: 'exists' });

              expect(evaluator.evalAST('', ast, substitutions)).toBe(text);
            });
          });
        });

        describe('when the AST is a RefSubstitute', () => {
          describe('when the substitution is not found', () => {
            test('returns empty string', () => {
              substitutions.get.mockReturnValue(null);
              const ast = new RefSubstitute({ key: 'does.not.exist' });

              expect(evaluator.evalAST('', ast, substitutions)).toBe('');
            });
          });

          describe('when the substitution is found', () => {
            test('returns the evaluated copy from the referenced key', () => {
              const referencedAST = new Newline({});
              copyService.getAstForKey.mockReturnValue(referencedAST);

              const key = 'some.key';
              const ast = new RefSubstitute({ key });

              expect(evaluator.evalAST('', ast, substitutions)).toBe('\n');
            });
          });
        });

        describe('when the AST is a Switch', () => {
          describe('when the decider is true', () => {
            test('returns the evaluated left AST of the Switch', () => {
              substitutions.getBoolean.mockReturnValue(true);
              const ast = new Switch({
                left: new Verbatim({ text: 'left text' }),
                right: new Verbatim({ text: 'right text' }),
                key: 'decider'
              });

              expect(evaluator.evalAST('', ast, substitutions)).toBe(ast.left.text);
            });
          });

          describe('when the decider is false', () => {
            test('returns the evaluated right AST of the Switch', () => {
              substitutions.getBoolean.mockReturnValue(false);
              const ast = new Switch({
                left: new Verbatim({ text: 'left text' }),
                right: new Verbatim({ text: 'right text' }),
                key: 'decider'
              });

              expect(evaluator.evalAST('', ast, substitutions)).toBe(ast.right.text);
            });
          });
        });

        describe('when the AST is a Functional', () => {
          test('returns the evaluated copy, passing through the function', () => {
            const funcText = 'func text';
            const func = jest.fn().mockReturnValue(funcText);

            const ast = new Functional({
              copy: new Verbatim({ text: 'functional text' }),
              key: 'func'
            });

            expect(
              evaluator.evalAST('', ast, new Substitutions({ func }))
            ).toBe(funcText);

            expect(func).toBeCalledWith(ast.copy.text);
          });

          describe('when allowFunctional is disabled on the evaluator', () => {
            beforeEach(() => {
              evaluator.allowFunctional = false;
            });

            test('returns the evaluated copy, ignoring the function itself', () => {
              const funcText = 'func text';
              const func = jest.fn().mockReturnValue(funcText);

              const ast = new Functional({
                copy: new Verbatim({ text: 'functional text' }),
                key: 'func'
              });

              expect(
                evaluator.evalAST('', ast, new Substitutions({ func }))
              ).toBe(ast.copy.text);

              expect(func).not.toBeCalled();
            });
          });
        });

        describe('when the AST is a Formatting', () => {
          test('returns the evaluated copy of the Formatting, ignoring the HTML tags', () => {
            const ast = new Formatting({
              copy: new Verbatim({ text: 'functional text' }),
              tag: 'strong'
            });

            expect(evaluator.evalAST('', ast, substitutions)).toBe(ast.copy.text);
          });

          describe('when allowsFormattingTags is true', () => {
            beforeEach(() => {
              jest.spyOn(evaluator, 'allowsFormattingTags').mockReturnValue(true);
            });

            test('returns the evaluated copy of the Formatting, including the HTML tags', () => {
              const ast = new Formatting({
                copy: new Verbatim({ text: 'functional text' }),
                tag: 'strong'
              });

              expect(evaluator.evalAST('', ast, substitutions)).toBe(
                `<strong>${ast.copy.text}</strong>`
              );
            });

            describe('when the copy is empty', () => {
              test('does not apply the tags', () => {
                const ast = new Formatting({
                  copy: new Verbatim({ text: '' }),
                  tag: 'strong'
                });

                expect(evaluator.evalAST('', ast, substitutions)).toBe('');
              });
            });
          });
        });

        describe('when the AST is not a known AST class', () => {
          beforeEach(() => {
            jest.spyOn(evaluator, '_handleError').mockImplementation();
          });

          test('logs error', () => {
            evaluator.evalAST('', {});
            expect(evaluator._handleError).toBeCalledWith('Unknown node detected');
          });

          test('returns empty string', () => {
            expect(evaluator.evalAST('', {})).toBe('');
          });
        });
      });

      describe('when the AST is complex and has siblings', () => {
        describe('when the AST is a nested Switch', () => {
          test('returns the correct copy', () => {
            const ast = new Switch({
              left: new Switch({
                left: new Verbatim({ text: 'll' }),
                right: new Verbatim({ text: 'lr' }),
                key: 'nestedLeft'
              }),
              right: new Switch({
                left: new Verbatim({ text: 'rl' }),
                right: new Verbatim({ text: 'rr' }),
                key: 'nestedRight'
              }),
              key: 'initialDecider'
            });

            const substitutions = new Substitutions({
              initialDecider: true,
              nestedLeft: false,
              nestedRight: true
            });

            expect(evaluator.evalAST('', ast, substitutions)).toBe(
              ast.left.right.text
            );
          });
        });
      });
    });
  });

  describe('allowsFormattingTags', () => {
    test('returns false', () => {
      expect(evaluator.allowsFormattingTags()).toBe(false);
    });
  });

  describe('getNewline', () => {
    test('returns a newline character', () => {
      expect(evaluator.getNewline()).toBe('\n');
    });
  });

  describe('getWordBreak', () => {
    test('returns an empty string', () => {
      expect(evaluator.getWordBreak()).toBe('');
    });
  });
});
