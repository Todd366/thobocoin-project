// THoBoCoin Frontend Application

// Contract ABIs (simplified)
const THOBOCOIN_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function circulatingSupply() view returns (uint256)",
    "function totalBurned() view returns (uint256)",
    "function totalStaked() view returns (uint256)",
    "function stake(uint256 amount, uint256 lockPeriod)",
    "function unstake()",
    "function emergencyUnstake()",
    "function getStakeInfo(address) view returns (uint256 amount, uint256 timestamp, uint256 lockPeriod, uint256 unlockTime, bool isLocked)"
];

// Contract addresses (UPDATE AFTER DEPLOYMENT)
const CONTRACTS = {
    thoboCoin: "0x0000000000000000000000000000000000000000",
    roomRegistry: "0x0000000000000000000000000000000000000000",
    governance: "0x0000000000000000000000000000000000000000"
};

// Global state
let provider = null;
let signer = null;
let thoboCoinContract = null;
let userAddress = null;

// Initialize
async function init() {
    console.log("Initializing THoBoCoin DApp...");
    
    if (typeof window.ethereum === 'undefined') {
        showToast("Please install MetaMask", "error");
        return;
    }
    
    document.getElementById('connectButton').addEventListener('click', connectWallet);
    
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length > 0) {
        await connectWallet();
    }
    
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', () => window.location.reload());
}

// Connect wallet
async function connectWallet() {
    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        userAddress = accounts[0];
        
        const network = await provider.getNetwork();
        
        thoboCoinContract = new ethers.Contract(CONTRACTS.thoboCoin, THOBOCOIN_ABI, signer);
        
        document.getElementById('connectButton').textContent = 'Connected';
        document.getElementById('connectButton').classList.add('bg-green-600');
        document.getElementById('walletInfo').classList.remove('hidden');
        document.getElementById('walletAddress').textContent = formatAddress(userAddress);
        document.getElementById('networkName').textContent = network.chainId === 56 ? 'BSC Mainnet' : 'BSC Testnet';
        
        await loadData();
        
        showToast("Wallet connected!", "success");
    } catch (error) {
        console.error("Error:", error);
        showToast("Failed to connect wallet", "error");
    }
}

// Handle account changes
async function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        location.reload();
    } else if (accounts[0] !== userAddress) {
        userAddress = accounts[0];
        await loadData();
    }
}

// Load data
async function loadData() {
    try {
        await Promise.all([
            loadTokenStats(),
            loadUserBalance(),
            loadStakeInfo()
        ]);
    } catch (error) {
        console.error("Error loading data:", error);
        showToast("Check contract addresses in app.js", "error");
    }
}

// Load token stats
async function loadTokenStats() {
    try {
        const totalSupply = await thoboCoinContract.totalSupply();
        const circulatingSupply = await thoboCoinContract.circulatingSupply();
        const totalBurned = await thoboCoinContract.totalBurned();
        const totalStaked = await thoboCoinContract.totalStaked();
        
        document.getElementById('totalSupply').textContent = formatNumber(ethers.utils.formatEther(totalSupply));
        document.getElementById('circulatingSupply').textContent = formatNumber(ethers.utils.formatEther(circulatingSupply));
        document.getElementById('totalBurned').textContent = formatNumber(ethers.utils.formatEther(totalBurned));
        document.getElementById('totalStaked').textContent = formatNumber(ethers.utils.formatEther(totalStaked));
    } catch (error) {
        console.error("Error loading stats:", error);
    }
}

// Load user balance
async function loadUserBalance() {
    try {
        const balance = await thoboCoinContract.balanceOf(userAddress);
        document.getElementById('thbBalance').textContent = formatNumber(ethers.utils.formatEther(balance)) + ' THB';
    } catch (error) {
        console.error("Error loading balance:", error);
    }
}

