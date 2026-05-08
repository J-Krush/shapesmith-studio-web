import { AnimatePresence } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import ScrollToTop from './components/ScrollToTop';
import AppFooter from './components/shared/AppFooter';
import AppHeader from './components/shared/AppHeader';
import './css/App.css';
import UseScrollToTop from './hooks/useScrollToTop';
import { SERVICES } from './data/services';

// import './App.css';

const About = lazy(() => import('./pages/AboutMe'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const Home = lazy(() => import('./pages/Home'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectSingle = lazy(() => import('./pages/ProjectSingle.jsx'));
const Quote = lazy(() => import('./pages/Quote'));
const Shop = lazy(() => import('./pages/Shop'));
const NotFound = lazy(() => import('./pages/NotFound'));




function App() {
	// reCAPTCHA v3 site key — public, browser-safe; injected at build time by
	// `react-scripts build` from the REACT_APP_RECAPTCHA_SITE_KEY env var (CRA
	// contract). When unset (e.g. local dev without env vars), the provider
	// mounts but the reCAPTCHA script never loads — `executeRecaptcha` stays
	// undefined and QuoteSubmitForm surfaces a "spam protection isn't loaded
	// yet" inline message instead of throwing. This keeps the build green even
	// when owner-prep (Plan 03-03 Task 1) hasn't been completed yet.
	const reCaptchaKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

	return (
		<HelmetProvider>
			<GoogleReCaptchaProvider
				reCaptchaKey={reCaptchaKey}
				scriptProps={{ async: true, defer: true, appendTo: 'head' }}
			>
			<AnimatePresence>
				<div className=" bg-secondary-light dark:bg-primary-dark transition duration-300">
					<Router>
						<ScrollToTop />
						<AppHeader />
						<Suspense fallback={""}>
							<Routes>
								<Route path="/" element={<Home />} />
								{SERVICES.map((s) => (
									<Route key={s.key}>
										<Route
											path={`/${s.urlSegment}`}
											element={<Projects serviceKey={s.key} />}
										/>
										<Route
											path={`/${s.urlSegment}/:slug`}
											element={<ProjectSingle serviceKey={s.key} />}
										/>
									</Route>
								))}
								{/* Legacy /materials route → in-page Materials section on /styles per D-17.
								    This handles SPA hops (client-side already loaded). public/_redirects
								    handles direct hits + crawlers with a real 301 status code.
								    The legacy src/pages/Materials.jsx file was deleted in Plan 02-05 (VIS-05). */}
								<Route
									path="/materials"
									element={<Navigate to="/styles#materials" replace />}
								/>

								<Route path="about" element={<About />} />
								<Route path="contact" element={<Contact />} />
								{/* /shop is a live route as of Plan 02-03 — currently renders the
								    legacy "Shop Coming Soon!" stub; Plan 02-05 replaces with the
								    Coming Soon page + shop-notify form per D-23. */}
								<Route path="/shop" element={<Shop />} />
								{/* /quote is the auto-pricing quote tool stub (Plan 03-01).
								    Lazy-loaded chunk; Three.js parsers are dynamically imported
								    inside QuoteTabs only after a file is dropped. */}
								<Route path="/quote" element={<Quote />} />
								{/* /404 catch-all (Plan 02-03) — must be the LAST route. */}
								<Route path="*" element={<NotFound />} />
							</Routes>
						</Suspense>
						<AppFooter />
					</Router>
					<UseScrollToTop />
				</div>
			</AnimatePresence>
			</GoogleReCaptchaProvider>
		</HelmetProvider>
	);
}

export default App;
