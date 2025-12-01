import Evaluator from './Evaluator.js';
import Substitutions from '../Substitutions/Substitutions.js';
import CopyService from '../CopyService.js';
import ErrorHandler from '../ErrorHandler/ErrorHandler.js';
import SyntaxNode from '../SyntaxNode/SyntaxNode.js';

// TODO: Import from CopyService once that file is converted to TypeScript
type AST = SyntaxNode | null;

// Concrete test implementation of abstract Evaluator
class TestEvaluator extends Evaluator<string> {
  override evalAST(): string {
    return '';
  }

  override getInitialResult(): string {
    return '';
  }
}

describe('Evaluator', () => {
  let evaluator: TestEvaluator;
  let copyService: CopyService;

  beforeEach(() => {
    copyService = new CopyService();
    evaluator = new TestEvaluator(copyService);
  });

  describe('constructor', () => {
    test('sets the copy service', () => {
      expect(evaluator.copyService).toBe(copyService);
    });

    test('creates the evaluationCache', () => {
      // evaluationCache is private, so we can't test it directly
      // We'll verify it exists indirectly through getCached/setCacheIfCacheable tests
      expect(evaluator).toBeInstanceOf(TestEvaluator);
    });

    test('defaults allowFunctional to true', () => {
      expect(evaluator.allowFunctional).toBe(true);
    });

    describe('when allowFunctional is passed', () => {
      test('sets allowFunctional from options', () => {
        evaluator = new TestEvaluator(copyService, { allowFunctional: false });
        expect(evaluator.allowFunctional).toBe(false);
      });
    });
  });

  describe('getCached', () => {
    test('gets the result from the evaluation cache', () => {
      const result = 'result';
      const ast = new SyntaxNode();
      jest.spyOn(ast, 'isCacheable').mockReturnValue(true);

      // Set the cache indirectly through setCacheIfCacheable
      evaluator.setCacheIfCacheable(ast, result);
      expect(evaluator.getCached(ast)).toBe(result);
    });
  });

  describe('setCacheIfCacheable', () => {
    let result: string;

    beforeEach(() => {
      result = 'result';
    });

    describe('when the ast is cacheable', () => {
      test('sets the result in the cache', () => {
        const ast = new SyntaxNode();
        jest.spyOn(ast, 'isCacheable').mockReturnValue(true);

        evaluator.setCacheIfCacheable(ast, result);
        expect(evaluator.getCached(ast)).toBe(result);
        expect(ast.isCacheable).toHaveBeenCalledWith(copyService);
      });
    });

    describe('when the ast is not cacheable', () => {
      test('does not set the result in the cache', () => {
        const ast = new SyntaxNode();
        jest.spyOn(ast, 'isCacheable').mockReturnValue(false);

        evaluator.setCacheIfCacheable(ast, result);
        expect(evaluator.getCached(ast)).toBeUndefined();
        expect(ast.isCacheable).toHaveBeenCalledWith(copyService);
      });
    });
  });

  describe('getCopy', () => {
    test('defers to evalAST with correct args', () => {
      const key = 'some.copy.key';
      const rawSubstitutions = { some: 'raw', substitutions: 'yo' };

      const initialCopy = 'initialCopy';
      const ast = new SyntaxNode();

      jest.spyOn(copyService, 'getAstForKey').mockReturnValue(ast);
      jest.spyOn(evaluator, 'getInitialResult').mockReturnValue(initialCopy);

      const copy = 'result copy';
      const evalASTSpy = jest.spyOn(evaluator, 'evalAST');
      evalASTSpy.mockImplementation(
        ((_init: string, _a: AST, subs: Substitutions): string => {
          expect(subs.substitutions).toEqual(rawSubstitutions);
          return copy;
        }) as typeof evaluator.evalAST
      );

      expect(evaluator.getCopy(key, rawSubstitutions)).toBe(copy);
      expect(evaluator.evalAST).toHaveBeenCalledWith(initialCopy, ast, expect.any(Substitutions));
      expect(copyService.getAstForKey).toHaveBeenCalledWith(key);
      expect(evaluator.getInitialResult).toHaveBeenCalled();
    });
  });

  describe('_handleError', () => {
    test('defers to ErrorHandler.handleError', () => {
      const errorMessage = 'some error message';
      const errorOptions = { halt: true };
      jest.spyOn(ErrorHandler, 'handleError').mockImplementation();

      // @ts-expect-error Accessing protected method for testing
      evaluator._handleError(errorMessage, errorOptions);
      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        TestEvaluator.name,
        errorMessage,
        errorOptions
      );
    });
  });
});
