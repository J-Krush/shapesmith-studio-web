// QuoteRestoreBanner — subtle one-time confirmation that localStorage restored
// the visitor's last tab + material + quantity.
//
// Plan 03-04 (QTE-10). Per UI-SPEC §"localStorage persistence UX":
//   - Sits above the tab strip.
//   - text-sm text-ternary-light; "Start over" is an inline text button
//     (underline hover:text-primary-light), no full button chrome.
//   - Auto-dismisses on first user interaction (parent QuoteTabs flips
//     showRestoreBanner to false on every updateState call).
//   - "Start over" callback (provided by parent): clears the localStorage
//     entry AND resets in-memory state to defaults. NO confirmation dialog —
//     the action is cheap and reversible (visitor can re-select).
const QuoteRestoreBanner = ({ onStartOver }) => (
	<div
		className="text-sm text-ternary-light mb-4 flex items-center gap-2"
		role="status"
	>
		<span>We restored your last selections.</span>
		<button
			type="button"
			onClick={onStartOver}
			className="underline hover:text-primary-light text-sm"
		>
			Start over
		</button>
	</div>
);

export default QuoteRestoreBanner;
