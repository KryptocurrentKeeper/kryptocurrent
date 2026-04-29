import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, X, Search } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function CryptoAggregator() {
  const [cryptoPrices, setCryptoPrices] = useState([]);
  const [xrpExchangeBalance, setXrpExchangeBalance] = useState(null);
  const [xrpExchangeLoading, setXrpExchangeLoading] = useState(true);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [showAllExchanges, setShowAllExchanges] = useState(false);
  const [showExchangeSummary, setShowExchangeSummary] = useState(false);
  const [miniChartData, setMiniChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartTimeframe, setChartTimeframe] = useState('7');
  const [pricesExpanded, setPricesExpanded] = useState(0);
  const [priceCategory, setPriceCategory] = useState('utility');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const pricesRef = useRef(null);

  // Helper function to clean up text encoding issues
  const cleanText = (text) => {
    if (!text) return text;
    return text
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&#x27;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\u2018|\u2019/g, "'")
      .replace(/\u201C|\u201D/g, '"')
      .replace(/\u2013|\u2014/g, '-')
      .replace(/\u2026/g, '...')
      .replace(/\u00A0/g, ' ');
  };

  // Token utility information
  const tokenUtility = {
    'XRP': {
      utility: 'Global cross-border settlements & liquidity provisioning',
      adoption: 'Ripple ODL in 70+ countries, $15B+ annual volume, 300+ bank/fintech partnerships',
      partnerships: ['SBI Holdings (RLUSD Japan)', 'BNY Mellon (RLUSD custody)', 'Mastercard/WebBank/Gemini', 'Mizuho Bank/SMBC Nikko', 'Archax (RWA tokenization)', 'Franklin Templeton', 'DBS Group', 'Ctrl Alt/Dubai Land Dept', 'Modulr (UK/Europe)', 'AMINA Bank'],
      backers: ['Andreessen Horowitz (a16z)', 'Tetragon Financial', 'SBI Holdings', 'Pantera Capital', 'Fortress Investment Group'],
      founders: 'Jed McCaleb, Arthur Britto, David Schwartz, Chris Larsen (Ripple Labs)'
    },
    'ETH': {
      utility: 'Smart contracts, DeFi, NFTs, tokenized RWAs',
      adoption: '$500B+ DeFi TVL, BlackRock/BNY Mellon funds, L2 dominance (Base, Arbitrum)',
      partnerships: ['JP Morgan', 'Microsoft', 'Consensys', 'EY', 'BlackRock/BNY Mellon', 'Standard Chartered', 'Accenture', 'UBS/Fidelity', 'Visa', 'Google Cloud'],
      backers: ['Joseph Lubin (ConsenSys)', 'Vitalik Buterin', 'BlackRock', 'Grayscale', 'Fidelity'],
      founders: 'Vitalik Buterin (primary), with co-founders including Gavin Wood, Charles Hoskinson, Anthony Di Iorio, Joseph Lubin'
    },
    'LINK': {
      utility: 'Decentralized oracles for smart contracts',
      adoption: '2,000+ projects, CCIP for RWAs, SWIFT/DTCC pilots',
      partnerships: ['SWIFT (pilots)', 'DTCC (fund data)', 'Mastercard', 'Euroclear', 'Fidelity International', 'UBS/ANZ', 'Deutsche Börse', 'SBI Group', 'GLEIF', 'Chainalysis'],
      backers: ['Fundamental Labs', 'Nirvana Capital', 'Grayscale Trust'],
      founders: 'Sergey Nazarov (with Steve Ellis)'
    },
    'BTC': {
      utility: 'Store of value + payments (Lightning)',
      adoption: 'Nation-state reserves, corporate treasuries, surging Lightning volume',
      partnerships: ['Nation-state reserves (U.S.)', 'MicroStrategy (treasury)', 'Lightning Network', 'BlackRock ETFs', 'JPMorgan (collateral)', 'Tesla', 'El Salvador', 'Corporate treasuries (172+)', 'Fedwire pilots', 'Grayscale Trust'],
      backers: ['MicroStrategy', 'BlackRock (ETFs)', 'Tesla', 'Marathon Digital', 'Fidelity'],
      founders: 'Satoshi Nakamoto (pseudonymous/unknown identity)'
    },
    'SOL': {
      utility: 'High-throughput payments, DeFi, consumer apps',
      adoption: 'Visa pilot, PayPal PYUSD, top DEX volume, mobile integration',
      partnerships: ['Visa (pilots)', 'PayPal (PYUSD)', 'Shopify/Stripe', 'JP Morgan (bonds)', 'Revolut', 'Chainlink', 'Google Cloud', 'Mysten Labs', 'Coinbase (DEX)', 'Facebook Diem alumni'],
      backers: ['Andreessen Horowitz (a16z)', 'Polychain Capital', 'Multicoin Capital', 'Alameda Research', 'Jump Trading'],
      founders: 'Anatoly Yakovenko (with Raj Gokal and Greg Fitzgerald)'
    },
    'XLM': {
      utility: 'Low-cost remittances & CBDC infrastructure',
      adoption: 'MoneyGram, Ukraine CBDC pilot, Circle USDC issuer',
      partnerships: ['MoneyGram', 'Circle (USDC issuer)', 'Mastercard', 'Franklin Templeton', 'Ukraine CBDC pilot', 'Paxos/Ondo (RWAs)', 'Visa', 'IBM', 'SureRemit', 'Wormhole'],
      backers: ['Stripe (seed)', 'Circle (USDC)', 'MoneyGram'],
      founders: 'Jed McCaleb (with Joyce Kim)'
    },
    'QNT': {
      utility: 'Enterprise blockchain interoperability',
      adoption: 'SWIFT/BIS projects, LACChain CBDC, UK digital bonds',
      partnerships: ['ECB (digital euro)', 'SWIFT/BIS projects', 'Oracle', 'SIA', 'LACChain CBDC', 'UK digital bonds', 'Overledger enterprise clients'],
      backers: ['Private enterprise-focused', 'Limited public VC details'],
      founders: 'Gilbert Verdian'
    },
    'HBAR': {
      utility: 'Enterprise DLT for payments, tokenization',
      adoption: 'Council (Google, Boeing), 20B+ transactions, abrdn RWAs',
      partnerships: ['Google', 'Boeing', 'IBM', 'abrdn (RWAs)', 'Nairobi Securities Exchange', 'NATO DIANA (2026)', 'ServiceNow'],
      backers: ['Google', 'Boeing', 'IBM', 'abrdn'],
      founders: 'Leemon Baird (with Mance Harmon)'
    },
    'VET': {
      utility: 'Supply-chain traceability & carbon credits',
      adoption: 'Walmart China, PwC/DNV, enterprise NFTs',
      partnerships: ['Walmart China', 'PwC/DNV', 'BMW', 'DHL', 'Franklin Templeton/BitGo', 'Boston Consulting Group', 'Crypto.com', 'Valour ETPs'],
      backers: ['PwC', 'DNV', 'Enterprise-focused'],
      founders: 'Sunny Lu'
    },
    'POL': {
      utility: 'Ethereum scaling + enterprise sidechains',
      adoption: 'Starbucks/Adidas/JPMorgan usage, AggLayer',
      partnerships: ['Starbucks', 'Nike', 'Adidas', 'JPMorgan', 'Mastercard', 'Calastone', 'Cypher Capital', 'Manifold Trading', 'Reliance Jio', 'Stripe'],
      backers: ['Sequoia Capital India', 'SoftBank Vision Fund', 'Tiger Global', 'Andreessen Horowitz', 'Binance Labs'],
      founders: 'Jaynti Kanani, Sandeep Nailwal, Anurag Arjun, Mihailo Bjelic'
    },
    'TON': {
      utility: 'Mass-scale payments & mini-apps via Telegram',
      adoption: '900M+ Telegram users, wallet adoption, growing DeFi/stablecoins',
      partnerships: ['Telegram (Mini Apps)', 'Sequoia Capital/Benchmark ($400M)', 'BitGo/Kraken/SkyBridge', 'Crypto.com', 'Chainlink'],
      backers: ['Sequoia Capital', 'Ribbit Capital', 'Benchmark', 'Pantera Capital', 'Vy Capital'],
      founders: 'Nikolai Durov and Pavel Durov (Telegram founders); community-led after Telegram exit'
    },
    'ADA': {
      utility: 'Identity, governance, real-fi in emerging markets',
      adoption: 'Ethiopia credentials (5M+ users), World Mobile telecom',
      partnerships: ['Ethiopia (credentials)', 'World Mobile (telecom)', 'Chainlink', 'Google/Oracle', 'Dune Analytics', 'Pyth Oracle', 'Tier-1 stablecoins incoming'],
      backers: ['Input Output Global (IOG)', 'EMURGO', 'ICO-funded'],
      founders: 'Charles Hoskinson'
    },
    'RLUSD': {
      utility: 'Enterprise-grade stablecoin on XRPL/Ethereum',
      adoption: 'Launched 2025, used in Ripple Payments, MiCA-compliant',
      partnerships: ['SBI VC Trade (Japan)', 'Uphold/Bitstamp/Bitso', 'MoonPay/Independent Reserve', 'CoinMENA/Bullish', 'BNY Mellon', 'Mastercard/WebBank/Gemini'],
      backers: ['Fortress', 'Citadel affiliates', 'Pantera', 'Galaxy Digital'],
      founders: 'Ripple Labs (company-created stablecoin; key figures Brad Garlinghouse, Chris Larsen)'
    },
    'AVAX': {
      utility: 'Institutional subnets, tokenized assets',
      adoption: 'Citi/WisdomTree/Deloitte RWAs, Project Guardian',
      partnerships: ['Citi/WisdomTree/Deloitte', 'JP Morgan Onyx', 'SMBC (stablecoins)', 'Crypto Finance AG', 'SkyBridge', 'Galaxy Digital/Pantera/VanEck'],
      backers: ['Polychain Capital', 'Andreessen Horowitz', 'Three Arrows Capital', 'Galaxy Digital', 'ParaFi Capital'],
      founders: 'Emin Gün Sirer (with Maofan Yin and Kevin Sekniqi)'
    },
    'NEAR': {
      utility: 'AI integration, account abstraction, cross-chain',
      adoption: 'AI + DeFi growth, intents for swaps',
      partnerships: ['Google Cloud', 'LayerZero', 'THORChain/Everclear', 'Frax Finance', 'Deutsche Telekom (validator)'],
      backers: ['Andreessen Horowitz', 'Pantera Capital', 'Three Arrows Capital', 'Dragonfly Capital', 'Tiger Global'],
      founders: 'Illia Polosukhin (with Alexander Skidanov)'
    },
    'ICP': {
      utility: 'On-chain cloud & decentralized web',
      adoption: 'Fully on-chain apps (OpenChat/DSCVR)',
      partnerships: ['Microsoft Azure', 'Google Cloud', 'SWIFT', 'Chain Fusion (Solana/Doge)', 'Caffeine AI partners'],
      backers: ['Andreessen Horowitz', 'Polychain Capital', 'Multicoin Capital', 'Amino Capital', 'SV Angel'],
      founders: 'Dominic Williams (DFINITY Foundation)'
    },
    'KAS': {
      utility: 'Ultra-fast DAG payments',
      adoption: '10 blocks/sec, merchant adoption',
      partnerships: ['WhiteBIT', 'Tangem/Ledger (wallets)', 'Zealous Swap (DeFi)'],
      backers: ['Fair-launched', 'Community-driven', 'Limited institutional VC'],
      founders: 'Yonatan Sompolinsky'
    },
    'SUI': {
      utility: 'High-throughput for gaming & DeFi',
      adoption: 'DeepBook DEX, Mysten Labs backing',
      partnerships: ['BytePlus', 'ONE Championship', 'SEED', 'Grayscale/21Shares (ETPs)', 'Google Cloud'],
      backers: ['Andreessen Horowitz', 'FTX Ventures', 'Binance Labs', 'Coinbase Ventures', 'Jump Crypto'],
      founders: 'Evan Cheng, Sam Blackshear, Adeniyi Abiodun, George Danezis, Kostas Chalkias (Mysten Labs; ex-Diem team)'
    },
    'XDC': {
      utility: 'Enterprise trade finance & payments',
      adoption: 'TradeFinex/R3 partnerships, USDC native',
      partnerships: ['SBI Japan', 'Contour (trade finance)', 'VERT Capital', 'SIX Swiss Exchange', 'Ankr'],
      backers: ['LDA Capital', 'Enterprise-focused', 'Limited public VC'],
      founders: 'Ritesh Kakkad (with Atul Khekade)'
    },
    'ALGO': {
      utility: 'Institutional & CBDC focus',
      adoption: 'Italy SIA, Marshall Islands crypto',
      partnerships: ['Wormhole', 'Google (Agent Payments)', 'ISDA (derivatives)', 'Marshall Islands', 'Paxos/Ondo (RWAs)'],
      backers: ['Union Square Ventures', 'Pillar VC', 'ICO backers'],
      founders: 'Silvio Micali'
    },
    'XTZ': {
      utility: 'Self-amending, institutional baking',
      adoption: 'Societe Generale/Ubisoft, formal verification',
      partnerships: ['Societe Generale', 'Ubisoft', 'Manchester United', 'Red Bull Racing'],
      backers: ['Tim Draper', 'Polychain Capital', 'ICO-funded'],
      founders: 'Arthur Breitman (with Kathleen Breitman)'
    },
    'DOT': {
      utility: 'Sovereign interoperable chains & parachains',
      adoption: '100+ connected chains, growing RWA volume, JAM upgrades upcoming',
      partnerships: ['Moonbeam (EVM)', 'Acala (DeFi)', 'Centrifuge (RWAs)', 'Hydration', 'Mythos'],
      backers: ['Polychain Capital', 'Web3 Foundation', 'ICO-funded'],
      founders: 'Gavin Wood (with Robert Habermeier and Peter Czaban)'
    },
    'TAO': {
      utility: 'Decentralized machine-learning',
      adoption: 'Fast-growing AI sector, subnet revenue',
      partnerships: ['Chainlink (interoperability)', 'General TAO Ventures', 'Subnet projects (AIT Protocol)'],
      backers: ['Polychain Capital', 'Digital Currency Group', 'dao5', 'Pantera Capital', 'Foundry'],
      founders: 'Jacob Robert Steeves (with Ala Shaabana)'
    },
    'ATOM': {
      utility: 'IBC ecosystem for interoperable chains',
      adoption: 'Noble USDC, dYdX v4',
      partnerships: ['Noble (USDC)', 'dYdX v4', 'Osmosis', 'Solana IBC (incoming)'],
      backers: ['Interchain Foundation', 'ICO-funded', 'Limited traditional VC'],
      founders: 'Jae Kwon (with Ethan Buchman)'
    }
  };

  // Debounced search effect
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        searchCrypto(searchQuery);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else if (searchQuery.trim().length === 0 && priceCategory === 'search') {
      setPriceCategory('utility');
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchCryptoPrices();
    fetchXRPExchangeBalance();
  }, []);

  // Fetch prices when category changes
  useEffect(() => {
    fetchCryptoPrices(priceCategory);
  }, [priceCategory]);

  // Auto-refresh XRP Exchange Balance every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchXRPExchangeBalance();
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchCryptoPrices = async (category = 'utility') => {
    try {
      setLoading(true);

      const COINGECKO_API_KEYS = [
        'CG-pDYwrEULGCyoK3cDn37ZMws6',
        import.meta.env.VITE_COINGECKO_API_KEY,
        import.meta.env.VITE_COINGECKO_API_KEY_3
      ];

      let currentKeyIndex = parseInt(localStorage.getItem('coingecko_api_key_index') || '0');
      const validKeys = COINGECKO_API_KEYS.filter(key => key && key.length > 0);

      let apiKeyParam = '';
      if (validKeys.length > 0 && validKeys[currentKeyIndex % validKeys.length]) {
        const currentKey = validKeys[currentKeyIndex % validKeys.length];
        const isPaidKey = currentKey === 'CG-pDYwrEULGCyoK3cDn37ZMws6';
        apiKeyParam = isPaidKey ? `&x-cg-pro-api-key=${currentKey}` : `&x_cg_demo_api_key=${currentKey}`;
      }

      let url = '';

      if (category === 'search') {
        setLoading(false);
        return;
      } else if (category === 'utility') {
        const utilityIds = 'ripple,ethereum,chainlink,bitcoin,solana,stellar,quant-network,hedera-hashgraph,vechain,matic-network,the-open-network,cardano,avalanche-2,near,internet-computer,kaspa,sui,xdce-crowd-sale,algorand,tezos,polkadot,bittensor,cosmos';
        url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${utilityIds}&order=market_cap_desc&per_page=250&page=1${apiKeyParam}`;
      } else if (category === 'iso20022') {
        const iso20022Ids = 'ripple,stellar,algorand,hedera-hashgraph,quant-network,xdce-crowd-sale,iota,cardano,vechain,casper-network,lcx,coti';
        url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${iso20022Ids}&order=market_cap_desc&per_page=250&page=1${apiKeyParam}`;
      } else if (category === 'ai') {
        url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=artificial-intelligence&order=market_cap_desc&per_page=30&page=1${apiKeyParam}`;
      } else if (category === 'meme') {
        url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=meme-token&order=market_cap_desc&per_page=30&page=1${apiKeyParam}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 429 && validKeys.length > 1) {
          currentKeyIndex = (currentKeyIndex + 1) % validKeys.length;
          localStorage.setItem('coingecko_api_key_index', currentKeyIndex.toString());
          const newApiKey = validKeys[currentKeyIndex];
          const isPaidKey = newApiKey === 'CG-pDYwrEULGCyoK3cDn37ZMws6';
          const newApiKeyParam = isPaidKey ? `&x-cg-pro-api-key=${newApiKey}` : `&x_cg_demo_api_key=${newApiKey}`;

          let retryUrl = '';
          if (category === 'utility') {
            const utilityIds = 'ripple,ethereum,chainlink,bitcoin,solana,stellar,quant-network,hedera-hashgraph,vechain,matic-network,the-open-network,cardano,avalanche-2,near,internet-computer,kaspa,sui,xdce-crowd-sale,algorand,tezos,polkadot,bittensor,cosmos';
            retryUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${utilityIds}&order=market_cap_desc&per_page=250&page=1${newApiKeyParam}`;
          } else if (category === 'iso20022') {
            const iso20022Ids = 'ripple,stellar,algorand,hedera-hashgraph,quant-network,xdce-crowd-sale,iota,cardano,vechain,casper-network,lcx,coti';
            retryUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${iso20022Ids}&order=market_cap_desc&per_page=250&page=1${newApiKeyParam}`;
          } else if (category === 'ai') {
            retryUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=artificial-intelligence&order=market_cap_desc&per_page=30&page=1${newApiKeyParam}`;
          } else if (category === 'meme') {
            retryUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=meme-token&order=market_cap_desc&per_page=30&page=1${newApiKeyParam}`;
          }

          const retryResponse = await fetch(retryUrl);
          if (!retryResponse.ok) throw new Error(`HTTP ${retryResponse.status}`);
          const retryData = await retryResponse.json();
          if (Array.isArray(retryData) && retryData.length > 0) {
            let filteredData = retryData;
            if (category === 'ai') filteredData = retryData.filter(coin => coin.id !== 'chainlink');
            setCryptoPrices(filteredData);
            localStorage.setItem(`kryptocurrent_prices_${category}`, JSON.stringify(filteredData));
            localStorage.setItem(`kryptocurrent_prices_${category}_timestamp`, Date.now().toString());
            setLoading(false);
            return;
          }
        }

        if (response.status === 429) {
          const cached = localStorage.getItem(`kryptocurrent_prices_${category}`);
          if (cached) {
            setCryptoPrices(JSON.parse(cached));
            setLoading(false);
            return;
          }
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        let filteredData = data;
        if (category === 'ai') {
          filteredData = data.filter(coin => coin.id !== 'chainlink');
        } else if (category === 'utility') {
          const utilityOrder = [
            'ripple', 'ethereum', 'chainlink', 'bitcoin', 'solana', 'stellar',
            'quant-network', 'hedera-hashgraph', 'vechain', 'matic-network',
            'the-open-network', 'cardano', 'ripple-usd', 'avalanche-2', 'near',
            'internet-computer', 'kaspa', 'sui', 'xdce-crowd-sale', 'algorand',
            'tezos', 'polkadot', 'bittensor', 'cosmos'
          ];
          filteredData = data.sort((a, b) => {
            const aIndex = utilityOrder.indexOf(a.id);
            const bIndex = utilityOrder.indexOf(b.id);
            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            return 0;
          });
        }
        setCryptoPrices(filteredData);
        localStorage.setItem(`kryptocurrent_prices_${category}`, JSON.stringify(filteredData));
        localStorage.setItem(`kryptocurrent_prices_${category}_timestamp`, Date.now().toString());
      } else {
        setCryptoPrices([]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching prices:', error);
      const cached = localStorage.getItem(`kryptocurrent_prices_${category}`);
      if (cached) {
        setCryptoPrices(JSON.parse(cached));
      } else {
        setCryptoPrices([]);
      }
      setLoading(false);
    }
  };

  const searchCrypto = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setPriceCategory('utility');
      return;
    }

    setIsSearching(true);

    try {
      const API_KEYS = [
        'CG-pDYwrEULGCyoK3cDn37ZMws6',
        import.meta.env.VITE_COINGECKO_API_KEY,
        'CG-3sWy6p7H9PxVMPazCH3b4qmP',
        'CG-sMadE1qVVGWq7C2pxdoMEeub',
        'CG-1HxnkGiCvdMTQKAQWtcvYfzc'
      ].filter(Boolean);

      let currentKeyIndex = parseInt(localStorage.getItem('coingecko_api_key_index') || '0');
      let API_KEY = API_KEYS[currentKeyIndex];
      const isPaidKey = API_KEY === 'CG-pDYwrEULGCyoK3cDn37ZMws6';
      const apiKeyParam = API_KEY ? (isPaidKey ? `x-cg-pro-api-key=${API_KEY}` : `x_cg_demo_api_key=${API_KEY}`) : '';

      const searchUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&${apiKeyParam}`;
      const response = await fetch(searchUrl);

      if (!response.ok) throw new Error('Search failed');

      const allCoins = await response.json();
      const searchLower = query.toLowerCase();
      const matchingCoins = allCoins.filter(coin =>
        coin.name.toLowerCase().includes(searchLower) ||
        coin.symbol.toLowerCase().includes(searchLower) ||
        coin.id.toLowerCase().includes(searchLower)
      );

      if (matchingCoins.length > 0) {
        setSearchResults(matchingCoins);
        setPriceCategory('search');
        setCryptoPrices(matchingCoins);
      } else {
        setSearchResults([]);
        setPriceCategory('search');
        setCryptoPrices([]);
      }
    } catch (error) {
      console.error('Error searching crypto:', error);
      setSearchResults([]);
      setPriceCategory('utility');
    } finally {
      setIsSearching(false);
    }
  };

  const fetchChartData = async (coinId, days = '7') => {
    setChartLoading(true);
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`);
      const data = await response.json();
      const formattedData = data.prices.map(([timestamp, price]) => ({
        time: days === '1'
          ? new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          : new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: price
      }));
      setChartData(formattedData);
      setChartLoading(false);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartLoading(false);
    }
  };

  const openChart = async (crypto) => {
    setSelectedCrypto(crypto);
    setChartTimeframe('7');
    fetchChartData(crypto.id, '7');

    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/${crypto.id}/market_chart?vs_currency=usd&days=30&interval=daily`);
      if (response.ok) {
        const data = await response.json();
        const formattedData = data.prices.map(([timestamp, price]) => ({
          time: timestamp,
          price: price
        }));
        setMiniChartData(formattedData);
      }
    } catch (error) {
      console.error('Error fetching mini chart:', error);
      setMiniChartData([]);
    }
  };

  const changeChartTimeframe = (days) => {
    setChartTimeframe(days);
    fetchChartData(selectedCrypto.id, days);
  };

  const closeChart = () => {
    setSelectedCrypto(null);
    setChartData([]);
    setMiniChartData([]);
  };

  const handlePricesToggle = (action) => {
    if (action === 'more') {
      setPricesExpanded(prev => Math.min(prev + 1, 3));
    } else {
      setPricesExpanded(0);
      if (pricesRef.current) {
        setTimeout(() => {
          pricesRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  };

  const fetchXRPExchangeBalance = async () => {
    try {
      const cached = localStorage.getItem('kryptocurrent_xrp_exchange_balance');
      const cacheTimestamp = localStorage.getItem('kryptocurrent_xrp_exchange_balance_timestamp');

      if (cached && cacheTimestamp) {
        const cacheAge = Date.now() - parseInt(cacheTimestamp);
        if (cacheAge < 5 * 60 * 1000) {
          setXrpExchangeBalance(JSON.parse(cached));
          setXrpExchangeLoading(false);
          return;
        }
      }

      setXrpExchangeLoading(true);
      const response = await fetch('/api/xrp-exchange-balance');

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const balanceData = await response.json();
      setXrpExchangeBalance(balanceData);
      setXrpExchangeLoading(false);
      localStorage.setItem('kryptocurrent_xrp_exchange_balance', JSON.stringify(balanceData));
      localStorage.setItem('kryptocurrent_xrp_exchange_balance_timestamp', Date.now().toString());
    } catch (error) {
      console.error('Error fetching XRP exchange balance:', error);
      setXrpExchangeBalance({
        total: 4180000000,
        change7d: -2.1,
        lastUpdated: new Date().toISOString(),
        source: 'Fallback',
        error: true
      });
      setXrpExchangeLoading(false);
    }
  };

  // Filter and deduplicate prices
  const validCryptoPrices = cryptoPrices
    .filter(crypto =>
      crypto &&
      crypto.id &&
      crypto.symbol &&
      crypto.current_price !== null &&
      crypto.current_price !== undefined
    )
    .filter((crypto, index, self) =>
      index === self.findIndex(c =>
        c.id === crypto.id ||
        (c.symbol.toLowerCase() === crypto.symbol.toLowerCase() && c.name.toLowerCase() === crypto.name.toLowerCase())
      )
    );

  // Show all by market cap — paginated via expand
  const displayedPrices = validCryptoPrices.slice(
    0,
    pricesExpanded === 0 ? 24 : pricesExpanded === 1 ? 56 : pricesExpanded === 2 ? 96 : validCryptoPrices.length
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-[#ffc93c] py-6 mb-8">
          <div className="max-w-2xl mx-auto px-4">
            <img src="/logo.png?v=2" alt="Kryptocurrent Logo" className="w-full" />
          </div>
        </div>

        {/* Prices Section */}
        <div ref={pricesRef} className="bg-slate-800/50 backdrop-blur rounded-xl p-6 mb-8">
          <div className="flex flex-col gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Current Conditions</h2>
            </div>

            {/* Category Toggle Buttons and Search */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setPriceCategory('utility'); setSearchQuery(''); setSearchResults([]); }}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${priceCategory === 'utility' ? 'bg-[#ffc93c] text-black' : 'bg-slate-700/50 text-white hover:bg-slate-700'}`}
                >
                  Top Real-World Coins
                </button>
                <button
                  onClick={() => { setPriceCategory('iso20022'); setSearchQuery(''); setSearchResults([]); }}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${priceCategory === 'iso20022' ? 'bg-[#ffc93c] text-black' : 'bg-slate-700/50 text-white hover:bg-slate-700'}`}
                >
                  ISO 20022 Coins
                </button>
                <button
                  onClick={() => { setPriceCategory('ai'); setSearchQuery(''); setSearchResults([]); }}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${priceCategory === 'ai' ? 'bg-[#ffc93c] text-black' : 'bg-slate-700/50 text-white hover:bg-slate-700'}`}
                >
                  Top AI Coins
                </button>
                <button
                  onClick={() => { setPriceCategory('meme'); setSearchQuery(''); setSearchResults([]); }}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${priceCategory === 'meme' ? 'bg-[#ffc93c] text-black' : 'bg-slate-700/50 text-white hover:bg-slate-700'}`}
                >
                  Top Meme Coins
                </button>
              </div>

              {/* Search Field */}
              <div className="mt-4 md:mt-0 md:ml-4 flex-shrink-0">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search any crypto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full md:w-64 px-4 py-2 pl-10 pr-10 bg-slate-700/50 text-white rounded-lg border border-slate-600 focus:border-[#ffc93c] focus:outline-none focus:ring-2 focus:ring-[#ffc93c]/20 transition"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  {isSearching && (
                    <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#ffc93c] animate-spin" size={18} />
                  )}
                  {!isSearching && searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(''); setSearchResults([]); setPriceCategory('utility'); }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition"
                      aria-label="Clear search"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                {priceCategory === 'search' && searchResults.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">Found {searchResults.length} results</p>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="animate-spin mx-auto mb-2 text-[#ffc93c]" size={32} />
              <p className="text-gray-400">Loading prices...</p>
            </div>
          ) : (
            <>
              {/* Mobile: 3 columns */}
              <div className="md:hidden">
                <div className="grid grid-cols-3 gap-1.5">
                  {validCryptoPrices.slice(0, pricesExpanded === 0 ? 12 : pricesExpanded === 1 ? 36 : pricesExpanded === 2 ? 72 : validCryptoPrices.length).map((crypto) => (
                    <div
                      key={crypto.id}
                      onClick={() => openChart(crypto)}
                      className="group bg-slate-700/50 rounded-lg p-1.5 hover:bg-slate-700 transition-all duration-300 cursor-pointer border border-transparent hover:border-[#ffc93c]/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#ffc93c]/10"
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <img src={crypto.image} alt={crypto.name} className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                        <h3 className="font-semibold text-xs truncate group-hover:text-[#ffc93c] transition-colors">{crypto.symbol.toUpperCase()}</h3>
                      </div>
                      <p className="text-xs font-bold whitespace-nowrap">
                        ${crypto.current_price < 0.01
                          ? crypto.current_price.toFixed(6)
                          : crypto.current_price < 1
                          ? crypto.current_price.toFixed(4)
                          : crypto.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <div className={`flex items-center gap-0.5 text-xs ${crypto.price_change_percentage_24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {crypto.price_change_percentage_24h > 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                        <span>{Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                {validCryptoPrices.length > 12 && (
                  <div className="mt-3 flex gap-2">
                    {pricesExpanded > 0 && (
                      <button onClick={() => handlePricesToggle('less')} className="flex-1 px-4 py-2 bg-slate-600 text-white hover:bg-slate-500 rounded-lg transition font-semibold text-sm">
                        Show Less
                      </button>
                    )}
                    {pricesExpanded < 3 && validCryptoPrices.length > (pricesExpanded === 0 ? 12 : pricesExpanded === 1 ? 36 : 72) && (
                      <button onClick={() => handlePricesToggle('more')} className="flex-1 px-4 py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold text-sm">
                        Show More
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Desktop: 8 columns for max density */}
              <div className="hidden md:block">
                <div className="grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1.5">
                  {displayedPrices.map((crypto) => (
                    <div
                      key={crypto.id}
                      onClick={() => openChart(crypto)}
                      className="group bg-slate-700/50 rounded-lg p-2 hover:bg-slate-700 transition-all duration-300 cursor-pointer border border-transparent hover:border-[#ffc93c]/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#ffc93c]/10"
                    >
                      <div className="flex items-center gap-1 mb-1 min-w-0">
                        <img src={crypto.image} alt={crypto.name} className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                        <h3 className="font-semibold text-xs truncate group-hover:text-[#ffc93c] transition-colors">{crypto.symbol.toUpperCase()}</h3>
                      </div>
                      <p className="text-xs font-bold whitespace-nowrap">
                        ${crypto.current_price < 0.01
                          ? crypto.current_price.toFixed(6)
                          : crypto.current_price < 1
                          ? crypto.current_price.toFixed(4)
                          : crypto.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <div className={`flex items-center gap-0.5 ${crypto.price_change_percentage_24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {crypto.price_change_percentage_24h > 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                        <span className="text-xs">{Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                {validCryptoPrices.length > 24 && (
                  <div className="mt-3 flex gap-2">
                    {pricesExpanded > 0 && (
                      <button onClick={() => handlePricesToggle('less')} className="flex-1 px-4 py-2 bg-slate-600 text-white hover:bg-slate-500 rounded-lg transition font-semibold text-sm">
                        Show Less
                      </button>
                    )}
                    {pricesExpanded < 3 && validCryptoPrices.length > (pricesExpanded === 0 ? 24 : pricesExpanded === 1 ? 56 : 96) && (
                      <button onClick={() => handlePricesToggle('more')} className="flex-1 px-4 py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold text-sm">
                        Show More
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* XRP Sections */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* XRP Exchange Balance */}
            {xrpExchangeLoading ? (
              <div className="p-3 bg-slate-700/50 rounded-xl border border-slate-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src="/XRPlogo.jpg" alt="XRP" className="w-8 h-8 rounded" />
                    <h3 className="text-lg font-bold text-white">XRP on Exchanges</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-[#ffc93c] animate-spin" />
                    <span className="text-sm text-gray-400">Loading...</span>
                  </div>
                </div>
              </div>
            ) : xrpExchangeBalance && (
              <div
                onClick={() => setShowExchangeModal(true)}
                className="p-3 bg-slate-700/50 rounded-xl border border-slate-600 cursor-pointer hover:bg-slate-700 hover:border-[#ffc93c]/50 transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src="/XRPlogo.jpg" alt="XRP" className="w-8 h-8 rounded" />
                    <h3 className="text-lg font-bold text-white">XRP on Exchanges</h3>
                  </div>
                  <div className="text-2xl font-bold text-[#ffc93c]">
                    ~{(xrpExchangeBalance.total / 1000000000).toFixed(2)}B
                  </div>
                </div>
              </div>
            )}

            {/* ETF Tracker */}
            <div className="p-3 bg-slate-700/50 rounded-xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <img src="/XRPlogo.jpg" alt="XRP" className="w-6 h-6 rounded" />
                  <div>
                    <h3 className="text-base font-bold text-white">XRP ETF Tracker</h3>
                    <p className="text-xs text-gray-300 hidden md:block">Track spot ETF stats from our good friends at XRP Insights</p>
                  </div>
                </div>
                <a
                  href="https://xrp-insights.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 md:px-4 py-1.5 md:py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold whitespace-nowrap text-xs md:text-sm"
                >
                  Visit →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Modal */}
      {selectedCrypto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={closeChart}>
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <button onClick={closeChart} className="p-2 hover:bg-gray-100 rounded-lg ml-auto">
                <X size={24} className="text-black" />
              </button>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img src={selectedCrypto.image} alt={selectedCrypto.name} className="w-10 h-10" />
                <div>
                  <h2 className="text-2xl font-bold text-black">{selectedCrypto.name}</h2>
                  <p className="text-gray-600 text-xs">{selectedCrypto.symbol.toUpperCase()}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-black">${selectedCrypto.current_price.toLocaleString()}</div>
                <div className={`flex items-center justify-end gap-1 text-sm ${selectedCrypto.price_change_percentage_24h > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedCrypto.price_change_percentage_24h > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {Math.abs(selectedCrypto.price_change_percentage_24h).toFixed(2)}% (24h)
                </div>
              </div>
            </div>

            {/* Token Utility Information */}
            {tokenUtility[selectedCrypto.symbol.toUpperCase()] && (
              <div className="mb-4 space-y-3">
                <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2">PRIMARY UTILITY / REAL-WORLD USE CASE</p>
                  <p className="text-sm text-black">{tokenUtility[selectedCrypto.symbol.toUpperCase()].utility}</p>
                </div>
                <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2">KEY ADOPTION HIGHLIGHTS (2025-2026)</p>
                  <p className="text-sm text-black">{tokenUtility[selectedCrypto.symbol.toUpperCase()].adoption}</p>
                </div>
                {tokenUtility[selectedCrypto.symbol.toUpperCase()].founders && (
                  <div className="bg-gray-100 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-600 mb-2">FOUNDER(S) / CREATOR(S)</p>
                    <p className="text-sm text-black">{tokenUtility[selectedCrypto.symbol.toUpperCase()].founders}</p>
                  </div>
                )}
                {tokenUtility[selectedCrypto.symbol.toUpperCase()].partnerships && (
                  <div className="bg-gray-100 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-600 mb-2">TOP PARTNERSHIPS & COLLABORATIONS (2025-2026)</p>
                    <div className="text-sm text-black">
                      {tokenUtility[selectedCrypto.symbol.toUpperCase()].partnerships.slice(0, 10).map((partner, idx) => (
                        <span key={idx}>
                          {partner}
                          {idx < Math.min(9, tokenUtility[selectedCrypto.symbol.toUpperCase()].partnerships.length - 1) ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {tokenUtility[selectedCrypto.symbol.toUpperCase()].backers && (
                  <div className="bg-gray-100 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-600 mb-2">NOTABLE BACKERS & INVESTORS</p>
                    <div className="text-sm text-black">
                      {tokenUtility[selectedCrypto.symbol.toUpperCase()].backers.map((backer, idx) => (
                        <span key={idx}>
                          {backer}
                          {idx < tokenUtility[selectedCrypto.symbol.toUpperCase()].backers.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <div className="bg-[#ffc93c] rounded-lg p-3">
                <p className="text-black text-xs mb-1 font-semibold">Market Cap</p>
                <p className="font-bold text-black">${(selectedCrypto.market_cap / 1e9).toFixed(2)}B</p>
              </div>
              <div className="bg-[#ffc93c] rounded-lg p-3">
                <p className="text-black text-xs mb-1 font-semibold">24h High</p>
                <p className="font-bold text-black">${selectedCrypto.high_24h?.toLocaleString()}</p>
              </div>
              <div className="bg-[#ffc93c] rounded-lg p-3">
                <p className="text-black text-xs mb-1 font-semibold">24h Low</p>
                <p className="font-bold text-black">${selectedCrypto.low_24h?.toLocaleString()}</p>
              </div>
              <div className="bg-[#ffc93c] rounded-lg p-3">
                <p className="text-black text-xs mb-1 font-semibold">All-Time High</p>
                <p className="font-bold text-black">${selectedCrypto.ath?.toLocaleString()}</p>
              </div>
            </div>

            {/* Chart Timeframe Buttons */}
            <div className="flex gap-2 mb-4">
              {['1', '7', '30', '90', '365'].map((days) => (
                <button
                  key={days}
                  onClick={() => changeChartTimeframe(days)}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${chartTimeframe === days ? 'bg-[#ffc93c] text-black' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  {days === '1' ? '24H' : days === '7' ? '7D' : days === '30' ? '30D' : days === '90' ? '90D' : '1Y'}
                </button>
              ))}
            </div>

            {chartLoading ? (
              <div className="flex items-center justify-center h-48">
                <RefreshCw className="animate-spin text-[#ffc93c]" size={32} />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} width={60} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Price']} />
                  <Line type="monotone" dataKey="price" stroke="#ffc93c" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* XRP Exchange Balance Modal */}
      {showExchangeModal && xrpExchangeBalance && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowExchangeModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src="/XRPlogo.jpg" alt="XRP" className="w-10 h-10 rounded" />
                <div>
                  <h2 className="text-2xl font-bold text-black">Total XRP on Exchanges</h2>
                  <p className="text-gray-600 text-sm">Live on-chain data</p>
                </div>
              </div>
              <button onClick={() => setShowExchangeModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X size={24} className="text-black" />
              </button>
            </div>

            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="text-5xl font-bold text-green-600 mb-2">
                    ~{(xrpExchangeBalance.total / 1000000000).toFixed(2)}B XRP
                  </div>
                  {xrpExchangeBalance.totalQueried && (
                    <div className="text-sm text-gray-600">
                      Queried: {(xrpExchangeBalance.totalQueried / 1000000000).toFixed(2)}B from {xrpExchangeBalance.queriedExchanges} out of {xrpExchangeBalance.totalExchanges} exchange wallets
                    </div>
                  )}
                </div>
                <div className="text-right border-l-2 border-gray-300 pl-4">
                  <div className="text-xs text-gray-600 mb-1">Since Jan 1, 2026</div>
                  <div className={`text-3xl font-bold ${xrpExchangeBalance.total >= 16500000000 ? 'text-red-600' : 'text-green-600'}`}>
                    {xrpExchangeBalance.total >= 16500000000 ? '+' : ''}
                    {((xrpExchangeBalance.total - 16500000000) / 1000000000).toFixed(2)}B
                  </div>
                  <div className={`text-sm font-semibold ${xrpExchangeBalance.total >= 16500000000 ? 'text-red-600' : 'text-green-600'}`}>
                    {xrpExchangeBalance.total >= 16500000000 ? '↑' : '↓'} {Math.abs(((xrpExchangeBalance.total - 16500000000) / 16500000000) * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-bold text-black mb-3">Top 20 Exchange Wallets</h3>
              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-2">
                {xrpExchangeBalance.topWallets && Array.isArray(xrpExchangeBalance.topWallets) && xrpExchangeBalance.topWallets
                  .sort((a, b) => {
                    const aVal = parseInt(a.balance.replace(/[^0-9]/g, ''));
                    const bVal = parseInt(b.balance.replace(/[^0-9]/g, ''));
                    return bVal - aVal;
                  })
                  .slice(0, 20)
                  .map((wallet, index) => {
                    const cleanExchangeName = wallet.exchange.replace(/\s*\(\d+\s*wallets?\)/, '');
                    return (
                      <div key={`${wallet.exchange}-${index}`} className="bg-gray-100 rounded-lg p-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-black font-medium truncate flex-shrink-0" style={{ minWidth: '100px', maxWidth: '100px' }}>{cleanExchangeName}</div>
                          <div className="text-gray-600 font-mono truncate flex-1">{wallet.address}</div>
                          <div className="text-green-600 font-bold whitespace-nowrap flex-shrink-0">{wallet.balance}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <button
              onClick={() => setShowAllExchanges(true)}
              className="w-full py-2 bg-white hover:bg-gray-50 text-green-600 border-2 border-green-600 font-bold rounded-lg transition"
            >
              All {xrpExchangeBalance.queriedExchanges} Exchanges
            </button>
            <button
              onClick={() => setShowExchangeSummary(true)}
              className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition mt-2"
            >
              View by Exchange
            </button>
          </div>
        </div>
      )}

      {/* All Exchanges Breakdown Modal */}
      {showAllExchanges && xrpExchangeBalance && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60]" onClick={() => setShowAllExchanges(false)}>
          <div className="bg-white rounded-xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">All Exchange Wallets</h2>
              <button onClick={() => setShowAllExchanges(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X size={24} className="text-black" />
              </button>
            </div>
            <div className="space-y-1.5">
              {xrpExchangeBalance.topWallets && Array.isArray(xrpExchangeBalance.topWallets) && xrpExchangeBalance.topWallets
                .sort((a, b) => {
                  const aVal = parseInt(a.balance.replace(/[^0-9]/g, ''));
                  const bVal = parseInt(b.balance.replace(/[^0-9]/g, ''));
                  return bVal - aVal;
                })
                .map((wallet, index) => {
                  const cleanExchangeName = wallet.exchange.replace(/\s*\(\d+\s*wallets?\)/, '');
                  return (
                    <div key={`${wallet.exchange}-${index}`} className="bg-gray-100 rounded-lg p-2 hover:bg-gray-200 transition text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-black font-medium truncate flex-shrink-0" style={{ minWidth: '100px', maxWidth: '100px' }}>{cleanExchangeName}</div>
                        <div className="text-gray-600 font-mono truncate flex-1">{wallet.address}</div>
                        <div className="text-green-600 font-bold whitespace-nowrap flex-shrink-0">{wallet.balance}</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Exchange Summary Modal */}
      {showExchangeSummary && xrpExchangeBalance && xrpExchangeBalance.exchangeSummary && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[70]" onClick={() => setShowExchangeSummary(false)}>
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">XRP Balance by Exchange</h2>
              <button onClick={() => setShowExchangeSummary(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X size={24} className="text-black" />
              </button>
            </div>
            <div className="mb-4 text-sm text-gray-600">
              Total across {xrpExchangeBalance.exchangeSummary.length} unique exchanges
            </div>
            <div className="space-y-2">
              {xrpExchangeBalance.exchangeSummary.map((exchange, index) => (
                <div key={index} className="bg-gray-100 rounded-lg p-4 flex items-center justify-between hover:bg-gray-200 transition">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="bg-white rounded-full w-10 h-10 flex items-center justify-center">
                      <span className="text-gray-600 font-bold text-sm">#{index + 1}</span>
                    </div>
                    <div>
                      <div className="font-bold text-black text-lg">{exchange.exchange}</div>
                      <div className="text-xs text-gray-600">
                        {exchange.walletCount} {exchange.walletCount === 1 ? 'wallet' : 'wallets'}
                      </div>
                    </div>
                  </div>
                  <div className="text-green-600 font-bold text-xl">{exchange.totalBalance} XRP</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowExchangeSummary(false)}
              className="w-full mt-6 py-2 bg-gray-200 hover:bg-gray-300 text-black font-bold rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
