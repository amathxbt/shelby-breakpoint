import { useQuery, UseQueryOptions } from "@tanstack/react-query";

export const getVideoBlobQueryKey = (url?: string) =>
  ["video-blob", url] as const;

export type UseVideoBlobOptions = Omit<
  UseQueryOptions<Blob, Error>,
  "queryKey" | "queryFn"
> & {
  url: string;
};

export default function useVideoBlob({ url, ...options }: UseVideoBlobOptions) {
  return useQuery({
    queryKey: getVideoBlobQueryKey(url),
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
