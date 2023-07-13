
export const isProd = () => {
    if (process.env.REACT_APP_ENV === 'prod') {
      return true;
    }
    return true;
}

export const getImageUrl = (imageData) => {

    return isProd() ? getGoogleDriveLink(imageData.driveFile) : getLocalPath(imageData.localFile)
}

export const getLocalPath = () => {
    
    return ``;
}

export const getGoogleDriveLink = (id) => {

    return `https://drive.google.com/uc?id=${id}`;
}