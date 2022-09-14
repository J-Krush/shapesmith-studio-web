import { useState } from 'react';

function ContactForm(props) {

    const { onSubmit, onCancel } = props;

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
        <>
        <form 
            name="contact-form"
            method="post"
            data-netlify="true"
            netlify-honeypot="bot-field"
            data-netlify-honeypot="bot-field"
            className="bg-gray-900 w-full shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4">
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
                onClick={onCancel}
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
        </>
    )
}

export default ContactForm;