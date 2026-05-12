// QuoteTabs — WAI-ARIA tabs (no library) wrapping FileDropzone + GeometrySummary
// per active tab. Pre-fill cascade mirrors ContactForm.jsx D-24 verbatim per D-05
// (query string ?service= → document.referrer → 3D default).
//
// Three.js parsers (parseStl, parseObj, parseSvg) are imported DYNAMICALLY
// inside the file handler so the Three.js bundle is only fetched when a
// visitor actually drops a file — not at /quote first paint. This keeps the
// /quote chunk small (Pitfall 7 — bundle measurement target ≤120 KB gzip).
//
// Plan 03-04 (QTE-10) — localStorage persistence. The active tab + materialId +
// quantity now live in a single quoteState object backed by useLocalStorageState.
// File / geometry / error / busy state stay per-tab in their own non-persisted
// maps because (a) File contents are NEVER persisted (privacy + 5MB cap) and
// (b) geometry is re-derived from the file the visitor re-uploads. The
// pre-fill cascade is short-circuited when a stored selection was restored
// (localStorage takes precedence over ?service=/document.referrer).
import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SERVICES } from '../../data/services';
import useSanityQuery from '../../hooks/useSanityQuery';
import useLocalStorageState from '../../hooks/useLocalStorageState';
import FileDropzone from './FileDropzone';
import GeometrySummary from './GeometrySummary';
import MaterialPicker, { MATERIALS_QUERY } from './MaterialPicker';
import QuantityInput from './QuantityInput';
import PriceRange from './PriceRange';
import QuoteSubmitForm from './QuoteSubmitForm';
import QuoteRestoreBanner from './QuoteRestoreBanner';
import { formatError } from '../../utilities/quote/formatErrors';
import { calculatePrice } from '../../utilities/quote/calculatePrice';

const TAB_CONFIG = {
	print: {
		label: '3D Printing',
		accepted: ['stl', 'obj'],
		wrongFormatCode: 'WRONG_FORMAT_3D',
		malformedCode: (ext) => (ext === 'stl' ? 'MALFORMED_STL' : 'MALFORMED_OBJ'),
	},
	laser: {
		label: 'Laser Cutting',
		accepted: ['svg'],
		wrongFormatCode: 'WRONG_FORMAT_LASER',
		malformedCode: () => 'MALFORMED_SVG',
	},
};
const TAB_ORDER = ['print', 'laser'];
const MAX_BYTES = 25 * 1024 * 1024; // D-12 — 25MB cap (QTE-09 partial).

// Plan 03-04 — versioned key (`-v1`) so a future shape change is a non-event.
const STORAGE_KEY = 'shapesmith-quote-v1';
const DEFAULT_STATE = { tab: 'print', materialId: '', quantity: 1 };

const isNonDefaultState = (s) =>
	s &&
	(s.tab !== DEFAULT_STATE.tab ||
		s.materialId !== DEFAULT_STATE.materialId ||
		s.quantity !== DEFAULT_STATE.quantity);

