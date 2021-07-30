import { useState, useEffect } from 'react';

/**
 * @typedef {Boolean} resourceExists boolean value that represent wether the remote resource exists or not
 * @typedef {Boolean} isLoading boolean value that indicates when the promise is completed
 */

/**
 * Hook to handle the remote state of a resource
 * @param {String} uri Resource URI
 * @return {Boolean} resourceExists
 */
const useRemoteResourceExists = (uri: string): boolean[] => {
	const [resourceExists, setReourceExists] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const fetchStatus = async (uri: string): Promise<void> => {
		fetch(uri, { method: 'HEAD' })
			.then(res => setReourceExists(res.status === 200))
			.then(() => setIsLoading(false))
			.catch(() => {
				setReourceExists(false);
				setIsLoading(false);
			});
	};

	useEffect(() => {
		fetchStatus(uri);
	}, [uri]);

	return [resourceExists, isLoading];
};

export default useRemoteResourceExists;
