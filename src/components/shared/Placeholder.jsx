import { FiImage } from 'react-icons/fi';

// Branded, intentional image placeholder per CONTEXT D-11.
// Used wherever a Sanity image field is empty so the surface reads as
// "we know, real photos coming" — never "broken image."
const Placeholder = ({ caption = 'Image coming soon', className = '' }) => (
	<div
		className={`flex flex-col items-center justify-center bg-secondary-section-dark aspect-square rounded-xl ${className}`}
	>
		<FiImage
			className="text-4xl text-ternary-section-dark opacity-50"
			aria-hidden="true"
		/>
		<p className="text-sm font-general-medium text-ternary-section-dark opacity-80 mt-2">
			{caption}
		</p>
	</div>
);

export default Placeholder;
