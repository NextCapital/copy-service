const Evaluator = require('./Evaluator');
const Substitutions = require('../Substitutions/Substitutions');
const CopyService = require('../CopyService');
const ErrorHandler = require('../ErrorHandler/ErrorHandler').default;

describe('Evaluator', () => {
  let evaluator, copyService;

  beforeEach(() => {
    copyService = new CopyService();
    evaluator = new Evaluator(copyService);
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
        evaluator = new Evaluator(copyService, { allowFunctional: false });
        expect(evaluator.allowFunctional).toBe(false);
      });
    });
  });

  describe('getCached', () => {
    test('gets the result from the evaluation cache', () => {
      const result = { some: 'result' };
      const ast = { an: 'ast' };

      evaluator.evaluationCache.set(ast, result);
      expect(evaluator.getCached(ast)).toBe(result);
    });
  });

  describe('setCacheIfCacheable', () => {
    let result;

    beforeEach(() => {
      result = { some: 'result' };
    });

    describe('when the ast is cacheable', () => {
      test('sets the result in the cache', () => {
        const ast = { an: 'ast', isCacheable: jest.fn().mockReturnValue(true) };

        evaluator.setCacheIfCacheable(ast, result);
        expect(evaluator.getCached(ast)).toBe(result);
        expect(ast.isCacheable).toHaveBeenCalledWith(copyService);
      });
    });

    describe('when the ast is not cacheable', () => {
      test('does not set the result in the cache', () => {
        const ast = { an: 'ast', isCacheable: jest.fn().mockReturnValue(false) };

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
      const ast = { some: 'ast' };

      jest.spyOn(copyService, 'getAstForKey').mockReturnValue(ast);
      jest.spyOn(evaluator, 'getInitialResult').mockReturnValue(initialCopy);

      const copy = 'result copy';
      jest.spyOn(evaluator, 'evalAST').mockImplementation((init, a, subs) => {
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
      evaluator._handleError(...args);
      expect(ErrorHandler.handleError).toHaveBeenCalledWith(Evaluator.name, ...args);
    });
  });
});
