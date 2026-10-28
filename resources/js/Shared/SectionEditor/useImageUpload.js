// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/shared/useImageUpload.js

import { useState, useEffect } from 'react';

export const useImageUpload = (initialSrc = '') => {
  const [imageSrc, setImageSrc] = useState(initialSrc);
  const [imageChanged, setImageChanged] = useState(false);
  const [oldImagePath, setOldImagePath] = useState(initialSrc);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Reset when initialSrc changes
  useEffect(() => {
    if (initialSrc !== imageSrc && !imageChanged) {
      setImageSrc(initialSrc);
      setOldImagePath(initialSrc);
    }
  }, [imageChanged, imageSrc, initialSrc]);

  const handleImageChange = (newSrc) => {
    if (!imageChanged && imageSrc) {
      setOldImagePath(imageSrc);
    }
    setImageSrc(newSrc);
    setImageChanged(true);
    setUploadError(null);
  };

  const handleImageRemove = () => {
    if (!imageChanged && imageSrc) {
      setOldImagePath(imageSrc);
    }
    setImageSrc('');
    setImageChanged(true);
    setUploadError(null);
  };

  const resetImage = () => {
    setImageSrc(initialSrc);
    setImageChanged(false);
    setOldImagePath(initialSrc);
    setUploadError(null);
    setIsUploading(false);
  };

  const setUploading = (loading) => setIsUploading(loading);
  const setError = (error) => setUploadError(error);

  return {
    imageSrc,
    imageChanged,
    oldImagePath,
    isUploading,
    uploadError,
    handleImageChange,
    handleImageRemove,
    resetImage,
    setImageSrc,
    setImageChanged,
    setOldImagePath,
    setUploading,
    setError,
  };
};