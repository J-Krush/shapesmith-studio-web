
function ContactForm(props) {


    const { onSubmit, onCancel } = props;

    // constructor(props) {
    //     super(props);
    //     this.state = { name: "", email: "", message: "" };
    // }
    
    // handleSubmit = e => {
    //     fetch("/", {
    //         method: "POST",
    //         headers: { "Content-Type": "application/x-www-form-urlencoded" },
    //         body: encode({ "form-name": "contact", ...this.state })
    //     })
    //         .then(() => alert("Success!"))
    //         .catch(error => alert(error));

    //     e.preventDefault();
    // };

    return (
        <form name="contact-form" data-netlify="true" method="post" data-netlify-honeypot="bot-field" className="bg-gray-900 w-full shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4">
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
                />

                <input
                    className="shadow appearance-none border rounded w-full p-3 mb-12 text-gray-700 leading-tight focus:ring transform transition hover:scale-105 duration-300 ease-in-out"
                    id="emailaddress"
                    type="text"
                    placeholder="Email"
                    name="email"
                />

                <textarea 
                    className="shadow appearance-none border rounded w-full p-3 mb-12 text-gray-700 leading-tight focus:ring transform transition hover:scale-105 duration-300 ease-in-out"
                    id="message"
                    placeholder="Message" 
                    name="message"
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
                    onClick={onSubmit}
                >
                    Send
                </button>
                
            </div>
        </form>
    )
}

export default ContactForm;