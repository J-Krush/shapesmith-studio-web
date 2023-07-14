import { FiMapPin, FiMail } from 'react-icons/fi';

const contacts = [
	{
		id: 1,
		name: 'Asheville NC',
		icon: <FiMapPin />,
		link: ''
	},
	{
		id: 2,
		name: 'jkrush@shapesmith.studio',
		icon: <FiMail />,
		link: 'mailto:jkrush@shapesmith.studio'
	}
];

const ContactDetails = () => {

	return (
		// <div className="w-full lg:w-1/2">
			<div className="text-left max-w-xl px-6">
				<h2 className="font-general-medium text-2xl text-primary-dark dark:text-primary-light mt-12 mb-8">
					Contact details
				</h2>
				<ul className="font-general-regular">
					{contacts.map((contact) => {

						return (
							<div key={contact.id}>{
								contact.link ? 
								<a href={contact.link}>
									<ContactItem contact={contact}/>
								</a> :
								<ContactItem contact={contact}/>
							}
							</div>
						)
						
						})}
				</ul>
			</div>
		// </div>
	);
};

const ContactItem = ({ contact }) => {

	return (
		<li className="flex " key={contact.id}>
			<i className="text-2xl text-gray-500 dark:text-gray-400 mr-4">
				{contact.icon}
			</i>
			<span className={`text-lg mb-4 text-ternary-dark dark:text-ternary-light ${contact.link ? 'underline' : ''}`}>
				{contact.name}
			</span>
		</li>
	)
}

export default ContactDetails;
