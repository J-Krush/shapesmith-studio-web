import { AnimatePresence } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
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




function App() {
	return (
		<HelmetProvider>
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
								    handles direct hits + crawlers with a real 301 status code. The
								    src/pages/Materials.jsx file is preserved (Plan 02-05 owns deletion). */}
								<Route
									path="/materials"
									element={<Navigate to="/styles#materials" replace />}
								/>

								<Route path="about" element={<About />} />
								<Route path="contact" element={<Contact />} />
							</Routes>
						</Suspense>
						<AppFooter />
					</Router>
					<UseScrollToTop />
				</div>
			</AnimatePresence>
		</HelmetProvider>
	);
}

export default App;
