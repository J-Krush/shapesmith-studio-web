// Plan 03-04 RED — failing tests for useLocalStorageState.
//
// Hook contract (mirrors RESEARCH.md Pattern 7):
//   const [value, setValue] = useLocalStorageState(key, initialValue);
//
// 5 cases covered (per Plan 03-04 <done> criteria):
//   1. Initial read returns initialValue when key absent
//   2. Initial read returns parsed value when key present
//   3. Ignores JSON.parse errors gracefully (returns initialValue)
//   4. Removes the key on null
//   5. Fails silently on localStorage.setItem throwing (e.g. QuotaExceededError)
import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import useLocalStorageState from './useLocalStorageState';

const KEY = 'shapesmith-quote-v1';

const importHook = () => useLocalStorageState;

beforeEach(() => {
	window.localStorage.clear();
	vi.restoreAllMocks();
});

afterEach(() => {
	window.localStorage.clear();
	vi.restoreAllMocks();
});

test('initial read returns initialValue when key is absent', () => {
	const useLocalStorageState = importHook();
	const initial = { tab: 'print', materialId: '', quantity: 1 };
	const { result } = renderHook(() => useLocalStorageState(KEY, initial));
	expect(result.current[0]).toEqual(initial);
});

test('initial read returns parsed value when key is present', () => {
	const stored = { tab: 'laser', materialId: 'mat-abc', quantity: 4 };
	window.localStorage.setItem(KEY, JSON.stringify(stored));
	const useLocalStorageState = importHook();
	const { result } = renderHook(() =>
		useLocalStorageState(KEY, { tab: 'print', materialId: '', quantity: 1 }),
	);
	expect(result.current[0]).toEqual(stored);
});

test('returns initialValue when stored JSON is malformed (parse error swallowed)', () => {
	window.localStorage.setItem(KEY, '{not valid json');
	const useLocalStorageState = importHook();
	const initial = { tab: 'print', materialId: '', quantity: 1 };
	const { result } = renderHook(() => useLocalStorageState(KEY, initial));
	expect(result.current[0]).toEqual(initial);
});

test('setValue writes JSON.stringified value to localStorage', () => {
	const useLocalStorageState = importHook();
	const { result } = renderHook(() =>
		useLocalStorageState(KEY, { tab: 'print', materialId: '', quantity: 1 }),
	);
	const next = { tab: 'laser', materialId: 'mat-xyz', quantity: 7 };
	act(() => {
		result.current[1](next);
	});
	expect(JSON.parse(window.localStorage.getItem(KEY))).toEqual(next);
});

test('setValue(null) removes the key from localStorage (auto-clear-on-submit path)', () => {
	window.localStorage.setItem(
		KEY,
		JSON.stringify({ tab: 'laser', materialId: 'mat-x', quantity: 3 }),
	);
	const useLocalStorageState = importHook();
	const { result } = renderHook(() =>
		useLocalStorageState(KEY, { tab: 'print', materialId: '', quantity: 1 }),
	);
	act(() => {
		result.current[1](null);
	});
	expect(window.localStorage.getItem(KEY)).toBeNull();
});

test('setValue(undefined) removes the key from localStorage', () => {
	window.localStorage.setItem(
		KEY,
		JSON.stringify({ tab: 'laser', materialId: 'mat-x', quantity: 3 }),
	);
	const useLocalStorageState = importHook();
	const { result } = renderHook(() =>
		useLocalStorageState(KEY, { tab: 'print', materialId: '', quantity: 1 }),
	);
	act(() => {
		result.current[1](undefined);
	});
	expect(window.localStorage.getItem(KEY)).toBeNull();
});

test('fails silently when localStorage.setItem throws QuotaExceededError', () => {
	const setItemSpy = vi
		.spyOn(Storage.prototype, 'setItem')
		.mockImplementation(() => {
			const err = new Error('QuotaExceededError');
			err.name = 'QuotaExceededError';
			throw err;
		});
	const useLocalStorageState = importHook();
	const { result } = renderHook(() =>
		useLocalStorageState(KEY, { tab: 'print', materialId: '', quantity: 1 }),
	);
	// The setValue call must NOT throw — UI keeps working in-memory.
	expect(() => {
		act(() => {
			result.current[1]({ tab: 'laser', materialId: 'mat-x', quantity: 5 });
		});
	}).not.toThrow();
	// In-memory value still updates so the UI reflects the new selection.
	expect(result.current[0]).toEqual({
		tab: 'laser',
		materialId: 'mat-x',
		quantity: 5,
	});
	setItemSpy.mockRestore();
});

test('fails silently when localStorage.getItem throws (disabled storage / Safari private mode)', () => {
	vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
		throw new Error('SecurityError: localStorage disabled');
	});
	const useLocalStorageState = importHook();
	const initial = { tab: 'print', materialId: '', quantity: 1 };
	const { result } = renderHook(() => useLocalStorageState(KEY, initial));
	// Falls back to initialValue without throwing.
	expect(result.current[0]).toEqual(initial);
});
