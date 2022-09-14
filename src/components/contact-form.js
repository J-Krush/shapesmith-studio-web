
function ContactForm(props) {

    const { onSubmit, onCancel } = props;

    return (
        <form className="bg-gray-900 w-full shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4" netlify="true">
            <div className="mb-4">

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