// Load stake info
async function loadStakeInfo() {
    try {
        const stakeInfo = await thoboCoinContract.getStakeInfo(userAddress);
        
        document.getElementById('userStakeAmount').textContent = 
            formatNumber(ethers.utils.formatEther(stakeInfo.amount)) + ' THB';
        
        if (stakeInfo.amount.gt(0)) {
            const lockPeriodDays = Math.floor(stakeInfo.lockPeriod.toNumber() / 86400);
            document.getElementById('userLockPeriod').textContent = 
                lockPeriodDays > 0 ? `${lockPeriodDays} days` : 'Flexible';
            
            const unlockDate = new Date(stakeInfo.unlockTime.toNumber() * 1000);
            document.getElementById('userUnlockTime').textContent = unlockDate.toLocaleString();
            
            document.getElementById('userStakeStatus').textContent = 
                stakeInfo.isLocked ? '🔒 Locked' : '✅ Unlocked';
        }
    } catch (error) {
        console.error("Error loading stake info:", error);
    }
}

// Stake tokens
async function stakeTokens() {
    try {
        const amount = document.getElementById('stakeAmount').value;
        const lockPeriod = document.getElementById('lockPeriod').value;
        
        if (!amount || amount <= 0) {
            showToast("Enter valid amount", "error");
            return;
        }
        
        const amountWei = ethers.utils.parseEther(amount);
        
        showToast("Staking... Confirm transaction", "info");
        
        const tx = await thoboCoinContract.stake(amountWei, lockPeriod);
        await tx.wait();
        
        showToast("Tokens staked successfully!", "success");
        await loadData();
        
        document.getElementById('stakeAmount').value = '';
    } catch (error) {
        console.error("Error:", error);
        showToast("Failed to stake: " + error.message, "error");
    }
}

// Unstake tokens
async function unstakeTokens() {
    try {
        showToast("Unstaking... Confirm transaction", "info");
        
        const tx = await thoboCoinContract.unstake();
        await tx.wait();
        
        showToast("Tokens unstaked!", "success");
        await loadData();
    } catch (error) {
        console.error("Error:", error);
        showToast("Failed: " + error.message, "error");
    }
}

// Emergency unstake
async function emergencyUnstake() {
    if (!confirm("10% penalty applies. Continue?")) {
        return;
    }
    
    try {
        showToast("Emergency unstaking...", "info");
        
        const tx = await thoboCoinContract.emergencyUnstake();
        await tx.wait();
        
        showToast("Emergency unstake complete (10% penalty)", "success");
        await loadData();
    } catch (error) {
        console.error("Error:", error);
        showToast("Failed: " + error.message, "error");
    }
}

// Transfer tokens
async function transferTokens() {
    try {
        const recipient = document.getElementById('transferRecipient').value;
        const amount = document.getElementById('transferAmount').value;
        
        if (!recipient || !ethers.utils.isAddress(recipient)) {
            showToast("Invalid address", "error");
            return;
        }
        
        if (!amount || amount <= 0) {
            showToast("Invalid amount", "error");
            return;
        }
        
        const amountWei = ethers.utils.parseEther(amount);
        
        showToast("Transferring...", "info");
        
        const tx = await thoboCoinContract.transfer(recipient, amountWei);
        await tx.wait();
        
        showToast("Transfer successful!", "success");
        await loadData();
        
        document.getElementById('transferRecipient').value = '';
        document.getElementById('transferAmount').value = '';
    } catch (error) {
        console.error("Error:", error);
        showToast("Failed: " + error.message, "error");
    }
}

// Tab switching
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-button').forEach(el => {
        el.classList.remove('active', 'border-blue-500', 'text-blue-400');
        el.classList.add('border-transparent', 'text-gray-400');
    });
    
    document.getElementById(tabName + 'Content').classList.remove('hidden');
    const button = document.getElementById(tabName + 'Tab');
    button.classList.add('active', 'border-blue-500', 'text-blue-400');
    button.classList.remove('border-transparent', 'text-gray-400');
}

// Utility functions
function formatAddress(address) {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

function formatNumber(num) {
    const number = parseFloat(num);
    if (number >= 1000000) {
        return (number / 1000000).toFixed(2) + 'M';
    } else if (number >= 1000) {
        return (number / 1000).toFixed(2) + 'K';
    }
    return number.toFixed(2);
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    
    toast.classList.remove('bg-gray-800', 'bg-green-800', 'bg-red-800', 'bg-blue-800');
    if (type === 'success') {
        toast.classList.add('bg-green-800');
    } else if (type === 'error') {
        toast.classList.add('bg-red-800');
    } else if (type === 'info') {
        toast.classList.add('bg-blue-800');
    }
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 5000);
}

window.addEventListener('load', init);
