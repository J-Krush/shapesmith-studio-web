import { useState } from 'react';

function ContactForm(props) {

    const { onSubmit, onCancel } = props;

    const [formName, setFormName] = useState("");
    const [formEmail, setFormEmail] = useState("");
    const [formMessage, setFormMessage] = useState("");


    const encode = (data) => {
        return Object.keys(data)
            .map(key => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
            .join("&");
    }
    
    const handleSubmit = e => {
        e.preventDefault();

        // const recaptcha_box_checked = grecaptcha.getResponse() ? true : false;

        // console.log('recaptcha response: ', grecaptcha.getResponse());
      
        // if (recaptcha_box_checked) {
        //   // Calling the function submit_form after recaptcha box is checked
        // //   submit_form()
        //   alert("CAPTCHA success!")
        // } else {
        //   alert("CAPTCHA failed please try again");
        // }

        fetch("/", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: encode({ "form-name": "contact-form", name: formName, email: formEmail, message: formMessage })
        })
            .then(() => alert("Success!"))
            .catch(error => alert(error));
    };

    return (
        <form 
            name="contact-form"
            method="post"
            data-netlify="true"
            data-netlify-recaptcha="true"
            // data-netlify-honeypot="bot-field"
            className="bg-gray-900 w-full shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4">
            <div className="mb-4">

                <input type="hidden" name="form-name" value="contact-form" />
                
                <label className="block text-blue-300 py-2 font-bold mb-2">
                    Inquiries and Custom Work
                </label>
                
                {/* <label className="block uppercase tracking-wide text-gray-200 text-xs font-bold mb-2" for="grid-first-name">
                    First Name
                </label> */}
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

                <div data-netlify-recaptcha="true"></div>

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
    )
}

export default ContactForm;