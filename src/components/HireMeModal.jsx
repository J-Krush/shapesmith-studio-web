import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';

const HireMeModal = ({ onClose, onSubmit }) => {

	const [formName, setFormName] = useState("");
    const [formEmail, setFormEmail] = useState("");
    const [formMessage, setFormMessage] = useState("");
    const [formBotField, setFormBotField] = useState("");

	const encode = (data) => {
        return Object.keys(data)
            .map(key => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
            .join("&");
    }
    
    const handleSubmit = e => {
        e.preventDefault();

        fetch("/", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: encode({ 
                "form-name": "contact-form",
                name: formName,
                email: formEmail,
                message: formMessage,
                "bot-field": formBotField
            })
        })
            .then(() => alert("Success!"))
            .catch(error => alert(error));
    };


	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="font-general-medium fixed inset-0 z-30 transition-all duration-500"
		>
			{/* Modal Backdrop */}
			<div className="bg-filter bg-black bg-opacity-50 fixed inset-0 w-full h-full z-20"></div>

			{/* Modal Content */}
			<main className="flex flex-col items-center justify-center h-full w-full">
				<div className="modal-wrapper flex items-center z-30">
					<div className="modal max-w-md mx-5 xl:max-w-xl lg:max-w-xl md:max-w-xl bg-secondary-light dark:bg-primary-dark max-h-screen shadow-lg flex-row rounded-lg relative">
						<div className="modal-header flex justify-between gap-10 p-5 border-b border-ternary-light dark:border-ternary-dark">
							<h5 className=" text-primary-dark dark:text-primary-light text-xl">
								What project are you looking for?
							</h5>
							<button
								onClick={onClose}
								className="px-4 font-bold text-primary-dark dark:text-primary-light"
							>
								<FiX className="text-3xl" />
							</button>
						</div>
						<div className="modal-body p-5 w-full h-full">
							<form
								onSubmit={(e) => {
									e.preventDefault();
								}}
								className="max-w-xl m-4 text-left"
							>
								{/* <div className="">
									<input
										className="w-full px-5 py-2 border dark:border-secondary-dark rounded-md text-md bg-secondary-light dark:bg-ternary-dark text-primary-dark dark:text-ternary-light"
										id="name"
										name="name"
										type="text"
										required=""
										placeholder="Name"
										aria-label="Name"
									/>
								</div>
								<div className="mt-6">
									<input
										className="w-full px-5 py-2 border dark:border-secondary-dark rounded-md text-md bg-secondary-light dark:bg-ternary-dark text-primary-dark dark:text-ternary-light"
										id="email"
										name="email"
										type="text"
										required=""
										placeholder="Email"
										aria-label="Email"
									/>
								</div>
								<div className="mt-6">
									<select
										className="w-full px-5 py-2 border dark:border-secondary-dark rounded-md text-md bg-secondary-light dark:bg-ternary-dark text-primary-dark dark:text-ternary-light"
										id="subject"
										name="subject"
										type="text"
										required=""
										aria-label="Project Category"
									>
										{selectOptions.map((option) => (
											<option
												className="text-normal sm:text-md"
												key={option}
											>
												{option}
											</option>
										))}
									</select>
								</div>

								<div className="mt-6">
									<textarea
										className="w-full px-5 py-2 border dark:border-secondary-dark rounded-md text-md bg-secondary-light dark:bg-ternary-dark text-primary-dark dark:text-ternary-light"
										id="message"
										name="message"
										cols="14"
										rows="6"
										aria-label="Details"
										placeholder="Project description"
									></textarea>
								</div>

								<div className="mt-6 pb-4 sm:pb-1">
									<span
										onClick={onClose}
										type="submit"
										className="px-4
											sm:px-6
											py-2
											sm:py-2.5
											text-white
											bg-indigo-500
											hover:bg-indigo-600
											rounded-md
											focus:ring-1 focus:ring-indigo-900 duration-500"
										aria-label="Submit Request"
									>
										<Button title="Send Request" />
									</span>
								</div> */}
								 <div className="mb-4">

									<input type="hidden" name="form-name" value="contact-form" />

									<label className="block text-2xl text-blue-300 py-2 font-bold mb-8">
										Inquiries and Custom Work
									</label>

									<input
										className="shadow appearance-none border rounded w-full p-3 mb-12 text-gray-700 leading-tight focus:ring transform transition hover:scale-105 duration-300 ease-in-out"
										id="bot-field"
										type="text"
										placeholder="Don't fill this out if you're human"
										name="bot-field"
										onChange={(t) => setFormBotField(t)}
									/>

									<input
										className="shadow appearance-none border rounded w-full p-3 mb-12 text-gray-700 leading-tight focus:ring transform transition hover:scale-105 duration-300 ease-in-out"
										id="name"
										type="text"
										placeholder="Name"
										name="name"
										onChange={(t) => setFormName(t)}
									/>

									<input
										className="shadow appearance-none border rounded w-full p-3 mb-12 text-gray-700 leading-tight focus:ring transform transition hover:scale-105 duration-300 ease-in-out"
										id="emailaddress"
										type="email"
										placeholder="Email"
										name="email"
										onChange={(t) => setFormEmail(t)}
									/>

									<textarea 
										className="shadow appearance-none border rounded w-full p-3 mb-12 text-gray-700 leading-tight focus:ring transform transition hover:scale-105 duration-300 ease-in-out"
										id="message"
										placeholder="Message" 
										name="message"
										onChange={(t) => setFormMessage(t)}
									/>
									</div>

									<div className="flex items-center justify-between pt-4">
									<button
									className="hover:from-pink-500 hover:to-green-500 text-white font-bold py-2 px-4 rounded focus:ring transform transition hover:scale-105 duration-300 ease-in-out"
									type="button"
									onClick={onClose}
									>
										Cancel
									</button>

									<button
										className="bg-green-500 hover:from-pink-500 hover:to-green-500 text-white font-bold py-2 px-4 rounded focus:ring transform transition hover:scale-105 duration-300 ease-in-out"
										type="submit"
										onClick={() => {
											handleSubmit();
											onSubmit();
										}}
									>
										Send
									</button>

									</div>
							</form>
						</div>
						{/* <div className="modal-footer mt-2 sm:mt-0 py-5 px-8 border0-t text-right">
							<span
								onClick={onClose}
								type="button"
								className="px-4
									sm:px-6
									py-2 bg-gray-600 text-primary-light hover:bg-ternary-dark dark:bg-gray-200 dark:text-secondary-dark dark:hover:bg-primary-light
									rounded-md
									focus:ring-1 focus:ring-indigo-900 duration-500"
								aria-label="Close Modal"
							>
								<Button title="Close" />
							</span>
						</div> */}
					</div>
				</div>
			</main>
		</motion.div>
	);
};

export default HireMeModal;
