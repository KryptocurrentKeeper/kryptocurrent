import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, X, Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Known stablecoin / wrapped / yield-bearing token IDs — filtered from all non-stable views
const STABLECOIN_IDS = new Set([
  // ── USD Fiat-backed ──
  'tether','usd-coin','binance-usd','true-usd','pax-dollar','gemini-dollar',
  'paypal-usd','first-digital-usd','fdusd','usdd','eurc','usdb','usdx',
  'mountain-protocol-usdm','ondo-us-dollar-yield','ripple-usd','usde',
  'ethena-usde','usual-usd','resolv-usr','sky-usds','deusd','usual',
  'frax','liquity-usd','crvusd','susd','sfrxeth','usdy','usdm',
  'ageur','angle-protocol','bean','float-protocol','fei-usd','neutrino',
  'terra-usd','terrausd','tribe','mai','mimatic','mim','spell-token',
  'origin-dollar','ousd','dollar-on-chain','tbtc-token',
  // ── EUR / GBP / other fiat stables ──
  'stasis-eurs','tether-eurt','ageur','ceur','eure',
  // ── Commodity-backed ──
  'tether-gold','pax-gold','cache-gold','digix-gold','xaut','paxg',
  // ── Wrapped / Liquid-staked ETH ──
  'staked-ether','wrapped-steth','staked-frax-ether','rocket-pool-eth',
  'wrapped-ether','weth','coinbase-wrapped-staked-eth','wrapped-eeth',
  'kelp-dao-restaked-eth','renzo-restaked-eth','ether-fi-staked-eth',
  'mantle-staked-ether','liquid-staked-ethereum','lido-staked-ether',
  'frax-ether','ankr-staked-eth','stakewise-staked-eth','swell-staked-ether',
  'stader-staked-bnb','origin-ether','dinero','nodal-staked-eth',
  'bedrock-unieth','ether-fi','weeth','ezeth','rseth','oseth','meth',
  // ── Wrapped / Bridged BTC ──
  'wrapped-bitcoin','coinbase-wrapped-bitcoin','tbtc','sobtc',
  'renbtc','hbtc','btcb','sbtc','wbtc','cbbtc',
  // ── Restaking / Liquid restaking ──
  'eigenlayer','symbiotic','karak-network','puffer-finance','ion-protocol',
  // ── Yield-bearing / RWA stable derivatives ──
  'ondo-finance','ondo-us-dollar-yield','backed-ib01','sdai','savings-dai',
  'aave-v2','compound-coin',
]);

