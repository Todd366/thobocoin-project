import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, usePublicClient } from 'wagmi'
import { ethers } from 'ethers'
console.log('App started');
import abi from './config/abi.json'
import { useEffect, useState } from 'react'

const contractAddress = '0xDd92559E95BAcB66f8a5f983199C40142Da56E27'

function App() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const [balance, setBalance] = useState('Loading...')

  useEffect(() => {
    if (!isConnected || !address || !publicClient) {
      setBalance('Connect MetaMask on BSC Testnet')
      return
    }

    const fetchBalance = async () => {
      try {
        const provider = new ethers.BrowserProvider(publicClient.transport)
        const contract = new ethers.Contract(contractAddress, abi, provider)
        const bal = await contract.balanceOf(address)
        setBalance(ethers.formatUnits(bal, 18) + ' THB')
      } catch (err) {
        console.error('Balance error:', err)
        setBalance('Error - wrong network?')
      }
    }

    fetchBalance()
  }, [isConnected, address, publicClient])

  return (
    <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#111', color: '#fff', minHeight: '100vh' }}>
      <h1>THoBoCoin Wallet</h1>
      <ConnectButton />
      {isConnected && address && (
        <div style={{ marginTop: '30px' }}>
          <p>Connected: {address.slice(0,6)}...{address.slice(-4)}</p>
          <p style={{ fontSize: '24px', marginTop: '20px' }}>Balance: {balance}</p>
        </div>
      )}
      {!isConnected && (
        <p style={{ marginTop: '20px' }}>Connect wallet to see balance</p>
      )}
      <p style={{ marginTop: '40px', color: '#888' }}>Network: BSC Testnet (Chain ID 97)</p>
    </div>
  )
}

export default App
