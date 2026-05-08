// FileDropzone — native HTML5 drag-and-drop + file picker. NO library
// (react-dropzone NOT installed per RESEARCH.md §Standard Stack).
//
// CRITICAL — `e.preventDefault()` MUST be called on BOTH `onDragOver` AND
// `onDrop` per RESEARCH.md Pitfall 6 / threat T-03-01-04. Without both, the
// browser default opens the dropped file as a new tab, trashing the UX.
//
// Validation order (validate before any read so a 30MB file is rejected in
// O(1) before we waste memory on it):
//   1. Extension allow-list — friendly WRONG_FORMAT_*.
//   2. Size cap — friendly TOO_LARGE.
//   3. Pass to onFile; the parent runs the parser.
import { useRef, useState } from 'react';
import { FiUploadCloud, FiFile } from 'react-icons/fi';

const FileDropzone = ({ acceptedExtensions, maxBytes, file, error, onFile, onError }) => {
	const inputRef = useRef(null);
	const [dragActive, setDragActive] = useState(false);

	const validate = (f) => {
		const ext = f.name.split('.').pop().toLowerCase();
		if (!acceptedExtensions.includes(ext)) return { code: 'WRONG_FORMAT', ext };
		if (f.size > maxBytes) return { code: 'TOO_LARGE', sizeMB: (f.size / 1024 / 1024).toFixed(1) };
		return null;
	};

	const handleFile = (f) => {
		const err = validate(f);
		if (err) {
			onError(err);
			return;
		}
		onFile(f);
	};

	const acceptedAttr = acceptedExtensions.map((e) => `.${e}`).join(',');

	// Compact summary card after a successful drop (UI-SPEC §"After successful drop").
	if (file) {
		return (
			<>
				<div className="border border-secondary-section-dark bg-ternary-dark rounded-xl p-4 flex items-center gap-3">
					<FiFile className="text-2xl text-ternary-section-dark" />
					<span className="text-base text-primary-light font-general-medium">{file.name}</span>
					<span className="text-sm text-ternary-section-dark">· {file.sizeMB} MB</span>
					<button
						type="button"
						onClick={() => inputRef.current?.click()}
						className="ml-auto text-sm text-ternary-light hover:text-primary-light underline-offset-4 hover:underline"
					>
						Replace file
					</button>
					<input
						ref={inputRef}
						type="file"
						accept={acceptedAttr}
						onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
						className="sr-only"
					/>
				</div>
				{error && (
					<p role="alert" className="mt-2 text-sm text-red-400">
						{error}
					</p>
				)}
			</>
		);
	}

	return (
		<>
			<div
				role="region"
				aria-label="File upload"
				onDragOver={(e) => {
					e.preventDefault();
					setDragActive(true);
				}}
				onDragLeave={() => setDragActive(false)}
				onDrop={(e) => {
					e.preventDefault();
					setDragActive(false);
					const f = e.dataTransfer.files?.[0];
					if (f) handleFile(f);
				}}
				className={
					dragActive
						? 'border-2 border-solid border-accent bg-ternary-dark rounded-xl p-12 text-center min-h-[12rem] sm:min-h-[14rem] flex items-center justify-center'
						: 'border-2 border-dashed border-secondary-section-dark bg-ternary-dark/40 rounded-xl p-12 text-center cursor-pointer hover:border-ternary-light min-h-[12rem] sm:min-h-[14rem] flex items-center justify-center'
				}
			>
				<label htmlFor="quote-file" className="cursor-pointer block">
					<FiUploadCloud className="mx-auto text-5xl text-ternary-section-dark mb-3" />
					{dragActive ? (
						<p className="text-base font-general-medium text-primary-light">
							Drop the file to upload.
						</p>
					) : (
						<p className="text-base text-primary-light">
							<strong className="font-general-medium">
								Drop your {acceptedExtensions.map((e) => e.toUpperCase()).join(' or ')} here.
							</strong>{' '}
							Or click to choose a file. (max {maxBytes / 1024 / 1024}MB)
						</p>
					)}
				</label>
				<input
					ref={inputRef}
					id="quote-file"
					type="file"
					accept={acceptedAttr}
					onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
					className="sr-only"
				/>
			</div>
			{error && (
				<p role="alert" className="mt-2 text-sm text-red-400">
					{error}
				</p>
			)}
		</>
	);
};

export default FileDropzone;
