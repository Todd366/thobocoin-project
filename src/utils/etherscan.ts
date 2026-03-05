const API_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY;
const BASE_URL = "https://api.etherscan.io/v2/api";

export async function getBalance(address: string, chainId = "1") {
  const res = await fetch(
    `${BASE_URL}?chainid=${chainId}&module=account&action=balance&address=${address}&tag=latest&apikey=${API_KEY}`
  );
  return res.json();
}

export async function getTransactions(address: string, chainId = "1") {
  const res = await fetch(
    `${BASE_URL}?chainid=${chainId}&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${API_KEY}`
  );
  return res.json();
}
