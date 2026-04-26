import { GasStationTransactionSubmitter } from "@aptos-labs/gas-station-client";
import {
  Aptos,
  AptosConfig,
  Network,
  NetworkToNetworkName,
} from "@aptos-labs/ts-sdk";

const getAptosClientApiKey = (network: Network) => {
  switch (network) {
    case Network.SHELBYNET:
      return process.env.NEXT_PUBLIC_APTOS_SHELBYNET_API_KEY;
  }
};

const getAptosClientTransactionSubmitter = (network: Network) => {
  switch (network) {
    case Network.SHELBYNET:
      if (process.env.NEXT_PUBLIC_APTOS_SHELBYNET_GAS_STATION_API_KEY) {
        return new GasStationTransactionSubmitter({
          network,
          apiKey: process.env.NEXT_PUBLIC_APTOS_SHELBYNET_GAS_STATION_API_KEY,
          baseUrl: "https://api.shelbynet.shelby.xyz/gs/v1",
        });
      }
      break;
  }
};

export const createAptosClient = (
  network: Network,
  { withGasStation = false }: { withGasStation?: boolean } = {}
) => {
  const apiKey = getAptosClientApiKey(network);
  if (!apiKey) {
    throw new Error(
      `Unsupported network when creating Aptos client: ${network}`
    );
  }

  const pluginSettings = withGasStation
    ? {
        TRANSACTION_SUBMITTER: new GasStationTransactionSubmitter({
          network,
          apiKey: process.env.NEXT_PUBLIC_APTOS_SHELBYNET_GAS_STATION_API_KEY,
          baseUrl: "https://api.shelbynet.shelby.xyz/gs/v1",
        }),
      }
    : {};

  return new Aptos(
    new AptosConfig({
      network: NetworkToNetworkName[network],
      clientConfig: { API_KEY: apiKey },
      pluginSettings,
    })
  );
};

export const createAptosServerClient = (network: Network) => {
  const apiKey = getAptosClientApiKey(network);
  if (!apiKey) {
    throw new Error(
      `Unsupported network when creating Aptos client: ${network}`
    );
  }

  return new Aptos(
    new AptosConfig({
      network: NetworkToNetworkName[network],
      clientConfig: { API_KEY: apiKey },
      pluginSettings: {
        TRANSACTION_SUBMITTER: getAptosClientTransactionSubmitter(network),
      },
    })
  );
};
