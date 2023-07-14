import { useState } from 'react';
import FormInput from '../reusable/FormInput';

const ContactForm = () => {
	const [formName, setFormName] = useState("");
    const [formEmail, setFormEmail] = useState("");
	const [formSubject, setFormSubject] = useState("");
    const [formMessage, setFormMessage] = useState("");
    const [formBotField, setFormBotField] = useState("");

	const [formSubmitted, setFormSubmitted] = useState(false);

	const encode = (data) => {
        return Object.keys(data)
            .map(key => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
            .join("&");
    }
    
    const handleSubmit = e => {
        // e.preventDefault(); 

		console.log('handle submit');
		console.log('name: ', formName);
		console.log('email: ', formEmail);
		console.log('message: ', formMessage);
		
		e.preventDefault();

        fetch("https://shapesmith.studio/", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: encode({ 
                "form-name": "contact-form",
                name: formName,
                email: formEmail,
				subject: formSubject,
                message: formMessage,
                "bot-field": formBotField
            })
        })
            .then(() => {
				console.log('success');
				alert("Success!");
				setFormSubmitted(true);
			})
            .catch(error => {
				console.log('error: ', error);
				alert(error)
			});

			
    };

	return (
		<div className="w-full">
			<div className="leading-loose">
				{formSubmitted ? 
				<div
					className="text-center max-w-xl m-4 p-6 sm:p-10 bg-secondary-light dark:bg-secondary-dark rounded-xl shadow-xl text-left"
				>
					<span className="font-general-medium text-2xl mb-8">👍 </span>
					 
				<p 
					className="font-general-medium text-2xl text-primary-dark dark:text-primary-light mb-8"
				>
					Thanks for your message! 
				</p>
				<p 
					className="font-general-medium text-2xl text-primary-dark dark:text-primary-light mb-8"
				> 
					We will be in touch shortly.
				</p>
				</div>
				:
					<form
						// onSubmit={(e) => {
						// 	e.preventDefault();
						// }}
						className="max-w-xl m-4 p-6 sm:p-10 bg-secondary-light dark:bg-secondary-dark rounded-xl shadow-xl text-left"
					>
						<p className="font-general-medium text-primary-dark dark:text-primary-light text-2xl mb-8">
							Contact Us for Inquiries and Custom Work
						</p>

						<input type="hidden" name="form-name" value="contact-form" />

						<FormInput
							inputLabel=""
							labelFor="bot-field"
							inputType="text"
							inputId="bot-field"
							inputName="bot-field"
							placeholderText="Don't fill this out if you're human."
							ariaLabelName="Bot"
							required={false}
							onChange={(e) => setFormBotField(e.target.value)}
						/>

						<FormInput
							inputLabel="Full Name"
							labelFor="name"
							inputType="text"
							inputId="name"
							inputName="name"
							placeholderText="Your Name"
							ariaLabelName="Name"
							required={true}
							onChange={(e) => setFormName(e.target.value)}
						/>
						<FormInput
							inputLabel="Email"
							labelFor="email"
							inputType="email"
							inputId="emailaddress"
							inputName="email"
							placeholderText="Your email"
							ariaLabelName="Email"
							required={true}
							onChange={(e) => setFormEmail(e.target.value)}
						/>
						<FormInput
							inputLabel="Subject"
							labelFor="subject"
							inputType="text"
							inputId="subject"
							inputName="subject"
							placeholderText="Subject"
							ariaLabelName="Subject"
							required={false}
							onChange={(e) => setFormSubject(e.target.value)}
						/>

						<div className="mt-6">
							<label
								className="block text-lg text-primary-dark dark:text-primary-light mb-2"
								htmlFor="message"
							>
								Message
							</label>
							<textarea
								className="w-full px-5 py-2 border border-gray-300 dark:border-primary-dark border-opacity-50 text-primary-dark dark:text-secondary-light bg-ternary-light dark:bg-ternary-dark rounded-md shadow-sm text-md"
								id="message"
								name="message"
								cols="14"
								rows="6"
								aria-label="Message"
								required={true}
								onChange={(e) => setFormMessage(e.target.value)}
							></textarea>
						</div>

						<button
							className="font-general-medium w-40 px-4 py-2.5 text-white text-center font-medium tracking-wider bg-indigo-500 hover:bg-indigo-600 focus:ring-1 focus:ring-indigo-900 rounded-lg mt-6 duration-500"
							type="submit"
							aria-label="Send Message"
							onClick={handleSubmit}
						>
							Send
						</button>
					</form>
				}
			</div>
		</div>
	);
};

export default ContactForm;
