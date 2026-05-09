import { useSingleService } from '../../context/SingleServiceContext';
import { useServices } from '../../context/ServicesContext';
import ImageGallery from '../shared/ImageGallery';

// Plan 05-02: ServiceGallery is now a thin context-coupled wrapper around the
// shared <ImageGallery /> primitive. The wrapper preserves the existing zero-prop
// API consumed by ProjectSingle.jsx for /styles/:slug and /3d-printing/:slug;
// ShopSingle (Plan 05-05) will consume <ImageGallery /> directly with product props.
const ServiceGallery = () => {
	const { singleService } = useSingleService();
	const { serviceKey } = useServices();

	const placeholderCaption =
		serviceKey === 'print'
			? '3D print example coming soon'
			: 'Laser cut example coming soon';

	return (
		<ImageGallery
			images={singleService?.detailImages}
			alt={singleService?.title}
			placeholderCaption={placeholderCaption}
		/>
	);
};

export default ServiceGallery;
