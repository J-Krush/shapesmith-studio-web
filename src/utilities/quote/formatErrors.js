// Pure mapper from error codes to UI-SPEC strings (UI-SPEC §"File-rejection
// error copy"). Consumers pass an interpolation map; the function never throws.
// All copy is locked verbatim with the UI-SPEC table — do NOT reword without
// editing the spec first.
export const formatError = (err) => {
	if (!err || !err.code) return formatError({ code: 'GENERIC' });
	switch (err.code) {
		case 'WRONG_FORMAT_3D':
			return `That looks like a ${err.ext} file. The 3D tab takes STL or OBJ — try one of those.`;
		case 'WRONG_FORMAT_LASER':
			return `That looks like a ${err.ext} file. The laser tab takes SVG — try one of those.`;
		case 'TOO_LARGE':
			return `This file is ${err.sizeMB}MB — we cap uploads at 25MB so the page doesn't lock up. Try compressing or decimating the mesh.`;
		case 'MALFORMED_STL':
			return "We couldn't read this STL — it might be corrupted or empty. Try re-exporting it from your CAD tool.";
		case 'MALFORMED_OBJ':
			return "We couldn't read this OBJ — it might be corrupted or missing geometry. Try re-exporting it from your CAD tool.";
		case 'MALFORMED_SVG':
			return "We couldn't read this SVG — check that it's a valid file with at least one path.";
		case 'GENERIC':
		default:
			return "Something went sideways reading this file. Try a different one, or contact us and we'll take a look.";
	}
};
