// useLocalStorageState — generic [value, setValue] hook backed by localStorage.
//
// Plan 03-04 (QTE-10). Per RESEARCH.md Pattern 7 + PATTERNS.md "useLocalStorageState":
//   - Lazy initializer reads localStorage[key] once on mount; JSON.parse errors,
//     SecurityError (disabled storage / Safari private mode), and any other read
//     failure all fall back to initialValue silently.
//   - Effect mirrors value into localStorage on every change. Passing null or
//     undefined to setValue removes the key — supports auto-clear-on-submit
//     (QuoteTabs passes setQuoteState(null) from QuoteSubmitForm.onSubmitted).
//   - Effect's localStorage write is wrapped in try/catch so QuotaExceededError
//     is swallowed; the in-memory value still updates so the UI keeps working.
//
// File extension is .jsx per CONVENTIONS.md (matches useSanityQuery.jsx,
// useScrollToTop.jsx). Default export per the codebase convention for hooks.
import { useState, useEffect } from 'react';

const useLocalStorageState = (key, initialValue) => {
	const [value, setValue] = useState(() => {
		try {
			const stored = window.localStorage.getItem(key);
			return stored !== null ? JSON.parse(stored) : initialValue;
		} catch {
			// Disabled storage, malformed JSON, or any other read failure —
			// silently fall back to initialValue.
			return initialValue;
		}
	});

	useEffect(() => {
		try {
			if (value === undefined || value === null) {
				window.localStorage.removeItem(key);
			} else {
				window.localStorage.setItem(key, JSON.stringify(value));
			}
		} catch {
			// QuotaExceededError or disabled storage — fail silently. The
			// in-memory value (above) still drives the UI for this session.
		}
	}, [key, value]);

	return [value, setValue];
};

export default useLocalStorageState;
