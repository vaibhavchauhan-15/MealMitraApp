import React, { useEffect, useState } from 'react';
import {
  Image,
  ImageProps,
  ImageSourcePropType,
} from 'react-native';

const DEFAULT_RECIPE_PLACEHOLDER = require('../../assets/icons/Recipe-icon-paceholder.jpg');

interface FallbackImageProps extends Omit<ImageProps, 'source'> {
  uri?: string | null;
  forcePlaceholder?: boolean;
  placeholderSource?: ImageSourcePropType;
}

export const FallbackImage: React.FC<FallbackImageProps> = ({
  uri,
  forcePlaceholder = false,
  placeholderSource = DEFAULT_RECIPE_PLACEHOLDER,
  onError,
  ...rest
}) => {
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [uri]);

  const hasUri = Boolean(uri && uri.trim().length > 0);
  const usePlaceholder = forcePlaceholder || loadFailed || !hasUri;

  return (
    <Image
      {...rest}
      source={usePlaceholder ? placeholderSource : { uri: uri as string }}
      onError={(event) => {
        setLoadFailed(true);
        onError?.(event);
      }}
    />
  );
};
