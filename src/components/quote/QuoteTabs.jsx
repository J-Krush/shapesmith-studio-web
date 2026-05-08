// QuoteTabs — WAI-ARIA tabs (no library) wrapping FileDropzone + GeometrySummary
// per active tab. Pre-fill cascade mirrors ContactForm.jsx D-24 verbatim per D-05
// (query string ?service= → document.referrer → 3D default).
//
// Three.js parsers (parseStl, parseObj, parseSvg) are imported DYNAMICALLY
// inside the file handler so the Three.js bundle is only fetched when a
// visitor actually drops a file — not at /quote first paint. This keeps the
// /quote chunk small (Pitfall 7 — bundle measurement target ≤120 KB gzip).
import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SERVICES } from '../../data/services';
import useSanityQuery from '../../hooks/useSanityQuery';
import FileDropzone from './FileDropzone';
import GeometrySummary from './GeometrySummary';
import MaterialPicker, { MATERIALS_QUERY } from './MaterialPicker';
import QuantityInput from './QuantityInput';
import PriceRange from './PriceRange';
import { formatError } from '../../utilities/quote/formatErrors';

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

const QuoteTabs = () => {
	const [activeKey, setActiveKey] = useState('print'); // UI-SPEC default = 3D
	const [filesByTab, setFilesByTab] = useState({ print: null, laser: null });
	const [geometryByTab, setGeometryByTab] = useState({ print: null, laser: null });
	const [errorByTab, setErrorByTab] = useState({ print: '', laser: '' });
	const [busyByTab, setBusyByTab] = useState({ print: false, laser: false });
	// Per-tab material + quantity state — Plan 03-02. Switching tabs preserves
	// each tab's independent selection.
	const [materialIdByTab, setMaterialIdByTab] = useState({ print: '', laser: '' });
	const [quantityByTab, setQuantityByTab] = useState({ print: 1, laser: 1 });

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
	useEffect(() => {
		const queryService = new URLSearchParams(window.location.search).get('service');
		if (queryService) {
			const m = SERVICES.find(
				(s) => s.key === queryService || s.urlSegment === queryService,
			);
			if (m) {
				setActiveKey(m.key);
				return;
			}
		}
		const referrer = (typeof document !== 'undefined' && document.referrer) || '';
		const rule = SERVICES.find((s) => referrer.includes(`/${s.urlSegment}`));
		if (rule) setActiveKey(rule.key);
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
		if (e.key === 'ArrowRight') setActiveKey(TAB_ORDER[(i + 1) % TAB_ORDER.length]);
		else if (e.key === 'ArrowLeft') setActiveKey(TAB_ORDER[(i - 1 + TAB_ORDER.length) % TAB_ORDER.length]);
		else if (e.key === 'Home') setActiveKey(TAB_ORDER[0]);
		else if (e.key === 'End') setActiveKey(TAB_ORDER[TAB_ORDER.length - 1]);
	};

	const acceptedExtensions = TAB_CONFIG[activeKey].accepted;

	return (
		<div className="max-w-3xl mx-auto px-4">
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
							onClick={() => setActiveKey(key)}
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
								value={materialIdByTab[activeKey]}
								onChange={(e) =>
									setMaterialIdByTab((prev) => ({
										...prev,
										[activeKey]: e.target.value,
									}))
								}
							/>
							{materialIdByTab[activeKey] && (
								<QuantityInput
									value={quantityByTab[activeKey]}
									onChange={(e) =>
										setQuantityByTab((prev) => ({
											...prev,
											[activeKey]: Math.max(
												1,
												Math.min(999, parseInt(e.target.value, 10) || 1),
											),
										}))
									}
								/>
							)}
							{(() => {
								const picked = materials.find(
									(m) => m._id === materialIdByTab[activeKey],
								);
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
								return (
									<PriceRange
										geometry={geometryByTab[activeKey]}
										pricing={picked.pricing}
										quantity={quantityByTab[activeKey]}
									/>
								);
							})()}
						</div>
					)}
					{/* Plan 03-01 placeholder submit affordance per D-03 — disabled CTA,
					    kept honest. Real submission lands in Plan 03-03. */}
					{geometryByTab[activeKey] && (
						<div className="mt-8">
							<button
								type="button"
								disabled
								className="font-general-medium px-5 py-2.5 text-white bg-accent/40 cursor-not-allowed rounded-md"
							>
								Submit for confirmation — coming soon
							</button>
							<p className="mt-3 text-sm text-ternary-section-dark">
								We&rsquo;re still building the submission flow. In the meantime, you can{' '}
								<a href="/contact" className="hover:text-accent">contact us</a> directly.
							</p>
						</div>
					)}
				</motion.div>
			</AnimatePresence>
		</div>
	);
};

export default QuoteTabs;
