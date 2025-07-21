import { supabase } from '@/lib/supabase';
import { TradeValidator, TradeValidationResult } from './tradeValidator';

export interface KrakenBalance {
  [currency: string]: string;
}

export interface KrakenOrderRequest {
  pair: string;
  type: 'buy' | 'sell';
  ordertype: 'market' | 'limit';
  volume: string;
  price?: string;
}

export interface KrakenOrderResponse {
  error?: string[];
  result?: {
    descr: { order: string };
    txid: string[];
  };
}

interface CryptoPrice {
  [key: string]: number;
}

const logError = (type: 'error' | 'warning' | 'info', message: string, details?: string) => {
  console.log(`[${type.toUpperCase()}] ${message}`, details || '');
  if (typeof window !== 'undefined' && (window as any).logError) {
    (window as any).logError(type, message, details, 'Kraken Service');
  }
};

export class KrakenService {
  private apiKey: string;
  private apiSecret: string;
  private cachedBalances: KrakenBalance = {};
  private lastBalanceUpdate: number = 0;
  private balanceUpdateInterval: number = 30000;
  private cryptoPrices: CryptoPrice = {};
  private lastPriceUpdate: number = 0;
  private priceUpdateInterval: number = 60000;

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.initializeCryptoPrices();
  }

  private async initializeCryptoPrices() {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,ripple,litecoin,cardano,polkadot&vs_currencies=usd');
      const data = await response.json();
      
      this.cryptoPrices = {
        'XBT': data.bitcoin?.usd || 45000,
        'XXBT': data.bitcoin?.usd || 45000,
        'ETH': data.ethereum?.usd || 2500,
        'XETH': data.ethereum?.usd || 2500,
        'XRP': data.ripple?.usd || 0.6,
        'XXRP': data.ripple?.usd || 0.6,
        'LTC': data.litecoin?.usd || 100,
        'XLTC': data.litecoin?.usd || 100,
        'ADA': data.cardano?.usd || 0.5,
        'DOT': data.polkadot?.usd || 7,
        'USD': 1,
        'ZUSD': 1
      };
      
      this.lastPriceUpdate = Date.now();
      logError('info', 'Crypto prices updated successfully');
    } catch (error) {
      logError('warning', 'Failed to fetch crypto prices, using fallback values');
      this.cryptoPrices = {
        'XBT': 45000, 'XXBT': 45000,
        'ETH': 2500, 'XETH': 2500,
        'XRP': 0.6, 'XXRP': 0.6,
        'LTC': 100, 'XLTC': 100,
        'ADA': 0.5, 'DOT': 7,
        'USD': 1, 'ZUSD': 1
      };
    }
  }

  private async updateCryptoPricesIfNeeded() {
    const now = Date.now();
    if (now - this.lastPriceUpdate > this.priceUpdateInterval) {
      await this.initializeCryptoPrices();
    }
  }

  async getAccountBalance(): Promise<KrakenBalance> {
    const now = Date.now();
    if (now - this.lastBalanceUpdate < this.balanceUpdateInterval && Object.keys(this.cachedBalances).length > 0) {
      return this.cachedBalances;
    }

    try {
      logError('info', 'Fetching Kraken account balance...');
      const { data, error } = await supabase.functions.invoke('kraken-api', {
        body: {
          action: 'getBalance',
          apiKey: this.apiKey,
          apiSecret: this.apiSecret
        }
      });

      if (error) {
        logError('error', 'Supabase function invocation failed', JSON.stringify(error));
        throw new Error(`Function invocation failed: ${error.message || 'Unknown error'}`);
      }

      if (data?.error && data.error.length > 0) {
        const krakenError = data.error[0];
        logError('error', 'Kraken API returned error', krakenError);
        
        if (krakenError.includes('Invalid key')) {
          throw new Error('Invalid API key - check your credentials');
        } else if (krakenError.includes('Permission denied')) {
          throw new Error('API key lacks required permissions');
        } else if (krakenError.includes('Invalid signature')) {
          throw new Error('Invalid API signature - check your secret key');
        } else if (krakenError.includes('Invalid nonce')) {
          throw new Error('Invalid nonce - time synchronization issue');
        }
        
        throw new Error(`Kraken Error: ${krakenError}`);
      }

      if (!data?.result) {
        logError('error', 'No result data received from Kraken API', JSON.stringify(data));
        throw new Error('No balance data received from Kraken');
      }

      this.cachedBalances = data.result;
      this.lastBalanceUpdate = now;
      
      // Log portfolio summary including Bitcoin and other crypto
      const portfolioSummary = this.getPortfolioSummary();
      logError('info', 'Portfolio balance updated', `Total USD value: $${portfolioSummary.totalUsdValue.toFixed(2)}`);
      
      return this.cachedBalances;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch balance';
      logError('error', 'Balance fetch failed', errorMessage);
      throw error;
    }
  }

  getPortfolioSummary() {
    const summary: { [currency: string]: { balance: number; usdValue: number } } = {};
    let totalUsdValue = 0;
    
    Object.entries(this.cachedBalances).forEach(([currency, balance]) => {
      const numBalance = parseFloat(balance);
      if (numBalance > 0.0001) {
        const price = this.cryptoPrices[currency] || 1;
        const usdValue = numBalance * price;
        
        summary[currency] = {
          balance: numBalance,
          usdValue
        };
        
        totalUsdValue += usdValue;
      }
    });
    
    return { summary, totalUsdValue };
  }

  async placeValidatedOrder(order: KrakenOrderRequest): Promise<KrakenOrderResponse> {
    try {
      logError('info', `Placing ${order.type} order for ${order.volume} ${order.pair}`);
      
      await this.updateCryptoPricesIfNeeded();
      const balances = await this.getAccountBalance();
      const validator = new TradeValidator(balances, this.cryptoPrices);
      
      // Convert pair format for validation
      let validationPair = order.pair;
      if (order.pair === 'XBTUSD') validationPair = 'BTC/USD';
      if (order.pair === 'ETHUSD') validationPair = 'ETH/USD';
      if (order.pair === 'XRPUSD') validationPair = 'XRP/USD';
      
      const validation = validator.validateTrade({
        pair: validationPair,
        side: order.type,
        amount: parseFloat(order.volume),
        price: order.price ? parseFloat(order.price) : undefined
      });

      if (!validation.isValid) {
        logError('warning', 'Trade validation failed', validation.error);
        
        if (validation.adjustedAmount && validation.adjustedAmount > 0) {
          logError('info', `Adjusting trade amount from ${order.volume} to ${validation.adjustedAmount}`);
          order.volume = validation.adjustedAmount.toString();
          
          const revalidation = validator.validateTrade({
            pair: validationPair,
            side: order.type,
            amount: validation.adjustedAmount,
            price: order.price ? parseFloat(order.price) : undefined
          });
          
          if (!revalidation.isValid) {
            logError('error', 'Trade still invalid after adjustment', revalidation.error);
            return { error: [validation.error || 'Trade validation failed'] };
          }
        } else {
          return { error: [validation.error || 'Trade validation failed'] };
        }
      }

      return await this.placeOrder(order);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Order placement failed';
      logError('error', 'Validated order placement failed', errorMessage);
      return { error: [errorMessage] };
    }
  }

  async placeOrder(order: KrakenOrderRequest): Promise<KrakenOrderResponse> {
    try {
      logError('info', 'Sending order to Kraken API', JSON.stringify(order));
      
      const { data, error } = await supabase.functions.invoke('kraken-api', {
        body: {
          action: 'placeOrder',
          apiKey: this.apiKey,
          apiSecret: this.apiSecret,
          ...order
        }
      });

      if (error) {
        logError('error', 'Supabase function invocation failed during order placement', JSON.stringify(error));
        throw new Error(`Function invocation failed: ${error.message || 'Unknown error'}`);
      }

      if (data?.error && data.error.length > 0) {
        const krakenError = data.error[0];
        logError('error', 'Kraken order placement error', krakenError);
        
        if (krakenError.includes('Insufficient funds')) {
          throw new Error('Insufficient funds for this trade');
        } else if (krakenError.includes('Invalid arguments')) {
          throw new Error('Invalid order parameters');
        } else if (krakenError.includes('Order minimum not met')) {
          throw new Error('Order size below minimum requirement');
        } else if (krakenError.includes('Unknown asset pair')) {
          throw new Error('Invalid trading pair');
        } else if (krakenError.includes('Invalid price')) {
          throw new Error('Invalid price specified');
        }
        
        throw new Error(krakenError);
      }
      
      if (!data?.result) {
        logError('error', 'No result data received from order placement', JSON.stringify(data));
        throw new Error('No order result received from Kraken');
      }
      
      this.lastBalanceUpdate = 0; // Invalidate balance cache
      logError('info', 'Order placed successfully', `TxID: ${data.result.txid?.[0] || 'N/A'}`);
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Order placement failed';
      logError('error', 'Order placement error', errorMessage);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      logError('info', 'Testing Kraken connection...');
      await this.getAccountBalance();
      logError('info', 'Kraken connection test successful');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      logError('error', 'Kraken connection test failed', errorMessage);
      return false;
    }
  }

  getTradeValidator(): TradeValidator | null {
    if (Object.keys(this.cachedBalances).length === 0) {
      return null;
    }
    return new TradeValidator(this.cachedBalances, this.cryptoPrices);
  }
}

export const createKrakenService = (apiKey: string, apiSecret: string) => {
  if (!apiKey || !apiSecret) {
    throw new Error('API key and secret are required');
  }
  return new KrakenService(apiKey, apiSecret);
};