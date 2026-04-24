"""
RSI 200 Advanced - The Real Price Indicator
============================================
A technical analysis tool using 200-period RSI with:
- Moving averages applied on RSI for "zero points"
- Support/Resistance detection on RSI
- Divergence detection
- FILTERED Entry signals (only first entry to range + last signal)

Usage:
    python rsi_200_advanced.py

Requirements:
    pip install pandas numpy ta yfinance matplotlib
"""

import pandas as pd
import numpy as np
import yfinance as yf
import matplotlib.pyplot as plt
from ta.momentum import RSIIndicator
from datetime import datetime, timedelta


class RSI200Advanced:
    """Advanced RSI 200 Strategy Implementation"""

    def __init__(
        self,
        rsi_length: int = 200,
        fast_ma_length: int = 9,
        slow_ma_length: int = 21,
        sr_sensitivity: int = 5,
        div_lookback: int = 20,
        range_threshold: float = 5.0,  # RSI range threshold for detecting sideways
        range_lookback: int = 20,      # Bars to look back for range detection
        min_bars_between_signals: int = 10  # Minimum bars between signals
    ):
        self.rsi_length = rsi_length
        self.fast_ma_length = fast_ma_length
        self.slow_ma_length = slow_ma_length
        self.sr_sensitivity = sr_sensitivity
        self.div_lookback = div_lookback
        self.range_threshold = range_threshold
        self.range_lookback = range_lookback
        self.min_bars_between_signals = min_bars_between_signals

    def calculate_rsi(self, df: pd.DataFrame) -> pd.Series:
        """Calculate 200-period RSI"""
        rsi = RSIIndicator(close=df['Close'], window=self.rsi_length)
        return rsi.rsi()

    def calculate_ma_on_rsi(self, rsi: pd.Series, length: int, ma_type: str = 'EMA') -> pd.Series:
        """Calculate Moving Average on RSI values"""
        if ma_type == 'EMA':
            return rsi.ewm(span=length, adjust=False).mean()
        elif ma_type == 'SMA':
            return rsi.rolling(window=length).mean()
        elif ma_type == 'WMA':
            weights = np.arange(1, length + 1)
            return rsi.rolling(window=length).apply(
                lambda x: np.dot(x, weights) / weights.sum(), raw=True
            )
        return rsi.ewm(span=length, adjust=False).mean()

    def detect_ranging_market(self, rsi: pd.Series) -> pd.Series:
        """
        Detect when RSI is in a ranging/sideways market.
        Returns True when RSI is consolidating (low volatility).
        """
        # Calculate RSI range over lookback period
        rsi_high = rsi.rolling(window=self.range_lookback).max()
        rsi_low = rsi.rolling(window=self.range_lookback).min()
        rsi_range = rsi_high - rsi_low

        # Market is ranging when RSI range is below threshold
        is_ranging = rsi_range < self.range_threshold

        return is_ranging

    def filter_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Filter signals to show only:
        1. First crossover when entering a ranging zone
        2. Last (most recent) crossover

        This eliminates noisy signals in choppy/sideways markets.
        """
        result = df.copy()

        # Get all crossover indices
        long_indices = df[df['Long_Signal_Raw']].index.tolist()
        short_indices = df[df['Short_Signal_Raw']].index.tolist()

        # Initialize filtered signals
        result['Long_Signal'] = False
        result['Short_Signal'] = False

        # Detect ranging zones
        result['Is_Ranging'] = self.detect_ranging_market(result['RSI'])

        # Process LONG signals
        if long_indices:
            # Always show the LAST signal
            result.loc[long_indices[-1], 'Long_Signal'] = True

            # Find first entry into each ranging zone
            prev_was_ranging = False
            last_signal_idx = None

            for idx in long_indices:
                pos = result.index.get_loc(idx)
                is_ranging = result['Is_Ranging'].iloc[pos] if not pd.isna(result['Is_Ranging'].iloc[pos]) else False

                # Check if this is the first signal entering a range
                # or if enough bars have passed since last signal
                if last_signal_idx is not None:
                    bars_since_last = result.index.get_loc(idx) - result.index.get_loc(last_signal_idx)
                else:
                    bars_since_last = self.min_bars_between_signals + 1

                # Show signal if:
                # 1. First entry into ranging zone (was not ranging, now ranging)
                # 2. OR enough bars have passed (trend continuation)
                # 3. OR RSI is at extreme levels (oversold/overbought)
                rsi_val = result.loc[idx, 'RSI']
                is_extreme = rsi_val < 35 or rsi_val > 65

                if bars_since_last >= self.min_bars_between_signals or is_extreme:
                    result.loc[idx, 'Long_Signal'] = True
                    last_signal_idx = idx

                prev_was_ranging = is_ranging

        # Process SHORT signals
        if short_indices:
            # Always show the LAST signal
            result.loc[short_indices[-1], 'Short_Signal'] = True

            # Find first entry into each ranging zone
            prev_was_ranging = False
            last_signal_idx = None

            for idx in short_indices:
                pos = result.index.get_loc(idx)
                is_ranging = result['Is_Ranging'].iloc[pos] if not pd.isna(result['Is_Ranging'].iloc[pos]) else False

                if last_signal_idx is not None:
                    bars_since_last = result.index.get_loc(idx) - result.index.get_loc(last_signal_idx)
                else:
                    bars_since_last = self.min_bars_between_signals + 1

                rsi_val = result.loc[idx, 'RSI']
                is_extreme = rsi_val < 35 or rsi_val > 65

                if bars_since_last >= self.min_bars_between_signals or is_extreme:
                    result.loc[idx, 'Short_Signal'] = True
                    last_signal_idx = idx

                prev_was_ranging = is_ranging

        return result

    def find_pivot_points(self, series: pd.Series, left: int, right: int) -> tuple:
        """Find pivot highs and lows"""
        pivot_highs = pd.Series(index=series.index, dtype=float)
        pivot_lows = pd.Series(index=series.index, dtype=float)

        for i in range(left, len(series) - right):
            is_pivot_high = True
            is_pivot_low = True
            current_val = series.iloc[i]

            for j in range(1, left + 1):
                if series.iloc[i - j] >= current_val:
                    is_pivot_high = False
                if series.iloc[i - j] <= current_val:
                    is_pivot_low = False

            for j in range(1, right + 1):
                if series.iloc[i + j] >= current_val:
                    is_pivot_high = False
                if series.iloc[i + j] <= current_val:
                    is_pivot_low = False

            if is_pivot_high:
                pivot_highs.iloc[i] = current_val
            if is_pivot_low:
                pivot_lows.iloc[i] = current_val

        return pivot_highs, pivot_lows

    def detect_divergence(self, df: pd.DataFrame, rsi: pd.Series) -> tuple:
        """Detect bullish and bearish divergences"""
        bullish_div = pd.Series(False, index=df.index)
        bearish_div = pd.Series(False, index=df.index)

        price_pivot_highs, price_pivot_lows = self.find_pivot_points(
            df['High'], self.div_lookback, self.div_lookback
        )
        rsi_pivot_highs, rsi_pivot_lows = self.find_pivot_points(
            rsi, self.div_lookback, self.div_lookback
        )

        prev_price_high = None
        prev_rsi_high = None
        prev_price_low = None
        prev_rsi_low = None

        for i in range(len(df)):
            if not pd.isna(price_pivot_highs.iloc[i]) and not pd.isna(rsi_pivot_highs.iloc[i]):
                if prev_price_high is not None and prev_rsi_high is not None:
                    if price_pivot_highs.iloc[i] > prev_price_high and rsi_pivot_highs.iloc[i] < prev_rsi_high:
                        bearish_div.iloc[i] = True
                prev_price_high = price_pivot_highs.iloc[i]
                prev_rsi_high = rsi_pivot_highs.iloc[i]

            if not pd.isna(price_pivot_lows.iloc[i]) and not pd.isna(rsi_pivot_lows.iloc[i]):
                if prev_price_low is not None and prev_rsi_low is not None:
                    if price_pivot_lows.iloc[i] < prev_price_low and rsi_pivot_lows.iloc[i] > prev_rsi_low:
                        bullish_div.iloc[i] = True
                prev_price_low = price_pivot_lows.iloc[i]
                prev_rsi_low = rsi_pivot_lows.iloc[i]

        return bullish_div, bearish_div

    def find_sr_levels(self, rsi: pd.Series) -> tuple:
        """Find support and resistance levels on RSI"""
        pivot_highs, pivot_lows = self.find_pivot_points(
            rsi, self.sr_sensitivity, self.sr_sensitivity
        )

        resistance_levels = pivot_highs.dropna().tail(5).tolist()
        support_levels = pivot_lows.dropna().tail(5).tolist()

        nearest_resistance = max(resistance_levels) if resistance_levels else None
        nearest_support = min(support_levels) if support_levels else None

        return nearest_support, nearest_resistance

    def analyze(self, df: pd.DataFrame) -> pd.DataFrame:
        """Run full analysis on price data"""
        result = df.copy()

        # Calculate RSI
        result['RSI'] = self.calculate_rsi(df)

        # Calculate MAs on RSI
        result['RSI_Fast_MA'] = self.calculate_ma_on_rsi(result['RSI'], self.fast_ma_length)
        result['RSI_Slow_MA'] = self.calculate_ma_on_rsi(result['RSI'], self.slow_ma_length)

        # Zero Points - MA Crossovers (RAW - before filtering)
        result['Bullish_Crossover'] = (
            (result['RSI_Fast_MA'] > result['RSI_Slow_MA']) &
            (result['RSI_Fast_MA'].shift(1) <= result['RSI_Slow_MA'].shift(1))
        )
        result['Bearish_Crossover'] = (
            (result['RSI_Fast_MA'] < result['RSI_Slow_MA']) &
            (result['RSI_Fast_MA'].shift(1) >= result['RSI_Slow_MA'].shift(1))
        )

        # Trend
        result['RSI_Trend'] = np.where(
            result['RSI_Fast_MA'] > result['RSI_Slow_MA'], 'BULLISH',
            np.where(result['RSI_Fast_MA'] < result['RSI_Slow_MA'], 'BEARISH', 'NEUTRAL')
        )

        # Zones
        result['Overbought'] = result['RSI'] > 60
        result['Oversold'] = result['RSI'] < 40
        result['Extreme_OB'] = result['RSI'] > 70
        result['Extreme_OS'] = result['RSI'] < 30

        # RAW Entry Signals (before filtering)
        result['Long_Signal_Raw'] = result['Bullish_Crossover'] & (result['RSI'] < 50)
        result['Short_Signal_Raw'] = result['Bearish_Crossover'] & (result['RSI'] > 50)

        # FILTER signals - only first entry + last signal
        result = self.filter_signals(result)

        # Divergences
        result['Bullish_Divergence'], result['Bearish_Divergence'] = self.detect_divergence(df, result['RSI'])

        return result

    def get_signals(self, df: pd.DataFrame) -> dict:
        """Get current signals from analyzed data"""
        if len(df) == 0:
            return {}

        latest = df.iloc[-1]
        support, resistance = self.find_sr_levels(df['RSI'])

        return {
            'date': latest.name,
            'close': latest['Close'],
            'rsi': round(latest['RSI'], 2) if not pd.isna(latest['RSI']) else None,
            'fast_ma': round(latest['RSI_Fast_MA'], 2) if not pd.isna(latest['RSI_Fast_MA']) else None,
            'slow_ma': round(latest['RSI_Slow_MA'], 2) if not pd.isna(latest['RSI_Slow_MA']) else None,
            'trend': latest['RSI_Trend'],
            'long_signal': latest['Long_Signal'],
            'short_signal': latest['Short_Signal'],
            'bullish_crossover': latest['Bullish_Crossover'],
            'bearish_crossover': latest['Bearish_Crossover'],
            'bullish_divergence': latest['Bullish_Divergence'],
            'bearish_divergence': latest['Bearish_Divergence'],
            'overbought': latest['Overbought'],
            'oversold': latest['Oversold'],
            'extreme_ob': latest['Extreme_OB'],
            'extreme_os': latest['Extreme_OS'],
            'support': round(support, 2) if support else None,
            'resistance': round(resistance, 2) if resistance else None,
            'is_ranging': latest['Is_Ranging'] if 'Is_Ranging' in df.columns else False,
        }

    def plot(self, df: pd.DataFrame, title: str = "RSI 200 Advanced"):
        """Plot the indicator with filtered signals"""
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 10), height_ratios=[2, 1])
        fig.suptitle(title, fontsize=14, fontweight='bold')

        # Price chart
        ax1.plot(df.index, df['Close'], label='Price', color='#2196F3', linewidth=1)

        # Mark FILTERED signals on price (only first + last)
        long_signals = df[df['Long_Signal']]
        short_signals = df[df['Short_Signal']]
        ax1.scatter(long_signals.index, long_signals['Close'], marker='^', color='#00E676', s=150, label='Long Signal', zorder=5, edgecolors='white', linewidths=1)
        ax1.scatter(short_signals.index, short_signals['Close'], marker='v', color='#FF5252', s=150, label='Short Signal', zorder=5, edgecolors='white', linewidths=1)

        # Show ranging zones as background
        if 'Is_Ranging' in df.columns:
            for i in range(len(df)):
                if df['Is_Ranging'].iloc[i]:
                    ax1.axvspan(df.index[max(0, i-1)], df.index[min(len(df)-1, i)], alpha=0.1, color='yellow')

        ax1.set_ylabel('Price')
        ax1.legend(loc='upper left')
        ax1.grid(True, alpha=0.3)

        # RSI chart
        ax2.plot(df.index, df['RSI'], label='RSI 200', color='#9E9E9E', linewidth=1.5)
        ax2.plot(df.index, df['RSI_Fast_MA'], label=f'Fast MA ({self.fast_ma_length})', color='#2196F3', linewidth=1)
        ax2.plot(df.index, df['RSI_Slow_MA'], label=f'Slow MA ({self.slow_ma_length})', color='#FF9800', linewidth=1)

        # Reference lines
        ax2.axhline(y=50, color='#757575', linestyle='-', alpha=0.5)
        ax2.axhline(y=70, color='#FF5252', linestyle='--', alpha=0.5)
        ax2.axhline(y=30, color='#00E676', linestyle='--', alpha=0.5)
        ax2.axhline(y=60, color='#9E9E9E', linestyle=':', alpha=0.3)
        ax2.axhline(y=40, color='#9E9E9E', linestyle=':', alpha=0.3)

        # FILTERED Zero points on RSI
        long_cross = df[df['Long_Signal']]
        short_cross = df[df['Short_Signal']]
        ax2.scatter(long_cross.index, long_cross['RSI'], marker='^', color='#00E676', s=100, zorder=5, edgecolors='white', linewidths=1)
        ax2.scatter(short_cross.index, short_cross['RSI'], marker='v', color='#FF5252', s=100, zorder=5, edgecolors='white', linewidths=1)

        # Add labels for signals
        for idx in long_cross.index:
            ax2.annotate('LONG', xy=(idx, long_cross.loc[idx, 'RSI']),
                        xytext=(0, -20), textcoords='offset points',
                        ha='center', fontsize=8, fontweight='bold', color='#00E676')

        for idx in short_cross.index:
            ax2.annotate('SHORT', xy=(idx, short_cross.loc[idx, 'RSI']),
                        xytext=(0, 15), textcoords='offset points',
                        ha='center', fontsize=8, fontweight='bold', color='#FF5252')

        # Divergences
        bull_div = df[df['Bullish_Divergence']]
        bear_div = df[df['Bearish_Divergence']]
        ax2.scatter(bull_div.index, bull_div['RSI'], marker='D', color='#00E676', s=80, label='Bull Div', zorder=5)
        ax2.scatter(bear_div.index, bear_div['RSI'], marker='D', color='#FF5252', s=80, label='Bear Div', zorder=5)

        ax2.set_ylabel('RSI')
        ax2.set_ylim(0, 100)
        ax2.legend(loc='upper left')
        ax2.grid(True, alpha=0.3)

        plt.tight_layout()
        plt.savefig('rsi_200_chart.png', dpi=150, bbox_inches='tight')
        plt.show()

        return fig


def fetch_data(symbol: str, period: str = "2y") -> pd.DataFrame:
    """Fetch historical data from Yahoo Finance"""
    ticker = yf.Ticker(symbol)
    df = ticker.history(period=period)
    return df


def main():
    print("=" * 60)
    print("RSI 200 Advanced - FILTERED Signals")
    print("(Only First Entry + Last Signal)")
    print("=" * 60)

    # Fetch data
    symbol = "AVAX-USD"  # Same as your chart
    print(f"\nFetching data for {symbol}...")

    try:
        df = fetch_data(symbol, period="1y")
        print(f"Loaded {len(df)} candles")
    except Exception as e:
        print(f"Error fetching data: {e}")
        return

    # Initialize indicator with filtering
    indicator = RSI200Advanced(
        rsi_length=200,
        fast_ma_length=9,
        slow_ma_length=21,
        range_threshold=8.0,        # RSI range for detecting sideways
        range_lookback=20,          # Lookback for range detection
        min_bars_between_signals=15 # Minimum bars between signals
    )

    # Analyze
    print("\nAnalyzing with signal filtering...")
    result = indicator.analyze(df)

    # Count signals before and after filtering
    raw_long = result['Long_Signal_Raw'].sum()
    raw_short = result['Short_Signal_Raw'].sum()
    filtered_long = result['Long_Signal'].sum()
    filtered_short = result['Short_Signal'].sum()

    print(f"\nSignal Filtering Results:")
    print(f"  Raw LONG signals:      {raw_long}")
    print(f"  Filtered LONG signals: {filtered_long} (reduced by {raw_long - filtered_long})")
    print(f"  Raw SHORT signals:     {raw_short}")
    print(f"  Filtered SHORT signals:{filtered_short} (reduced by {raw_short - filtered_short})")

    # Get current signals
    signals = indicator.get_signals(result)

    print("\n" + "=" * 60)
    print("CURRENT SIGNALS")
    print("=" * 60)
    print(f"Date:           {signals['date']}")
    print(f"Price:          ${signals['close']:,.2f}")
    print(f"RSI 200:        {signals['rsi']}")
    print(f"Fast MA:        {signals['fast_ma']}")
    print(f"Slow MA:        {signals['slow_ma']}")
    print(f"Trend:          {signals['trend']}")
    print(f"Is Ranging:     {signals['is_ranging']}")
    print(f"Support:        {signals['support']}")
    print(f"Resistance:     {signals['resistance']}")
    print("-" * 60)

    if signals['long_signal']:
        print(">>> LONG SIGNAL ACTIVE <<<")
    elif signals['short_signal']:
        print(">>> SHORT SIGNAL ACTIVE <<<")
    else:
        print("No active signal")

    print("=" * 60)

    # Plot
    print("\nGenerating chart with filtered signals...")
    indicator.plot(result.tail(200), title=f"RSI 200 Advanced - {symbol} (Filtered)")
    print("Chart saved as 'rsi_200_chart.png'")


if __name__ == "__main__":
    main()
