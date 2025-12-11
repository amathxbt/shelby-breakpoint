import { useQuery, UseQueryOptions } from "@tanstack/react-query";

export const getVideoBlobQueryKey = (url?: string, authToken?: string) =>
  ["video-blob", url, authToken] as const;

export type UseVideoBlobOptions = Omit<
  UseQueryOptions<Blob, Error>,
  "queryKey" | "queryFn"
> & {
  url: string;
  authToken?: string;
};

export default function useVideoBlob({
  url,
  authToken,
  ...options
}: UseVideoBlobOptions) {
  return useQuery({
    queryKey: getVideoBlobQueryKey(url, authToken),
    queryFn: async ({ signal }) => {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SHELBY_SHELBYNET_API_KEY}`,
        },
        signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.status}`);
      }

      return await response.blob();
    },
    ...options,
  });
}
