// Plan 05-03 RED — ShopContext smoke test.
//
// Hook contract (mirrors PATTERNS.md ShopContext + SingleProductContext shape):
//   const { products, loading, error, refetch } = useShop();
//
// Cases covered (per Plan 05-03 Task 3 <behavior>):
//   1. useShop returns { products: [], loading: true, error: null } during initial fetch.
//   2. result.current.refetch is a function.
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('../utilities/sanityClient', () => ({
	default: {
		fetch: vi.fn(() => new Promise(() => {})), // pending forever — keeps loading=true
	},
}));

import { ShopProvider, useShop } from './ShopContext';

describe('ShopContext', () => {
	it('useShop returns { products: [], loading: true, error: null } during initial fetch', () => {
		const wrapper = ({ children }) => <ShopProvider>{children}</ShopProvider>;
		const { result } = renderHook(() => useShop(), { wrapper });
		expect(result.current).toMatchObject({
			products: [],
			loading: true,
			error: null,
		});
		expect(typeof result.current.refetch).toBe('function');
	});
});
