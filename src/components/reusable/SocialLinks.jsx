import {
	FiGithub,
	FiLinkedin,
	FiGlobe,
    FiInstagram
} from 'react-icons/fi';

const socialLinks = [
    {
		id: 1,
		icon: <FiInstagram />,
		url: 'https://www.instagram.com/shapesmith.studio/',
	},
	{
		id: 2,
		icon: <FiGlobe />,
		url: 'https://www.johnkreisher.com/',
	},
	{
		id: 3,
		icon: <FiGithub />,
		url: 'https://github.com/J-Krush',
	},
	{
		id: 4,
		icon: <FiLinkedin />,
		url: 'https://www.linkedin.com/in/john-kreisher-792aa34b/',
	},
];

const SocialLinks = () => {
    
    return (
        <div className="font-general-regular flex flex-col justify-center items-center mb-12 sm:mb-28">
            <p className="font-general-medium text-2xl sm:text-xl text-primary-dark dark:text-primary-light mb-5 mt-12">
                Social Links
            </p>
            <ul className="flex gap-4 sm:gap-8">
                {socialLinks.map((link) => (
                    <a
                        href={link.url}
                        target="__blank"
                        key={link.id}
                        className="text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 cursor-pointer rounded-lg bg-gray-50 dark:bg-ternary-dark hover:bg-gray-100 shadow-sm p-4 duration-300"
                    >
                        <i className="text-xl sm:text-2xl md:text-3xl">
                            {link.icon}
                        </i>
                    </a>
                ))}
            </ul>
        </div>
    )
}

export default SocialLinks;