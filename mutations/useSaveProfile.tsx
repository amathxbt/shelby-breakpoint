import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { saveProfile, SaveProfileParams } from "@/actions/profiles";
import { getProfileQueryKey } from "@/queries/useProfile";

export type UseSaveProfileOptions = Omit<
  UseMutationOptions<void, Error, SaveProfileParams>,
  "mutationFn"
>;

export default function useSaveProfile(options?: UseSaveProfileOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SaveProfileParams) => {
      const result = await saveProfile(params);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (_data, variables, context, mutation) => {
      queryClient.invalidateQueries({
        queryKey: getProfileQueryKey(variables.walletAddress),
      });
      options?.onSuccess?.(void 0, variables, context, mutation);
    },
    onError: (error, variables, context, mutation) => {
      options?.onError?.(error, variables, context, mutation);
    },
  });
}
