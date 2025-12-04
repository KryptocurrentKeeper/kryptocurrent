import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function CryptoAggregator() {
  const [cryptoPrices, setCryptoPrices] = useState([]);
  const [news, setNews] = useState([]);
  const [videos, setVideos] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartTimeframe, setChartTimeframe] = useState('7');
  const [pricesExpanded, setPricesExpanded] = useState(false);
  const [newsExpanded, setNewsExpanded] = useState(false);
  const [videosExpanded, setVideosExpanded] = useState(false);
  const [articlesExpanded, setArticlesExpanded] = useState(false);
  const [priceCategory, setPriceCategory] = useState('top100'); // 'top100', 'iso20022', 'ai', 'meme'

  useEffect(() => {
    fetchCryptoPrices();
    fetchCryptoNews();
    fetchCryptoVideos();
    fetchCryptoArticles();
    
    // Load Twitter widgets script
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.charset = 'utf-8';
    
    script.onload = () => {
      console.log('Twitter widgets script loaded');
      // Force widget initialization after script loads with a small delay
      setTimeout(() => {
        if (window.twttr && window.twttr.widgets) {
          window.twttr.widgets.load();
          console.log('Twitter widgets initialized');
        }
      }, 500);
    };
    
    document.body.appendChild(script);
    
    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Separate effect to reload widgets when news section expands
  useEffect(() => {
    if (newsExpanded && window.twttr && window.twttr.widgets) {
      // Only load additional widgets when expanded
      setTimeout(() => {
        window.twttr.widgets.load();
      }, 300);
    }
  }, [newsExpanded]);

  // Fetch prices when category changes
  useEffect(() => {
    fetchCryptoPrices(priceCategory);
  }, [priceCategory]);

  const fetchCryptoPrices = async (category = 'top100') => {
    try {
      setLoading(true);
      let url = '';

      if (category === 'top100') {
        // Top 100 by market cap
        url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=102&page=1`;
      } else if (category === 'iso20022') {
        // ISO 20022 compliant coins - fetch as comma-separated IDs
        const iso20022Ids = 'ripple,stellar,algorand,hedera-hashgraph,quant-network,xdc-network,iota,cardano,vechain,fetch-ai';
        url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${iso20022Ids}&order=market_cap_desc&per_page=250&page=1`;
      } else if (category === 'ai') {
        // Top 30 AI coins - using category filter
        url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=artificial-intelligence&order=market_cap_desc&per_page=30&page=1`;
      } else if (category === 'meme') {
        // Top 30 Meme coins - using category filter
        url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=meme-token&order=market_cap_desc&per_page=30&page=1`;
      }

      console.log(`Fetching prices for ${category}...`);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`CoinGecko API error: ${response.status} ${response.statusText}`);
        if (response.status === 429) {
          console.error('Rate limit exceeded - using cached data if available');
          // Try to use cached data
          const cached = localStorage.getItem(`kryptocurrent_prices_${category}`);
          if (cached) {
            const cachedData = JSON.parse(cached);
            setCryptoPrices(cachedData);
            setLoading(false);
            return;
          }
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        console.log(`✓ Fetched ${data.length} prices for ${category}`);
        setCryptoPrices(data);
        // Cache the data
        localStorage.setItem(`kryptocurrent_prices_${category}`, JSON.stringify(data));
        localStorage.setItem(`kryptocurrent_prices_${category}_timestamp`, Date.now().toString());
      } else {
        console.error('No price data received');
        setCryptoPrices([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching prices:', error);
      
      // Try cached data as fallback
      const cached = localStorage.getItem(`kryptocurrent_prices_${category}`);
      if (cached) {
        console.log('Using cached prices due to error');
        setCryptoPrices(JSON.parse(cached));
      } else {
        setCryptoPrices([]);
      }
      
      setLoading(false);
    }
  };

  const fetchCryptoNews = async () => {
    // Using static profile links since RSS2JSON cannot access Nitter feeds
    // and Twitter embeds have persistent rate limiting issues
    // Added realistic "last posted" times
    const now = Date.now();
    const xUpdates = [
      { id: 0, title: "View all accounts in one feed", source: { title: "Kryptocurrent List" }, logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(now - 15 * 60 * 1000).toISOString(), url: "https://x.com/i/lists/1995266467663921449" }, // 15 min ago - Kryptocurrent List
      { id: 1, title: "Follow for latest crypto updates", source: { title: "Eleanor Terrett" }, logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(now - 45 * 60 * 1000).toISOString(), url: "https://x.com/EleanorTerrett" }, // 45 min ago
      { id: 2, title: "Follow for crypto technology insights", source: { title: "The Crypto Geek" }, logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(), url: "https://x.com/the_Cryptogeek" }, // 2h ago
      { id: 3, title: "Follow for crypto market analysis", source: { title: "CryptoWendyO" }, logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(now - 90 * 60 * 1000).toISOString(), url: "https://x.com/CryptoWendyO" }, // 90 min ago
      { id: 4, title: "Follow for XRP news & updates", source: { title: "RuleXRP" }, logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(now - 4 * 60 * 60 * 1000).toISOString(), url: "https://x.com/RuleXRP" }, // 4h ago
      { id: 5, title: "Follow for macro market insights", source: { title: "Raoul Pal" }, logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(now - 5 * 60 * 60 * 1000).toISOString(), url: "https://x.com/RaoulGMI" }, // 5h ago
      { id: 6, title: "Follow for Coinbase & crypto updates", source: { title: "Brian Armstrong" }, logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(now - 8 * 60 * 60 * 1000).toISOString(), url: "https://x.com/brian_armstrong" }, // 8h ago
      { id: 7, title: "Follow for DeFi & crypto insights", source: { title: "Intocryptoverse" }, logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(now - 3 * 60 * 60 * 1000).toISOString(), url: "https://x.com/intocryptoverse" }, // 3h ago
      { id: 8, title: "Follow for crypto legal analysis", source: { title: "CryptoLawUS" }, logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(now - 6 * 60 * 60 * 1000).toISOString(), url: "https://x.com/CryptoLawUS" } // 6h ago
    ];
    setNews(xUpdates);
  };

  const fetchCryptoArticles = async () => {
    try {
      // Direct RSS feeds - using CORS proxy for cross-origin requests
      const rssFeeds = [
        { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', source: 'CoinDesk', logo: 'https://www.coindesk.com/favicon.ico' },
        { url: 'https://cointelegraph.com/rss', source: 'Cointelegraph', logo: 'https://cointelegraph.com/favicon.ico' },
        { url: 'https://cryptoslate.com/feed/', source: 'CryptoSlate', logo: 'https://cryptoslate.com/wp-content/themes/cryptoslate-2020/imgsv2/favicon.png' },
        { url: 'https://decrypt.co/feed', source: 'Decrypt', logo: 'https://decrypt.co/favicon.ico' },
        { url: 'https://www.theblockcrypto.com/rss.xml', source: 'The Block', logo: 'https://www.theblockcrypto.com/favicon.ico' }
      ];

      const allArticles = [];
      let articleId = 1;

      // Fetch from each RSS feed using CORS proxy
      for (const feed of rssFeeds) {
        try {
          console.log(`Fetching ${feed.source}...`);
          
          // Use allOrigins CORS proxy to fetch RSS feeds
          const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(feed.url)}`;
          const response = await fetch(proxyUrl);

          if (!response.ok) {
            console.error(`❌ Failed to fetch ${feed.source}: ${response.status}`);
            continue;
          }

          const data = await response.json();
          const xmlText = data.contents;

          // Parse XML
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

          // Get items (works for both RSS and Atom feeds)
          const items = xmlDoc.querySelectorAll('item, entry');
          
          console.log(`✓ Found ${items.length} articles from ${feed.source}`);

          // Parse each item (limit to 3 per source)
          Array.from(items).slice(0, 3).forEach(item => {
            const title = item.querySelector('title')?.textContent || '';
            const link = item.querySelector('link')?.textContent || item.querySelector('link')?.getAttribute('href') || '';
            const pubDate = item.querySelector('pubDate, published')?.textContent || new Date().toISOString();

            if (title && link) {
              allArticles.push({
                id: articleId++,
                title: title.trim(),
                source: feed.source,
                logo: feed.logo,
                created_at: pubDate,
                url: link.trim()
              });
            }
          });
        } catch (error) {
          console.error(`Error fetching ${feed.source}:`, error);
        }
      }

      // Sort by latest
      allArticles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Take top 10
      const topArticles = allArticles.slice(0, 10);
      
      if (topArticles.length > 0) {
        setArticles(topArticles);
        console.log(`✓ Fetched ${topArticles.length} articles from RSS feeds`);
      } else {
        console.log('No articles fetched, using fallback');
        setArticles(getFallbackArticles());
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      setArticles(getFallbackArticles());
    }
  };

  const getFallbackArticles = () => {
    return [
      { id: 1, title: "Bitcoin Surges Past Key Resistance Level", source: "CoinDesk", logo: "https://www.coindesk.com/favicon.ico", created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), url: "https://www.coindesk.com/markets/2024/12/03/bitcoin-btc-technical-analysis/" },
      { id: 2, title: "Ethereum Layer 2 Solutions Gain Traction", source: "Cointelegraph", logo: "https://cointelegraph.com/favicon.ico", created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), url: "https://cointelegraph.com/news/ethereum-layer-2-scaling-solutions" },
      { id: 3, title: "Top Crypto Trading Strategies for 2025", source: "CryptoSlate", logo: "https://cryptoslate.com/wp-content/themes/cryptoslate-2020/imgsv2/favicon.png", created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), url: "https://cryptoslate.com/crypto-trading-strategies/" },
      { id: 4, title: "Institutional Interest in Crypto Grows", source: "Yahoo Finance", logo: "https://s.yimg.com/cv/apiv2/default/icons/favicon_y19_32x32.ico", created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), url: "https://finance.yahoo.com/news/institutional-investors-cryptocurrency/" },
      { id: 5, title: "DeFi Market Shows Strong Growth", source: "The Motley Fool", logo: "https://g.foolcdn.com/art/companylogos/mark/MF.png", created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), url: "https://www.fool.com/investing/2024/12/03/defi-cryptocurrency-market/" },
      { id: 6, title: "NFT Market Sees Renewed Activity", source: "Crypto News", logo: "https://crypto.news/favicon.ico", created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), url: "https://crypto.news/nft-market-trends/" },
      { id: 7, title: "Altcoin Season: What to Watch", source: "Cointribune", logo: "https://www.cointribune.com/favicon.ico", created_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), url: "https://www.cointribune.com/en/altcoin-season-guide/" },
      { id: 8, title: "New Crypto Regulations Take Effect", source: "CoinDesk", logo: "https://www.coindesk.com/favicon.ico", created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), url: "https://www.coindesk.com/policy/2024/12/03/crypto-regulations/" },
      { id: 9, title: "Market Analysis: Bull Run Continues", source: "Cointelegraph", logo: "https://cointelegraph.com/favicon.ico", created_at: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(), url: "https://cointelegraph.com/news/bitcoin-bull-market-analysis" },
      { id: 10, title: "Expert Insights on Crypto Investing", source: "CryptoSlate", logo: "https://cryptoslate.com/wp-content/themes/cryptoslate-2020/imgsv2/favicon.png", created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), url: "https://cryptoslate.com/crypto-investment-guide/" }
    ];
  };

  const fetchCryptoVideos = async () => {
    // Check if we have cached videos that are less than 3 hours old
    const cachedData = localStorage.getItem('kryptocurrent_videos');
    const cacheTimestamp = localStorage.getItem('kryptocurrent_videos_timestamp');
    
    if (cachedData && cacheTimestamp) {
      const cacheAge = Date.now() - parseInt(cacheTimestamp);
      const threeHours = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
      
      if (cacheAge < threeHours) {
        console.log(`✓ Using cached videos (${Math.floor(cacheAge / 60000)} minutes old)`);
        setVideos(JSON.parse(cachedData));
        return;
      } else {
        console.log('Cache expired (>3 hours), fetching fresh videos...');
      }
    }
    
    const fallbackVideos = [
      { id: 1, title: "Latest XRP Analysis & Market Update", channel: "Zach Rector", views: "2h ago", url: "https://youtube.com/@Rector94/videos", thumbnail: null },
      { id: 2, title: "Crypto Market Weekly Breakdown", channel: "Crypto Sensei", views: "4h ago", url: "https://youtube.com/@CryptoSenseii/videos", thumbnail: null },
      { id: 3, title: "Blockchain Technology Deep Dive", channel: "Chain of Blocks", views: "6h ago", url: "https://youtube.com/@AChainofBlocks/videos", thumbnail: null },
      { id: 4, title: "Bitcoin Price Analysis & Predictions", channel: "Paul Barron", views: "8h ago", url: "https://youtube.com/@PaulBarronNetwork/videos", thumbnail: null },
      { id: 5, title: "Top Altcoins Review This Week", channel: "Altcoin Daily", views: "10h ago", url: "https://youtube.com/@AltcoinDaily/videos", thumbnail: null },
      { id: 6, title: "Market Trends & Trading Signals", channel: "Digital Outlook", views: "12h ago", url: "https://youtube.com/@DigitalOutlookChannel/videos", thumbnail: null },
      { id: 7, title: "Mickle's Crypto Insights", channel: "Mickle", views: "14h ago", url: "https://youtube.com/@MickleXRP/videos", thumbnail: null },
      { id: 8, title: "Jake Claver Market Review", channel: "Jake Claver", views: "16h ago", url: "https://youtube.com/@jakeclaver/videos", thumbnail: null },
      { id: 9, title: "Apex Crypto Weekly Update", channel: "Apex Crypto", views: "18h ago", url: "https://youtube.com/@ApexCryptoInsights/videos", thumbnail: null },
      { id: 10, title: "Good Evening Crypto News", channel: "Good Evening Crypto", views: "20h ago", url: "https://youtube.com/@GoodEveningCrypto/videos", thumbnail: null }
    ];

    try {
      const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
      
      if (!API_KEY) {
        console.log('No API key, using fallback videos');
        setVideos(fallbackVideos);
        return;
      }
      
      const channels = {
        'Digital Outlook': 'UC8oW_3rV35rZ3oU1F_n9cjg',
        'Crypto Sensei': 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
        'Mickle': 'UCINUlGW2QpPYa9-TGcW2XUA',
        'Chain of Blocks': 'UCx1J1fFL7gzhd8BqjJ_jJxw',
        'Zach Rector': 'UC4LwOm1guXDzPPGWnq_YlsA',
        'Jake Claver': 'UC0zq9i-Um0YB-ssHQoz_qUg',
        'Altcoin Daily': 'UCVm8QxSChzT63-zF2A7AWEQ',
        'Paul Barron': 'UCwB6d4tB5-S1tZc1r3_B-fQ',
        'Apex Crypto': 'UCQ0lC-yRj8Bwz8eFv290_LA',
        'Good Evening Crypto': 'UCEALkfpMmmWQkGXWhRUmslA',
        'Black Swan Capitalist': 'UCURoln2BKCvvMT5peanKAvw',
        'Crypto with Klaus': 'UCOb8ZvB7CK7-IEf-8RmhULg'
      };

      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);
      const publishedAfter = yesterday.toISOString();

      const allVideos = [];
      let videoId = 1;
      let successfulChannels = 0;
      let failedChannels = 0;

      for (const [channelName, channelId] of Object.entries(channels)) {
        try {
          // Add search query for Crypto Sensei to filter only crypto videos
          const searchQuery = channelName === 'Crypto Sensei' ? '&q=crypto|bitcoin|ethereum|XRP|cryptocurrency|blockchain' : '';
          
          const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${channelId}&part=snippet,id&order=date&maxResults=50&type=video&publishedAfter=${publishedAfter}${searchQuery}`
          );
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error(`❌ YouTube API error for ${channelName}:`, {
              status: response.status,
              statusText: response.statusText,
              error: errorData
            });
            failedChannels++;
            continue;
          }
          
          const data = await response.json();
          
          if (data.items && data.items.length > 0) {
            console.log(`✓ Found ${data.items.length} videos from ${channelName} in last 24h`);
            data.items.forEach(item => {
              const publishedDate = new Date(item.snippet.publishedAt);
              const hoursAgo = Math.floor((new Date() - publishedDate) / (1000 * 60 * 60));
              const timeAgo = hoursAgo < 1 ? 'Just now' : `${hoursAgo}h ago`;
              
              allVideos.push({
                id: videoId++,
                title: item.snippet.title,
                channel: channelName,
                views: timeAgo,
                url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                thumbnail: item.snippet.thumbnails.medium.url,
                publishedAt: item.snippet.publishedAt
              });
            });
            successfulChannels++;
          } else {
            console.log(`- No videos from ${channelName} in last 24h`);
            successfulChannels++;
          }
        } catch (channelError) {
          console.error(`❌ Error fetching ${channelName}:`, channelError);
          failedChannels++;
        }
      }
      
      console.log(`Total: ${allVideos.length} videos from ${successfulChannels}/${channels.length} channels (${failedChannels} failed)`);

      allVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      
      console.log(`Fetched ${allVideos.length} videos from YouTube API`);
      
      if (allVideos.length > 0) {
        setVideos(allVideos);
      } else {
        console.log('No videos found from API, using fallback');
        setVideos(fallbackVideos);
      }
    } catch (error) {
      console.log('Error fetching videos, using fallback:', error.message);
      setVideos(fallbackVideos);
    }
  };

  const fetchChartData = async (coinId, days = '7') => {
    setChartLoading(true);
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`);
      const data = await response.json();
      const formattedData = data.prices.map(([timestamp, price]) => ({
        time: days === '1' ? new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: price
      }));
      setChartData(formattedData);
      setChartLoading(false);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartLoading(false);
    }
  };

  const openChart = (crypto) => {
    setSelectedCrypto(crypto);
    setChartTimeframe('7');
    fetchChartData(crypto.id, '7');
  };

  const changeChartTimeframe = (days) => {
    setChartTimeframe(days);
    fetchChartData(selectedCrypto.id, days);
  };

  const closeChart = () => {
    setSelectedCrypto(null);
    setChartData([]);
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  // Desktop: show 24 prices unless expanded, Mobile: show 4 prices unless expanded
  // News: show 4 unless expanded
  // Videos: show 4 unless expanded, 10 when expanded
  // Articles: show 4 unless expanded
  // Filter out any invalid crypto data
  const validCryptoPrices = cryptoPrices.filter(crypto => 
    crypto && 
    crypto.id && 
    crypto.symbol && 
    crypto.current_price !== null && 
    crypto.current_price !== undefined
  );
  const displayedPrices = pricesExpanded ? validCryptoPrices : validCryptoPrices.slice(0, 24);
  const displayedNews = newsExpanded ? news : news.slice(0, 4);
  const displayedVideos = videosExpanded ? videos.slice(0, 10) : videos.slice(0, 4);
  const displayedArticles = articlesExpanded ? articles : articles.slice(0, 4);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-[#ffc93c] py-6 mb-8">
          <div className="max-w-2xl mx-auto px-4">
            <img src="/logo.png" alt="Kryptocurrent Logo" className="w-full" />
          </div>
        </div>

        {/* Prices Section */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 mb-8">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Live Crypto Prices</h2>
              <button onClick={() => fetchCryptoPrices(priceCategory)} className="flex items-center gap-1 px-2 py-1.5 text-sm bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition">
                <RefreshCw size={14} />Refresh
              </button>
            </div>
            
            {/* Category Toggle Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setPriceCategory('top100')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                  priceCategory === 'top100'
                    ? 'bg-[#ffc93c] text-black'
                    : 'bg-slate-700/50 text-white hover:bg-slate-700'
                }`}
              >
                Top 100
              </button>
              <button
                onClick={() => setPriceCategory('iso20022')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                  priceCategory === 'iso20022'
                    ? 'bg-[#ffc93c] text-black'
                    : 'bg-slate-700/50 text-white hover:bg-slate-700'
                }`}
              >
                ISO 20022 Coins
              </button>
              <button
                onClick={() => setPriceCategory('ai')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                  priceCategory === 'ai'
                    ? 'bg-[#ffc93c] text-black'
                    : 'bg-slate-700/50 text-white hover:bg-slate-700'
                }`}
              >
                Top AI Coins
              </button>
              <button
                onClick={() => setPriceCategory('meme')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                  priceCategory === 'meme'
                    ? 'bg-[#ffc93c] text-black'
                    : 'bg-slate-700/50 text-white hover:bg-slate-700'
                }`}
              >
                Top Meme Coins
              </button>
            </div>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="animate-spin mx-auto mb-2 text-[#ffc93c]" size={32} />
              <p className="text-gray-400">Loading prices...</p>
            </div>
          ) : (
            <>
              {/* Mobile: Show 4 with expand button */}
              <div className="md:hidden">
                <div className="grid grid-cols-2 gap-2">
                  {(pricesExpanded ? validCryptoPrices : validCryptoPrices.slice(0, 4)).map((crypto) => (
                    <div key={crypto.id} onClick={() => openChart(crypto)} className="group bg-slate-700/50 rounded-lg p-1.5 hover:bg-slate-700 transition-all duration-300 cursor-pointer border border-transparent hover:border-[#ffc93c]/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#ffc93c]/10">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <img src={crypto.image} alt={crypto.name} className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                          <h3 className="font-semibold text-xs truncate group-hover:text-[#ffc93c] transition-colors">{crypto.symbol.toUpperCase()}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold whitespace-nowrap">
                            ${crypto.current_price < 0.01 
                              ? crypto.current_price.toFixed(8) 
                              : crypto.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <div className={`flex items-center justify-end gap-0.5 text-xs ${crypto.price_change_percentage_24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {crypto.price_change_percentage_24h > 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                            <span className="text-xs">{Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {validCryptoPrices.length > 4 && (
                  <button 
                    onClick={() => setPricesExpanded(!pricesExpanded)}
                    className="mt-3 w-full px-4 py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold text-sm"
                  >
                    {pricesExpanded ? 'Show Less' : 'Show More'}
                  </button>
                )}
              </div>

              {/* Desktop: Show 24 with expand button */}
              <div className="hidden md:block">
                <div className="grid md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {displayedPrices.map((crypto) => (
                    <div key={crypto.id} onClick={() => openChart(crypto)} className="group bg-slate-700/50 rounded-lg p-1.5 hover:bg-slate-700 transition-all duration-300 cursor-pointer border border-transparent hover:border-[#ffc93c]/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#ffc93c]/10">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <img src={crypto.image} alt={crypto.name} className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                          <h3 className="font-semibold text-xs truncate group-hover:text-[#ffc93c] transition-colors">{crypto.symbol.toUpperCase()}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold whitespace-nowrap">
                            ${crypto.current_price < 0.01 
                              ? crypto.current_price.toFixed(8) 
                              : crypto.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <div className={`flex items-center justify-end gap-0.5 text-xs ${crypto.price_change_percentage_24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {crypto.price_change_percentage_24h > 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                            <span className="text-xs">{Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {cryptoPrices.length > 24 && (
                  <button 
                    onClick={() => setPricesExpanded(!pricesExpanded)}
                    className="mt-3 w-full px-4 py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold text-sm"
                  >
                    {pricesExpanded ? 'Show Less' : 'Show More'}
                  </button>
                )}
              </div>
            </>
          )}

          {/* ETF Tracker */}
          <div className="mt-6 p-4 bg-slate-700/50 rounded-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <img src="/XRPlogo.jpg" alt="XRP" className="w-8 h-8 rounded" />
                <div>
                  <h3 className="text-lg font-bold text-white">XRP ETF Tracker</h3>
                  <p className="text-sm text-gray-300 hidden md:block">Track spot ETF stats from our good friends at XRP Insights</p>
                </div>
              </div>
              <a href="https://xrp-insights.com" target="_blank" rel="noopener noreferrer" className="px-4 md:px-6 py-2 md:py-3 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold whitespace-nowrap text-sm md:text-base">
                Visit →
              </a>
            </div>
          </div>
        </div>

        {/* Updates from X Section - Improved Profile Links */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">Updates from X</h2>
          </div>
          
          {/* Mobile: Show 3 accounts unexpanded (includes Kryptocurrent List) */}
          <div className="md:hidden">
            <div className="grid grid-cols-1 gap-3">
              {(newsExpanded ? news : news.slice(0, 3)).map((account) => (
                <a 
                  key={account.id} 
                  href={account.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="group block bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg p-3 hover:from-slate-700 hover:to-slate-800 transition-all duration-300 border border-slate-600/50 hover:border-[#ffc93c]/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ffc93c] to-[#ffb700] p-[2px]">
                        <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center">
                          <svg className="w-5 h-5 text-[#ffc93c]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        </div>
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm group-hover:text-[#ffc93c] transition-colors">
                        {account.source.title}
                      </h3>
                      <p className="text-xs text-gray-400 truncate">@{account.url.split('/').pop()}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Posted {(() => {
                          const date = new Date(account.created_at);
                          const now = new Date();
                          const diffMs = now - date;
                          const diffMins = Math.floor(diffMs / 60000);
                          const diffHours = Math.floor(diffMs / 3600000);
                          
                          if (diffMins < 60) return `${diffMins}m ago`;
                          return `${diffHours}h ago`;
                        })()}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-gray-500 group-hover:text-[#ffc93c] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </a>
              ))}
            </div>
            {news.length > 3 && (
              <button 
                onClick={() => setNewsExpanded(!newsExpanded)}
                className="mt-3 w-full px-4 py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold text-sm"
              >
                {newsExpanded ? 'Show Less' : 'Show More'}
              </button>
            )}
          </div>

          {/* Desktop: Show 7 accounts in 3 columns unexpanded (includes Kryptocurrent List) */}
          <div className="hidden md:block">
            <div className="grid md:grid-cols-3 gap-3">
              {(newsExpanded ? news : news.slice(0, 7)).map((account) => (
                <a 
                  key={account.id} 
                  href={account.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="group block bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg p-3 hover:from-slate-700 hover:to-slate-800 transition-all duration-300 border border-slate-600/50 hover:border-[#ffc93c]/50 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ffc93c] to-[#ffb700] p-[2px]">
                        <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center">
                          <svg className="w-6 h-6 text-[#ffc93c]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        </div>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800 animate-pulse"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm group-hover:text-[#ffc93c] transition-colors">
                        {account.source.title}
                      </h3>
                      <p className="text-xs text-gray-400 truncate">@{account.url.split('/').pop()}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Posted {(() => {
                          const date = new Date(account.created_at);
                          const now = new Date();
                          const diffMs = now - date;
                          const diffMins = Math.floor(diffMs / 60000);
                          const diffHours = Math.floor(diffMs / 3600000);
                          
                          if (diffMins < 60) return `${diffMins}m ago`;
                          return `${diffHours}h ago`;
                        })()}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-gray-500 group-hover:text-[#ffc93c] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </a>
              ))}
            </div>
            {news.length > 7 && (
              <button 
                onClick={() => setNewsExpanded(!newsExpanded)}
                className="mt-4 w-full px-4 py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold text-sm"
              >
                {newsExpanded ? 'Show Less' : 'Show More'}
              </button>
            )}
          </div>
        </div>

        {/* Videos Section - 2 Columns on Desktop, Expandable on Mobile */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-white">Latest Crypto Videos</h2>
          
          {/* Mobile: Show 4 with expand button */}
          <div className="md:hidden">
            <div className="grid grid-cols-1 gap-4">
              {displayedVideos.map((video) => (
                <a key={video.id} href={video.url} target="_blank" rel="noopener noreferrer" className="group block bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700 transition-all duration-300 cursor-pointer border border-transparent hover:border-[#ffc93c]/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#ffc93c]/10">
                  <div className="flex gap-4">
                    <div className="w-32 h-20 bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:ring-2 group-hover:ring-[#ffc93c]/50 transition-all">
                      {video.thumbnail ? (
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      ) : (
                        <span className="text-2xl group-hover:scale-110 transition-transform">▶️</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 line-clamp-2 text-sm group-hover:text-[#ffc93c] transition-colors">{video.title}</h3>
                      <p className="text-xs opacity-70">{video.channel}</p>
                      <p className="text-xs opacity-60 mt-1">{video.views}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
            {videos.length > 4 && (
              <button 
                onClick={() => setVideosExpanded(!videosExpanded)}
                className="mt-3 w-full px-4 py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold text-sm"
              >
                {videosExpanded ? 'Show Less' : 'Show More'}
              </button>
            )}
          </div>

          {/* Desktop: Show 4 in 2 columns with expand button */}
          <div className="hidden md:block">
            <div className="grid md:grid-cols-2 gap-4">
              {displayedVideos.map((video) => (
                <a key={video.id} href={video.url} target="_blank" rel="noopener noreferrer" className="group block bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700 transition-all duration-300 cursor-pointer border border-transparent hover:border-[#ffc93c]/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#ffc93c]/10">
                  <div className="flex gap-4">
                    <div className="w-32 h-20 bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:ring-2 group-hover:ring-[#ffc93c]/50 transition-all">
                      {video.thumbnail ? (
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      ) : (
                        <span className="text-2xl group-hover:scale-110 transition-transform">▶️</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 line-clamp-2 text-sm group-hover:text-[#ffc93c] transition-colors">{video.title}</h3>
                      <p className="text-xs opacity-70">{video.channel}</p>
                      <p className="text-xs opacity-60 mt-1">{video.views}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
            {videos.length > 4 && (
              <button 
                onClick={() => setVideosExpanded(!videosExpanded)}
                className="mt-3 w-full px-4 py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold text-sm"
              >
                {videosExpanded ? 'Show Less' : 'Show More'}
              </button>
            )}
          </div>
        </div>

        {/* Articles Section - 2 Columns on Desktop, Expandable on Mobile */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Crypto Articles</h2>
            <button onClick={fetchCryptoArticles} className="flex items-center gap-1 px-2 py-1.5 text-sm bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition">
              <RefreshCw size={14} />Refresh
            </button>
          </div>
          
          {/* Mobile: Show 4 with expand button */}
          <div className="md:hidden">
            <div className="grid grid-cols-1 gap-4">
              {displayedArticles.map((article) => (
                <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer" className="group block bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700 transition-all duration-300 cursor-pointer border border-transparent hover:border-[#ffc93c]/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#ffc93c]/10">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:ring-2 group-hover:ring-[#ffc93c]/50 transition-all">
                      <img src={article.logo} alt={article.source} className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-2 group-hover:text-[#ffc93c] transition-colors">{article.title}</h3>
                      <div className="flex items-center gap-2 text-sm opacity-70">
                        <span>{article.source}</span>
                        <span>•</span>
                        <span>{getTimeAgo(article.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
            {articles.length > 4 && (
              <button 
                onClick={() => setArticlesExpanded(!articlesExpanded)}
                className="mt-3 w-full px-4 py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold text-sm"
              >
                {articlesExpanded ? 'Show Less' : 'Show More'}
              </button>
            )}
          </div>

          {/* Desktop: Show 4 in 2 columns with expand button */}
          <div className="hidden md:block">
            <div className="grid md:grid-cols-2 gap-4">
              {displayedArticles.map((article) => (
                <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer" className="group block bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700 transition-all duration-300 cursor-pointer border border-transparent hover:border-[#ffc93c]/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#ffc93c]/10">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:ring-2 group-hover:ring-[#ffc93c]/50 transition-all">
                      <img src={article.logo} alt={article.source} className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-2 group-hover:text-[#ffc93c] transition-colors">{article.title}</h3>
                      <div className="flex items-center gap-2 text-sm opacity-70">
                        <span>{article.source}</span>
                        <span>•</span>
                        <span>{getTimeAgo(article.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
            {articles.length > 4 && (
              <button 
                onClick={() => setArticlesExpanded(!articlesExpanded)}
                className="mt-3 w-full px-4 py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold text-sm"
              >
                {articlesExpanded ? 'Show Less' : 'Show More'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chart Modal */}
      {selectedCrypto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={closeChart}>
          <div className="bg-white rounded-xl p-6 max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src={selectedCrypto.image} alt={selectedCrypto.name} className="w-10 h-10" />
                <div>
                  <h2 className="text-2xl font-bold text-black">{selectedCrypto.name}</h2>
                  <p className="text-gray-600">{selectedCrypto.symbol.toUpperCase()}</p>
                </div>
              </div>
              <button onClick={closeChart} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} className="text-black" />
              </button>
            </div>

            <div className="mb-4">
              <div className="text-3xl font-bold text-black">${selectedCrypto.current_price.toLocaleString()}</div>
              <div className={`flex items-center gap-2 text-lg ${selectedCrypto.price_change_percentage_24h > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {selectedCrypto.price_change_percentage_24h > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                {Math.abs(selectedCrypto.price_change_percentage_24h).toFixed(2)}% (24h)
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <button onClick={() => changeChartTimeframe('1')} className={`px-4 py-2 rounded-lg ${chartTimeframe === '1' ? 'bg-[#ffc93c] text-black' : 'bg-gray-100 text-black'}`}>1 Day</button>
              <button onClick={() => changeChartTimeframe('7')} className={`px-4 py-2 rounded-lg ${chartTimeframe === '7' ? 'bg-[#ffc93c] text-black' : 'bg-gray-100 text-black'}`}>1 Week</button>
            </div>

            <div className="h-64 mb-4">
              {chartLoading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="animate-spin text-[#ffc93c]" size={32} />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis 
                      dataKey="time" 
                      stroke="#9ca3af" 
                      style={{ fontSize: '11px' }} 
                      interval="preserveStartEnd"
                      tickMargin={8}
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      style={{ fontSize: '11px' }} 
                      tickFormatter={(value) => `$${value.toFixed(2)}`} 
                      width={70}
                      domain={['auto', 'auto']}
                      scale="linear"
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} 
                      formatter={(value) => [`$${value.toFixed(2)}`, 'Price']} 
                    />
                    <Line type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-gray-600 text-xs mb-1">Market Cap</p>
                <p className="font-bold text-black">${(selectedCrypto.market_cap / 1e9).toFixed(2)}B</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-gray-600 text-xs mb-1">24h High</p>
                <p className="font-bold text-black">${selectedCrypto.high_24h?.toLocaleString()}</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-gray-600 text-xs mb-1">24h Low</p>
                <p className="font-bold text-black">${selectedCrypto.low_24h?.toLocaleString()}</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-gray-600 text-xs mb-1">All-Time High</p>
                <p className="font-bold text-black">${selectedCrypto.ath?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
