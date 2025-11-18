import Evaluator from './Evaluator';
import Substitutions from '../Substitutions/Substitutions';
import CopyService from '../CopyService';
import ErrorHandler from '../ErrorHandler/ErrorHandler';
import SyntaxNode from '../SyntaxNode/SyntaxNode';

type AST = SyntaxNode | null;

// Concrete test implementation of abstract Evaluator
class TestEvaluator extends Evaluator<string> {
  evalAST(copyPrefix: string, ast: AST, substitutions: Substitutions): string {
    this._handleError(
      'evalAST is abstract and must be implemented by the extending class',
      { halt: true }
    );
    return '';
  }

  getInitialResult(): string {
    this._handleError(
      'getInitialResult is abstract and must be implemented by the extending class',
      { halt: true }
    );
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
      expect(evaluator.evaluationCache).toBeInstanceOf(WeakMap);
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
      const ast = { an: 'ast' } as unknown as SyntaxNode;

      // Access private property for testing
      (evaluator as any).evaluationCache.set(ast, result);
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
        const ast = { an: 'ast', isCacheable: jest.fn().mockReturnValue(true) } as unknown as SyntaxNode;

        evaluator.setCacheIfCacheable(ast, result);
        expect(evaluator.getCached(ast)).toBe(result);
        expect(ast.isCacheable).toHaveBeenCalledWith(copyService);
      });
    });

    describe('when the ast is not cacheable', () => {
      test('does not set the result in the cache', () => {
        const ast = { an: 'ast', isCacheable: jest.fn().mockReturnValue(false) } as unknown as SyntaxNode;

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
      const ast = { some: 'ast' } as unknown as SyntaxNode;

      jest.spyOn(copyService, 'getAstForKey').mockReturnValue(ast);
      jest.spyOn(evaluator, 'getInitialResult').mockReturnValue(initialCopy);

      const copy = 'result copy';
      jest.spyOn(evaluator, 'evalAST').mockImplementation((init: string, a: AST, subs: Substitutions) => {
        expect(subs.substitutions).toEqual(rawSubstitutions);
        return copy;
      });

      expect(evaluator.getCopy(key, rawSubstitutions)).toBe(copy);
      expect(evaluator.evalAST).toHaveBeenCalledWith(initialCopy, ast, expect.any(Substitutions));
      expect(copyService.getAstForKey).toHaveBeenCalledWith(key);
      expect(evaluator.getInitialResult).toHaveBeenCalled();
    });
  });

  describe('evalAST', () => {
    test('throws error', () => {
      expect(() => evaluator.evalAST()).toThrow(
        'evalAST is abstract and must be implemented by the extending class'
      );
    });
  });

  describe('getInitialResult', () => {
    test('throws error', () => {
      expect(() => evaluator.getInitialResult()).toThrow(
        'getInitialResult is abstract and must be implemented by the extending class'
      );
    });
  });

  describe('_handleError', () => {
    test('defers to ErrorHandler.handleError', () => {
      const args = ['some error message', { halt: true }];
      jest.spyOn(ErrorHandler, 'handleError').mockImplementation();
      (evaluator as any)._handleError(...args);
      expect(ErrorHandler.handleError).toHaveBeenCalledWith(TestEvaluator.name, ...args);
    });
  });
});
