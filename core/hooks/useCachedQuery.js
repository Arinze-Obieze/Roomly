import { useQuery, useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Custom hook that applies cache config based on data type
 * Usage: useCachedQuery('listings', 'properties', queryFn)
 */
export const useCachedQuery = (dataType, queryKey, queryFn, options = {}) => {
  const queryClient = useQueryClient();
  const cacheConfig = queryClient.cacheConfig;
  const config = cacheConfig?.[dataType] || cacheConfig?.listings;

  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn,
    ...config,
    ...options,
  });
};

/**
 * Infinite query with cache config
 */
export const useCachedInfiniteQuery = (dataType, queryKey, queryFn, options = {}) => {
  const queryClient = useQueryClient();
  const cacheConfig = queryClient.cacheConfig;
  const config = cacheConfig?.[dataType] || cacheConfig?.listings;

  return useInfiniteQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn,
    ...config,
    ...options,
  });
};

/**
 * Smart invalidation - invalidates and refetches if data is stale
 */
export const useSmartMutation = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    onSuccess: async (data, variables, context) => {
      // Allow custom onSuccess to run first
      if (options.onSuccess) {
        await options.onSuccess(data, variables, context);
      }

      // Invalidate related queries
      if (options.invalidateKeys) {
        await Promise.all(
          options.invalidateKeys.map(key =>
            queryClient.invalidateQueries({ 
              queryKey: Array.isArray(key) ? key : [key],
              refetchType: 'active' // only refetch active queries
            })
          )
        );
      }
    },
  });
};

/**
 * Optimistic update helper
 */
export const useOptimisticMutation = (queryKey, options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    onMutate: async (newData) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey });

      // Snapshot old data
      const previousData = queryClient.getQueryData(queryKey);

      // Update cache optimistically
      if (options.onMutate) {
        const context = await options.onMutate(newData);
        return context;
      }

      return { previousData };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      if (options.onError) {
        options.onError(err, newData, context);
      }
    },
  });
};
