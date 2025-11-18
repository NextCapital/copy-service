import {
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
  WordBreak,
  ErrorHandler
} from '../index';

import PlainTextEvaluator from './PlainTextEvaluator';
import SyntaxNode from '../copy-service/SyntaxNode/SyntaxNode';

describe('PlainTextEvaluator', () => {
  let evaluator: PlainTextEvaluator;
  let copyService: CopyService;
  let substitutions: Substitutions;

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

        expect(evaluator.evalAST(copyPrefix, null, substitutions)).toBe(copyPrefix);
      });
    });

    describe('when the ast is cached', () => {
      test('combines the cached result with the prefix', () => {
        const copyPrefix = 'hello';
        const suffix = 'world';
        const ast = new Newline({ sibling: null });

        jest.spyOn(evaluator, 'getCached').mockReturnValue(suffix);
        expect(evaluator.evalAST(copyPrefix, ast, substitutions)).toBe(copyPrefix + suffix);
        expect(evaluator.getCached).toHaveBeenCalledWith(ast);
      });
    });

    describe('when the ast is not cached', () => {
      test('caches the fully evaluated ast, without the prefix', () => {
        const copyPrefix = 'hello';
        const ast = new Verbatim({
          text: 'world',
          sibling: new Verbatim({ text: '!', sibling: null })
        });

        jest.spyOn(evaluator, 'setCacheIfCacheable').mockImplementation();
        expect(evaluator.evalAST(copyPrefix, ast, substitutions)).toBe('helloworld!');
        expect(evaluator.setCacheIfCacheable).toHaveBeenCalledWith(ast, 'world!');
      });
    });

    describe('when an AST is passed', () => {
      describe('when the AST is simple and has no sibling', () => {
        describe('when the AST is a Newline', () => {
          test('returns a newline character', () => {
            const ast = new Newline({ sibling: null });

            const newlineResult = 'newline';
            jest.spyOn(evaluator, 'getNewline').mockReturnValue(newlineResult);

            expect(evaluator.evalAST('', ast, substitutions)).toBe(newlineResult);
            expect(evaluator.getNewline).toHaveBeenCalled();
          });
        });

        describe('when the AST is a WordBreak', () => {
          test('defers to getWordBreak', () => {
            const ast = new WordBreak({ sibling: null });

            const wordbreakResult = '';
            jest.spyOn(evaluator, 'getWordBreak').mockReturnValue(wordbreakResult);

            expect(evaluator.evalAST('', ast, substitutions)).toBe(wordbreakResult);
            expect(evaluator.getWordBreak).toHaveBeenCalled();
          });
        });

        describe('when the AST is a Verbatim', () => {
          test('returns text from Verbatim', () => {
            const text = 'some really cool text';
            const ast = new Verbatim({ text, sibling: null });

            expect(evaluator.evalAST('', ast, substitutions)).toBe(text);
          });
        });

        describe('when the AST is a Reference', () => {
          test('returns the evaluated copy from the referenced key', () => {
            const referencedAST = new Newline({ sibling: null });
            (copyService.getAstForKey as jest.Mock).mockReturnValue(referencedAST);

            const key = 'some.key';
            const ast = new Reference({ key, sibling: null });

            expect(evaluator.evalAST('', ast, substitutions)).toBe('\n');
          });
        });

        describe('when the AST is a Substitute', () => {
          describe('when the substitution is not found', () => {
            test('returns empty string', () => {
              (substitutions.get as jest.Mock).mockReturnValue(null);
              const ast = new Substitute({ key: 'does.not.exist', sibling: null });

              expect(evaluator.evalAST('', ast, substitutions)).toBe('');
            });
          });

          describe('when the substitution is found', () => {
            test('returns the substitution as a string', () => {
              const text = 'substitution';
              (substitutions.get as jest.Mock).mockReturnValue(text);
              const ast = new Substitute({ key: 'exists', sibling: null });

              expect(evaluator.evalAST('', ast, substitutions)).toBe(text);
            });
          });
        });

        describe('when the AST is a RefSubstitute', () => {
          describe('when the substitution is not found', () => {
            test('returns empty string', () => {
              (substitutions.get as jest.Mock).mockReturnValue(null);
              const ast = new RefSubstitute({ key: 'does.not.exist', sibling: null });

              expect(evaluator.evalAST('', ast, substitutions)).toBe('');
            });
          });

          describe('when the substitution is found', () => {
            test('returns the evaluated copy from the referenced key', () => {
              const referencedAST = new Newline({ sibling: null });
              (copyService.getAstForKey as jest.Mock).mockReturnValue(referencedAST);

              const key = 'some.key';
              const ast = new RefSubstitute({ key, sibling: null });

              expect(evaluator.evalAST('', ast, substitutions)).toBe('\n');
            });
          });
        });

        describe('when the AST is a Switch', () => {
          describe('when the decider is true', () => {
            test('returns the evaluated left AST of the Switch', () => {
              (substitutions.getBoolean as jest.Mock).mockReturnValue(true);
              const ast = new Switch({
                left: new Verbatim({ text: 'left text', sibling: null }),
                right: new Verbatim({ text: 'right text', sibling: null }),
                key: 'decider',
                sibling: null
              });

              expect(evaluator.evalAST('', ast, substitutions)).toBe((ast.left as Verbatim).text);
            });
          });

          describe('when the decider is false', () => {
            test('returns the evaluated right AST of the Switch', () => {
              (substitutions.getBoolean as jest.Mock).mockReturnValue(false);
              const ast = new Switch({
                left: new Verbatim({ text: 'left text', sibling: null }),
                right: new Verbatim({ text: 'right text', sibling: null }),
                key: 'decider',
                sibling: null
              });

              expect(evaluator.evalAST('', ast, substitutions)).toBe((ast.right as Verbatim).text);
            });
          });
        });

        describe('when the AST is a Functional', () => {
          test('returns the evaluated copy, passing through the function', () => {
            const funcText = 'func text';
            const func = jest.fn().mockReturnValue(funcText);

            const ast = new Functional({
              copy: new Verbatim({ text: 'functional text', sibling: null }),
              key: 'func',
              sibling: null
            });

            expect(
              evaluator.evalAST('', ast, new Substitutions({ func }))
            ).toBe(funcText);

            expect(func).toHaveBeenCalledWith((ast.copy as Verbatim).text);
          });

          describe('when allowFunctional is disabled on the evaluator', () => {
            beforeEach(() => {
              evaluator.allowFunctional = false;
            });

            test('returns the evaluated copy, ignoring the function itself', () => {
              const funcText = 'func text';
              const func = jest.fn().mockReturnValue(funcText);

              const ast = new Functional({
                copy: new Verbatim({ text: 'functional text', sibling: null }),
                key: 'func',
                sibling: null
              });

              expect(
                evaluator.evalAST('', ast, new Substitutions({ func }))
              ).toBe((ast.copy as Verbatim).text);

              expect(func).not.toHaveBeenCalled();
            });
          });
        });

        describe('when the AST is a Formatting', () => {
          test('returns the evaluated copy of the Formatting, ignoring the HTML tags', () => {
            const ast = new Formatting({
              copy: new Verbatim({ text: 'functional text', sibling: null }),
              tag: 'strong',
              sibling: null
            });

            expect(evaluator.evalAST('', ast, substitutions)).toBe((ast.copy as Verbatim).text);
          });

          describe('when allowsFormattingTags is true', () => {
            beforeEach(() => {
              jest.spyOn(evaluator, 'allowsFormattingTags').mockReturnValue(true);
            });

            test('returns the evaluated copy of the Formatting, including the HTML tags', () => {
              const ast = new Formatting({
                copy: new Verbatim({ text: 'functional text', sibling: null }),
                tag: 'strong',
                sibling: null
              });

              expect(evaluator.evalAST('', ast, substitutions)).toBe(
                `<strong>${(ast.copy as Verbatim).text}</strong>`
              );
            });

            describe('when the copy is empty', () => {
              test('does not apply the tags', () => {
                const ast = new Formatting({
                  copy: new Verbatim({ text: '', sibling: null }),
                  tag: 'strong',
                  sibling: null
                });

                expect(evaluator.evalAST('', ast, substitutions)).toBe('');
              });
            });
          });
        });

        describe('when the AST is not a known AST class', () => {
          beforeEach(() => {
            jest.spyOn(ErrorHandler, 'handleError').mockImplementation();
          });

          test('logs error', () => {
            evaluator.evalAST('', {} as unknown as SyntaxNode, substitutions);
            expect(ErrorHandler.handleError).toHaveBeenCalledWith('PlainTextEvaluator', 'Unknown node detected');
          });

          test('returns empty string', () => {
            expect(evaluator.evalAST('', {} as unknown as SyntaxNode, substitutions)).toBe('');
          });
        });
      });

      describe('when the AST is complex and has siblings', () => {
        describe('when the AST is a nested Switch', () => {
          test('returns the correct copy', () => {
            const ast = new Switch({
              left: new Switch({
                left: new Verbatim({ text: 'll', sibling: null }),
                right: new Verbatim({ text: 'lr', sibling: null }),
                key: 'nestedLeft',
                sibling: null
              }),
              right: new Switch({
                left: new Verbatim({ text: 'rl', sibling: null }),
                right: new Verbatim({ text: 'rr', sibling: null }),
                key: 'nestedRight',
                sibling: null
              }),
              key: 'initialDecider',
              sibling: null
            });

            substitutions = new Substitutions({
              initialDecider: true,
              nestedLeft: false,
              nestedRight: true
            });

            expect(evaluator.evalAST('', ast, substitutions)).toBe(
              ((ast.left as Switch).right as Verbatim).text
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
