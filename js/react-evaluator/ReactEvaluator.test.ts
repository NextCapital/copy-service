import React from 'react';
import ReactDOMServer from 'react-dom/server';

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
  WordBreak
} from '../index';

import ReactEvaluator from './ReactEvaluator';
import SyntaxNode from '../copy-service/SyntaxNode/SyntaxNode';

type AST = SyntaxNode | null;

describe('ReactEvaluator', () => {
  let evaluator: ReactEvaluator;
  let copyService: CopyService;
  let substitutions: Substitutions;

  beforeEach(() => {
    copyService = new CopyService();
    evaluator = new ReactEvaluator(copyService);

    substitutions = new Substitutions({});
    jest.spyOn(substitutions, 'get');
    jest.spyOn(substitutions, 'getBoolean');
  });

  /**
   * Helper function to create a React element with null props.
   *
   * @param {string} tag - The HTML tag name.
   * @param {React.ReactNode[]} content - The children content.
   * @returns {React.ReactElement} The created React element.
   */
  function createElement(tag: string, ...content: React.ReactNode[]): React.ReactElement {
    return React.createElement(tag, null, ...content);
  }

  describe('getInitialResult', () => {
    test('returns null', () => {
      expect(evaluator.getInitialResult()).toBeNull();
    });
  });

  describe('evalAST', () => {
    beforeEach(() => {
      jest.spyOn(copyService, 'getAstForKey');
    });

    const getStaticMarkup = (copyPrefix: React.ReactNode, ast: AST): string => (
      ReactDOMServer.renderToStaticMarkup(
        evaluator.evalAST(copyPrefix, ast, substitutions) as React.ReactElement
      )
    );

    describe('when no AST is passed', () => {
      test('returns copyPrefix', () => {
        const copyPrefix = createElement('div', 'hello');

        expect(evaluator.evalAST(copyPrefix, null, substitutions)).toBe(copyPrefix);
      });
    });

    describe('when the ast is cached', () => {
      test('combines the cached result with the prefix', () => {
        const copyPrefix = 'hello';
        const suffix = createElement('strong', 'world');
        const ast = new Newline({ sibling: null });

        jest.spyOn(evaluator, 'getCached').mockReturnValue(suffix);
        expect(getStaticMarkup(copyPrefix, ast)).toBe('hello<strong>world</strong>');
        expect(evaluator.getCached).toHaveBeenCalledWith(ast);
      });
    });

    describe('when the ast is not cached', () => {
      test('caches the fully evaluated ast, without the prefix', () => {
        const copyPrefix = React.createElement(React.Fragment, null, 'hello');
        const ast = new Verbatim({
          text: 'world',
          sibling: new Verbatim({ text: '!', sibling: null })
        });

        jest.spyOn(evaluator, 'setCacheIfCacheable');
        expect(getStaticMarkup(copyPrefix, ast)).toBe('helloworld!');
        expect(evaluator.setCacheIfCacheable).toHaveBeenCalledWith(ast, 'world!');
        expect(
          ReactDOMServer.renderToStaticMarkup(evaluator.getCached(ast) as React.ReactElement)
        ).toBe('world!');
      });
    });

    describe('when an AST is passed', () => {
      describe('when the AST is simple and has no sibling', () => {
        describe('when the AST is a Newline', () => {
          test('returns a span with a br element', () => {
            const ast = new Newline({ sibling: null });

            expect(getStaticMarkup(null, ast)).toBe('<br/>');
          });
        });

        describe('when the AST is a WordBreak', () => {
          test('returns a span with a wbr element', () => {
            const ast = new WordBreak({ sibling: null });

            expect(getStaticMarkup(null, ast)).toBe('<wbr/>');
          });
        });

        describe('when the AST is a Verbatim', () => {
          test('returns the text from Verbatim as JSX', () => {
            const text = 'some really cool text';
            const ast = new Verbatim({ text, sibling: null });

            expect(getStaticMarkup(null, ast)).toBe(text);
          });
        });

        describe('when the AST is a Reference', () => {
          test('returns the evaluated copy of the referenced key', () => {
            const referencedAST = new Verbatim({ text: 'some text', sibling: null });
            (copyService.getAstForKey as jest.Mock).mockReturnValue(referencedAST);

            const key = 'some.key';
            const ast = new Reference({ key, sibling: null });

            expect(getStaticMarkup(null, ast)).toBe(referencedAST.text);
          });
        });

        describe('when the AST is a Substitute', () => {
          describe('when the substitution is not found', () => {
            test('returns the copy prefix', () => {
              (substitutions.get as jest.Mock).mockReturnValue(null);
              const ast = new Substitute({ key: 'does.not.exist', sibling: null });

              expect(evaluator.evalAST(null, ast, substitutions)).toBe(null);
            });
          });

          describe('when the substitution is found', () => {
            test('returns the substitution as a string formatted in JSX', () => {
              const text = 'substitution';
              (substitutions.get as jest.Mock).mockReturnValue(text);
              const ast = new Substitute({ key: 'exists', sibling: null });

              expect(getStaticMarkup(null, ast)).toBe(text);
            });
          });

          describe('when the substitution is an empty string', () => {
            test('returns the copy prefix', () => {
              (substitutions.get as jest.Mock).mockReturnValue('');
              const ast = new Substitute({ key: 'exists', sibling: null });

              expect(evaluator.evalAST(null, ast, substitutions)).toBe(null);
            });
          });
        });

        describe('when the AST is a RefSubstitute', () => {
          describe('when the substitution is not found', () => {
            test('returns copy prefix', () => {
              (substitutions.get as jest.Mock).mockReturnValue(null);
              const ast = new RefSubstitute({ key: 'does.not.exist', sibling: null });

              expect(evaluator.evalAST(null, ast, substitutions)).toBe(null);
            });
          });

          describe('when the substitution is found', () => {
            test('returns the evaluated copy of the referenced key', () => {
              const referencedAST = new Verbatim({ text: 'some text', sibling: null });
              (copyService.getAstForKey as jest.Mock).mockReturnValue(referencedAST);

              const key = 'some.key';
              const ast = new RefSubstitute({ key, sibling: null });

              expect(getStaticMarkup(null, ast)).toBe(referencedAST.text);
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

              expect(getStaticMarkup(null, ast)).toBe((ast.left as Verbatim).text);
            });
          });

          describe('when the decider false', () => {
            test('returns the evaluated right AST of the Switch', () => {
              (substitutions.getBoolean as jest.Mock).mockReturnValue(false);
              const ast = new Switch({
                left: new Verbatim({ text: 'left text', sibling: null }),
                right: new Verbatim({ text: 'right text', sibling: null }),
                key: 'decider',
                sibling: null
              });

              expect(getStaticMarkup(null, ast)).toBe((ast.right as Verbatim).text);
            });
          });
        });

        describe('when the AST is a Functional', () => {
          describe('when the functional has a method', () => {
            test('evaluates the function', () => {
              const func = jest.fn();
              const ast = new Functional({
                key: 'func',
                copy: new Verbatim({ text: 'some copy', sibling: null }),
                args: ['arg1', 'arg2'],
                sibling: null
              });

              evaluator.evalAST(null, ast, new Substitutions({ func }));
              expect(func).toHaveBeenCalledWith((ast.copy as Verbatim).text, 'arg1', 'arg2');
            });

            test('returns the result of the function method formatted as JSX', () => {
              const funcText = 'func text';
              const func = jest.fn().mockReturnValue(funcText);
              const ast = new Functional({
                key: 'func',
                copy: new Verbatim({ text: 'some copy', sibling: null }),
                args: ['arg1', 'arg2'],
                sibling: null
              });

              expect(ReactDOMServer.renderToStaticMarkup(
                evaluator.evalAST(null, ast, new Substitutions({ func })) as React.ReactElement
              )).toBe(funcText);
            });

            describe('when allowFunctional is false on the evaluator', () => {
              beforeEach(() => {
                evaluator.allowFunctional = false;
              });

              test('returns the functional\'s evaluated copy without calling the function', () => {
                const funcText = 'func text';
                const func = jest.fn().mockReturnValue(funcText);

                const ast = new Functional({
                  key: 'func',
                  copy: new Verbatim({ text: 'some copy', sibling: null }),
                  args: ['arg1', 'arg2'],
                  sibling: null
                });

                expect(ReactDOMServer.renderToStaticMarkup(
                  evaluator.evalAST(null, ast, new Substitutions({ func })) as React.ReactElement
                )).toBe((ast.copy as Verbatim).text);

                expect(func).not.toHaveBeenCalled();
              });
            });
          });

          describe('when the functional does not have a method', () => {
            test('returns the functional\'s evaluated copy', () => {
              const ast = new Functional({
                key: 'func',
                copy: new Verbatim({ text: 'some copy', sibling: null }),
                args: ['arg1', 'arg2'],
                sibling: null
              });

              expect(ReactDOMServer.renderToStaticMarkup(
                evaluator.evalAST(null, ast, substitutions) as React.ReactElement
              )).toBe((ast.copy as Verbatim).text);
            });
          });
        });

        describe('when the AST is a Formatting', () => {
          test('returns the Formatting\'s HTML tag containing evaluated copy', () => {
            const ast = new Formatting({
              tag: 'em',
              copy: new Verbatim({ text: 'some copy', sibling: null }),
              sibling: null
            });

            expect(ReactDOMServer.renderToStaticMarkup(
              evaluator.evalAST(null, ast, substitutions) as React.ReactElement
            )).toBe(`<em>${(ast.copy as Verbatim).text}</em>`);
          });

          describe('when the tag is empty', () => {
            test('returns the existing prefix', () => {
              const prefix = React.createElement(React.Fragment, null, 'prefix');

              const ast = new Formatting({
                tag: 'em',
                copy: null,
                sibling: null
              });

              expect(ReactDOMServer.renderToStaticMarkup(
                evaluator.evalAST(prefix, ast, substitutions) as React.ReactElement
              )).toBe('prefix');
            });
          });
        });

        describe('when the AST is an unknown AST class', () => {
          test('returns null', () => {
            // Note: Can't spy on protected _handleError method
            expect(evaluator.evalAST(null, {} as SyntaxNode, substitutions)).toBeNull();
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

            expect(ReactDOMServer.renderToStaticMarkup(
              evaluator.evalAST(null, ast, substitutions) as React.ReactElement
            )).toBe(((ast.left as Switch).right as Verbatim).text);
          });
        });

        describe('when several Verbatim nodes are siblings', () => {
          test('returns the correct copy', () => {
            const ast = new Verbatim({
              text: 'verbatim1',
              sibling: new Verbatim({
                text: 'verbatim2',
                sibling: new Verbatim({ text: 'verbatim3', sibling: null })
              })
            });

            expect(getStaticMarkup(null, ast)).toBe('verbatim1verbatim2verbatim3');
          });
        });

        describe('when complex copy exists inside of an HTML tag', () => {
          test('returns the correct copy', () => {
            const ast = new Formatting({
              tag: 'strong',
              copy: new Formatting({
                tag: 'em',
                copy: new Switch({
                  left: new Verbatim({ text: 'rl', sibling: null }),
                  right: new Verbatim({ text: 'rr', sibling: null }),
                  key: 'nestedRight',
                  sibling: null
                }),
                sibling: null
              }),
              sibling: null
            });

            expect(getStaticMarkup(null, ast)).toBe('<strong><em>rr</em></strong>');
          });
        });
      });
    });
  });
});
