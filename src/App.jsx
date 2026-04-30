import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, X, Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Known stablecoin IDs to filter from market cap list
const STABLECOIN_IDS = new Set([
  'tether','usd-coin','dai','binance-usd','true-usd','pax-dollar','usdd',
  'gemini-dollar','tether-eurt','stasis-eurs','paypal-usd','first-digital-usd',
  'frax','liquity-usd','eurc','usdb','usdx','mountain-protocol-usdm','ondo-us-dollar-yield',
  'ripple-usd','tether-gold','pax-gold','staked-ether','wrapped-steth','wrapped-bitcoin',
  'coinbase-wrapped-bitcoin','wrapped-ether','weth','staked-frax-ether','rocket-pool-eth',
]);

export default function CryptoAggregator() {
  const [cryptoPrices, setCryptoPrices] = useState([]);
  const [stablePrices, setStablePrices] = useState([]);
  const [stableLoading, setStableLoading] = useState(true);
  const [miniChartData, setMiniChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [selectedCryptoIndex, setSelectedCryptoIndex] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartTimeframe, setChartTimeframe] = useState('7');
  const [visibleCount, setVisibleCount] = useState(96);
  const [priceCategory, setPriceCategory] = useState('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(null);
  const currentSwipeX = useRef(0);

  const pricesRef = useRef(null);
  const sentinelRef = useRef(null);
  const dropdownRef = useRef(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);


  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => prev + 48);
        }
      },
      { threshold: 0, rootMargin: '300px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, loading]);

  // Reset visible count when category changes
  useEffect(() => {
    setVisibleCount(96);
  }, [priceCategory]);

  // Debounced search effect
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        searchCrypto(searchQuery);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else if (searchQuery.trim().length === 0 && priceCategory === 'search') {
      setPriceCategory('all');
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchCryptoPrices();
    fetchStablePrices();
  }, []);

  // Fetch prices when category changes
  useEffect(() => {
    fetchCryptoPrices(priceCategory);
  }, [priceCategory]);

  const fetchCryptoPrices = async (category = 'all') => {
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
      } else if (category === 'all') {
        // Top 250 by market cap
        url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1${apiKeyParam}`;
      } else if (category === 'utility') {
        const utilityIds = 'ripple,ethereum,chainlink,bitcoin,solana,stellar,quant-network,hedera-hashgraph,vechain,matic-network,the-open-network,cardano,avalanche-2,near,internet-computer,kaspa,sui,xdce-crowd-sale,algorand,tezos,polkadot,bittensor,cosmos';
        url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${utilityIds}&order=market_cap_desc&per_page=250&page=1${apiKeyParam}`;
      } else if (category === 'iso20022') {
        const iso20022Ids = 'ripple,stellar,algorand,hedera-hashgraph,quant-network,xdce-crowd-sale,iota,cardano,vechain,casper-network,lcx,coti';
        url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${iso20022Ids}&order=market_cap_desc&per_page=250&page=1${apiKeyParam}`;
      } else if (category === 'ai') {
        url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=artificial-intelligence&order=market_cap_desc&per_page=100&page=1${apiKeyParam}`;
      } else if (category === 'meme') {
        url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=meme-token&order=market_cap_desc&per_page=100&page=1${apiKeyParam}`;
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
          if (category === 'all') {
            retryUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1${newApiKeyParam}`;
          } else if (category === 'utility') {
            const utilityIds = 'ripple,ethereum,chainlink,bitcoin,solana,stellar,quant-network,hedera-hashgraph,vechain,matic-network,the-open-network,cardano,avalanche-2,near,internet-computer,kaspa,sui,xdce-crowd-sale,algorand,tezos,polkadot,bittensor,cosmos';
            retryUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${utilityIds}&order=market_cap_desc&per_page=250&page=1${newApiKeyParam}`;
          } else if (category === 'iso20022') {
            const iso20022Ids = 'ripple,stellar,algorand,hedera-hashgraph,quant-network,xdce-crowd-sale,iota,cardano,vechain,casper-network,lcx,coti';
            retryUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${iso20022Ids}&order=market_cap_desc&per_page=250&page=1${newApiKeyParam}`;
          } else if (category === 'ai') {
            retryUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=artificial-intelligence&order=market_cap_desc&per_page=100&page=1${newApiKeyParam}`;
          } else if (category === 'meme') {
            retryUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=meme-token&order=market_cap_desc&per_page=100&page=1${newApiKeyParam}`;
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
        } else if (category === 'all') {
          // Remove stablecoins and wrapped tokens from market cap list
          filteredData = data.filter(coin => !STABLECOIN_IDS.has(coin.id));
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
      setPriceCategory('all');
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
      setPriceCategory('all');
    } finally {
      setIsSearching(false);
    }
  };

  const fetchStablePrices = async () => {
    setStableLoading(true);
    try {
      const COINGECKO_API_KEYS = [
        'CG-pDYwrEULGCyoK3cDn37ZMws6',
        import.meta.env.VITE_COINGECKO_API_KEY,
      ];
      const validKeys = COINGECKO_API_KEYS.filter(Boolean);
      const currentKey = validKeys[0];
      const isPaidKey = currentKey === 'CG-pDYwrEULGCyoK3cDn37ZMws6';
      const apiKeyParam = currentKey ? (isPaidKey ? `&x-cg-pro-api-key=${currentKey}` : `&x_cg_demo_api_key=${currentKey}`) : '';
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=stablecoins&order=market_cap_desc&per_page=50&page=1${apiKeyParam}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) setStablePrices(data);
      }
    } catch (e) {
      console.error('Error fetching stablecoins:', e);
    } finally {
      setStableLoading(false);
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

  const openChart = async (crypto, index) => {
    setSelectedCrypto(crypto);
    setSelectedCryptoIndex(index ?? null);
    setChartTimeframe('7');
    fetchChartData(crypto.id, '7');
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/${crypto.id}/market_chart?vs_currency=usd&days=30&interval=daily`);
      if (response.ok) {
        const data = await response.json();
        setMiniChartData(data.prices.map(([timestamp, price]) => ({ time: timestamp, price })));
      }
    } catch (error) {
      setMiniChartData([]);
    }
  };

  const navigateCrypto = (direction) => {
    if (selectedCryptoIndex === null) return;
    const list = priceCategory === 'stable' ? stablePrices : displayedPrices;
    const newIndex = selectedCryptoIndex + direction;
    if (newIndex < 0 || newIndex >= list.length) return;
    openChart(list[newIndex], newIndex);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    currentSwipeX.current = 0;
    setIsSwiping(true);
  };
  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    currentSwipeX.current = diff;
    setSwipeOffset(diff);
  };
  const handleTouchEnd = () => {
    const diff = currentSwipeX.current;
    setIsSwiping(false);
    setSwipeOffset(0);
    touchStartX.current = null;
    currentSwipeX.current = 0;
    if (Math.abs(diff) > 60) navigateCrypto(diff < 0 ? 1 : -1);
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

  // Filter and deduplicate prices
  const validCryptoPrices = cryptoPrices
    .filter(crypto =>
      crypto && crypto.id && crypto.symbol &&
      crypto.current_price !== null && crypto.current_price !== undefined
    )
    .filter((crypto, index, self) =>
      index === self.findIndex(c => c.id === crypto.id ||
        (c.symbol.toLowerCase() === crypto.symbol.toLowerCase() && c.name.toLowerCase() === crypto.name.toLowerCase()))
    );

  const validStablePrices = stablePrices.filter(c => c && c.id && c.symbol && c.current_price != null);

  // Lazy-loaded slice — starts at 96, grows by 48 as user scrolls
  const displayedPrices = validCryptoPrices.slice(0, visibleCount);
  const hasMore = visibleCount < validCryptoPrices.length;

  const activeCategory = priceCategory;
  const dropdownLabel = {
    all: 'Market Cap', utility: 'Utility Coins', ai: 'AI Coins', meme: 'Meme Coins', stable: 'Stable Coins'
  }[activeCategory] || 'Market Cap';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-[#ffc93c] py-2">
          <div className="max-w-xs mx-auto px-4">
            <img src="/logo.png?v=2" alt="Kryptocurrent Logo" className="w-full h-10 object-contain" />
          </div>
        </div>

        {/* Prices Section */}
        <div ref={pricesRef} className="bg-slate-800/50 backdrop-blur rounded-xl px-4 pt-3 pb-4 mb-4">

          {/* ── Controls row ── */}
          <div className="flex items-center gap-2 mb-3">

            {/* Mobile only: dropdown */}
            <div className="relative flex-shrink-0 md:hidden" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(o => !o)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-xs transition whitespace-nowrap bg-[#ffc93c] text-black`}
              >
                {dropdownLabel}
                <ChevronDown size={12} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl min-w-[150px]" style={{ zIndex: 9999 }}>
                  {[
                    { key: 'all', label: 'Market Cap' },
                    { key: 'utility', label: 'Utility Coins' },
                    { key: 'ai', label: 'AI Coins' },
                    { key: 'meme', label: 'Meme Coins' },
                    { key: 'stable', label: 'Stable Coins' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setPriceCategory(key);
                        setSearchQuery('');
                        setSearchResults([]);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-700 transition first:rounded-t-lg last:rounded-b-lg ${activeCategory === key ? 'text-[#ffc93c]' : 'text-white'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop only: flat buttons for all categories */}
            <div className="hidden md:flex gap-1.5 flex-shrink-0 flex-wrap">
              {[
                { key: 'all', label: 'Market Cap' },
                { key: 'utility', label: 'Utility Coins' },
                { key: 'ai', label: 'AI Coins' },
                { key: 'meme', label: 'Meme Coins' },
                { key: 'stable', label: 'Stable Coins' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setPriceCategory(key); setSearchQuery(''); setSearchResults([]); }}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition whitespace-nowrap ${activeCategory === key ? 'bg-[#ffc93c] text-black' : 'bg-slate-700/50 text-white hover:bg-slate-700'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-shrink-0 ml-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-28 md:w-48 px-3 py-1.5 pl-8 pr-8 bg-slate-700/50 text-white rounded-lg border border-slate-600 focus:border-[#ffc93c] focus:outline-none focus:ring-2 focus:ring-[#ffc93c]/20 transition text-xs"
                />
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={13} />
                {isSearching && <RefreshCw className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#ffc93c] animate-spin" size={13} />}
                {!isSearching && searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setSearchResults([]); setPriceCategory('all'); }} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition" aria-label="Clear search">
                    <X size={13} />
                  </button>
                )}
              </div>
              {priceCategory === 'search' && searchResults.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">Found {searchResults.length} results</p>
              )}
            </div>
          </div>

          {/* ── Stable Coins section (shown when category = stable, or always on desktop as a separate block) ── */}
          {activeCategory === 'stable' ? (
            /* Full-page stable coins view */
            stableLoading ? (
              <div className="text-center py-8"><RefreshCw className="animate-spin mx-auto text-[#ffc93c]" size={28} /></div>
            ) : (
              <>
                <div className="md:hidden">
                  <div className="grid grid-cols-3 gap-2">
                    {validStablePrices.map((crypto, i) => (
                      <StableCard key={crypto.id} crypto={crypto} onClick={() => openChart(crypto, i)} />
                    ))}
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                    {validStablePrices.map((crypto, i) => (
                      <DesktopCard key={crypto.id} crypto={crypto} onClick={() => openChart(crypto, i)} />
                    ))}
                  </div>
                </div>
              </>
            )
          ) : (
            /* Normal price cards */
            <>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="animate-spin mx-auto mb-2 text-[#ffc93c]" size={32} />
                  <p className="text-gray-400">Loading prices...</p>
                </div>
              ) : (
                <>
                  {/* Mobile */}
                  <div className="md:hidden">
                    <div className="grid grid-cols-3 gap-2">
                      {displayedPrices.map((crypto, i) => (
                        <MobileCard key={crypto.id} crypto={crypto} onClick={() => openChart(crypto, i)} />
                      ))}
                    </div>
                    {hasMore && <div ref={sentinelRef} className="h-8 mt-2 flex items-center justify-center"><RefreshCw className="animate-spin text-[#ffc93c]/40" size={16} /></div>}
                  </div>

                  {/* Desktop */}
                  <div className="hidden md:block">
                    <div className="grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                      {displayedPrices.map((crypto, i) => (
                        <DesktopCard key={crypto.id} crypto={crypto} onClick={() => openChart(crypto, i)} />
                      ))}
                    </div>
                    {hasMore && <div ref={sentinelRef} className="h-8 mt-2 flex items-center justify-center"><RefreshCw className="animate-spin text-[#ffc93c]/40" size={16} /></div>}
                  </div>

                  {/* Desktop Stable Coins sub-section */}
                  {!stableLoading && validStablePrices.length > 0 && (
                    <div className="hidden md:block mt-6">
                      <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Stable Coins</h3>
                      <div className="grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                        {validStablePrices.map((crypto, i) => (
                          <DesktopCard key={crypto.id} crypto={crypto} onClick={() => openChart(crypto, i)} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Chart Modal with smooth swipe */}
      {selectedCrypto && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 z-50"
          onClick={closeChart}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[93vh] overflow-y-auto relative shadow-2xl"
            style={{
              transform: `translateX(${swipeOffset}px)`,
              transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
              willChange: 'transform',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Top bar: prev / close / next ── */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <button
                onClick={(e) => { e.stopPropagation(); navigateCrypto(-1); }}
                className="p-2 rounded-full bg-gray-100 hover:bg-[#ffc93c] transition"
                aria-label="Previous"
              >
                <ChevronLeft size={18} className="text-black" />
              </button>
              <button onClick={closeChart} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition">
                <X size={18} className="text-black" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigateCrypto(1); }}
                className="p-2 rounded-full bg-gray-100 hover:bg-[#ffc93c] transition"
                aria-label="Next"
              >
                <ChevronRight size={18} className="text-black" />
              </button>
            </div>

            <div className="px-5 pb-6">
              {/* ── Hero: logo + ticker + price ── */}
              <div className="flex flex-col items-center text-center mb-5">
                <img src={selectedCrypto.image} alt={selectedCrypto.name} className="w-20 h-20 rounded-full mb-3 shadow-lg" />
                <div className="text-3xl font-extrabold text-black tracking-tight leading-none">{selectedCrypto.symbol.toUpperCase()}</div>
                <div className="text-sm text-gray-500 font-medium mb-2">{selectedCrypto.name}</div>
                <div className="text-4xl font-extrabold text-black tracking-tight">
                  ${selectedCrypto.current_price >= 1000
                    ? selectedCrypto.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : selectedCrypto.current_price < 0.001
                    ? selectedCrypto.current_price.toFixed(6)
                    : selectedCrypto.current_price < 1
                    ? selectedCrypto.current_price.toFixed(4)
                    : selectedCrypto.current_price.toFixed(2)}
                </div>
                <div className={`flex items-center gap-1 text-base font-semibold mt-1 ${selectedCrypto.price_change_percentage_24h > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedCrypto.price_change_percentage_24h > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {selectedCrypto.price_change_percentage_24h > 0 ? '+' : ''}{Math.abs(selectedCrypto.price_change_percentage_24h).toFixed(2)}% (24h)
                </div>
              </div>

              {/* ── Chart timeframe buttons ── */}
              <div className="flex gap-1.5 mb-3 justify-center">
                {['1', '7', '30', '90', '365'].map((days) => (
                  <button
                    key={days}
                    onClick={() => changeChartTimeframe(days)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${chartTimeframe === days ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {days === '1' ? '24H' : days === '7' ? '7D' : days === '30' ? '30D' : days === '90' ? '90D' : '1Y'}
                  </button>
                ))}
              </div>

              {/* ── Price chart ── */}
              {chartLoading ? (
                <div className="flex items-center justify-center h-40">
                  <RefreshCw className="animate-spin text-gray-400" size={28} />
                </div>
              ) : (
                <div className="mb-5">
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={chartData}>
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#9ca3af' }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
                      <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: '#9ca3af' }} width={55} tickFormatter={(v) => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v.toFixed(2)}`} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#111', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                        formatter={(value) => [`$${value.toLocaleString()}`, 'Price']}
                      />
                      <Line type="monotone" dataKey="price" stroke="#000000" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* ── Stats grid: outlined boxes ── */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                <div className="border border-gray-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Market Cap</p>
                  <p className="text-base font-bold text-black">${(selectedCrypto.market_cap / 1e9).toFixed(2)}B</p>
                </div>
                <div className="border border-gray-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">In Circulation</p>
                  <p className="text-base font-bold text-black">
                    {selectedCrypto.circulating_supply
                      ? selectedCrypto.circulating_supply >= 1e9
                        ? (selectedCrypto.circulating_supply / 1e9).toFixed(2) + 'B'
                        : selectedCrypto.circulating_supply >= 1e6
                        ? (selectedCrypto.circulating_supply / 1e6).toFixed(2) + 'M'
                        : selectedCrypto.circulating_supply.toLocaleString('en-US', { maximumFractionDigits: 0 })
                      : '—'}
                  </p>
                </div>
                <div className="border border-gray-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">24h Volume</p>
                  <p className={`text-base font-bold ${selectedCrypto.price_change_percentage_24h > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${selectedCrypto.total_volume >= 1e9
                      ? (selectedCrypto.total_volume / 1e9).toFixed(2) + 'B'
                      : selectedCrypto.total_volume >= 1e6
                      ? (selectedCrypto.total_volume / 1e6).toFixed(2) + 'M'
                      : selectedCrypto.total_volume?.toLocaleString('en-US', { maximumFractionDigits: 0 }) ?? '—'}
                  </p>
                </div>
                <div className="border border-gray-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">All-Time High</p>
                  <p className="text-base font-bold text-black">${selectedCrypto.ath?.toLocaleString()}</p>
                </div>
              </div>

              {/* ── Info sections ── */}
              {tokenUtility[selectedCrypto.symbol.toUpperCase()] && (() => {
                const info = tokenUtility[selectedCrypto.symbol.toUpperCase()];
                return (
                  <div className="space-y-4">
                    {info.utility && (
                      <div>
                        <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Utility Use Case</h3>
                        <p className="text-sm text-gray-800 leading-relaxed">{info.utility}</p>
                      </div>
                    )}
                    {info.adoption && (
                      <div>
                        <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Key Adoption</h3>
                        <p className="text-sm text-gray-800 leading-relaxed">{info.adoption}</p>
                      </div>
                    )}
                    {info.partnerships && info.partnerships.length > 0 && (
                      <div>
                        <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Top Partnerships</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {info.partnerships.slice(0, 10).map((p, i) => (
                            <span key={i} className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">{p}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {info.founders && (
                      <div>
                        <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Founders / Creators</h3>
                        <p className="text-sm text-gray-800 leading-relaxed">{info.founders}</p>
                      </div>
                    )}
                    {info.backers && info.backers.length > 0 && (
                      <div>
                        <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Notable Backers & Investors</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {info.backers.map((b, i) => (
                            <span key={i} className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">{b}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {selectedCryptoIndex !== null && (
                <p className="text-center text-xs text-gray-300 mt-6 md:hidden">← swipe to navigate →</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Shared card sub-components ── */
function formatPrice(p) {
  if (p < 0.001) return p.toFixed(6);
  if (p < 1) return p.toFixed(4);
  if (p >= 1000) return p.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return p.toFixed(2);
}

function MobileCard({ crypto, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group bg-slate-700/50 rounded-xl p-2.5 hover:bg-slate-700 transition-all duration-200 cursor-pointer border border-transparent hover:border-[#ffc93c]/40 flex flex-col items-center text-center"
    >
      <img src={crypto.image} alt={crypto.name} className="w-10 h-10 rounded-full mb-1.5" loading="lazy" />
      <div className="font-bold text-sm group-hover:text-[#ffc93c] transition-colors mb-1">{crypto.symbol.toUpperCase()}</div>
      <div className="text-xs font-bold text-white mb-0.5">${formatPrice(crypto.current_price)}</div>
      <div className={`flex items-center gap-0.5 text-xs font-semibold ${crypto.price_change_percentage_24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
        {crypto.price_change_percentage_24h > 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
        {crypto.price_change_percentage_24h > 0 ? '+' : ''}{Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
      </div>
    </div>
  );
}

function StableCard({ crypto, onClick }) {
  return <MobileCard crypto={crypto} onClick={onClick} />;
}

function DesktopCard({ crypto, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group bg-slate-700/50 rounded-xl p-3 hover:bg-slate-700 transition-all duration-200 cursor-pointer border border-transparent hover:border-[#ffc93c]/40 hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#ffc93c]/10"
    >
      <div className="flex items-center gap-2 mb-2">
        <img src={crypto.image} alt={crypto.name} className="w-9 h-9 flex-shrink-0 rounded-full" loading="lazy" />
        <div className="min-w-0">
          <div className="font-bold text-sm truncate group-hover:text-[#ffc93c] transition-colors">{crypto.symbol.toUpperCase()}</div>
          <div className="text-gray-400 text-xs truncate leading-tight">{crypto.name}</div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs font-bold text-white whitespace-nowrap">${formatPrice(crypto.current_price)}</span>
        <span className={`flex items-center gap-0.5 text-xs font-semibold whitespace-nowrap ${crypto.price_change_percentage_24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {crypto.price_change_percentage_24h > 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
          {crypto.price_change_percentage_24h > 0 ? '+' : ''}{Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
        </span>
      </div>
    </div>
  );
}
