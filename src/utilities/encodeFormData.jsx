// Shared URL-encoded form-data helper for Netlify Forms POST.
// Extracted from src/components/contact/ContactForm.jsx so both ContactForm
// and Shop (shop-notify) can share the same encoder without duplication.
// T-02-05-07 mitigation: iterates own-keys via Object.keys (no prototype walk);
// every key + value is passed through encodeURIComponent.
const encodeFormData = (data) =>
	Object.keys(data)
		.map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
		.join('&');

export default encodeFormData;
