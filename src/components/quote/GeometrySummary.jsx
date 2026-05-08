// GeometrySummary — definition-list panel rendering 3D OR laser readouts based
// on geometry.mode. Loading state shows a shimmer in each <dd> with the heading
// "Reading your file…". SVG unit-warning footnote is rendered INSIDE the panel
// directly under the bbox row per UI-SPEC §"Geometry readout panel".
//
// Tailwind `animate-pulse` is used for the shimmer — no new utility introduced.
const Shimmer = () => (
	<span className="inline-block w-16 h-4 bg-secondary-section-dark/50 rounded animate-pulse" />
);

const GeometrySummary = ({ geometry, loading }) => {
	const heading = loading || !geometry ? 'Reading your file…' : 'Geometry summary';
	return (
		<div className="bg-ternary-dark rounded-xl p-6 mt-6">
			<h3 className="font-display font-bold text-2xl sm:text-3xl text-ternary-dark dark:text-ternary-light mb-6">
				{heading}
			</h3>
			{!geometry || loading ? (
				<dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-3">
					{[0, 1, 2, 3].map((i) => (
						<span key={i} className="contents">
							<dt className="text-sm font-general-regular text-ternary-section-dark">
								<Shimmer />
							</dt>
							<dd className="text-base font-general-medium text-primary-light">
								<Shimmer />
							</dd>
						</span>
					))}
				</dl>
			) : geometry.mode === '3d' ? (
				<dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-3">
					<dt className="text-sm font-general-regular text-ternary-section-dark">Volume</dt>
					<dd className="text-base font-general-medium text-primary-light">
						{geometry.volumeCm3.toFixed(1)} cm³
						<div className="text-sm text-ternary-section-dark">
							{geometry.volumeIn3.toFixed(2)} in³
						</div>
					</dd>
					<dt className="text-sm font-general-regular text-ternary-section-dark">Bounding box</dt>
					<dd className="text-base font-general-medium text-primary-light">
						{geometry.bbox.w} × {geometry.bbox.d} × {geometry.bbox.h} mm
					</dd>
					<dt className="text-sm font-general-regular text-ternary-section-dark">Triangles</dt>
					<dd className="text-base font-general-medium text-primary-light">
						{geometry.triangleCount.toLocaleString()}
					</dd>
					<dt className="text-sm font-general-regular text-ternary-section-dark">File size</dt>
					<dd className="text-base font-general-medium text-primary-light">
						{geometry.fileSizeMB} MB
					</dd>
				</dl>
			) : (
				<dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-3">
					<dt className="text-sm font-general-regular text-ternary-section-dark">Cut area</dt>
					<dd className="text-base font-general-medium text-primary-light">
						{geometry.bbox.w} × {geometry.bbox.h} mm
						{geometry.unitWarning && (
							<div className="text-sm text-ternary-section-dark mt-2 border-l-2 border-ternary-section-dark pl-3">
								We&rsquo;re reading this file as{' '}
								<strong className="font-general-medium">millimeters</strong>. If your design is in inches or pixels, the numbers above won&rsquo;t be accurate.
							</div>
						)}
					</dd>
					<dt className="text-sm font-general-regular text-ternary-section-dark">Total cut length</dt>
					<dd className="text-base font-general-medium text-primary-light">
						{geometry.pathLengthMm > 100
							? Math.round(geometry.pathLengthMm)
							: geometry.pathLengthMm.toFixed(1)}{' '}
						mm
					</dd>
					<dt className="text-sm font-general-regular text-ternary-section-dark">File size</dt>
					<dd className="text-base font-general-medium text-primary-light">
						{geometry.fileSizeMB} MB
					</dd>
				</dl>
			)}
		</div>
	);
};

export default GeometrySummary;
