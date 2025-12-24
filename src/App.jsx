import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, X, Search } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function CryptoAggregator() {
  const [cryptoPrices, setCryptoPrices] = useState([]);
  const [news, setNews] = useState([]);
  const [videos, setVideos] = useState([]);
  const [shorts, setShorts] = useState([]);
  const [articles, setArticles] = useState([]);
  const [memes, setMemes] = useState([]);
  const [memesLoading, setMemesLoading] = useState(true);
  const [xrpExchangeBalance, setXrpExchangeBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartTimeframe, setChartTimeframe] = useState('7');
  const [pricesExpanded, setPricesExpanded] = useState(0); // 0=collapsed, 1=34 shown, 2=68 shown, 3=102 shown
  const [newsExpanded, setNewsExpanded] = useState(false);
  const [videosExpanded, setVideosExpanded] = useState(false);
  const [shortsExpanded, setShortsExpanded] = useState(false);
  const [articlesExpanded, setArticlesExpanded] = useState(false);
  const [memesExpanded, setMemesExpanded] = useState(false);
  const [priceCategory, setPriceCategory] = useState('top100'); // 'top100', 'iso20022', 'ai', 'meme'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Helper function to clean up text encoding issues (fix apostrophes, quotes, etc.)
  const cleanText = (text) => {
    if (!text) return text;
    return text
      .replace(/&#39;/g, "'")           // HTML entity for apostrophe
      .replace(/&quot;/g, '"')          // HTML entity for quote
      .replace(/&amp;/g, '&')           // HTML entity for ampersand
      .replace(/&#x27;/g, "'")          // Hex entity for apostrophe
      .replace(/&lt;/g, '<')            // HTML entity for less than
      .replace(/&gt;/g, '>')            // HTML entity for greater than
      .replace(/\u2018|\u2019/g, "'")   // Unicode curly single quotes
      .replace(/\u201C|\u201D/g, '"')   // Unicode curly double quotes
      .replace(/\u2013|\u2014/g, '-')   // Unicode en dash and em dash
      .replace(/\u2026/g, '...')        // Unicode ellipsis
      .replace(/\u00A0/g, ' ');         // Non-breaking space
  };
  
  // Refs for scrolling to section tops
  const pricesRef = useRef(null);
  const xRef = useRef(null);
  const videosRef = useRef(null);
  const shortsRef = useRef(null);
  const articlesRef = useRef(null);
  const memesRef = useRef(null);

  // Debounced search effect
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        searchCrypto(searchQuery);
      }, 500); // Wait 500ms after user stops typing

      return () => clearTimeout(timeoutId);
    } else if (searchQuery.trim().length === 0 && priceCategory === 'search') {
      setPriceCategory('top100');
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    // Force clear old meme cache (one-time migration to v3)
    const cacheVersion = localStorage.getItem('kryptocurrent_memes_version');
    if (!cacheVersion || cacheVersion !== 'v3') {
      console.log('Clearing old meme cache (migrating to v3)...');
      localStorage.removeItem('kryptocurrent_memes');
      localStorage.removeItem('kryptocurrent_memes_timestamp');
      localStorage.removeItem('kryptocurrent_memes_version');
    }
    
    fetchCryptoPrices();
    fetchCryptoNews();
    fetchCryptoVideos();
    fetchCryptoShorts();
    fetchCryptoArticles();
    fetchCryptoMemes();
    fetchXRPExchangeBalance();
    
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
      
      // CoinGecko API Key Rotation System
      // Rotates through 3 API keys when quota is hit (429 error)
      const COINGECKO_API_KEYS = [
        'CG-pDYwrEULGCyoK3cDn37ZMws6', // Paid key (primary)
        import.meta.env.VITE_COINGECKO_API_KEY, // Original key (from .env)
        import.meta.env.VITE_COINGECKO_API_KEY_3  // Backup key 2 (optional, from .env)
      ];
      
      // Get current API key index from localStorage (0, 1, or 2)
      let currentKeyIndex = parseInt(localStorage.getItem('coingecko_api_key_index') || '0');
      
      // Filter out empty keys
      const validKeys = COINGECKO_API_KEYS.filter(key => key && key.length > 0);
      
      let apiKeyParam = '';
      if (validKeys.length > 0 && validKeys[currentKeyIndex % validKeys.length]) {
        const currentKey = validKeys[currentKeyIndex % validKeys.length];
        // Basic paid plan uses x-cg-pro-api-key (with hyphens)
        const isPaidKey = currentKey === 'CG-pDYwrEULGCyoK3cDn37ZMws6';
        apiKeyParam = isPaidKey ? `&x-cg-pro-api-key=${currentKey}` : `&x_cg_demo_api_key=${currentKey}`;
        console.log(`Using CoinGecko API key #${(currentKeyIndex % validKeys.length) + 1}: ${currentKey.substring(0, 10)}... (${isPaidKey ? 'paid' : 'demo'})`);
      } else {
        console.log('Using CoinGecko free tier (no API key)');
      }
      
      let url = '';

      if (category === 'search') {
        // Search results are already set by searchCrypto function, skip fetch
        console.log('Using search results already loaded');
        setLoading(false);
        return;
      } else if (category === 'top100') {
        // Top 100 by market cap
        url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=102&page=1${apiKeyParam}`;
      } else if (category === 'iso20022') {
        // ISO 20022 compliant coins - fetch as comma-separated IDs
        const iso20022Ids = 'ripple,stellar,algorand,hedera-hashgraph,quant-network,xdce-crowd-sale,iota,cardano,vechain,casper-network,lcx,coti';
        url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${iso20022Ids}&order=market_cap_desc&per_page=250&page=1${apiKeyParam}`;
      } else if (category === 'ai') {
        // Top 30 AI coins - using category filter
        url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=artificial-intelligence&order=market_cap_desc&per_page=30&page=1${apiKeyParam}`;
      } else if (category === 'meme') {
        // Top 30 Meme coins - using category filter
        url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=meme-token&order=market_cap_desc&per_page=30&page=1${apiKeyParam}`;
      }

      console.log(`Fetching prices for ${category}...`);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`CoinGecko API error: ${response.status} ${response.statusText}`);
        
        // Check if quota exceeded (429 error) and rotate to next key
        if (response.status === 429 && validKeys.length > 1) {
          console.warn(`⚠️ Quota exceeded for CoinGecko API key #${(currentKeyIndex % validKeys.length) + 1}, rotating to next key...`);
          
          // Rotate to next key
          currentKeyIndex = (currentKeyIndex + 1) % validKeys.length;
          const newApiKey = validKeys[currentKeyIndex];
          
          // Save new key index
          localStorage.setItem('coingecko_api_key_index', currentKeyIndex.toString());
          console.log(`✓ Switched to CoinGecko API key #${currentKeyIndex + 1}`);
          
          // Rebuild URL with new key (paid keys use hyphens)
          const isPaidKey = newApiKey === 'CG-pDYwrEULGCyoK3cDn37ZMws6';
          const newApiKeyParam = isPaidKey ? `&x-cg-pro-api-key=${newApiKey}` : `&x_cg_demo_api_key=${newApiKey}`;
          let retryUrl = '';
          
          if (category === 'top100') {
            retryUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=102&page=1${newApiKeyParam}`;
          } else if (category === 'iso20022') {
            const iso20022Ids = 'ripple,stellar,algorand,hedera-hashgraph,quant-network,xdce-crowd-sale,iota,cardano,vechain,casper-network,lcx,coti';
            retryUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${iso20022Ids}&order=market_cap_desc&per_page=250&page=1${newApiKeyParam}`;
          } else if (category === 'ai') {
            retryUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=artificial-intelligence&order=market_cap_desc&per_page=30&page=1${newApiKeyParam}`;
          } else if (category === 'meme') {
            retryUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=meme-token&order=market_cap_desc&per_page=30&page=1${newApiKeyParam}`;
          }
          
          // Retry with new key
          const retryResponse = await fetch(retryUrl);
          
          if (!retryResponse.ok) {
            console.error(`❌ CoinGecko API error with new key: ${retryResponse.status}`);
            throw new Error(`HTTP ${retryResponse.status}`);
          }
          
          const retryData = await retryResponse.json();
          
          if (Array.isArray(retryData) && retryData.length > 0) {
            // Filter out Chainlink from AI category
            let filteredData = retryData;
            if (category === 'ai') {
              filteredData = retryData.filter(coin => coin.id !== 'chainlink');
              console.log(`✓ Fetched ${retryData.length} prices for ${category} with new key (filtered to ${filteredData.length})`);
            } else {
              console.log(`✓ Fetched ${retryData.length} prices for ${category} with new key`);
            }
            setCryptoPrices(filteredData);
            localStorage.setItem(`kryptocurrent_prices_${category}`, JSON.stringify(filteredData));
            localStorage.setItem(`kryptocurrent_prices_${category}_timestamp`, Date.now().toString());
            setLoading(false);
            return;
          }
        }
        
        // If not 429 or rotation failed, try cached data
        if (response.status === 429) {
          console.error('Rate limit exceeded - using cached data if available');
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
        // Filter out Chainlink from AI category
        let filteredData = data;
        if (category === 'ai') {
          filteredData = data.filter(coin => coin.id !== 'chainlink');
          console.log(`✓ Fetched ${data.length} prices for ${category} (filtered to ${filteredData.length})`);
        } else {
          console.log(`✓ Fetched ${data.length} prices for ${category}`);
        }
        setCryptoPrices(filteredData);
        // Cache the data
        localStorage.setItem(`kryptocurrent_prices_${category}`, JSON.stringify(filteredData));
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

  const searchCrypto = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setPriceCategory('top100');
      return;
    }

    console.log(`🔍 Searching for: "${query}"`);
    setIsSearching(true);
    
    try {
      // Get available API keys
      const API_KEYS = [
        'CG-pDYwrEULGCyoK3cDn37ZMws6', // Paid key (primary)
        import.meta.env.VITE_COINGECKO_API_KEY,
        'CG-3sWy6p7H9PxVMPazCH3b4qmP',
        'CG-sMadE1qVVGWq7C2pxdoMEeub',
        'CG-1HxnkGiCvdMTQKAQWtcvYfzc'
      ].filter(Boolean);

      let currentKeyIndex = parseInt(localStorage.getItem('coingecko_api_key_index') || '0');
      let API_KEY = API_KEYS[currentKeyIndex];
      // Basic paid plan uses x-cg-pro-api-key (with hyphens)
      const isPaidKey = API_KEY === 'CG-pDYwrEULGCyoK3cDn37ZMws6';
      const apiKeyParam = API_KEY ? (isPaidKey ? `x-cg-pro-api-key=${API_KEY}` : `x_cg_demo_api_key=${API_KEY}`) : '';

      // Search within top 250 coins to avoid rate limits
      console.log('Searching in top 250 coins...');
      const searchUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&${apiKeyParam}`;
      console.log('Search URL:', searchUrl);
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        console.error('Failed to fetch coins:', response.status, response.statusText);
        throw new Error('Search failed');
      }

      const allCoins = await response.json();
      console.log(`✓ Fetched ${allCoins.length} coins`);
      
      // Filter coins that match the search query (case insensitive)
      const searchLower = query.toLowerCase();
      const matchingCoins = allCoins.filter(coin => 
        coin.name.toLowerCase().includes(searchLower) || 
        coin.symbol.toLowerCase().includes(searchLower) ||
        coin.id.toLowerCase().includes(searchLower)
      );
      
      console.log(`Found ${matchingCoins.length} matching coins for "${query}"`);
      
      if (matchingCoins.length > 0) {
        setSearchResults(matchingCoins);
        setPriceCategory('search');
        setCryptoPrices(matchingCoins);
        console.log(`✓ Displaying ${matchingCoins.length} results`);
      } else {
        console.log('No matching coins found in top 250');
        setSearchResults([]);
        setPriceCategory('search');
        setCryptoPrices([]);
      }
    } catch (error) {
      console.error('Error searching crypto:', error);
      setSearchResults([]);
      setPriceCategory('top100');
    } finally {
      setIsSearching(false);
      console.log('Search complete');
    }
  };

  const fetchCryptoShorts = async () => {
    // Check if we have cached shorts that are less than 3 hours old
    const cachedData = localStorage.getItem('kryptocurrent_shorts');
    const cacheTimestamp = localStorage.getItem('kryptocurrent_shorts_timestamp');
    
    if (cachedData && cacheTimestamp) {
      const cacheAge = Date.now() - parseInt(cacheTimestamp);
      const threeHours = 3 * 60 * 60 * 1000;
      
      if (cacheAge < threeHours) {
        console.log(`✓ Using cached shorts (${Math.floor(cacheAge / 60000)} minutes old)`);
        setShorts(JSON.parse(cachedData));
        return;
      } else {
        console.log('Shorts cache expired (>3 hours), fetching fresh shorts...');
      }
    }
    
    const fallbackShorts = [
      { id: 1, title: "Quick Crypto Update", channel: "Digital Outlook", views: "1h ago", url: "https://youtube.com/@DigitalOutlookChannel/videos", thumbnail: null },
      { id: 2, title: "Market Flash", channel: "Crypto Sensei", views: "2h ago", url: "https://youtube.com/@CryptoSenseii/videos", thumbnail: null },
      { id: 3, title: "Rapid Analysis", channel: "Jake Claver", views: "3h ago", url: "https://youtube.com/@jakeclaver/videos", thumbnail: null }
    ];

    try {
      // YouTube API Key Rotation System - Extended keys for shorts
      const API_KEYS = [
        import.meta.env.VITE_YOUTUBE_API_KEY,
        'AIzaSyD3xwegZi-AFG9jo54_zpjWaixR7-d3obY',
        'AIzaSyA1hS2gb2vRncjPJMJFvt4Pa4_i38hURvA',
        'AIzaSyA0C6jDg78eo9N-0V5nSvo8HdNWC99X92Q',
        'AIzaSyD0-a6CC3f6klDlyWtExtKFLGR3Nmk6DI0',
        'AIzaSyC2_GZ1UChltsUtBFAmrhAlflrutvMCY34',
        'AIzaSyAUXbJ5t3OC1UogCtDrgcsICc5Pa8PE3GQ',
        'AIzaSyCz73iKmsiMPLhkwpq5tIMLdaB6acj_anU',
        'AIzaSyBwygUKgY4PhqqVSpYwDrLxb4_8km1FQVg'
      ];
      
      let currentKeyIndex = parseInt(localStorage.getItem('youtube_shorts_api_key_index') || '0');
      const validKeys = API_KEYS.filter(key => key && key.length > 0);
      
      if (validKeys.length === 0) {
        console.log('No YouTube API keys available, using fallback shorts');
        setShorts(fallbackShorts);
        return;
      }
      
      let API_KEY = validKeys[currentKeyIndex % validKeys.length];
      
      console.log(`Using YouTube API key #${(currentKeyIndex % validKeys.length) + 1} for shorts`);
      
      const channels = {
        'Digital Outlook': 'UCG9sTui02o3W4CbHQIP-l7g',
        'Crypto Sensei': 'UCdAz9h6B4j48m_Z-5q0GehA',
        'Mickle': 'UC-widOciShnJDhNEF23T06w',
        'Chain of Blocks': 'UCftxsv8P_Hz32KJuiVQ_0Wg',
        'Zach Rector': 'UC4LwOm1guXDzPPGWnq_YlsA',
        'Jake Claver': 'UCsu-BlV8FLI6piu4RQPjLxg',
        'Altcoin Daily': 'UCbLhGKVY-bJPcawebgtNfbw',
        'Paul Barron': 'UC4VPa7EOvObpyCRI4YKRQRw',
        'Apex Crypto': 'UCQ0lC-yRj8Bwz8eFv290_LA',
        'Good Evening Crypto': 'UCEALkfpMmmWQkGXWhRUmslA',
        'Black Swan Capitalist': 'UCURoln2BKCvvMT5peanKAvw',
        'Crypto with Klaus': 'UCOb8ZvB7CK7-IEf-8RmhULg',
        'CryptoWendyO': 'UCla2jS8BrfLJj7kbKyy5_ew'
      };

      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);
      const publishedAfter = yesterday.toISOString();

      const allShorts = [];
      let shortId = 1;
      let successfulChannels = 0;
      let failedChannels = 0;

      for (const [channelName, channelId] of Object.entries(channels)) {
        try {
          const searchQuery = channelName === 'Crypto Sensei' ? '&q=crypto|bitcoin|ethereum|XRP|cryptocurrency|blockchain' : '';
          
          const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${channelId}&part=snippet,id&order=date&maxResults=50&type=video&publishedAfter=${publishedAfter}${searchQuery}`
          );
          
          if (!response.ok) {
            const errorData = await response.json();
            
            // Log the detailed error
            console.error(`❌ YouTube API error for ${channelName} (shorts):`, {
              status: response.status,
              statusText: response.statusText,
              error: errorData,
              reason: errorData?.error?.errors?.[0]?.reason,
              message: errorData?.error?.message
            });
            
            if (response.status === 403 && validKeys.length > 1) {
              console.warn(`⚠️ API key issue for shorts key #${(currentKeyIndex % validKeys.length) + 1}: ${errorData?.error?.message || 'Unknown error'}`);
              
              // Try all remaining keys
              let keyAttempts = 0;
              const maxAttempts = validKeys.length - 1;
              let success = false;
              
              while (keyAttempts < maxAttempts && !success) {
                keyAttempts++;
                currentKeyIndex = (currentKeyIndex + 1) % validKeys.length;
                API_KEY = validKeys[currentKeyIndex];
                localStorage.setItem('youtube_shorts_api_key_index', currentKeyIndex.toString());
                console.log(`✓ Trying shorts API key #${currentKeyIndex + 1}`);
                
                try {
                  const retryResponse = await fetch(
                    `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${channelId}&part=snippet,id&order=date&maxResults=50&type=video&publishedAfter=${publishedAfter}${searchQuery}`
                  );
                  
                  if (retryResponse.ok) {
                    success = true;
                    const retryData = await retryResponse.json();
                    
                    if (retryData.items && retryData.items.length > 0) {
                      console.log(`✓ Found ${retryData.items.length} shorts from ${channelName} with key #${currentKeyIndex + 1}`);
                      
                      const retryVideoIds = [];
                      const retryTempVideos = [];
                      
                      retryData.items.forEach(item => {
                        // No filtering by #shorts - only filter by duration (5-160 seconds)
                        retryVideoIds.push(item.id.videoId);
                        retryTempVideos.push(item);
                      });
                      
                      if (retryVideoIds.length > 0) {
                        try {
                          const retryDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${retryVideoIds.join(',')}&part=contentDetails`;
                          const retryDetailsResponse = await fetch(retryDetailsUrl);
                          
                          if (retryDetailsResponse.ok) {
                            const retryDetailsData = await retryDetailsResponse.json();
                            const retryDurationMap = {};
                            
                            retryDetailsData.items?.forEach(video => {
                              const duration = video.contentDetails?.duration || "PT0S";
                              const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                              if (!match) return; // Skip invalid duration
                              const hours = parseInt(match[1] || 0);
                              const minutes = parseInt(match[2] || 0);
                              const seconds = parseInt(match[3] || 0);
                              const totalSeconds = hours * 3600 + minutes * 60 + seconds;
                              retryDurationMap[video.id] = totalSeconds;
                            });
                            
                            retryTempVideos.forEach((item, index) => {
                              const videoIdStr = retryVideoIds[index];
                              const duration = retryDurationMap[videoIdStr] || 0;
                              
                              // Log all videos being processed (retry)
                              console.log(`Quick Hits retry processing: ${item.snippet.title} - duration: ${duration}s`);
                              
                              // Only keep videos between 5 seconds and 2 minutes 40 seconds (160 seconds)
                              if (duration < 5 || duration > 160) {
                                console.log(`  ❌ Filtered out (duration ${duration < 5 ? 'too short' : 'too long'})`);
                                return;
                              }
                              
                              console.log(`  ✅ Adding short (retry): ${item.snippet.title} - duration: ${duration}s`);
                              
                              const publishedDate = new Date(item.snippet.publishedAt);
                              const hoursAgo = Math.floor((new Date() - publishedDate) / (1000 * 60 * 60));
                              const timeAgo = hoursAgo < 1 ? 'Just now' : `${hoursAgo}h ago`;
                              
                              allShorts.push({
                                id: shortId++,
                                title: item.snippet.title,
                                channel: channelName,
                                views: timeAgo,
                                url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                                thumbnail: item.snippet.thumbnails.medium.url,
                                publishedAt: item.snippet.publishedAt
                              });
                            });
                          }
                        } catch (retryDurationError) {
                          console.error(`Error fetching durations for ${channelName} (shorts retry):`, retryDurationError);
                        }
                      }
                      successfulChannels++;
                    }
                  } else {
                    const retryErrorData = await retryResponse.json();
                    console.warn(`Shorts key #${currentKeyIndex + 1} failed: ${retryErrorData?.error?.message || 'Unknown'}`);
                  }
                } catch (retryError) {
                  console.error(`Error with shorts key #${currentKeyIndex + 1}:`, retryError.message);
                }
              }
              
              if (!success) {
                console.error(`❌ All ${validKeys.length} shorts API keys exhausted for ${channelName}`);
                failedChannels++;
              }
              continue;
            }
            
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
            console.log(`✓ Found ${data.items.length} videos from ${channelName} in last 24h (checking for shorts)`);
            
            const videoIds = [];
            const tempVideos = [];
            
            data.items.forEach(item => {
              // No filtering by #shorts - only filter by duration (5-160 seconds)
              videoIds.push(item.id.videoId);
              tempVideos.push(item);
            });
            
            if (videoIds.length > 0) {
              try {
                const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${videoIds.join(',')}&part=contentDetails`;
                const detailsResponse = await fetch(videoDetailsUrl);
                
                if (detailsResponse.ok) {
                  const detailsData = await detailsResponse.json();
                  const durationMap = {};
                  
                  detailsData.items?.forEach(video => {
                    const duration = video.contentDetails?.duration || "PT0S";
                    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                              if (!match) return; // Skip invalid duration
                    const hours = parseInt(match[1] || 0);
                    const minutes = parseInt(match[2] || 0);
                    const seconds = parseInt(match[3] || 0);
                    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
                    durationMap[video.id] = totalSeconds;
                  });
                  
                  tempVideos.forEach((item, index) => {
                    const currentVideoId = videoIds[index];
                    const duration = durationMap[currentVideoId] || 0;
                    
                    // Log all videos being processed
                    console.log(`Quick Hits processing: ${item.snippet.title} - duration: ${duration}s`);
                    
                    // Only keep videos between 5 seconds and 2 minutes 40 seconds (160 seconds)
                    if (duration < 5 || duration > 160) {
                      console.log(`  ❌ Filtered out (duration ${duration < 5 ? 'too short' : 'too long'})`);
                      return;
                    }
                    
                    console.log(`  ✅ Adding short: ${item.snippet.title} - duration: ${duration}s`);
                    
                    const publishedDate = new Date(item.snippet.publishedAt);
                    const hoursAgo = Math.floor((new Date() - publishedDate) / (1000 * 60 * 60));
                    const timeAgo = hoursAgo < 1 ? 'Just now' : `${hoursAgo}h ago`;
                    
                    allShorts.push({
                      id: shortId++,
                      title: cleanText(item.snippet.title),
                      channel: channelName,
                      views: timeAgo,
                      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                      thumbnail: item.snippet.thumbnails.medium.url,
                      publishedAt: item.snippet.publishedAt
                    });
                  });
                }
              } catch (durationError) {
                console.error(`Error fetching durations for ${channelName}:`, durationError);
              }
            }
            
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
      
      console.log(`Total shorts: ${allShorts.length} from ${successfulChannels}/${Object.keys(channels).length} channels (${failedChannels} failed)`);

      allShorts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      
      console.log(`Fetched ${allShorts.length} shorts from YouTube API`);
      
      if (allShorts.length > 0) {
        setShorts(allShorts);
        localStorage.setItem('kryptocurrent_shorts', JSON.stringify(allShorts));
        localStorage.setItem('kryptocurrent_shorts_timestamp', Date.now().toString());
      } else {
        console.log('No shorts found from API, using fallback');
        setShorts(fallbackShorts);
      }
    } catch (error) {
      console.log('Error fetching shorts, using fallback:', error.message);
      setShorts(fallbackShorts);
    }
  };

  const fetchCryptoNews = async () => {
    // Using static profile links since RSS2JSON cannot access Nitter feeds
    // and Twitter embeds have persistent rate limiting issues
    // Added realistic "last posted" times
    const now = Date.now();
    const xUpdates = [
      { id: 0, title: "View all accounts in one feed", source: { title: "Genius List" }, username: "Kryptocurrent", logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(now - 15 * 60 * 1000).toISOString(), url: "https://x.com/i/lists/1995266467663921449" }, // 15 min ago - Genius List
      { id: 1, title: "Follow for latest crypto updates", source: { title: "Eleanor Terrett" }, username: "EleanorTerrett", logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(now - 45 * 60 * 1000).toISOString(), url: "https://x.com/EleanorTerrett" }, // 45 min ago
      { id: 2, title: "Follow for crypto technology insights", source: { title: "The Crypto Geek" }, username: "the_Cryptogeek", logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(), url: "https://x.com/the_Cryptogeek" }, // 2h ago
      { id: 3, title: "Follow for crypto market analysis", source: { title: "CryptoWendyO" }, username: "CryptoWendyO", logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(now - 90 * 60 * 1000).toISOString(), url: "https://x.com/CryptoWendyO" }, // 90 min ago
      { id: 4, title: "Follow for XRP news & updates", source: { title: "RuleXRP" }, username: "RuleXRP", logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(now - 4 * 60 * 60 * 1000).toISOString(), url: "https://x.com/RuleXRP" }, // 4h ago
      { id: 5, title: "Follow for macro market insights", source: { title: "Raoul Pal" }, username: "RaoulGMI", logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(now - 5 * 60 * 60 * 1000).toISOString(), url: "https://x.com/RaoulGMI" }, // 5h ago
      { id: 6, title: "Follow for Coinbase & crypto updates", source: { title: "Brian Armstrong" }, username: "brian_armstrong", logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(now - 8 * 60 * 60 * 1000).toISOString(), url: "https://x.com/brian_armstrong" }, // 8h ago
      { id: 7, title: "Follow for DeFi & crypto insights", source: { title: "Intocryptoverse" }, username: "intocryptoverse", logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(now - 3 * 60 * 60 * 1000).toISOString(), url: "https://x.com/intocryptoverse" }, // 3h ago
      { id: 8, title: "Follow for crypto legal analysis", source: { title: "CryptoLawUS" }, username: "CryptoLawUS", logo: "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", created_at: new Date(now - 6 * 60 * 60 * 1000).toISOString(), url: "https://x.com/CryptoLawUS" } // 6h ago
    ];
    setNews(xUpdates);
  };

  const fetchCryptoArticles = async () => {
    try {
      // Direct RSS feeds - using CORS proxy for cross-origin requests
      const rssFeeds = [
        { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', source: 'CoinDesk', logo: 'https://www.coindesk.com/favicon.ico' },
        { url: 'https://cointelegraph.com/rss', source: 'Cointelegraph', logo: 'https://cointelegraph.com/favicon.ico' },
        { url: 'https://cryptoslate.com/feed/', source: 'CryptoSlate', logo: '/CryptoSlate.jpg' },
        { url: 'https://decrypt.co/feed', source: 'Decrypt', logo: '/Decrypt.png' },
        { url: 'https://www.theblockcrypto.com/rss.xml', source: 'The Block', logo: '/TheBlock.jpeg' },
        { url: 'https://cryptonews.com/news/feed/', source: 'CryptoNews', logo: 'https://cryptonews.com/favicon.ico' }
      ];

      const allArticles = [];
      let articleId = 1;

      // Fetch from each RSS feed using CORS proxy with fallbacks
      for (const feed of rssFeeds) {
        try {
          console.log(`Fetching ${feed.source}...`);
          
          // Try multiple CORS proxies as fallbacks
          const corsProxies = [
            `https://corsproxy.io/?${encodeURIComponent(feed.url)}`,
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(feed.url)}`,
            `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(feed.url)}`
          ];
          
          let response = null;
          let xmlText = null;
          
          // Try each proxy until one works
          for (const proxyUrl of corsProxies) {
            try {
              response = await fetch(proxyUrl);
              if (response.ok) {
                xmlText = await response.text();
                break;
              }
            } catch (proxyError) {
              continue; // Try next proxy
            }
          }

          if (!xmlText) {
            console.error(`❌ Failed to fetch ${feed.source} from all proxies`);
            continue;
          }

          // Parse XML
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

          // Get items (works for both RSS and Atom feeds)
          const items = xmlDoc.querySelectorAll('item, entry');
          
          console.log(`✓ Found ${items.length} articles from ${feed.source}`);

          // Parse each item (limit to 3 per source)
          Array.from(items).slice(0, 5).forEach(item => {
            const title = item.querySelector('title')?.textContent || '';
            const link = item.querySelector('link')?.textContent || item.querySelector('link')?.getAttribute('href') || '';
            const pubDate = item.querySelector('pubDate, published')?.textContent || new Date().toISOString();
            const description = item.querySelector('description')?.textContent || '';

            // Filter for cryptocurrency-related content
            const cryptoKeywords = ['crypto', 'bitcoin', 'btc', 'ethereum', 'eth', 'blockchain', 'altcoin', 'defi', 'nft', 'xrp', 'ripple', 'binance', 'coinbase', 'solana', 'cardano', 'dogecoin', 'shiba', 'web3', 'token', 'coin', 'mining', 'wallet', 'exchange'];
            const titleLower = title.toLowerCase();
            const descLower = description.toLowerCase();
            
            // Check if title or description contains crypto keywords
            const isCryptoRelated = cryptoKeywords.some(keyword => 
              titleLower.includes(keyword) || descLower.includes(keyword)
            );

            if (title && link && isCryptoRelated) {
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

      // Take top 20 (to display 16 when expanded)
      const topArticles = allArticles.slice(0, 20);
      
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
      { id: 3, title: "Top Crypto Trading Strategies for 2025", source: "CryptoSlate", logo: "/CryptoSlate.jpg", created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), url: "https://cryptoslate.com/crypto-trading-strategies/" },
      { id: 4, title: "Institutional Interest in Crypto Grows", source: "Yahoo Finance", logo: "https://s.yimg.com/cv/apiv2/default/icons/favicon_y19_32x32.ico", created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), url: "https://finance.yahoo.com/news/institutional-investors-cryptocurrency/" },
      { id: 5, title: "DeFi Market Shows Strong Growth", source: "The Motley Fool", logo: "https://g.foolcdn.com/art/companylogos/mark/MF.png", created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), url: "https://www.fool.com/investing/2024/12/03/defi-cryptocurrency-market/" },
      { id: 6, title: "NFT Market Sees Renewed Activity", source: "Crypto News", logo: "https://crypto.news/favicon.ico", created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), url: "https://crypto.news/nft-market-trends/" },
      { id: 7, title: "Altcoin Season: What to Watch", source: "Cointribune", logo: "https://www.cointribune.com/favicon.ico", created_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), url: "https://www.cointribune.com/en/altcoin-season-guide/" },
      { id: 8, title: "New Crypto Regulations Take Effect", source: "CoinDesk", logo: "https://www.coindesk.com/favicon.ico", created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), url: "https://www.coindesk.com/policy/2024/12/03/crypto-regulations/" },
      { id: 9, title: "Market Analysis: Bull Run Continues", source: "Cointelegraph", logo: "https://cointelegraph.com/favicon.ico", created_at: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(), url: "https://cointelegraph.com/news/bitcoin-bull-market-analysis" },
      { id: 10, title: "Expert Insights on Crypto Investing", source: "CryptoSlate", logo: "/CryptoSlate.jpg", created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), url: "https://cryptoslate.com/crypto-investment-guide/" }
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
      { id: 8, title: "Apex Crypto Weekly Update", channel: "Apex Crypto", views: "16h ago", url: "https://youtube.com/@ApexCryptoInsights/videos", thumbnail: null },
      { id: 9, title: "Good Evening Crypto News", channel: "Good Evening Crypto", views: "18h ago", url: "https://youtube.com/@GoodEveningCrypto/videos", thumbnail: null },
      { id: 10, title: "Black Swan Capitalist Update", channel: "Black Swan Capitalist", views: "20h ago", url: "https://youtube.com/@blackswancapitalist/videos", thumbnail: null }
    ];

    try {
      // YouTube API Key Rotation System
      // Rotates through 9 API keys when quota is hit (403 error)
      const API_KEYS = [
        import.meta.env.VITE_YOUTUBE_API_KEY, // Original key
        'AIzaSyD3xwegZi-AFG9jo54_zpjWaixR7-d3obY',
        'AIzaSyA1hS2gb2vRncjPJMJFvt4Pa4_i38hURvA',
        'AIzaSyA0C6jDg78eo9N-0V5nSvo8HdNWC99X92Q',
        'AIzaSyD0-a6CC3f6klDlyWtExtKFLGR3Nmk6DI0',
        'AIzaSyC2_GZ1UChltsUtBFAmrhAlflrutvMCY34',
        'AIzaSyAUXbJ5t3OC1UogCtDrgcsICc5Pa8PE3GQ',
        'AIzaSyCz73iKmsiMPLhkwpq5tIMLdaB6acj_anU',
        'AIzaSyBwygUKgY4PhqqVSpYwDrLxb4_8km1FQVg'
      ];
      
      // Get current API key index from localStorage (0-8)
      let currentKeyIndex = parseInt(localStorage.getItem('youtube_api_key_index') || '0');
      
      // Ensure we have at least one valid key
      const validKeys = API_KEYS.filter(key => key && key.length > 0);
      if (validKeys.length === 0) {
        console.log('No YouTube API keys available, using fallback videos');
        setVideos(fallbackVideos);
        return;
      }
      
      // Try to use current key, rotate if quota exceeded
      let API_KEY = API_KEYS[currentKeyIndex];
      
      console.log(`Using YouTube API key #${currentKeyIndex + 1}`);
      
      const channels = {
        'Digital Outlook': 'UCG9sTui02o3W4CbHQIP-l7g',
        'Crypto Sensei': 'UCdAz9h6B4j48m_Z-5q0GehA',
        'Mickle': 'UC-widOciShnJDhNEF23T06w',
        'Chain of Blocks': 'UCftxsv8P_Hz32KJuiVQ_0Wg',
        'Zach Rector': 'UC4LwOm1guXDzPPGWnq_YlsA',
        'Altcoin Daily': 'UCbLhGKVY-bJPcawebgtNfbw',
        'Paul Barron': 'UC4VPa7EOvObpyCRI4YKRQRw',
        'Apex Crypto': 'UCQ0lC-yRj8Bwz8eFv290_LA',
        'Good Evening Crypto': 'UCEALkfpMmmWQkGXWhRUmslA',
        'Black Swan Capitalist': 'UCURoln2BKCvvMT5peanKAvw',
        'Crypto with Klaus': 'UCOb8ZvB7CK7-IEf-8RmhULg',
        'CryptoWendyO': 'UCla2jS8BrfLJj7kbKyy5_ew'
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
            
            // Log the detailed error
            console.error(`❌ YouTube API error for ${channelName}:`, {
              status: response.status,
              statusText: response.statusText,
              error: errorData,
              reason: errorData?.error?.errors?.[0]?.reason,
              message: errorData?.error?.message
            });
            
            // Check if quota exceeded (403 error) - try all remaining keys
            if (response.status === 403 && validKeys.length > 1) {
              console.warn(`⚠️ API key issue for key #${currentKeyIndex + 1}: ${errorData?.error?.message || 'Unknown error'}`);
              
              // Try all remaining keys
              let keyAttempts = 0;
              const maxAttempts = validKeys.length - 1; // Don't retry the same key
              let success = false;
              
              while (keyAttempts < maxAttempts && !success) {
                keyAttempts++;
                currentKeyIndex = (currentKeyIndex + 1) % validKeys.length;
                API_KEY = validKeys[currentKeyIndex];
                localStorage.setItem('youtube_api_key_index', currentKeyIndex.toString());
                console.log(`✓ Trying YouTube API key #${currentKeyIndex + 1}`);
                
                try {
                  const retryResponse = await fetch(
                    `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${channelId}&part=snippet,id&order=date&maxResults=50&type=video&publishedAfter=${publishedAfter}${searchQuery}`
                  );
                  
                  if (retryResponse.ok) {
                    success = true;
                    const retryData = await retryResponse.json();
              
                    if (retryData.items && retryData.items.length > 0) {
                      console.log(`✓ Found ${retryData.items.length} videos from ${channelName} with key #${currentKeyIndex + 1}`);
                      
                      const retryVideoIds = [];
                      const retryTempVideos = [];
                      
                      retryData.items.forEach(item => {
                        const title = item.snippet.title.toLowerCase();
                        const description = item.snippet.description?.toLowerCase() || '';
                        
                        if (title.includes('#shorts') || title.includes('#short') || 
                            description.includes('#shorts') || description.includes('youtube shorts')) {
                          return;
                        }
                        
                        retryVideoIds.push(item.id.videoId);
                        retryTempVideos.push(item);
                      });
                      
                      if (retryVideoIds.length > 0) {
                        try {
                          const retryDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${retryVideoIds.join(',')}&part=contentDetails`;
                          const retryDetailsResponse = await fetch(retryDetailsUrl);
                          
                          if (retryDetailsResponse.ok) {
                            const retryDetailsData = await retryDetailsResponse.json();
                            const retryDurationMap = {};
                            
                            retryDetailsData.items?.forEach(video => {
                              const duration = video.contentDetails?.duration || "PT0S";
                              const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                              if (!match) return; // Skip invalid duration
                              const hours = parseInt(match[1] || 0);
                              const minutes = parseInt(match[2] || 0);
                              const seconds = parseInt(match[3] || 0);
                              const totalSeconds = hours * 3600 + minutes * 60 + seconds;
                              retryDurationMap[video.id] = totalSeconds;
                            });
                            
                            retryTempVideos.forEach((item, index) => {
                              const videoIdStr = retryVideoIds[index];
                              const duration = retryDurationMap[videoIdStr] || 0;
                              
                              // Only keep videos longer than 2 minutes 40 seconds (160 seconds)
                              if (duration <= 160) {
                                return;
                              }
                              
                              const publishedDate = new Date(item.snippet.publishedAt);
                              const hoursAgo = Math.floor((new Date() - publishedDate) / (1000 * 60 * 60));
                              const timeAgo = hoursAgo < 1 ? 'Just now' : `${hoursAgo}h ago`;
                              
                              allVideos.push({
                                id: videoId++,
                                title: cleanText(item.snippet.title),
                                channel: channelName,
                                views: timeAgo,
                                url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                                thumbnail: item.snippet.thumbnails.medium.url,
                                publishedAt: item.snippet.publishedAt
                              });
                            });
                          }
                        } catch (retryDurationError) {
                          console.error(`Error fetching durations for ${channelName} (retry):`, retryDurationError);
                        }
                      }
                      successfulChannels++;
                    }
                  } else {
                    const retryErrorData = await retryResponse.json();
                    console.warn(`Key #${currentKeyIndex + 1} failed: ${retryErrorData?.error?.message || 'Unknown'}`);
                  }
                } catch (retryError) {
                  console.error(`Error with key #${currentKeyIndex + 1}:`, retryError.message);
                }
              }
              
              if (!success) {
                console.error(`❌ All ${validKeys.length} API keys exhausted for ${channelName}`);
                failedChannels++;
              }
              continue;
            }
            
            failedChannels++;
          }
          
          const data = await response.json();
          
          if (data.items && data.items.length > 0) {
            console.log(`✓ Found ${data.items.length} videos from ${channelName} in last 24h`);
            
            // First, collect video IDs for duration check
            const videoIds = [];
            const tempVideos = [];
            
            data.items.forEach(item => {
              const title = item.snippet.title.toLowerCase();
              const description = item.snippet.description?.toLowerCase() || '';
              
              // Skip if it's a Short (contains #shorts or youtube shorts indicators)
              if (title.includes('#shorts') || title.includes('#short') || 
                  description.includes('#shorts') || description.includes('youtube shorts')) {
                return; // Skip this video
              }
              
              videoIds.push(item.id.videoId);
              tempVideos.push(item);
            });
            
            // Fetch video durations to filter out videos under 90 seconds
            if (videoIds.length > 0) {
              try {
                const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${videoIds.join(',')}&part=contentDetails`;
                const detailsResponse = await fetch(videoDetailsUrl);
                
                if (detailsResponse.ok) {
                  const detailsData = await detailsResponse.json();
                  const durationMap = {};
                  
                  // Parse ISO 8601 duration format (PT1M30S = 1 min 30 sec)
                  detailsData.items?.forEach(video => {
                    const duration = video.contentDetails?.duration || "PT0S";
                    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                              if (!match) return; // Skip invalid duration
                    const hours = parseInt(match[1] || 0);
                    const minutes = parseInt(match[2] || 0);
                    const seconds = parseInt(match[3] || 0);
                    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
                    durationMap[video.id] = totalSeconds;
                  });
                  
                  // Now add videos that are 90+ seconds
                  tempVideos.forEach((item, index) => {
                    const currentVideoId = videoIds[index];
                    const duration = durationMap[currentVideoId] || 0;
                    
                    // Only keep videos longer than 2 minutes 40 seconds (160 seconds)
                    if (duration <= 160) {
                      console.log(`Skipping ${item.snippet.title} - duration: ${duration}s (too short)`);
                      return;
                    }
                    
                    const publishedDate = new Date(item.snippet.publishedAt);
                    const hoursAgo = Math.floor((new Date() - publishedDate) / (1000 * 60 * 60));
                    const timeAgo = hoursAgo < 1 ? 'Just now' : `${hoursAgo}h ago`;
                    
                    allVideos.push({
                      id: videoId++,
                      title: cleanText(item.snippet.title),
                      channel: channelName,
                      views: timeAgo,
                      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                      thumbnail: item.snippet.thumbnails.medium.url,
                      publishedAt: item.snippet.publishedAt
                    });
                  });
                }
              } catch (durationError) {
                console.error(`Error fetching durations for ${channelName}:`, durationError);
                // Don't add videos if duration check fails - we need to ensure 90+ seconds only
                console.log(`Skipping ${channelName} videos due to duration check failure`);
              }
            }
            
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

  // Handle expand/collapse with scroll to last position or top
  const handlePricesToggle = (action) => {
    if (action === 'more') {
      // Expand one level (up to 3 levels: 6->34, 34->68, 68->102)
      setPricesExpanded(prev => Math.min(prev + 1, 3));
    } else {
      // Collapse to original state (0) and scroll to section top
      setPricesExpanded(0);
      if (pricesRef.current) {
        setTimeout(() => {
          pricesRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  };

  const fetchCryptoMemes = async () => {
    setMemesLoading(true);
    try {
      // Check cache first (10 minute expiry for fresher content)
      // Version 3: Top of week from multiple subreddits via CORS proxy
      const CACHE_VERSION = 'v3';
      const cached = localStorage.getItem('kryptocurrent_memes');
      const cacheTimestamp = localStorage.getItem('kryptocurrent_memes_timestamp');
      const cacheVersion = localStorage.getItem('kryptocurrent_memes_version');
      
      if (cached && cacheTimestamp && cacheVersion === CACHE_VERSION) {
        const cacheAge = Date.now() - parseInt(cacheTimestamp);
        const tenMinutes = 10 * 60 * 1000; // 10 minutes instead of 1 hour
        
        if (cacheAge < tenMinutes) {
          console.log(`✓ Using cached memes (${Math.floor(cacheAge / 60000)} minutes old)`);
          const cachedMemes = JSON.parse(cached);
          console.log(`✓ Loaded ${cachedMemes.length} memes from cache`);
          console.log('First 3 memes:', cachedMemes.slice(0, 3).map(m => ({ title: m.title, url: m.url })));
          setMemes(cachedMemes);
          setMemesLoading(false);
          return;
        } else {
          console.log('Cache expired (>10 minutes), fetching fresh memes...');
        }
      }

      console.log('Fetching crypto memes from Reddit...');
      
      // Fetch top posts from this week for good mix of fresh and popular content
      const subreddits = ['cryptocurrencymemes', 'dogecoin', 'CryptoCurrency'];
      const allMemes = [];
      let memeId = 1;

      for (const subreddit of subreddits) {
        try {
          // Reddit URL - get top posts from this week
          const redditUrl = `https://old.reddit.com/r/${subreddit}/top.json?t=week&limit=25`;
          
          // Try multiple CORS proxies
          const corsProxies = [
            `https://corsproxy.io/?${encodeURIComponent(redditUrl)}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(redditUrl)}`,
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(redditUrl)}`
          ];
          
          let data = null;
          
          // Try each proxy until one works
          for (const proxyUrl of corsProxies) {
            try {
              console.log(`Trying to fetch from r/${subreddit}...`);
              const response = await fetch(proxyUrl);
              if (response.ok) {
                data = await response.json();
                console.log(`✓ Got ${data.data.children.length} posts from r/${subreddit}`);
                break;
              }
            } catch (proxyError) {
              continue; // Try next proxy
            }
          }
          
          if (!data) {
            console.log(`⚠️ All proxies failed for r/${subreddit}, skipping...`);
            continue;
          }
          
          // Filter for image posts only
          data.data.children.forEach(post => {
            const postData = post.data;
            
            // For r/CryptoCurrency, only include meme-flaired posts
            if (subreddit === 'CryptoCurrency') {
              if (!postData.link_flair_text || !postData.link_flair_text.toLowerCase().includes('meme')) {
                return;
              }
            }
            
            // Only include posts with images and exclude videos/galleries
            if (postData.post_hint === 'image' && postData.url && 
                (postData.url.endsWith('.jpg') || postData.url.endsWith('.png') || 
                 postData.url.endsWith('.jpeg') || postData.url.endsWith('.gif') ||
                 postData.url.includes('i.redd.it') || postData.url.includes('i.imgur.com'))) {
              
              // Skip if already have this meme (duplicate from different subreddit)
              if (allMemes.some(m => m.url === `https://reddit.com${postData.permalink}`)) {
                return;
              }
              
              allMemes.push({
                id: memeId++,
                title: postData.title,
                image: postData.url,
                upvotes: postData.ups,
                comments: postData.num_comments,
                subreddit: postData.subreddit,
                url: `https://reddit.com${postData.permalink}`,
                author: postData.author,
                created: new Date(postData.created_utc * 1000)
              });
            }
          });
          
        } catch (error) {
          console.error(`Error fetching from r/${subreddit}:`, error);
        }
      }

      console.log(`✓ Collected ${allMemes.length} image memes from multiple subreddits`);

      // Sort by upvotes and take top 40
      allMemes.sort((a, b) => b.upvotes - a.upvotes);
      const topMemes = allMemes.slice(0, 40);
      
      if (topMemes.length === 0) {
        console.warn('⚠️ No memes found - Reddit may be blocking requests');
        // Set empty array to stop loading spinner
        setMemes([]);
      } else {
        console.log(`✓ Loaded ${topMemes.length} crypto memes`);
        setMemes(topMemes);
        
        // Cache for 10 minutes with version
        localStorage.setItem('kryptocurrent_memes', JSON.stringify(topMemes));
        localStorage.setItem('kryptocurrent_memes_timestamp', Date.now().toString());
        localStorage.setItem('kryptocurrent_memes_version', 'v3');
      }
      
    } catch (error) {
      console.error('Error fetching memes:', error);
      setMemes([]);
    } finally {
      setMemesLoading(false);
    }
  };

  const fetchXRPExchangeBalance = async () => {
    try {
      // Check cache first (5 minute expiry)
      const cached = localStorage.getItem('kryptocurrent_xrp_exchange_balance');
      const cacheTimestamp = localStorage.getItem('kryptocurrent_xrp_exchange_balance_timestamp');
      
      if (cached && cacheTimestamp) {
        const cacheAge = Date.now() - parseInt(cacheTimestamp);
        const fiveMinutes = 5 * 60 * 1000;
        
        if (cacheAge < fiveMinutes) {
          console.log(`✓ Using cached XRP exchange balance (${Math.floor(cacheAge / 60000)} minutes old)`);
          setXrpExchangeBalance(JSON.parse(cached));
          return;
        }
      }

      console.log('Fetching XRP exchange balance from serverless API...');
      
      // Call our Vercel serverless function (no CORS issues!)
      const response = await fetch('/api/xrp-exchange-balance');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const balanceData = await response.json();
      
      console.log('✓ Fetched XRP exchange balance:', balanceData);
      
      setXrpExchangeBalance(balanceData);
      
      // Cache for 5 minutes
      localStorage.setItem('kryptocurrent_xrp_exchange_balance', JSON.stringify(balanceData));
      localStorage.setItem('kryptocurrent_xrp_exchange_balance_timestamp', Date.now().toString());
      
    } catch (error) {
      console.error('Error fetching XRP exchange balance:', error);
      // Set fallback data
      setXrpExchangeBalance({
        total: 4180000000,
        change7d: -2.1,
        lastUpdated: new Date().toISOString(),
        source: 'Fallback',
        error: true
      });
    }
  };

  const handleNewsToggle = () => {
    if (newsExpanded && xRef.current) {
      setTimeout(() => {
        xRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
    setNewsExpanded(!newsExpanded);
  };

  const handleVideosToggle = () => {
    if (videosExpanded && videosRef.current) {
      setTimeout(() => {
        videosRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
    setVideosExpanded(!videosExpanded);
  };

  const handleShortsToggle = () => {
    if (shortsExpanded && shortsRef.current) {
      setTimeout(() => {
        shortsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
    setShortsExpanded(!shortsExpanded);
  };

  const handleArticlesToggle = () => {
    if (articlesExpanded && articlesRef.current) {
      setTimeout(() => {
        articlesRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
    setArticlesExpanded(!articlesExpanded);
  };

  const handleMemesToggle = () => {
    if (memesExpanded && memesRef.current) {
      setTimeout(() => {
        memesRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
    setMemesExpanded(!memesExpanded);
  };

  // Desktop: show 24 prices unless expanded, Mobile: show 4 prices unless expanded
  // News: show 4 unless expanded
  // Videos: show 4 unless expanded, 10 when expanded
  // Articles: show 4 unless expanded
  // Filter out any invalid crypto data and remove duplicates
  const validCryptoPrices = cryptoPrices
    .filter(crypto => 
      crypto && 
      crypto.id && 
      crypto.symbol && 
      crypto.current_price !== null && 
      crypto.current_price !== undefined
    )
    .filter((crypto, index, self) => 
      // Remove duplicates by keeping only the first occurrence of each ID or symbol
      index === self.findIndex(c => 
        c.id === crypto.id || 
        (c.symbol.toLowerCase() === crypto.symbol.toLowerCase() && c.name.toLowerCase() === crypto.name.toLowerCase())
      )
    );
  const displayedPrices = validCryptoPrices.slice(0, pricesExpanded === 0 ? 18 : pricesExpanded === 1 ? 52 : pricesExpanded === 2 ? 84 : validCryptoPrices.length);
  const displayedNews = newsExpanded ? news : news.slice(0, 4);
  const displayedVideos = videosExpanded ? videos.slice(0, 8) : videos.slice(0, 3);
  const displayedArticles = articlesExpanded ? articles.slice(0, 16) : articles.slice(0, 4);

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
        <div ref={pricesRef} className="bg-slate-800/50 backdrop-blur rounded-xl p-6 mb-8">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Current Conditions</h2>
              <button onClick={() => fetchCryptoPrices(priceCategory)} className="flex items-center gap-1 px-2 py-1.5 text-sm bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition">
                <RefreshCw size={14} />Refresh
              </button>
            </div>
            
            {/* Category Toggle Buttons and Search */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setPriceCategory('top100');
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                  priceCategory === 'top100'
                    ? 'bg-[#ffc93c] text-black'
                    : 'bg-slate-700/50 text-white hover:bg-slate-700'
                }`}
              >
                Top 100
              </button>
              <button
                onClick={() => {
                  setPriceCategory('iso20022');
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                  priceCategory === 'iso20022'
                    ? 'bg-[#ffc93c] text-black'
                    : 'bg-slate-700/50 text-white hover:bg-slate-700'
                }`}
              >
                ISO 20022 Coins
              </button>
              <button
                onClick={() => {
                  setPriceCategory('ai');
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                  priceCategory === 'ai'
                    ? 'bg-[#ffc93c] text-black'
                    : 'bg-slate-700/50 text-white hover:bg-slate-700'
                }`}
              >
                Top AI Coins
              </button>
              <button
                onClick={() => {
                  setPriceCategory('meme');
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                  priceCategory === 'meme'
                    ? 'bg-[#ffc93c] text-black'
                    : 'bg-slate-700/50 text-white hover:bg-slate-700'
                }`}
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
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setPriceCategory('top100');
                    }}
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
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="animate-spin mx-auto mb-2 text-[#ffc93c]" size={32} />
              <p className="text-gray-400">Loading prices...</p>
            </div>
          ) : (
            <>
              {/* Mobile: Show 6, then 34, 68, 102 with expand/collapse buttons */}
              <div className="md:hidden">
                <div className="grid grid-cols-2 gap-2">
                  {validCryptoPrices.slice(0, pricesExpanded === 0 ? 6 : pricesExpanded === 1 ? 34 : pricesExpanded === 2 ? 68 : 102).map((crypto) => (
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
                {validCryptoPrices.length > 6 && (
                  <div className="mt-3 flex gap-2">
                    {pricesExpanded > 0 && (
                      <button 
                        onClick={() => handlePricesToggle('less')}
                        className="flex-1 px-4 py-2 bg-slate-600 text-white hover:bg-slate-500 rounded-lg transition font-semibold text-sm"
                      >
                        Show Less
                      </button>
                    )}
                    {pricesExpanded < 3 && validCryptoPrices.length > (pricesExpanded === 0 ? 6 : pricesExpanded === 1 ? 34 : 68) && (
                      <button 
                        onClick={() => handlePricesToggle('more')}
                        className="flex-1 px-4 py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold text-sm"
                      >
                        Show More
                      </button>
                    )}
                  </div>
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
                {validCryptoPrices.length > 18 && (
                  <div className="mt-3 flex gap-2">
                    {pricesExpanded > 0 && (
                      <button 
                        onClick={() => handlePricesToggle('less')}
                        className="flex-1 px-4 py-2 bg-slate-600 text-white hover:bg-slate-500 rounded-lg transition font-semibold text-sm"
                      >
                        Show Less
                      </button>
                    )}
                    {pricesExpanded < 3 && validCryptoPrices.length > (pricesExpanded === 0 ? 18 : pricesExpanded === 1 ? 52 : 84) && (
                      <button 
                        onClick={() => handlePricesToggle('more')}
                        className="flex-1 px-4 py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold text-sm"
                      >
                        Show More
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* XRP Exchange Balance */}
          {xrpExchangeBalance && (
            <div className="mt-4 p-2 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-1">
                  <img src="/XRPlogo.jpg" alt="XRP" className="w-5 h-5 rounded" />
                  <div>
                    <h3 className="text-sm font-bold text-white">XRP Currently on Exchanges</h3>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-[#ffc93c]">
                    ~{(xrpExchangeBalance.total / 1000000000).toFixed(2)}B
                  </div>
                  <div className={`flex items-center justify-end gap-0.5 text-xs ${xrpExchangeBalance.change7d < 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {xrpExchangeBalance.change7d < 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                    <span>{Math.abs(xrpExchangeBalance.change7d).toFixed(1)}% (7d)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ETF Tracker */}
          <div className="mt-6 p-3 bg-slate-700/50 rounded-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <img src="/XRPlogo.jpg" alt="XRP" className="w-6 h-6 rounded" />
                <div>
                  <h3 className="text-base font-bold text-white">XRP ETF Tracker</h3>
                  <p className="text-xs text-gray-300 hidden md:block">Track spot ETF stats from our good friends at XRP Insights</p>
                </div>
              </div>
              <a href="https://xrp-insights.com" target="_blank" rel="noopener noreferrer" className="px-3 md:px-4 py-1.5 md:py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold whitespace-nowrap text-xs md:text-sm">
                Visit →
              </a>
            </div>
          </div>
        </div>

        {/* Updates from X Section - Improved Profile Links */}
        <div ref={xRef} className="bg-slate-800/50 backdrop-blur rounded-xl p-6 mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">Xpository</h2>
          </div>
          
          {/* Mobile: Show 3 accounts unexpanded (includes Genius List) */}
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
                      <p className="text-xs text-gray-400 truncate">@{account.username}</p>
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
                onClick={handleNewsToggle}
                className="mt-3 w-full px-4 py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold text-sm"
              >
                {newsExpanded ? 'Show Less' : 'Show More'}
              </button>
            )}
          </div>

          {/* Desktop: Show 3 accounts in 3 columns unexpanded (includes Genius List) */}
          <div className="hidden md:block">
            <div className="grid md:grid-cols-3 gap-3">
              {(newsExpanded ? news : news.slice(0, 3)).map((account) => (
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
                      <p className="text-xs text-gray-400 truncate">@{account.username}</p>
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
                onClick={handleNewsToggle}
                className="mt-4 w-full px-4 py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold text-sm"
              >
                {newsExpanded ? 'Show Less' : 'Show More'}
              </button>
            )}
          </div>
        </div>

        {/* Videos Section - 2 Columns on Desktop, Expandable on Mobile */}
        <div ref={videosRef} className="bg-slate-800/50 backdrop-blur rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-white">Click-Worthy</h2>
          
          {/* Mobile: Show 3 with expand button */}
          <div className="md:hidden">
            <div className="grid grid-cols-1 gap-4">
              {(videosExpanded ? videos.slice(0, 12) : videos.slice(0, 3)).map((video) => (
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
            {videos.length > 3 && (
              <button 
                onClick={handleVideosToggle}
                className="mt-3 w-full px-4 py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold text-sm"
              >
                {videosExpanded ? 'Show Less' : 'Show More'}
              </button>
            )}
          </div>

          {/* Desktop: Show 4 in 2 columns with expand button */}
          <div className="hidden md:block">
            <div className="grid md:grid-cols-2 gap-4">
              {(videosExpanded ? videos.slice(0, 12) : videos.slice(0, 4)).map((video) => (
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
            {videos.length > 3 && (
              <button 
                onClick={handleVideosToggle}
                className="mt-3 w-full px-4 py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold text-sm"
              >
                {videosExpanded ? 'Show Less' : 'Show More'}
              </button>
            )}
          </div>
        </div>

        {/* Quick Hits Section - Short videos under 90 seconds */}
        <div ref={shortsRef} className="bg-slate-800/50 backdrop-blur rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-white">Quick Hits</h2>
          
          {/* Mobile: Show 3 with expand button */}
          <div className="md:hidden">
            <div className="grid grid-cols-1 gap-4">
              {(shortsExpanded ? shorts.slice(0, 12) : shorts.slice(0, 3)).map((short) => (
                <a key={short.id} href={short.url} target="_blank" rel="noopener noreferrer" className="group block bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700 transition-all duration-300 cursor-pointer border border-transparent hover:border-[#ffc93c]/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#ffc93c]/10">
                  <div className="flex gap-4">
                    <div className="w-32 h-20 bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:ring-2 group-hover:ring-[#ffc93c]/50 transition-all">
                      {short.thumbnail ? (
                        <img src={short.thumbnail} alt={short.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      ) : (
                        <span className="text-2xl group-hover:scale-110 transition-transform">▶️</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 line-clamp-2 text-sm group-hover:text-[#ffc93c] transition-colors">{short.title}</h3>
                      <p className="text-xs opacity-70">{short.channel}</p>
                      <p className="text-xs opacity-60 mt-1">{short.views}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
            {shorts.length > 3 && (
              <button 
                onClick={handleShortsToggle}
                className="mt-3 w-full px-4 py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold text-sm"
              >
                {shortsExpanded ? 'Show Less' : 'Show More'}
              </button>
            )}
          </div>

          {/* Desktop: Show 4 in 2 columns with expand button */}
          <div className="hidden md:block">
            <div className="grid md:grid-cols-2 gap-4">
              {(shortsExpanded ? shorts.slice(0, 12) : shorts.slice(0, 4)).map((short) => (
                <a key={short.id} href={short.url} target="_blank" rel="noopener noreferrer" className="group block bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700 transition-all duration-300 cursor-pointer border border-transparent hover:border-[#ffc93c]/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#ffc93c]/10">
                  <div className="flex gap-4">
                    <div className="w-32 h-20 bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:ring-2 group-hover:ring-[#ffc93c]/50 transition-all">
                      {short.thumbnail ? (
                        <img src={short.thumbnail} alt={short.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      ) : (
                        <span className="text-2xl group-hover:scale-110 transition-transform">▶️</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 line-clamp-2 text-sm group-hover:text-[#ffc93c] transition-colors">{short.title}</h3>
                      <p className="text-xs opacity-70">{short.channel}</p>
                      <p className="text-xs opacity-60 mt-1">{short.views}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
            {shorts.length > 3 && (
              <button 
                onClick={handleShortsToggle}
                className="mt-3 w-full px-4 py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold text-sm"
              >
                {shortsExpanded ? 'Show Less' : 'Show More'}
              </button>
            )}
          </div>
        </div>

        {/* Articles Section - 2 Columns on Desktop, Expandable on Mobile */}
        <div ref={articlesRef} className="bg-slate-800/50 backdrop-blur rounded-xl p-6 mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">Good News</h2>
          </div>
          
          {/* Mobile: Show 3 with expand button */}
          <div className="md:hidden">
            <div className="grid grid-cols-1 gap-4">
              {(articlesExpanded ? articles.slice(0, 16) : articles.slice(0, 3)).map((article) => (
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
            {articles.length > 3 && (
              <button 
                onClick={handleArticlesToggle}
                className="mt-3 w-full px-4 py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold text-sm"
              >
                {articlesExpanded ? 'Show Less' : 'Show More'}
              </button>
            )}
          </div>

          {/* Desktop: Show 4 in 2 columns with expand button */}
          <div className="hidden md:block">
            <div className="grid md:grid-cols-2 gap-4">
              {(articlesExpanded ? articles.slice(0, 16) : articles.slice(0, 4)).map((article) => (
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
                onClick={handleArticlesToggle}
                className="mt-3 w-full px-4 py-2 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded-lg transition font-semibold text-sm"
              >
                {articlesExpanded ? 'Show Less' : 'Show More'}
              </button>
            )}
          </div>
        </div>

        {/* Crypto Memes Section - Horizontal Scroll */}
        <div ref={memesRef} className="bg-slate-800/50 backdrop-blur rounded-xl p-6 mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Happy Tears</h2>
              {memes.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Last updated: {new Date(parseInt(localStorage.getItem('kryptocurrent_memes_timestamp') || Date.now())).toLocaleTimeString()}
                </p>
              )}
            </div>
            <button 
              onClick={() => {
                // Clear cache to force fresh fetch
                localStorage.removeItem('kryptocurrent_memes');
                localStorage.removeItem('kryptocurrent_memes_timestamp');
                localStorage.removeItem('kryptocurrent_memes_version');
                console.log('Cache cleared, fetching fresh memes...');
                fetchCryptoMemes();
              }}
              className="px-3 py-1 bg-[#ffc93c] text-black hover:bg-[#ffb700] rounded text-sm font-semibold transition"
            >
              Refresh Memes
            </button>
          </div>
          
          {memesLoading ? (
            <div className="text-center py-8 text-gray-400">
              <RefreshCw className="animate-spin mx-auto mb-2" size={32} />
              <p>Loading memes from Reddit...</p>
            </div>
          ) : memes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No memes available at the moment. Try refreshing the page!</p>
            </div>
          ) : (
            <div className="relative">
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-[#ffc93c] scrollbar-track-slate-700/50 pb-4">
                <div className="flex gap-4" style={{ width: 'max-content' }}>
                  {memes.map((meme) => (
                    <a 
                      key={meme.id} 
                      href={meme.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group block bg-slate-700/50 rounded-lg overflow-hidden hover:bg-slate-700 transition-all duration-300 cursor-pointer border border-transparent hover:border-[#ffc93c]/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#ffc93c]/10 flex-shrink-0"
                      style={{ width: '300px' }}
                    >
                      <div className="aspect-square relative overflow-hidden bg-black">
                        <img 
                          src={meme.image} 
                          alt={meme.title}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-[#ffc93c] transition-colors">
                          {meme.title}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <TrendingUp size={14} className="text-green-400" />
                            {meme.upvotes.toLocaleString()}
                          </span>
                          <span>r/{meme.subreddit}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
              <div className="text-center mt-3">
                <p className="text-xs text-gray-400">
                  Scroll horizontally to see all {memes.length} memes →
                </p>
              </div>
            </div>
          )}
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
    </div>
  );
}
