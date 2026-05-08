// QuantityInput — compact number input mirroring FormInput.jsx label+input
// rhythm. UI-SPEC §"Material + quantity picker Quantity input" — w-24 width,
// browser-native steppers, default 1, min 1, max 999.

const QuantityInput = ({ value, onChange }) => (
	<div className="font-general-regular mb-4">
		<label
			className="block text-lg text-primary-dark dark:text-primary-light mb-1"
			htmlFor="quantity"
		>
			Quantity
		</label>
		<input
			className="w-24 px-5 py-2 border border-gray-300 dark:border-primary-dark border-opacity-50 text-primary-dark dark:text-secondary-light bg-ternary-light dark:bg-ternary-dark rounded-md shadow-sm text-md focus:ring-1 focus:ring-accent"
			type="number"
			id="quantity"
			name="quantity"
			min="1"
			max="999"
			value={value}
			onChange={onChange}
			aria-label="Quantity"
		/>
	</div>
);

export default QuantityInput;