// Additional runtime filter: catch unknown stables by price proximity to $1 (±2%)
// and known stable naming patterns
const isLikelyStable = (coin) => {
  if (!coin) return false;
  if (STABLECOIN_IDS.has(coin.id)) return true;
  const p = coin.current_price;
  // Price within 2% of $1 with very low volatility = stable
  if (p && p > 0.96 && p < 1.04 && Math.abs(coin.price_change_percentage_24h ?? 0) < 0.5) return true;
  // Catch wrapped/staked naming patterns
  const id = (coin.id || '').toLowerCase();
  const sym = (coin.symbol || '').toLowerCase();
  if (/^w(btc|eth|bnb|avax|sol|matic)$/.test(sym)) return true;
  if (id.includes('wrapped') || id.includes('staked-') || id.includes('bridged')) return true;
  if (sym.startsWith('st') && id.includes('eth')) return true;
  return false;
};

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
  const [swipeExiting, setSwipeExiting] = useState(0); // -1 = exit left, 1 = exit right, 0 = none
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

  // Token utility information — covers Market Cap, Utility, AI, and Meme categories
  const tokenUtility = {
    // ── MARKET CAP / UTILITY COINS ──
    'BTC': {
      utility: 'Digital store of value and peer-to-peer payment network secured by proof-of-work mining',
      adoption: 'U.S. Strategic Bitcoin Reserve established 2025, 172+ corporate treasuries, Lightning Network processing millions of micropayments, spot Bitcoin ETFs holding $100B+',
      partnerships: ['BlackRock (IBIT ETF)', 'Fidelity (FBTC ETF)', 'MicroStrategy (treasury)', 'El Salvador (legal tender)', 'Lightning Network', 'JPMorgan (collateral)', 'Tesla', 'U.S. Federal Reserve pilots'],
      backers: ['MicroStrategy / Strategy', 'BlackRock', 'Fidelity', 'Marathon Digital', 'Tesla', 'Block (Square)'],
      founders: 'Satoshi Nakamoto (pseudonymous; identity unknown)'
    },
    'ETH': {
      utility: 'Programmable smart-contract platform powering DeFi, NFTs, stablecoins, and tokenized real-world assets',
      adoption: '$50B+ DeFi TVL, BlackRock BUIDL fund on-chain, Base and Arbitrum L2s processing millions of daily transactions, spot ETH ETFs approved in the U.S.',
      partnerships: ['JP Morgan (Onyx)', 'Microsoft (Azure integration)', 'BlackRock/BNY Mellon (BUIDL fund)', 'Visa (settlement)', 'Google Cloud', 'Consensys', 'EY', 'UBS', 'Standard Chartered'],
      backers: ['Ethereum Foundation', 'ConsenSys (Joseph Lubin)', 'BlackRock', 'Grayscale', 'Fidelity'],
      founders: 'Vitalik Buterin; co-founders Gavin Wood, Charles Hoskinson, Anthony Di Iorio, Joseph Lubin'
    },
    'BNB': {
      utility: 'Native token of the BNB Chain ecosystem — pays gas fees, funds DeFi on BSC, powers opBNB L2 and BNB Greenfield decentralized storage',
      adoption: 'BNB Chain hosts 1B+ total transactions, 30+ public companies hold BNB in treasury, Agoda and Mastercard integrations processing $27B in transactions, 21+ global regulatory licenses for Binance',
      partnerships: ['Mastercard (commerce integration)', 'Agoda (travel payments)', 'BBVA', 'Circle (USDC on BSC)', 'PancakeSwap (leading DEX)', 'YZi Labs', 'B Strategy treasury firm'],
      backers: ['Binance (Changpeng Zhao / Yi He)', 'YZi Labs', 'Windtree Therapeutics ($520M treasury)', 'B Strategy ($1B treasury)'],
      founders: 'Changpeng Zhao (CZ) and Yi He, co-founders of Binance; current CEO Richard Teng'
    },
    'SOL': {
      utility: 'High-throughput Layer-1 blockchain for DeFi, NFTs, consumer apps, and payments — 65,000+ TPS at sub-cent fees',
      adoption: 'Visa USDC settlement pilot, PayPal PYUSD deployment, top DEX volume globally, Solana Pay at retail merchants',
      partnerships: ['Visa (USDC settlement)', 'PayPal (PYUSD)', 'Shopify/Stripe', 'JP Morgan (bond tokenization)', 'Revolut', 'Chainlink', 'Google Cloud (validator)', 'Coinbase'],
      backers: ['Andreessen Horowitz (a16z)', 'Polychain Capital', 'Multicoin Capital', 'Jump Trading', 'FTX Ventures (historic)'],
      founders: 'Anatoly Yakovenko (with Raj Gokal and Greg Fitzgerald), Solana Labs'
    },
    'XRP': {
      utility: 'Global cross-border payment settlements and on-demand liquidity provisioning for financial institutions',
      adoption: 'Ripple ODL active in 70+ countries, $15B+ annual payment volume, 300+ bank and fintech partnerships, RLUSD stablecoin launched 2025',
      partnerships: ['SBI Holdings (RLUSD Japan)', 'BNY Mellon (RLUSD custody)', 'Mastercard/WebBank/Gemini', 'Mizuho Bank/SMBC Nikko', 'Archax (RWA tokenization)', 'Franklin Templeton', 'DBS Group', 'Modulr (UK/Europe)', 'AMINA Bank'],
      backers: ['Andreessen Horowitz (a16z)', 'Tetragon Financial', 'SBI Holdings', 'Pantera Capital', 'Fortress Investment Group'],
      founders: 'Jed McCaleb, Arthur Britto, David Schwartz, Chris Larsen (Ripple Labs)'
    },
    'DOGE': {
      utility: 'Peer-to-peer digital currency and tipping token; increasingly used for retail payments and social tipping on platforms like X',
      adoption: 'Accepted by Tesla merchandise, SpaceX mission funded with DOGE, AMC Theatres, Dallas Mavericks; billions in daily trading volume; Elon Musk advocacy drives mainstream awareness',
      partnerships: ['Tesla (merch payments)', 'SpaceX (DOGE-1 mission)', 'Dallas Mavericks', 'AMC Theatres', 'Newegg', 'Bitpay merchants'],
      backers: ['Elon Musk (public advocate)', 'Tesla', 'Mark Cuban (early supporter)', 'Retail community'],
      founders: 'Billy Markus and Jackson Palmer (created as a joke/meme in December 2013)'
    },
    'ADA': {
      utility: 'Proof-of-stake blockchain for identity, governance, and financial services in emerging markets; peer-reviewed academic approach',
      adoption: 'Ethiopian government student credential system for 5M+ students, World Mobile telecom connectivity, growing DeFi and stablecoin ecosystem via Chang upgrade',
      partnerships: ['Ethiopia Ministry of Education (credentials)', 'World Mobile (telecom)', 'Chainlink (oracles)', 'Google/Oracle (cloud)', 'Input Output Global (IOG)', 'EMURGO'],
      backers: ['Input Output Global (IOG)', 'EMURGO', 'Cardano Foundation', 'ICO community backers'],
      founders: 'Charles Hoskinson (co-founder of Ethereum; founded IOHK / Input Output Global)'
    },
    'AVAX': {
      utility: 'Modular Layer-1 with custom subnets for institutional DeFi, tokenized assets, and gaming applications',
      adoption: 'Citi, WisdomTree, and Deloitte RWA projects, MAS Project Guardian participation, $600M+ DeFi TVL, Evergreen subnet for institutional finance',
      partnerships: ['Citi/WisdomTree/Deloitte (RWAs)', 'JP Morgan Onyx', 'SMBC (stablecoins)', 'T. Rowe Price', 'SkyBridge Capital', 'AWS (cloud)', 'Galaxy Digital'],
      backers: ['Polychain Capital', 'Andreessen Horowitz', 'Galaxy Digital', 'Bain Capital Crypto', 'ParaFi Capital'],
      founders: 'Emin Gün Sirer (with Maofan Yin and Kevin Sekniqi), Cornell University researchers'
    },
    'TON': {
      utility: 'Blockchain integrated natively into Telegram for mass-market payments, mini-apps, and Web3 onboarding for Telegram\'s 900M+ users',
      adoption: 'Telegram wallet with millions of active users, TON Space wallet, growing DeFi and stablecoin ecosystem, Notcoin viral mini-app with 35M+ players',
      partnerships: ['Telegram (native integration)', 'Sequoia Capital / Benchmark ($400M raise)', 'Bitget/Kraken/OKX (exchanges)', 'Chainlink (oracles)', 'Tether (USDT on TON)'],
      backers: ['Sequoia Capital', 'Ribbit Capital', 'Benchmark', 'Pantera Capital', 'Vy Capital'],
      founders: 'Originally Nikolai Durov and Pavel Durov (Telegram); TON Foundation now community-led after Telegram handover'
    },
    'LINK': {
      utility: 'Decentralized oracle network connecting smart contracts to real-world data, enabling DeFi, RWAs, CCIP cross-chain messaging',
      adoption: '2,000+ blockchain integrations, SWIFT and DTCC institutional pilots, Cross-Chain Interoperability Protocol (CCIP) powering $1T+ in secured value',
      partnerships: ['SWIFT (pilot)', 'DTCC (fund tokenization)', 'Mastercard', 'Euroclear', 'Fidelity International', 'Deutsche Börse', 'SBI Group', 'GLEIF', 'ANZ Bank'],
      backers: ['Fundamental Labs', 'Nirvana Capital', 'Grayscale Chainlink Trust', 'Framework Ventures'],
      founders: 'Sergey Nazarov (with Steve Ellis); Chainlink Labs'
    },
    'SUI': {
      utility: 'High-performance Layer-1 blockchain optimized for gaming, NFTs, and DeFi using novel object-based Move programming language',
      adoption: 'DeepBook native DEX, Sui Name Service, growing gaming ecosystem, institutional ETPs from Grayscale and 21Shares, $1B+ DeFi TVL',
      partnerships: ['Google Cloud (validator)', 'Grayscale (ETP)', '21Shares (ETP)', 'BytePlus', 'ONE Championship', 'Circle (USDC native)'],
      backers: ['Andreessen Horowitz (a16z)', 'Binance Labs', 'Coinbase Ventures', 'Jump Crypto', 'Franklin Templeton'],
      founders: 'Evan Cheng, Sam Blackshear, Adeniyi Abiodun, George Danezis, Kostas Chalkias — Mysten Labs (ex-Meta/Diem team)'
    },
    'DOT': {
      utility: 'Heterogeneous multi-chain network enabling sovereign parachains to share security and communicate via XCM messaging protocol',
      adoption: '100+ connected parachains, JAM upgrade enabling smart contracts, RWA tokenization on Centrifuge, growing DeFi ecosystem on Hydration and Moonbeam',
      partnerships: ['Moonbeam (EVM parachain)', 'Acala (DeFi hub)', 'Centrifuge (RWAs)', 'Hydration (DEX)', 'Mythos (gaming)', 'Bifrost (liquid staking)'],
      backers: ['Web3 Foundation', 'Polychain Capital', 'Arrington XRP Capital', 'ICO community'],
      founders: 'Gavin Wood (Ethereum co-founder, invented Solidity); with Robert Habermeier and Peter Czaban — Web3 Foundation'
    },
    'TRX': {
      utility: 'High-throughput Layer-1 blockchain primarily used for USDT stablecoin transfers; powers decentralized applications and content platforms',
      adoption: 'Largest USDT network by volume (billions daily), JustLend DeFi protocol, TRON DAO Reserve backing, Sun.io ecosystem',
      partnerships: ['Tether (USDT on TRON)', 'Samsung Blockchain', 'Opera Browser', 'BitTorrent (acquired)', 'JustSwap DEX'],
      backers: ['TRON Foundation', 'Justin Sun personal investment', 'Binance (early supporter)'],
      founders: 'Justin Sun; TRON Foundation'
    },
    'NEAR': {
      utility: 'AI-native Layer-1 blockchain with account abstraction, chain signatures for multi-chain access, and NEAR AI agent framework',
      adoption: 'Chain Abstraction enabling access to all chains from one account, growing AI agent ecosystem, NEAR Intents for cross-chain swaps, Deutsche Telekom validator',
      partnerships: ['Google Cloud (validator/partner)', 'LayerZero (interop)', 'Deutsche Telekom (validator)', 'Frax Finance', 'Binance (launchpad)', 'Nansen Analytics'],
      backers: ['Andreessen Horowitz (a16z)', 'Pantera Capital', 'Dragonfly Capital', 'Tiger Global', 'Coinbase Ventures'],
      founders: 'Illia Polosukhin (ex-Google AI researcher) and Alexander Skidanov; NEAR Foundation'
    },
    'ICP': {
      utility: 'Decentralized cloud computing platform running smart contracts at web speed entirely on-chain, hosting dApps without traditional servers',
      adoption: 'OpenChat and DSCVR social apps fully on-chain, Chain Fusion connecting BTC/ETH/Solana natively, Caffeine AI no-code dApp builder',
      partnerships: ['DFINITY Foundation', 'Microsoft Azure (integration)', 'Google Cloud', 'SWIFT (pilot)', 'Chain Fusion (BTC/Solana/ETH)'],
      backers: ['Andreessen Horowitz (a16z)', 'Polychain Capital', 'Multicoin Capital', 'SV Angel', 'Amino Capital'],
      founders: 'Dominic Williams; DFINITY Foundation (Swiss non-profit)'
    },
    'KAS': {
      utility: 'Ultra-fast proof-of-work DAG (Directed Acyclic Graph) blockchain achieving 10 blocks per second for near-instant payments',
      adoption: 'Growing merchant adoption, Kaspa DeFi ecosystem emerging, Tangem and Ledger hardware wallet support, fair-launch community following',
      partnerships: ['WhiteBIT (exchange)', 'Tangem (hardware wallet)', 'Ledger (wallet support)', 'KuCoin/Binance (listings)', 'Zealous Swap (DeFi)'],
      backers: ['Fair-launched — no VC funding, no ICO, no premine; community-driven'],
      founders: 'Yonatan Sompolinsky (Hebrew University researcher who proposed the GHOSTDAG protocol)'
    },
    'XLM': {
      utility: 'Low-cost global payments and remittances with sub-second finality; CBDC infrastructure and cross-border stablecoin rails',
      adoption: 'MoneyGram On-Ramp integration, Circle USDC issued on Stellar, Ukraine CBDC pilot, Franklin Templeton money market fund on Stellar',
      partnerships: ['MoneyGram (on-ramp)', 'Circle (USDC issuer)', 'Mastercard', 'Franklin Templeton (BENJI fund)', 'Ukraine CBDC pilot', 'IBM', 'Wormhole (bridge)'],
      backers: ['Stripe (seed investor)', 'Circle', 'Stellar Development Foundation'],
      founders: 'Jed McCaleb (Ripple co-founder) with Joyce Kim; Stellar Development Foundation'
    },
    'HBAR': {
      utility: 'Enterprise-grade distributed ledger for tokenization, micropayments, and supply chain using hashgraph consensus (aBFT)',
      adoption: 'Governing Council includes Google, Boeing, IBM; 20B+ lifetime transactions, abrdn RWA tokenization, NATO DIANA dual-use program 2026',
      partnerships: ['Google', 'Boeing', 'IBM', 'abrdn (RWAs)', 'Standard Bank', 'Nairobi Securities Exchange', 'NATO DIANA', 'ServiceNow', 'Ubisoft'],
      backers: ['Google', 'Boeing', 'IBM', 'Deutsche Telekom', 'abrdn', 'LG Electronics'],
      founders: 'Dr. Leemon Baird (inventor of hashgraph) and Mance Harmon; Hedera Governing Council'
    },
    'VET': {
      utility: 'Enterprise blockchain for supply chain traceability, carbon credit management, and product lifecycle management with dual-token model',
      adoption: 'Walmart China food tracking, PwC/DNV supply chain audits, BMW carbon footprint tracking, DNV MyStory product authentication',
      partnerships: ['Walmart China', 'PwC', 'DNV (Det Norske Veritas)', 'BMW', 'DHL', 'Franklin Templeton/BitGo', 'Boston Consulting Group', 'Crypto.com'],
      backers: ['PwC', 'DNV', 'Breyer Capital', 'Enterprise-focused investors'],
      founders: 'Sunny Lu (former CIO of Louis Vuitton China); VeChain Foundation'
    },
    'POL': {
      utility: 'Ethereum scaling via AggLayer — aggregates ZK-proof L2 chains into unified liquidity, enabling near-zero-cost Ethereum transactions',
      adoption: 'Starbucks Odyssey NFT rewards, Nike .Swoosh, JPMorgan Onyx, Mastercard Polygon ID, 50,000+ dApps deployed',
      partnerships: ['Starbucks (Odyssey)', 'Nike (.Swoosh)', 'Adidas', 'JPMorgan Onyx', 'Mastercard (Polygon ID)', 'Stripe', 'Reliance Jio', 'Reddit (collectible avatars)'],
      backers: ['Sequoia Capital India', 'SoftBank Vision Fund', 'Tiger Global', 'Andreessen Horowitz', 'Binance Labs', 'Mark Cuban'],
      founders: 'Jaynti Kanani, Sandeep Nailwal, Anurag Arjun, Mihailo Bjelic; Polygon Labs'
    },
    'QNT': {
      utility: 'Enterprise blockchain interoperability via Overledger — connects legacy financial systems, banks, and multiple blockchains without a central hub',
      adoption: 'SWIFT BIS Innovation Office projects, LACChain CBDC infrastructure, UK government digital bond pilots, ECB digital euro consultation',
      partnerships: ['SWIFT/BIS (innovation projects)', 'ECB (digital euro)', 'Oracle', 'SIA (SWIFT messaging)', 'UK digital bonds', 'LACChain (LatAm CBDC)'],
      backers: ['Enterprise-funded; limited public VC disclosure'],
      founders: 'Gilbert Verdian (cybersecurity executive, former UK NHS and Australian government)'
    },
    'ALGO': {
      utility: 'Pure proof-of-stake blockchain for CBDCs, institutional finance, and digital identity with sub-4-second finality and carbon-negative status',
      adoption: 'Marshall Islands national digital currency (SOV), SIA Italian payments infrastructure, Lofty.ai real estate tokenization, ISDA derivatives pilot',
      partnerships: ['Marshall Islands (SOV currency)', 'SIA (payments)', 'ISDA (derivatives)', 'Wormhole (bridge)', 'Google (Agent Payments)', 'Paxos/Ondo (RWAs)', 'FIFA (NFTs)'],
      backers: ['Union Square Ventures', 'Pillar VC', 'Arrington XRP Capital', 'ICO backers', 'Algorand Foundation'],
      founders: 'Silvio Micali (MIT professor, Turing Award winner for cryptography)'
    },
    'XTZ': {
      utility: 'Self-amending proof-of-stake blockchain with on-chain governance; widely used for institutional NFTs and formal verification of smart contracts',
      adoption: 'Societe Generale digital bond issuance, Ubisoft NFT collectibles, Manchester United and Red Bull Racing partnerships, ArtBasel art tokenization',
      partnerships: ['Societe Generale (bond issuance)', 'Ubisoft (NFTs)', 'Manchester United', 'Red Bull Racing', 'ArtBasel', 'Interpop', 'McLaren Racing'],
      backers: ['Tim Draper', 'Polychain Capital', 'Tezos Foundation (ICO $232M)', 'Animoca Brands'],
      founders: 'Arthur Breitman and Kathleen Breitman; Tezos Foundation (Swiss)'
    },
    'XDC': {
      utility: 'Hybrid enterprise blockchain optimized for trade finance, supply chain, and cross-border payments; interoperable with ISO 20022 financial messaging',
      adoption: 'TradeFinex trade finance platform, R3 Corda integration, USDC native on XDC, SIX Swiss Exchange integration for tokenized securities',
      partnerships: ['SBI Japan', 'R3 Corda', 'Contour (trade finance)', 'VERT Capital', 'SIX Swiss Exchange', 'Ankr', 'Globacap'],
      backers: ['LDA Capital', 'XinFin enterprise investors', 'XDC Foundation'],
      founders: 'Ritesh Kakkad and Atul Khekade; XinFin Network / XDC Foundation'
    },
    'ATOM': {
      utility: 'Hub-and-spoke interoperability layer connecting sovereign blockchains via IBC protocol; ATOM secures the Cosmos Hub',
      adoption: 'Noble USDC (multi-billion USDC on IBC), dYdX v4 live on Cosmos, 100+ IBC-connected chains, Osmosis leading IBC DEX',
      partnerships: ['Noble (USDC on IBC)', 'dYdX v4 (derivatives)', 'Osmosis (DEX)', 'Axelar (bridge)', 'Stride (liquid staking)', 'Interchain Foundation'],
      backers: ['Interchain Foundation', 'All In Bits (Tendermint)', 'ICO community', 'Paradigm (Osmosis)'],
      founders: 'Jae Kwon (inventor of Tendermint BFT) and Ethan Buchman; Interchain Foundation'
    },
    // ── AI COINS ──
    'TAO': {
      utility: 'Decentralized marketplace for machine learning models — contributors train and serve AI across 128 specialized subnets and earn TAO based on output quality',
      adoption: 'First physically-backed TAO ETP on SIX Swiss Exchange (Deutsche Digital Assets/Safello, Nov 2025), Bitcoin-style halving in Dec 2025, 9.6M TAO in circulation, Grayscale Form 10 filing for Bittensor Trust',
      partnerships: ['Grayscale (Trust filing)', 'Deutsche Digital Assets (ETP)', 'Safello (ETP)', 'SIX Swiss Exchange', 'Chainlink (interoperability)', 'General TAO Ventures'],
      backers: ['Polychain Capital ($200M+)', 'Digital Currency Group', 'dao5', 'Pantera Capital', 'Foundry Digital'],
      founders: 'Jacob Robert Steeves (ex-Google engineer) and Ala Shaabana (ex-University of Toronto); OpenTensor Foundation'
    },
    'RNDR': {
      utility: 'Decentralized GPU rendering and AI compute marketplace connecting creators needing processing power with idle GPU operators worldwide',
      adoption: 'Major film studios and VFX houses using distributed rendering, expansion into AI inference workloads, Render Compute (Dispersed) subnet launched mid-2025, available on Coinbase in Germany (Oct 2025)',
      partnerships: ['NVIDIA (hardware integration)', 'Apple (Metal rendering support)', 'Otoy (founding company)', 'Solana (network migration)', 'Coinbase (listing)', 'Grayscale'],
      backers: ['Multicoin Capital', 'Alameda Research (historic)', 'Animoca Brands', 'Andreessen Horowitz', 'Coinbase Ventures'],
      founders: 'Jules Urbach (CEO of OTOY Inc.) and Brendan Eich (creator of JavaScript, co-founder of Mozilla); Render Foundation'
    },
    'FET': {
      utility: 'Decentralized AI platform for deploying autonomous economic agents (AEAs) that negotiate, transact, and execute tasks in supply chain, energy, mobility, and DeFi',
      adoption: 'Merged into Artificial Superintelligence Alliance (ASI) with SingularityNET and Ocean Protocol, autonomous parking systems in Cambridge, energy-grid optimization deployments, DeltaV AI agent platform',
      partnerships: ['SingularityNET (ASI Alliance)', 'Ocean Protocol (ASI Alliance)', 'Bosch (IoT agents)', 'Deutsche Telekom', 'Datarella', 'BMW (mobility agents)'],
      backers: ['Binance Launchpad (IEO 2019)', 'Outlier Ventures', 'Lemniscap', 'Hashed', 'DFG (Digital Finance Group)'],
      founders: 'Humayun Sheikh (CEO), Toby Simpson (COO), Thomas Hain (CTO); Fetch.ai Ltd (Cambridge, UK)'
    },
    'WLD': {
      utility: 'Global proof-of-humanity identity protocol using iris-scanning orbs to issue World IDs, enabling Sybil-resistant access to AI services and UBI distributions',
      adoption: '10M+ verified users across 160+ countries, World ID integrated into Minecraft, Reddit, Shopify, and OpenAI tools; pilot universal basic income distributions in multiple countries',
      partnerships: ['OpenAI (co-founder Sam Altman)', 'Shopify (World ID merchant verification)', 'Reddit (identity)', 'Minecraft', 'Okta', 'Match Group'],
      backers: ['Andreessen Horowitz (a16z)', 'Khosla Ventures', 'Reid Hoffman', 'Sam Altman (OpenAI CEO)', 'Tiger Global', 'Coinbase Ventures'],
      founders: 'Sam Altman (OpenAI CEO) and Alex Blania; Tools for Humanity'
    },
    'GRT': {
      utility: 'Decentralized indexing protocol for querying blockchain data — the "Google of blockchains" enabling fast GraphQL queries for dApps',
      adoption: '70B+ queries served monthly across Ethereum, Polygon, Arbitrum, Solana and 40+ networks; used by Uniswap, Aave, Compound, and hundreds of major DeFi protocols',
      partnerships: ['Uniswap (primary user)', 'Aave', 'Compound', 'Decentraland', 'Gnosis', 'Livepeer', 'Balancer', 'Synthetix'],
      backers: ['Multicoin Capital', 'ParaFi Capital', 'Coinbase Ventures', 'Digital Currency Group', 'Framework Ventures'],
      founders: 'Yaniv Tal, Jannis Pohlmann, Brandon Ramirez; Edge & Node'
    },
    'FIL': {
      utility: 'Decentralized storage network where users rent spare hard drive capacity in exchange for FIL tokens — a decentralized alternative to AWS S3',
      adoption: 'Over 10 exabytes of storage capacity onboarded, partnerships with Internet Archive and USC Shoah Foundation for data preservation, used by NFT platforms and Web3 projects',
      partnerships: ['Internet Archive (data preservation)', 'USC Shoah Foundation', 'Protocol Labs', 'Filecoin Foundation', 'Textile', 'Pinata', 'Estuary'],
      backers: ['Andreessen Horowitz (a16z)', 'Sequoia Capital', 'Union Square Ventures', 'Y Combinator', 'Winklevoss Capital'],
      founders: 'Juan Benet; Protocol Labs (also created IPFS)'
    },
    'INJ': {
      utility: 'Layer-1 blockchain purpose-built for decentralized finance — orderbook DEX infrastructure, derivatives, prediction markets, and on-chain RWAs',
      adoption: 'Helix decentralized derivatives exchange, growing institutional RWA tokenization, $500M+ TVL, cross-chain DeFi hub connecting Ethereum, Cosmos, and Solana',
      partnerships: ['Helix Exchange (native DEX)', 'Google Cloud', 'Wormhole', 'LayerZero', 'Jump Crypto', 'Pantera Capital', 'Binance Labs'],
      backers: ['Binance Labs', 'Pantera Capital', 'Jump Crypto', 'Mark Cuban', 'Hashed'],
      founders: 'Eric Chen and Albert Chon; Injective Labs'
    },
    'VIRTUAL': {
      utility: 'Launchpad and tokenization protocol for AI agents — enables creation, deployment, and monetization of autonomous AI agents on Base/Ethereum',
      adoption: 'Largest AI agent launchpad by TVL, hundreds of AI agents tokenized including AIXBT (crypto analyst) and Luna, 100M+ agent interactions monthly',
      partnerships: ['Coinbase Base (native L2)', 'Binance (listing)', 'OKX', 'ai16z (ecosystem)', 'ElizaOS framework'],
      backers: ['Pantera Capital', 'Hack VC', 'Coinbase Ventures', 'Spartan Group', 'Mechanism Capital'],
      founders: 'Jansen Teng and team; Virtuals Protocol'
    },
    'RENDER': {
      utility: 'Decentralized GPU rendering and AI compute marketplace — same as RNDR (rebranded to RENDER on Solana migration)',
      adoption: 'Distributed 3D rendering for film/VFX studios, AI inference subnet (Dispersed) launched 2025, deep integration with creative software tools',
      partnerships: ['NVIDIA', 'Apple', 'Otoy (founding company)', 'Solana Foundation', 'Coinbase'],
      backers: ['Multicoin Capital', 'Animoca Brands', 'Andreessen Horowitz', 'Coinbase Ventures'],
      founders: 'Jules Urbach (OTOY CEO) and Brendan Eich (JavaScript creator, Mozilla co-founder)'
    },
    'AIOZ': {
      utility: 'Decentralized AI and media streaming network — distributed AI training, video transcoding, and CDN using idle computing resources worldwide',
      adoption: 'AI training workloads for enterprises, video streaming CDN used by media companies, growing node network with thousands of contributors globally',
      partnerships: ['AIOZ Foundation', 'Binance (listing)', 'Bybit', 'Gate.io'],
      backers: ['AIOZ Foundation', 'Community-funded'],
      founders: 'AIOZ Network team; Singapore-based'
    },
    // ── MEME COINS ──
    'SHIB': {
      utility: 'Ethereum-based meme token with expanding ecosystem including ShibaSwap DEX, Shibarium Layer-2 network, and Shib: The Metaverse virtual world',
      adoption: 'Listed on Robinhood and all major exchanges, 1M+ wallet holders, Shibarium processing millions of transactions, active token burn mechanism reducing supply',
      partnerships: ['Welly\'s (fast food chain)', 'Shiba Inu x Margaritaville (metaverse)', 'Unification (Shibarium validators)', 'AMC Theatres', 'Binance (listing)'],
      backers: ['Community-driven; no institutional VC', 'Vitalik Buterin received 50% of supply (donated/burned most)'],
      founders: 'Ryoshi (anonymous; identity unknown); Shiba Inu community-led'
    },
    'PEPE': {
      utility: 'Pure community-driven meme coin based on the iconic "Pepe the Frog" internet character; no formal roadmap or utility beyond speculative value and culture',
      adoption: 'Reached $1B+ market cap within weeks of launch (2023), listed on Binance, OKX, and all major exchanges, billions in daily trading volume during peaks',
      partnerships: ['Binance (listing)', 'OKX', 'Coinbase', 'Community-organized promotions'],
      backers: ['No institutional backers; 100% community-driven'],
      founders: 'Anonymous team launched in April 2023; inspired by Matt Furie\'s "Pepe the Frog" character (2005)'
    },
    'BONK': {
      utility: 'First major Solana-native meme coin; community utility token used across 350+ DeFi, NFT, and gaming integrations on Solana',
      adoption: 'Airdropped to Solana NFT holders and traders Dec 2022 reviving ecosystem, BonkDAO governs initiatives, BURNmas event burned 1.69T BONK (Dec 2024), deep DEX liquidity on Raydium and Orca',
      partnerships: ['Solana Foundation (ecosystem support)', 'Raydium DEX', 'Orca DEX', 'Jupiter Aggregator', 'BonkBot (Telegram trading bot)', 'Coinbase (listing)'],
      backers: ['Community airdrop — no VC funding or presale; fair launch'],
      founders: 'Anonymous core contributors; BonkDAO community governance'
    },
    'WIF': {
      utility: 'Pure Solana-native meme coin featuring a Shiba Inu dog with a hat; no utility claims — value driven entirely by community and meme culture',
      adoption: 'Listed on Binance, Coinbase, and all major exchanges (2024), reached $4.83 ATH (March 2024), consistently top Solana DEX volume, Vegas sphere advertisement funded by community',
      partnerships: ['Binance (March 2024 listing)', 'Coinbase', 'Las Vegas Sphere (community-funded ad campaign)'],
      backers: ['No institutional backers; 100% community-driven'],
      founders: 'Anonymous developer launched November 2023 on Solana; no official team or roadmap'
    },
    'FLOKI': {
      utility: 'Meme coin with expanding DeFi ecosystem including Valhalla P2E metaverse game, FlokiFi Locker, and TokenFi token creation platform',
      adoption: 'Aggressive global marketing campaign (London buses, Singapore MRT ads), Valhalla metaverse game beta live, hundreds of thousands of community members, TokenFi enabling no-code token launches',
      partnerships: ['Binance (listing)', 'OKX', 'Bitmain (mining support)', 'Various sports sponsorships', 'TokenFi (sister project)'],
      backers: ['Community-driven', 'Elon Musk dog name inspiration drove initial viral growth'],
      founders: 'FLOKI core team (pseudonymous); named after Elon Musk\'s Shiba Inu dog'
    },
    'TRUMP': {
      utility: 'Political meme coin launched by Donald Trump; official merchandise and community token with no formal utility infrastructure',
      adoption: 'Launched January 2025 days before Trump inauguration; briefly reached $70+ price, $12B+ market cap at peak, listed on major exchanges immediately',
      partnerships: ['Official Trump team launch', 'Coinbase', 'Binance', 'Major centralized exchanges'],
      backers: ['Trump Organization affiliated launch', 'Retail community speculation'],
      founders: 'Donald J. Trump and associated team; launched via trump.meme official website'
    },
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
            if (category === 'ai') filteredData = retryData.filter(coin => coin.id !== 'chainlink' && !isLikelyStable(coin));
            else if (category === 'all' || category === 'meme') filteredData = retryData.filter(coin => !isLikelyStable(coin));
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
          filteredData = data.filter(coin => coin.id !== 'chainlink' && !isLikelyStable(coin));
        } else if (category === 'meme') {
          filteredData = data.filter(coin => !isLikelyStable(coin));
        } else if (category === 'all') {
          filteredData = data.filter(coin => !isLikelyStable(coin));
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

  const fetchChartData = async (coinId, timeframe = '7d') => {
    setChartLoading(true);
    try {
      // Map timeframe key to CoinGecko params
      const params = {
        '1h':  { days: '1',    interval: 'minutely' },
        '1d':  { days: '1',    interval: 'hourly'   },
        '1w':  { days: '7',    interval: 'daily'    },
        '1m':  { days: '30',   interval: 'daily'    },
        '1y':  { days: '365',  interval: 'daily'    },
        '5y':  { days: '1825', interval: 'weekly'   },
      };
      const { days, interval } = params[timeframe] || params['1w'];
      const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}${interval !== 'daily' ? `&interval=${interval}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      const formattedData = data.prices.map(([timestamp, price]) => {
        const d = new Date(timestamp);
        let label;
        if (timeframe === '1h') label = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        else if (timeframe === '1d') label = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        else if (timeframe === '5y') label = d.toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
        else label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return { time: label, price };
      });
      setChartData(formattedData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setChartLoading(false);
    }
  };

  const openChart = async (crypto, index) => {
    setSelectedCrypto(crypto);
    setSelectedCryptoIndex(index ?? null);
    setChartTimeframe('1w');
    setSwipeOffset(0);
    setSwipeExiting(0);
    fetchChartData(crypto.id, '1w');
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

  const changeChartTimeframe = (tf) => {
    setChartTimeframe(tf);
    fetchChartData(selectedCrypto.id, tf);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    currentSwipeX.current = 0;
    setIsSwiping(true);
    setSwipeExiting(0);
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
    touchStartX.current = null;
    currentSwipeX.current = 0;
    if (Math.abs(diff) > 60) {
      const direction = diff < 0 ? 1 : -1;
      const screenWidth = window.innerWidth;
      // Animate card flying off screen
      setSwipeExiting(diff < 0 ? -1 : 1);
      setSwipeOffset(diff < 0 ? -screenWidth : screenWidth);
      setTimeout(() => {
        navigateCrypto(direction);
      }, 280);
    } else {
      // Spring back to center
      setSwipeOffset(0);
    }
  };

  const navigateCrypto = (direction) => {
    if (selectedCryptoIndex === null) return;
    const list = priceCategory === 'stable' ? validStablePrices : displayedPrices;
    const newIndex = selectedCryptoIndex + direction;
    if (newIndex < 0 || newIndex >= list.length) return;
    openChart(list[newIndex], newIndex);
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
      crypto.current_price !== null && crypto.current_price !== undefined &&
      !isLikelyStable(crypto)
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
          style={{ overflow: 'hidden' }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[93vh] overflow-y-auto relative shadow-2xl"
            style={{
              transform: `translateX(${swipeOffset}px)`,
              transition: isSwiping ? 'none' : 'transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94)',
              willChange: 'transform',
              touchAction: 'pan-y',
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
                {[
                  { key: '1h', label: '1H' },
                  { key: '1d', label: '1D' },
                  { key: '1w', label: '1W' },
                  { key: '1m', label: '1M' },
                  { key: '1y', label: '1Y' },
                  { key: '5y', label: '5Y' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => changeChartTimeframe(key)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${chartTimeframe === key ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {label}
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
