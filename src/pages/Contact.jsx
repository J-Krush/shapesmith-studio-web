import { motion } from 'framer-motion';
import ContactDetails from '../components/contact/ContactDetails';
import ContactForm from '../components/contact/ContactForm';
import SocialLinks from '../components/reusable/SocialLinks';

const Contact = () => {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{
				ease: 'easeInOut',
				duration: 0.5,
				delay: 0.1,
			}}
			// className="container mx-auto flex flex-col-reverse lg:flex-row py-5 lg:py-10 lg:mt-10 h-screen"
			className="flex flex-col sm:justify-between sm:flex-row"
		>

{/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-6 mx-12 sm:mx-0 sm:gap-10"> */}
			<div className="flex-1">
				<ContactForm />
			</div>
			

			<div className="flex-1">
				<ContactDetails />
				<SocialLinks />
			</div>
			

		</motion.div>
	);
};

export default Contact;