const QuoteTabs = () => {
	// Plan 03-04 — single persisted state object replacing activeKey +
	// materialIdByTab[activeKey] + quantityByTab[activeKey]. The hook's lazy
	// initializer reads localStorage once, so storage takes precedence over
	// the URL-based pre-fill cascade below (which short-circuits when a
	// non-default state was restored).
	const [quoteState, setQuoteState] = useLocalStorageState(
		STORAGE_KEY,
		DEFAULT_STATE,
	);
	// Restore-banner visibility: true when storage had a non-default value AT
	// MOUNT. Lazy initializer ensures we only check the initial value, not
	// the post-update value (which would never be "default" again after the
	// first interaction).
	const [showRestoreBanner, setShowRestoreBanner] = useState(() =>
		isNonDefaultState(quoteState),
	);

	// File / geometry / error / busy state stay per-tab and are NOT persisted —
	// File contents would blow the 5MB localStorage cap, and geometry is
	// re-derived from the file the visitor re-uploads.
	const [filesByTab, setFilesByTab] = useState({ print: null, laser: null });
	const [geometryByTab, setGeometryByTab] = useState({ print: null, laser: null });
	const [errorByTab, setErrorByTab] = useState({ print: '', laser: '' });
	const [busyByTab, setBusyByTab] = useState({ print: false, laser: false });

	// Derived UI state — read from the single persisted state object. Optional
	// chaining + defaults guard against a tampered localStorage value (e.g. a
	// visitor manually setting `null` via DevTools — T-03-04-02).
	const activeKey = quoteState?.tab ?? DEFAULT_STATE.tab;
	const materialId = quoteState?.materialId ?? DEFAULT_STATE.materialId;
	const quantity = quoteState?.quantity ?? DEFAULT_STATE.quantity;

	// Single update path — every interaction calls updateState({...}) which
	// (a) merges the patch into quoteState (which writes to localStorage via
	// the hook's effect) and (b) dismisses the restore banner. The banner is
	// a one-time confirmation, not persistent UI.
	const updateState = useCallback(
		(patch) => {
			setQuoteState((prev) => ({ ...(prev ?? DEFAULT_STATE), ...patch }));
			setShowRestoreBanner(false);
		},
		[setQuoteState],
	);

	const handleStartOver = useCallback(() => {
		// Single state update — the useEffect that mirrors quoteState into
		// localStorage will write JSON.stringify(DEFAULT_STATE) on the next
		// render. No need to remove-then-seed across two ticks.
		setQuoteState(DEFAULT_STATE);
		setShowRestoreBanner(false);
		// Also reset per-tab file/geometry/error state — the restore banner
		// only appears on mount before any new file is dropped, but a visitor
		// who clicks "Start over" expects a truly fresh form.
		setFilesByTab({ print: null, laser: null });
		setGeometryByTab({ print: null, laser: null });
		setErrorByTab({ print: '', laser: '' });
	}, [setQuoteState]);

	// Sanity query owned at QuoteTabs level so MaterialPicker and PriceRange
	// share one materials list (no double-fetch). Re-runs when the active tab
	// changes (different serviceKey).
	const { data: materialsData, loading: materialsLoading } = useSanityQuery(
		MATERIALS_QUERY,
		{ serviceKey: activeKey },
		[activeKey],
	);
	const materials = materialsData ?? [];

	// Pre-fill cascade — mirrors ContactForm.jsx D-24 verbatim per D-05.
	// Plan 03-04: short-circuit when localStorage restored a non-default value;
	// stored selections take precedence over URL/referrer hints.
	useEffect(() => {
		if (showRestoreBanner) return;
		const queryService = new URLSearchParams(window.location.search).get('service');
		if (queryService) {
			const m = SERVICES.find(
				(s) => s.key === queryService || s.urlSegment === queryService,
			);
			if (m) {
				updateState({ tab: m.key });
				return;
			}
		}
		const referrer = (typeof document !== 'undefined' && document.referrer) || '';
		const rule = SERVICES.find((s) => referrer.includes(`/${s.urlSegment}`));
		if (rule) updateState({ tab: rule.key });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const onFile = useCallback(async (tabKey, file) => {
		const cfg = TAB_CONFIG[tabKey];
		const ext = file.name.split('.').pop().toLowerCase();
		setErrorByTab((prev) => ({ ...prev, [tabKey]: '' }));
		setBusyByTab((prev) => ({ ...prev, [tabKey]: true }));
		setFilesByTab((prev) => ({
			...prev,
			[tabKey]: { name: file.name, sizeMB: (file.size / 1024 / 1024).toFixed(1) },
		}));
		setGeometryByTab((prev) => ({ ...prev, [tabKey]: null }));
		try {
			let result;
			if (ext === 'stl') {
				const buf = await file.arrayBuffer();
				const { parseStl } = await import('../../utilities/quote/parseStl');
				result = parseStl(buf, file.size);
			} else if (ext === 'obj') {
				const text = await file.text();
				const { parseObj } = await import('../../utilities/quote/parseObj');
				result = parseObj(text, file.size);
			} else if (ext === 'svg') {
				const text = await file.text();
				const { parseSvg } = await import('../../utilities/quote/parseSvg');
				result = parseSvg(text, file.size);
			}
			setGeometryByTab((prev) => ({ ...prev, [tabKey]: result }));
		} catch (err) {
			const code = err.message === 'PARSE_FAILED' || err.message === 'NOT_SVG'
				? cfg.malformedCode(ext)
				: 'GENERIC';
			setErrorByTab((prev) => ({ ...prev, [tabKey]: formatError({ code }) }));
			setFilesByTab((prev) => ({ ...prev, [tabKey]: null }));
		} finally {
			setBusyByTab((prev) => ({ ...prev, [tabKey]: false }));
		}
	}, []);

	const onError = useCallback((tabKey, err) => {
		const cfg = TAB_CONFIG[tabKey];
		const code = err.code === 'WRONG_FORMAT' ? cfg.wrongFormatCode : err.code;
		setErrorByTab((prev) => ({ ...prev, [tabKey]: formatError({ ...err, code }) }));
	}, []);

	const handleArrowNav = (e) => {
		const i = TAB_ORDER.indexOf(activeKey);
		if (e.key === 'ArrowRight')
			updateState({ tab: TAB_ORDER[(i + 1) % TAB_ORDER.length] });
		else if (e.key === 'ArrowLeft')
			updateState({
				tab: TAB_ORDER[(i - 1 + TAB_ORDER.length) % TAB_ORDER.length],
			});
		else if (e.key === 'Home') updateState({ tab: TAB_ORDER[0] });
		else if (e.key === 'End') updateState({ tab: TAB_ORDER[TAB_ORDER.length - 1] });
	};

	const acceptedExtensions = TAB_CONFIG[activeKey].accepted;

	return (
		<div className="max-w-3xl mx-auto px-4">
			{showRestoreBanner && <QuoteRestoreBanner onStartOver={handleStartOver} />}
			<p className="text-sm text-ternary-section-dark mb-2">
				Pick what you&rsquo;re making — 3D printed or laser cut.
			</p>
			<div
				role="tablist"
				aria-label="Quote tool service"
				className="flex gap-8 mb-8 border-b border-secondary-section-dark"
			>
				{TAB_ORDER.map((key) => {
					const cfg = TAB_CONFIG[key];
					const isActive = activeKey === key;
					return (
						<button
							key={key}
							role="tab"
							id={`tab-${key}`}
							aria-selected={isActive}
							aria-controls={`panel-${key}`}
							tabIndex={isActive ? 0 : -1}
							onClick={() => updateState({ tab: key })}
							onKeyDown={handleArrowNav}
							type="button"
							className={
								isActive
									? 'text-primary-light font-general-medium border-b-2 border-accent pb-2 -mb-px'
									: 'text-ternary-section-dark hover:text-primary-light pb-2 -mb-px'
							}
						>
							{cfg.label}
						</button>
					);
				})}
			</div>
			<AnimatePresence mode="wait">
				<motion.div
					key={activeKey}
					role="tabpanel"
					id={`panel-${activeKey}`}
					aria-labelledby={`tab-${activeKey}`}
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -8 }}
					transition={{ duration: 0.2 }}
				>
					<p className="text-sm text-ternary-section-dark mb-2">
						<strong className="font-general-medium text-ternary-light">Max 25MB.</strong>{' '}
						Files are read in your browser — they&rsquo;re not uploaded anywhere unless you submit.
					</p>
					<div className="flex gap-2 mb-3" aria-label="Accepted formats">
						{acceptedExtensions.map((ext) => (
							<span
								key={ext}
								className="inline-block px-2 py-1 rounded bg-secondary-section-dark text-primary-light text-xs font-general-medium uppercase tracking-wide"
							>
								{ext}
							</span>
						))}
					</div>
					<FileDropzone
						acceptedExtensions={acceptedExtensions}
						maxBytes={MAX_BYTES}
						file={filesByTab[activeKey]}
						error={errorByTab[activeKey]}
						onFile={(f) => onFile(activeKey, f)}
						onError={(err) => onError(activeKey, err)}
					/>
					{(busyByTab[activeKey] || geometryByTab[activeKey]) && (
						<GeometrySummary
							geometry={geometryByTab[activeKey]}
							loading={busyByTab[activeKey]}
						/>
					)}
					{/* Plan 03-02 — material picker + quantity + price range. Only after
					    geometry has parsed; the MaterialPicker handles its own loading
					    + empty states. */}
					{geometryByTab[activeKey] && (
						<div className="mt-6">
							<MaterialPicker
								materials={materials}
								loading={materialsLoading}
								value={materialId}
								onChange={(e) => updateState({ materialId: e.target.value })}
							/>
							{materialId && (
								<QuantityInput
									value={quantity}
									onChange={(e) =>
										updateState({
											quantity: Math.max(
												1,
												Math.min(999, parseInt(e.target.value, 10) || 1),
											),
										})
									}
								/>
							)}
							{(() => {
								const picked = materials.find((m) => m._id === materialId);
								if (!picked) return null;
								if (!picked.pricing) {
									return (
										<p className="mt-4 text-sm text-ternary-light">
											Pricing not yet configured for this material — please{' '}
											<a href="/contact" className="hover:text-accent">
												contact us
											</a>{' '}
											for a manual quote.
										</p>
									);
								}
								// Plan 03-03 — real range AND real submission form. The disabled
								// "coming soon" placeholder from Plan 03-01 is gone.
								const geometry = geometryByTab[activeKey];
								const range = calculatePrice(geometry, picked.pricing, quantity);
								const file = filesByTab[activeKey];
								// Build the metadata payload that the Function will email. 3D-only
								// fields are spread conditionally so the helper's 3D-vs-laser
								// branches only see the fields that exist for this geometry.
								const metadata = {
									filename: file.name,
									fileSizeMB: parseFloat(file.sizeMB),
									materialName: picked.title,
									quantity,
									priceLow: range.low,
									priceHigh: range.high,
									...(geometry.mode === '3d' && {
										volumeCm3: geometry.volumeCm3,
										bbox: `${geometry.bbox.w} × ${geometry.bbox.d} × ${geometry.bbox.h} mm`,
										triangleCount: geometry.triangleCount,
									}),
									...(geometry.mode === 'laser' && {
										cutArea: `${geometry.bbox.w} × ${geometry.bbox.h} mm`,
										pathLengthMm: geometry.pathLengthMm,
									}),
								};
								return (
									<>
										<PriceRange
											geometry={geometry}
											pricing={picked.pricing}
											quantity={quantity}
										/>
										<QuoteSubmitForm
											payload={{ service: activeKey, metadata }}
											onSubmitted={() => setQuoteState(null)}
										/>
									</>
								);
							})()}
						</div>
					)}
				</motion.div>
			</AnimatePresence>
		</div>
	);
};

export default QuoteTabs;
