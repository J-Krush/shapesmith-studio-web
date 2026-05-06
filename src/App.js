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
import Materials from './pages/Materials';

// import './App.css';

const About = lazy(() => import('./pages/AboutMe'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const Home = lazy(() => import('./pages/Home'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectSingle = lazy(() => import('./pages/ProjectSingle.jsx'));




function App() {
	// `Navigate` is imported now (used by Plan 02 for /materials → /styles#materials);
	// silence eslint until then.
	void Navigate;

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
								<Route
									path="/materials"
									element={<Materials />}
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
