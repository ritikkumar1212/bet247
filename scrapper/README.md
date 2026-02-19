# 5Five Cricket Scraper

This is a specialized scraper for the "5Five Cricket" game on Tables247.

## Features

- **Specific Navigation**: Navigates directly to the 5Five Cricket game.
- **Continuous Tracking**: Stays on the game page and tracks matches sequentially.
- **Auto-Analysis**: Analyzes patterns after every over (5 overs per match).
- **Resilience**: Handles network glitches and waits for new matches automatically.

## Setup

1.  **Dependencies**: Ensure you have Python 3 and Firefox installed.

    ```bash
    pip install selenium pandas openpyxl
    ```

2.  **GeckoDriver**: Ensure `geckodriver` is in your system PATH.

## Usage

1.  **Edit Credentials**:
    Open `scrapper.py` and update the `username` and `password` variables in the `main()` function if needed.

2.  **Run the Scraper**:

    ```bash
    python3 scrapper.py
    ```

3.  **Configuration**:
    - Enter scraping interval (default: 2 seconds).
    - Enter wait time between matches (default: 10 seconds).

## Output

- **cricket_data.csv**: Contains raw ball-by-ball data.
- **cricket_data_analysis.xlsx**: Contains analyzed patterns and match statistics.

## Notes

- The scraper runs in **Headless Mode** by default (browser is invisible). To see the browser, change `headless=True` to `headless=False` in `main()`.
- The scraper expects 5-over matches.
