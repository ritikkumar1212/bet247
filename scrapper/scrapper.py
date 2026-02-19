#!/usr/bin/env python3
"""
Tables247 Virtual Cricket Scraper - Improved Error Handling
- Handles match end gracefully
- Better waiting for elements to load
- Automatic match state detection
"""
import requests
import time
import json
import csv
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import os
import subprocess


import re

# Card to runs mapping (fixed scores for 5Five Cricket)
# Card image URLs: ADD.jpg, 2DD.jpg, 3DD.jpg, 4DD.jpg, 6DD.jpg, 10DD.jpg, KDD.jpg
CARD_TO_RUNS = {
    'A': 1,    # Ace = 1 run
    '2': 2,    # 2 = 2 runs
    '3': 3,    # 3 = 3 runs
    '4': 4,    # 4 = 4 runs (boundary)
    '6': 6,    # 6 = 6 runs (six)
    '10': 0,   # 10 = 0 runs (dot ball)
    'K': -1,   # King = wicket
}

# Reverse mapping: runs to card (derived from scorecard)
# When we see runs in the scorecard, we know which card was played
RUNS_TO_CARD = {
    0: '10',   # 0 runs (dot ball) = 10 card
    1: 'A',    # 1 run = Ace
    2: '2',    # 2 runs = 2 card
    3: '3',    # 3 runs = 3 card
    4: '4',    # 4 runs = 4 card (boundary)
    6: '6',    # 6 runs = 6 card (six)
    -1: 'K',   # Wicket = King
    'W': 'K',  # Wicket text = King
    'ww': 'K', # Wicket variant = King
}

class Tables247FiveCricketScraper:

    def send_to_backend(self, payload):
        """Send scraped ball data to backend API"""
        try:
            url = "http://localhost:5000/api/ingest/ball"
            res = requests.post(url, json=payload, timeout=3)
            if res.status_code != 200:
                print(f"⚠️ API error: {res.text}")
        except Exception as e:
            print(f"⚠️ Failed to send to backend: {e}")

    def __init__(self, headless=True, profile_name=None, auto_analyze=True):
        """Initialize the scraper with Firefox options"""
        self.options = Options()
        if headless:
            self.options.add_argument("--headless")
        
        # Set Firefox profile if specified
        if profile_name:
            profile_path = os.path.expanduser(f"~/.mozilla/firefox/{profile_name}")
            if os.path.exists(profile_path):
                self.options.add_argument(f"--profile={profile_path}")
                print(f"Using Firefox profile: {profile_name}")
            else:
                print(f"Profile {profile_name} not found at {profile_path}, using default")
        
        # Additional options for better performance
        self.options.add_argument("--no-sandbox")
        self.options.add_argument("--disable-dev-shm-usage")
        self.options.add_argument("--disable-gpu")
        self.options.add_argument("--window-size=1920,1080")
        self.options.add_argument("--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        
        self.driver = None
        self.wait = None
        self.auto_analyze = auto_analyze
        
        # Tracking data
        self.previous_balls = []
        self.previous_score = {}
        self.previous_ball_num = None
        self.current_match_id = None
        self.current_round_id = None
        self.previous_round_id = None
        # Note: previous_cards removed - cards derived from runs via RUNS_TO_CARD
        self.csv_file = None
        self.last_analyzed_over = 0
        self.previous_over_info = {'over': 0, 'ball': 0}
        self.current_innings = 1  # Track which innings we're in (1 or 2)
        
        # Match state tracking
        self.match_started = False
        self.match_ended = False
        self.consecutive_errors = 0
        self.max_consecutive_errors = 20  # After 20 consecutive errors, consider match ended
        self.waiting_iterations = 0
        self.max_waiting_iterations = 300 # Wait longer for next match (10 mins)
        
    def start_driver(self):
        """Start the Firefox driver"""
        try:
            self.driver = webdriver.Firefox(options=self.options)
            self.wait = WebDriverWait(self.driver, 15)
            print("Firefox driver started successfully")
        except Exception as e:
            print(f"Error starting Firefox driver: {e}")
            raise
    
    def close_driver(self):
        """Close the Firefox driver"""
        if self.driver:
            self.driver.quit()
            print("Firefox driver closed")
    
    def close_welcome_popup(self):
        """Close the welcome popup that appears after login"""
        try:
            print("Looking for welcome popup...")
            time.sleep(2)
            
            close_button = self.wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button.btn-close"))
            )
            close_button.click()
            print("Welcome popup closed successfully")
            time.sleep(1)
            return True
        except TimeoutException:
            print("No welcome popup found or already closed")
            return False
        except Exception as e:
            print(f"Error closing welcome popup: {e}")
            return False
    
    def navigate_to_5five_cricket(self):
        """Navigate to 5Five Cricket game page by scrolling and clicking the game button"""
        try:
            # We're already at home page after login, no need to navigate again
            print("Already at home page, looking for 5Five Cricket...")
            time.sleep(2)
            
            # Scroll down to find the game list
            print("Scrolling to find 5Five Cricket game...")
            self.driver.execute_script("window.scrollBy(0, 500);")
            time.sleep(1)
            
            # Try multiple selectors to find the 5Five Cricket button
            selectors = [
                "a[href='/casino/cricketv3']",
                ".casino-list-item a[href='/casino/cricketv3']",
                "a[href*='cricketv3']",
            ]
            
            game_link = None
            for selector in selectors:
                try:
                    game_link = self.wait.until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                    )
                    if game_link:
                        print(f"Found 5Five Cricket using selector: {selector}")
                        break
                except:
                    continue
            
            if not game_link:
                # Try finding by text content
                print("Trying to find by text '5Five Cricket'...")
                casino_items = self.driver.find_elements(By.CSS_SELECTOR, ".casino-list-item")
                for item in casino_items:
                    if "5Five Cricket" in item.text or "Cricket" in item.text:
                        game_link = item.find_element(By.TAG_NAME, "a")
                        print(f"Found game by text: {item.text}")
                        break
            
            if not game_link:
                print("Could not find 5Five Cricket game link")
                return False
            
            # Scroll into view and click
            self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", game_link)
            time.sleep(1)
            
            # Click the game link
            try:
                game_link.click()
            except:
                # Use JavaScript click if regular click fails
                self.driver.execute_script("arguments[0].click();", game_link)
            
            print("Clicked on 5Five Cricket")
            print("Waiting for page to load...")
            time.sleep(10)  # Increased wait for page load
            
            # Wait for game page to load - try multiple selectors
            page_loaded = False
            load_selectors = [
                (By.CLASS_NAME, "scorecard"),
                (By.CSS_SELECTOR, ".scorecard"),
                (By.CSS_SELECTOR, ".casino-video-cards"),
                (By.CSS_SELECTOR, ".casino-rid"),
                (By.CSS_SELECTOR, ".bet-table"),
            ]
            
            for by, selector in load_selectors:
                try:
                    WebDriverWait(self.driver, 15).until(
                        EC.presence_of_element_located((by, selector))
                    )
                    print(f"5Five Cricket page loaded (found: {selector})")
                    page_loaded = True
                    break
                except:
                    continue
            
            if not page_loaded:
                print("Warning: Could not confirm page load, but continuing...")
            
            # Get initial round ID
            self.current_round_id = self.extract_round_id()
            self.previous_round_id = self.current_round_id
            print(f"Initial Round ID: {self.current_round_id}")
            
            return True
            
        except Exception as e:
            print(f"Error navigating to 5Five Cricket: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def extract_round_id(self):
        """Extract the current round ID from the page"""
        try:
            # Selector: .casino-rid span > span (inner span has the ID)
            rid_element = self.driver.find_element(By.CSS_SELECTOR, ".casino-rid span")
            round_id = rid_element.text.strip()
            # Sometimes it's "Round ID: 123456", extract just the number
            if ":" in round_id:
                round_id = round_id.split(":")[-1].strip()
            return round_id
        except NoSuchElementException:
            return None
        except Exception as e:
            print(f"Error extracting round ID: {e}")
            return None
    
    # NOTE: extract_cards() function REMOVED
    # Card is now derived from runs using RUNS_TO_CARD mapping
    # No need to scrape card images anymore
    
    def generate_match_id(self, round_id=None):
        """Generate a unique match ID using round ID"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        if round_id:
            return f"5Five_{round_id}"
        return f"5Five_Cricket_{timestamp}"
    
    def login(self, username, password):
        """Login to tables247.com"""
        try:
            print("Navigating to login page...")
            self.driver.get("https://tables247.com/")

            self.wait.until(EC.presence_of_element_located((By.NAME, "username")))
            print("Login page loaded")

            username_field = self.wait.until(
                EC.element_to_be_clickable((By.NAME, "username"))
            )
            username_field.clear()
            username_field.send_keys(username)
            print("Username entered")

            password_field = self.wait.until(
                EC.element_to_be_clickable((By.NAME, "password"))
            )
            password_field.clear()
            password_field.send_keys(password)
            print("Password entered")

            login_button = self.wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']"))
            )
            current_url_before_login = self.driver.current_url
            login_button.click()
            print("Login button clicked")

            # Login can land on different routes; treat disappearance of username field
            # or URL change as success.
            try:
                WebDriverWait(self.driver, 15).until(
                    lambda d: d.current_url != current_url_before_login
                    or len(d.find_elements(By.NAME, "username")) == 0
                )
                print(f"Login successful - current URL: {self.driver.current_url}")
                self.close_welcome_popup()
                return True
            except TimeoutException:
                print(
                    f"Login may have failed - still on login page ({self.driver.current_url})"
                )
                return False

        except Exception as e:
            print(f"Error during login: {e}")
            return False
    
    def check_match_state(self):
        """
        Check if match is active, waiting to start, or ended.
        
        Cricket logic for match end:
        - 1st innings ends: 5 overs complete OR 10 wickets
        - 2nd innings ends: 5 overs complete OR 10 wickets OR target chased
        - Match ends when 2nd innings ends
        """
        try:
            # Try to find scorecard with a short timeout
            try:
                scorecard = WebDriverWait(self.driver, 2).until(
                    EC.presence_of_element_located((By.CLASS_NAME, "scorecard"))
                )
                
                # Check if there are any team scores
                team_rows = scorecard.find_elements(By.CSS_SELECTOR, "p.team-1")
                if team_rows:
                    import re
                    
                    if len(team_rows) >= 2:
                        team1_spans = team_rows[0].find_elements(By.TAG_NAME, "span")
                        team2_spans = team_rows[1].find_elements(By.TAG_NAME, "span")
                        
                        team1_overs = None
                        team2_overs = None
                        team1_runs = 0
                        team2_runs = 0
                        team1_wickets = 0
                        team2_wickets = 0
                        
                        # Parse Team1 score (format: "39-1 (3.0)")
                        if len(team1_spans) >= 2:
                            score_text = team1_spans[1].text.strip()
                            # Extract runs and wickets: "39-1 (3.0)"
                            score_match = re.search(r'(\d+)-(\d+)', score_text)
                            if score_match:
                                team1_runs = int(score_match.group(1))
                                team1_wickets = int(score_match.group(2))
                            over_match = re.search(r'\((\d+)\.(\d+)\)', score_text)
                            if over_match:
                                team1_overs = float(f"{over_match.group(1)}.{over_match.group(2)}")
                        
                        # Parse Team2 score (format: "42-2 (4.3)")
                        if len(team2_spans) >= 2:
                            score_text = team2_spans[1].text.strip()
                            score_match = re.search(r'(\d+)-(\d+)', score_text)
                            if score_match:
                                team2_runs = int(score_match.group(1))
                                team2_wickets = int(score_match.group(2))
                            over_match = re.search(r'\((\d+)\.(\d+)\)', score_text)
                            if over_match:
                                team2_overs = float(f"{over_match.group(1)}.{over_match.group(2)}")
                        
                        # Detect innings and match state
                        first_innings_active = team1_overs is not None and (team2_overs is None or team2_overs == 0.0)
                        second_innings_active = team2_overs is not None and team2_overs > 0
                        
                        # 1st innings end conditions
                        first_innings_ended = (
                            team1_overs == 5.0 or  # 5 overs complete
                            team1_wickets >= 10     # All out
                        )
                        
                        # 2nd innings end conditions (match end)
                        second_innings_ended = (
                            team2_overs == 5.0 or           # 5 overs complete
                            team2_wickets >= 10 or           # All out
                            (team2_runs > team1_runs and second_innings_active)  # Target chased
                        )
                        
                        # Match ends when 2nd innings is complete
                        if second_innings_active and second_innings_ended:
                            if not self.match_ended:
                                if team2_overs == 5.0:
                                    print("\n🏁 2nd innings complete (5 overs) - Match finished!")
                                elif team2_wickets >= 10:
                                    print("\n🏁 2nd innings all out (10 wickets) - Match finished!")
                                elif team2_runs > team1_runs:
                                    print(f"\n🏁 Target chased! {team2_runs} > {team1_runs} - Match finished!")
                            return "ended"
                        
                        # Also check original condition for safety
                        if team1_overs == 5.0 and team2_overs == 5.0:
                            if not self.match_ended:
                                print("\n🏁 Both teams completed 5 overs - Match finished!")
                            return "ended"
                    
                    # Match is active if we can see teams and not finished
                    if not self.match_started:
                        print("🟢 Match has started!")
                        self.match_started = True
                    return "active"
                else:
                    return "waiting"
                    
            except TimeoutException:
                # No scorecard found
                if self.match_started:
                    # Scorecard disappeared after match started - likely ended
                    return "ended"
                else:
                    # Never found scorecard - waiting for match to start
                    return "waiting"
                    
        except Exception as e:
            return "unknown"
    
    def extract_match_info(self):
        """Extract detailed match information including ball-by-ball data and cards"""
        match_info = {
            'timestamp': datetime.now().isoformat(),
            'round_id': None,
            'match_title': None,
            'match_time': None,
            'teams': [],
            'ball_by_ball': [],
            'cards': [],
            'match_status': None
        }
        
        try:
            # Extract round ID first
            match_info['round_id'] = self.extract_round_id()
            self.current_round_id = match_info['round_id']
            
            # Check if round ID changed (new match started)
            if self.previous_round_id and self.current_round_id != self.previous_round_id:
                print(f"\n🆕 NEW MATCH DETECTED! Round ID changed: {self.previous_round_id} → {self.current_round_id}")
                self.match_ended = True  # Signal to reset for new match
                return match_info
            
            # Check match state
            match_state = self.check_match_state()
            
            if match_state == "waiting":
                if not self.match_started:
                    self.waiting_iterations += 1
                    
                    if self.waiting_iterations <= 3 or self.waiting_iterations % 10 == 0:
                        print(f"⏳ Waiting for match to start... ({self.waiting_iterations}/{self.max_waiting_iterations})")
                    
                    if self.waiting_iterations >= self.max_waiting_iterations:
                        print(f"\n⚠️  Match did not start after {self.max_waiting_iterations} iterations")
                        self.match_ended = True
                        return match_info
                
                return match_info
            
            # Reset waiting counter when match starts
            if match_state != "waiting":
                self.waiting_iterations = 0
            
            if match_state == "ended":
                if not self.match_ended:
                    print("🏁 Match ending detected - extracting final data...")
                    self.match_ended = True  # Set flag to stop tracking loop
            
            # Reset error counter on successful state check
            self.consecutive_errors = 0
            
            # NOTE: Cards are no longer scraped - derived from runs via RUNS_TO_CARD mapping
            
            # Extract match header
            try:
                casino_header = self.driver.find_element(By.CLASS_NAME, "casino-header")
                header_spans = casino_header.find_elements(By.TAG_NAME, "span")
                if len(header_spans) >= 2:
                    match_info['match_title'] = header_spans[0].text.strip()
                    match_info['match_time'] = header_spans[1].text.strip()
            except NoSuchElementException:
                pass
            
            # Extract scorecard
            scorecard = self.driver.find_element(By.CLASS_NAME, "scorecard")
            
            # Extract team scores
            team_rows = scorecard.find_elements(By.CSS_SELECTOR, "p.team-1")
            for row in team_rows:
                team_data = {}
                spans = row.find_elements(By.TAG_NAME, "span")
                
                if len(spans) >= 2:
                    team_data['name'] = spans[0].text.strip()
                    team_data['score'] = spans[1].text.strip()
                    
                    # Parse over info and runs from score (e.g., "39-1 (3.0)")
                    # Extract runs (before the dash)
                    runs_match = re.search(r'^(\d+)-', team_data['score'])
                    if runs_match:
                        team_data['runs'] = int(runs_match.group(1))
                    
                    # Extract wickets (after the dash, before parenthesis)
                    wickets_match = re.search(r'-(\d+)\s*\(', team_data['score'])
                    if wickets_match:
                        team_data['wickets'] = int(wickets_match.group(1))
                    
                    # Extract over info
                    score_match = re.search(r'\((\d+)\.(\d+)\)', team_data['score'])
                    if score_match:
                        team_data['current_over'] = int(score_match.group(1))
                        team_data['current_ball'] = int(score_match.group(2))
                    else:
                        score_match_complete = re.search(r'\((\d+)\.0\)', team_data['score'])
                        if score_match_complete:
                            team_data['current_over'] = int(score_match_complete.group(1))
                            team_data['current_ball'] = 0
                            team_data['innings_complete'] = True
                    
                    # Extract CRR if available
                    if len(spans) >= 3:
                        extra_info = spans[2].text.strip()
                        if 'CRR' in extra_info:
                            crr_match = re.search(r'CRR\s+([\d.]+)', extra_info)
                            if crr_match:
                                team_data['crr'] = crr_match.group(1)
                    
                    match_info['teams'].append(team_data)
            
            # Extract ball-by-ball from scorecard
            try:
                ball_by_ball_elem = scorecard.find_element(By.CLASS_NAME, "ball-by-ball")
                ball_runs = ball_by_ball_elem.find_elements(By.CLASS_NAME, "ball-runs")
                match_info['ball_by_ball'] = []
                
                for ball in ball_runs:
                    ball_text = ball.text.strip()
                    ball_class = ball.get_attribute('class')
                    ball_data = {
                        'runs': ball_text,
                        'is_four': 'four' in ball_class,
                        'is_six': 'six' in ball_class,
                        'is_wicket': 'wicket' in ball_class or ball_text.lower() == 'ww'
                    }
                    match_info['ball_by_ball'].append(ball_data)
            except NoSuchElementException:
                pass
            
            # Extract match status
            try:
                status_divs = scorecard.find_elements(By.CLASS_NAME, "text-xl-end")
                for div in status_divs:
                    text = div.text.strip()
                    if text and ('won' in text.lower() or 'lost' in text.lower() or 'needed' in text.lower()):
                        match_info['match_status'] = text
                        break
            except NoSuchElementException:
                pass
                
        except NoSuchElementException as e:
            self.consecutive_errors += 1
            if self.match_started and self.consecutive_errors < 5:
                print(f"⚠️  Element not found (attempt {self.consecutive_errors})")
        except Exception as e:
            self.consecutive_errors += 1
            if self.consecutive_errors < 5:
                print(f"⚠️  Error extracting match info: {e}")
        
        return match_info
    
    def extract_market_data(self):
        """Extract all betting market data"""
        markets_data = []
        
        try:
            game_markets = self.driver.find_elements(By.CLASS_NAME, "game-market")
            
            for market in game_markets:
                market_data = self.extract_single_market(market)
                if market_data:
                    markets_data.append(market_data)
                    
        except Exception as e:
            if self.match_started:  # Only log if match was active
                pass  # Silently skip market data errors
        
        return markets_data
    
    def extract_single_market(self, market_element):
        """Extract data from a single betting market"""
        try:
            market_data = {
                'market_title': None,
                'market_status': None,
                'bets': []
            }
            
            # Extract market title
            try:
                title_element = market_element.find_element(By.CSS_SELECTOR, ".market-title span")
                market_data['market_title'] = title_element.text.strip()
            except NoSuchElementException:
                pass
            
            # Extract market status
            try:
                status_element = market_element.find_element(By.CSS_SELECTOR, ".market-body")
                market_data['market_status'] = status_element.get_attribute('data-title')
            except NoSuchElementException:
                pass
            
            # Check if this is a Bookmaker market (market-2) or Fancy market (market-6)
            market_classes = market_element.get_attribute('class')
            
            # Extract min/max from header for Bookmaker markets
            bookmaker_min_max = None
            if 'market-2' in market_classes:
                try:
                    header = market_element.find_element(By.CLASS_NAME, "market-header")
                    min_max_text = header.find_element(By.CLASS_NAME, "market-nation-name").text.strip()
                    bookmaker_min_max = min_max_text  # e.g., "Min: 100 Max: 3L"
                except:
                    pass
            
            if 'market-2' in market_classes:
                # Bookmaker market - extract directly from market-body rows
                try:
                    market_body = market_element.find_element(By.CLASS_NAME, "market-body")
                    market_rows = market_body.find_elements(By.CLASS_NAME, "market-row")
                    for row in market_rows:
                        bet_data = self.extract_bet_data(row, bookmaker_min_max)
                        if bet_data:
                            market_data['bets'].append(bet_data)
                except NoSuchElementException:
                    pass
            else:
                # Fancy market - extract from fancy-market containers
                fancy_markets = market_element.find_elements(By.CLASS_NAME, "fancy-market")
                for fancy in fancy_markets:
                    market_rows = fancy.find_elements(By.CLASS_NAME, "market-row")
                    for row in market_rows:
                        bet_data = self.extract_bet_data(row)
                        if bet_data:
                            market_data['bets'].append(bet_data)
            
            return market_data if market_data['bets'] else None
            
        except Exception as e:
            return None
    
    def extract_bet_data(self, row_element, bookmaker_min_max=None):
        """Extract Yes/No betting data from a market row"""
        try:
            bet_data = {
                'bet_name': None,
                'no_odds': None,
                'no_volume': None,
                'yes_odds': None,
                'yes_volume': None,
                'min_bet': None,
                'max_bet': None
            }
            
            # Extract bet name
            try:
                name_element = row_element.find_element(By.CLASS_NAME, "market-nation-name")
                bet_data['bet_name'] = name_element.text.strip()
            except NoSuchElementException:
                pass
            
            # Extract No (Lay) odds
            try:
                lay_box = row_element.find_element(By.CSS_SELECTOR, ".market-odd-box.lay")
                no_odds = lay_box.find_element(By.CLASS_NAME, "market-odd").text.strip()
                no_volume = lay_box.find_element(By.CLASS_NAME, "market-volume").text.strip()
                
                bet_data['no_odds'] = no_odds
                bet_data['no_volume'] = no_volume
            except NoSuchElementException:
                pass
            
            # Extract Yes (Back) odds
            try:
                back_box = row_element.find_element(By.CSS_SELECTOR, ".market-odd-box.back")
                yes_odds = back_box.find_element(By.CLASS_NAME, "market-odd").text.strip()
                yes_volume = back_box.find_element(By.CLASS_NAME, "market-volume").text.strip()
                
                bet_data['yes_odds'] = yes_odds
                bet_data['yes_volume'] = yes_volume
            except NoSuchElementException:
                pass
            
            # Extract min/max betting limits
            # First try from fancy-min-max (for Fancy markets)
            try:
                min_max_box = row_element.find_element(By.CLASS_NAME, "fancy-min-max")
                min_max_spans = min_max_box.find_elements(By.TAG_NAME, "span")
                
                for span in min_max_spans:
                    text = span.text.strip()
                    if text.startswith('Min:'):
                        bet_data['min_bet'] = text.replace('Min:', '').strip()
                    elif text.startswith('Max:'):
                        bet_data['max_bet'] = text.replace('Max:', '').strip()
                        
            except NoSuchElementException:
                # If not found, use bookmaker_min_max (for Bookmaker markets)
                if bookmaker_min_max:
                    bet_data['min_bet'] = bookmaker_min_max
                    bet_data['max_bet'] = bookmaker_min_max
            
            if bet_data['bet_name'] and (bet_data['yes_odds'] or bet_data['no_odds']):
                return bet_data
                
        except Exception as e:
            pass
        
        return None
    
    def detect_changes(self, current_data):
        """Detect changes in balls, cards, and scores"""
        changes = {
            'new_balls': [],
            'new_card': None,
            'score_changed': False,
            'over_completed': False,
            'round_id_changed': False,
            'timestamp': datetime.now().isoformat()
        }
        
        # Get current data (cards no longer scraped - derived from runs)
        current_balls = current_data['match_info'].get('ball_by_ball', [])
        current_teams = current_data['match_info'].get('teams', [])
        
        # === PRIMARY DETECTION: Use scorecard's over.ball as source of truth ===
        # When batting team's (over, ball) increases, a new ball was played
        if len(current_teams) > 0:
            # Find the batting team based on current innings
            batting_team = None
            if self.current_innings == 1:
                # 1st innings - Team1 (AUS) is batting
                batting_team = current_teams[0] if len(current_teams) > 0 else None
            else:
                # 2nd innings - Team2 (IND) is batting
                batting_team = current_teams[1] if len(current_teams) > 1 else None
            
            if batting_team:
                current_over = batting_team.get('current_over', 0) or 0
                current_ball = batting_team.get('current_ball', 0) or 0
                
                # Calculate total balls played
                current_total_balls = current_over * 6 + current_ball
                prev_over = self.previous_over_info.get('over', 0)
                prev_ball = self.previous_over_info.get('ball', 0)
                prev_total_balls = prev_over * 6 + prev_ball
                
                # New ball detected when total balls increases
                if current_total_balls > prev_total_balls:
                    # Get the run value from ball-by-ball display (last element is most recent)
                    runs_display = '?'
                    runs_numeric = None
                    is_four = False
                    is_six = False
                    is_wicket = False
                    is_dot = False
                    
                    if current_balls and len(current_balls) > 0:
                        last_ball = current_balls[-1]
                        runs_display = last_ball.get('runs', '?')
                        is_four = last_ball.get('is_four', False)
                        is_six = last_ball.get('is_six', False)
                        is_wicket = last_ball.get('is_wicket', False) or runs_display in ['W', 'ww']
                        is_dot = last_ball.get('is_dot', False) or runs_display == '0'
                        
                        # Convert runs to numeric for card lookup
                        if runs_display in ['W', 'ww']:
                            runs_numeric = -1
                        elif runs_display.isdigit():
                            runs_numeric = int(runs_display)
                    
                    # DERIVE card from runs using RUNS_TO_CARD mapping (no scraping needed)
                    card_name = '?'
                    if is_wicket:
                        card_name = 'K'  # Wicket = King
                    elif runs_numeric is not None:
                        card_name = RUNS_TO_CARD.get(runs_numeric, '?')
                    
                    ball_data = {
                        'runs': runs_display,
                        'card': card_name,  # Derived from runs, not scraped
                        'card_runs': runs_numeric if runs_numeric is not None else runs_display,
                        'ball_position': current_ball if current_ball > 0 else 6,
                        'over': current_over,
                        'ball': current_ball,
                        'is_four': is_four,
                        'is_six': is_six,
                        'is_wicket': is_wicket,
                        'is_dot': is_dot
                    }
                    changes['new_balls'] = [ball_data]
                    
                    # DON'T update previous_over_info here - it's updated at the end
        
        # Note: No longer tracking cards - card is derived from runs
        # Note: Fallback detection REMOVED - scorecard over.ball is the single source of truth
        
        self.previous_balls = current_balls.copy() if current_balls else []
        
        # Check for over completion BEFORE updating previous_over_info
        # This must happen independently of score changes
        if len(current_teams) > 0:
            # Find the batting team (the one currently playing)
            batting_team = None
            batting_team_idx = None
            
            # Determine which team is batting based on innings
            if self.current_innings == 1:
                # 1st innings - Team1 (AUS) is batting
                batting_team = current_teams[0] if len(current_teams) > 0 else None
                batting_team_idx = 0
            else:
                # 2nd innings - Team2 (IND) is batting
                batting_team = current_teams[1] if len(current_teams) > 1 else None
                batting_team_idx = 1
            
            if batting_team:
                current_over = batting_team.get('current_over', 0) or 0
                current_ball = batting_team.get('current_ball', 0) or 0
                
                prev_over = self.previous_over_info.get('over', 0)
                prev_ball = self.previous_over_info.get('ball', 0)
                
                # Over completed when we see X.0 (X overs just finished)
                # AND we were previously at (X-1).6 or (X-1).5 etc
                if current_ball == 0 and current_over > prev_over and current_over > 0:
                    changes['over_completed'] = True
                    changes['completed_over_number'] = current_over
                    print(f"✅ OVER {current_over} COMPLETED!")
                
                # Update previous_over_info at the end (single update point)
                self.previous_over_info = {'over': current_over, 'ball': current_ball}
        
        # Check for score changes
        if current_teams != self.previous_score:
            changes['score_changed'] = True
            changes['score_details'] = current_teams
            
            # Detect innings change: When team2 (IND) starts batting
            if len(current_teams) >= 2:
                team2 = current_teams[1]
                team2_over = team2.get('current_over', 0)
                team2_ball = team2.get('current_ball', 0)
                
                # 2nd innings starts when IND has any ball/over progress
                if (team2_over > 0 or team2_ball > 0) and self.current_innings == 1:
                    self.current_innings = 2
                    changes['innings_changed'] = True
                    changes['new_innings'] = 2
                    print(f"\n🏏 INNINGS CHANGE: 2nd innings started (IND batting)")
                    # Reset over tracking for 2nd innings
                    self.previous_over_info = {'over': 0, 'ball': 0}
            
            self.previous_score = current_teams.copy()
        
        return changes
    
    
    def continuous_ball_by_ball_tracking(self, username, password, scrape_interval=2):
        """Continuously track the match ball by ball"""
        try:
            self.start_driver()
            
            # Login and navigate
            print("\n=== Logging in ===")
            if not self.login(username, password):
                print("Login failed")
                return
            
            print("\n=== Navigating to Cricket ===")
            if not self.navigate_to_5five_cricket():
                print("Navigation failed")
                return
            
            print("\n=== Finding Virtual Cricket Match ===")
            match_info = self.find_first_virtual_cricket_match()
            if not match_info:
                print("No match found")
                return
            
            print(f"\n{'='*60}")
            print(f"STARTING BALL-BY-BALL TRACKING")
            print(f"Match: {match_info['match_name']}")
            print(f"Match ID: {match_info['match_id']}")
            print(f"Update interval: {scrape_interval} seconds")
            if self.auto_analyze:
                print(f"Auto-analysis: ENABLED (triggers after each over)")
            print(f"{'='*60}\n")
            
            
            iteration = 0
            ball_count = 0
            
            while True:
                iteration += 1
                
                # Check if match has ended
                if self.match_ended:
                    print(f"\n🏁 Match ended. Stopping tracker.")
                    break
                
                # Check for too many consecutive errors
                if self.consecutive_errors >= self.max_consecutive_errors:
                    print(f"\n⚠️  Too many consecutive errors ({self.consecutive_errors})")
                    if self.match_started:
                        print("   Match likely ended. Stopping tracker.")
                        self.match_ended = True
                        break
                    else:
                        print("   Match might not have started yet. Continuing to wait...")
                        self.consecutive_errors = 0  # Reset and keep trying
                
                try:
                    # Extract current data
                    match_data = self.extract_match_info()
                    markets_data = self.extract_market_data()
                    
                    current_data = {
                        'match_info': match_data,
                        'markets': markets_data
                    }
                    
                    # Detect changes
                    changes = self.detect_changes(current_data)
                    
                    # Reset ball count on innings change and trigger pattern analysis
                    if changes.get('innings_changed'):
                        ball_count = 0
                        print(f"   📊 Ball count reset for 2nd innings")
                        
                        # Trigger pattern analysis for 1st innings completion
                        if self.auto_analyze:
                            print(f"\n🏏 1ST INNINGS COMPLETED - Analyzing patterns...")
                           
                    
                    # Log new balls
                    if changes['new_balls']:
                        for ball in changes['new_balls']:
                            ball_count += 1
                            
                            print(f"\n🏏 BALL #{ball_count}: Card {ball['card']} = {ball['runs']} runs", end="")
                            if ball['is_four']:
                                print(" - FOUR! 🎯", end="")
                            if ball['is_six']:
                                print(" - SIX! 🚀", end="")
                            if ball['is_wicket']:
                                print(" - WICKET! ❌", end="")
                            print()
                            
                            # Prepare team data
                            teams = match_data.get('teams', [{}, {}])
                            team1 = teams[0] if len(teams) > 0 else {}
                            team2 = teams[1] if len(teams) > 1 else {}
                            
                    
                    # Log score changes
                    if changes['score_changed']:
                        print(f"\n📊 SCORE UPDATE:")
                        for team in changes.get('score_details', []):
                            print(f"   {team.get('name', 'Unknown')}: {team.get('score', 'N/A')}")
                            if 'crr' in team:
                                print(f"      CRR: {team['crr']}", end="")
                            if 'rr' in team:
                                print(f" | RR: {team['rr']}", end="")
                            print()
                    
                    # Check if over is completed and trigger analysis
                    if changes.get('over_completed') and self.auto_analyze:
                        completed_over = changes.get('completed_over_number', 0)
                        print(f"\n✅ OVER {completed_over} COMPLETED!")
                        
                    
                    # Check if match ended (multiple conditions)
                    teams = match_data.get('teams', [])
                    match_status = match_data.get('match_status', '')
                    
                    if len(teams) >= 2:
                        team1_over = teams[0].get('current_over', 0)
                        team2_over = teams[1].get('current_over', 0)
                        
                        # Match ends when:
                        # 1. Both teams completed 10 overs
                        if team1_over == 10 and team2_over == 10:
                            if not self.match_ended:
                                print("\n🏁 Both teams completed 10 overs - Match finished!")
                                self.match_ended = True
                        
                        # 2. Match status shows result (won/lost - case insensitive)
                        elif match_status and ('won' in match_status.lower() or 'lost' in match_status.lower()):
                            if not self.match_ended:
                                print(f"\n🏁 Match finished - {match_status}")
                                self.match_ended = True
                        
                        # 3. Team 2 is batting and both teams have same over (chase completed early)
                        elif team2_over > 0 and team1_over == 10 and team2_over < 10:
                            # Check if team2 score is higher (chase successful)
                            team1_score_text = teams[0].get('score', '')
                            team2_score_text = teams[1].get('score', '')
                            
                            import re
                            team1_runs = re.search(r'^(\d+)-', team1_score_text)
                            team2_runs = re.search(r'^(\d+)-', team2_score_text)
                            
                            if team1_runs and team2_runs:
                                if int(team2_runs.group(1)) > int(team1_runs.group(1)):
                                    if not self.match_ended:
                                        print(f"\n🏁 Match finished - Team 2 chased the target!")
                                        self.match_ended = True
                    
                    # Print status every 10 iterations (only if match started)
                    if iteration % 10 == 0 and self.match_started:
                        # Get actual over info from batting team
                        teams = match_data.get('teams', [])
                        if teams:
                            batting_team = teams[0]
                            actual_over = batting_team.get('current_over', 0)
                            actual_ball = batting_team.get('current_ball', 0)
                            print(f"\n✓ Iteration {iteration} | Over {actual_over}.{actual_ball} ({ball_count} balls total)")
                    
                    time.sleep(scrape_interval)
                    
                except KeyboardInterrupt:
                    print("\n\n⏹️  Tracking stopped by user")
                    print(f"Total balls recorded: {ball_count}")
                    print(f"Total overs analyzed: {self.last_analyzed_over}")
                    print(f"Data saved to: {self.csv_file}")
                    
                    # Final analysis
                    
                    
                except Exception as e:
                    print(f"\n⚠️  Error in iteration {iteration}: {e}")
                    import traceback
                    traceback.print_exc()
                    time.sleep(scrape_interval)
                    continue
            
            # Final summary
            if self.match_ended:
                print(f"\n{'='*60}")
                print(f"MATCH COMPLETED - FINAL SUMMARY")
                print(f"{'='*60}")
                print(f"Total balls recorded: {ball_count}")
                print(f"Total overs analyzed: {self.last_analyzed_over}")
                print(f"Data saved to: {self.csv_file}")
                
                if self.auto_analyze and ball_count > 0:
                    print("\n🔍 Running final analysis for remaining overs...")
                    current_over = self.previous_over_info.get('over', 0)
                    current_ball = self.previous_over_info.get('ball', 0)
                    
                    print(f"   Current position: Over {current_over}.{current_ball}")
                    print(f"   Last analyzed over: {self.last_analyzed_over}")
                    
                    # Determine the last complete over
                    if current_ball == 0 and current_over > 0:
                        # Just completed an over (e.g., 9.0)
                        final_over = current_over
                    elif current_over > 0:
                        # In progress over (e.g., 9.5) - analyze up to previous complete over
                        final_over = current_over - 1
                    else:
                        final_over = 0
                    
                    # Analyze all overs that weren't analyzed yet
                    if final_over > self.last_analyzed_over:
                        for over_num in range(self.last_analyzed_over + 1, final_over + 1):
                            print(f"\n   Analyzing over {over_num}...")
                            
                    else:
                        print(f"   No additional complete overs to analyze.")
                
                print(f"{'='*60}\n")
            
        finally:
            self.close_driver()
    
    def continuous_match_tracker(self, username, password, scrape_interval=2, wait_between_matches=10):
        """Continuously track matches on the 5Five Cricket page"""
        try:
            self.start_driver()
            
            # Login once
            print("\n=== Logging in ===")
            if not self.login(username, password):
                print("Login failed")
                return
            
            # Navigate to 5Five Cricket once
            print("\n=== Navigating to 5Five Cricket ===")
            if not self.navigate_to_5five_cricket():
                print("Navigation failed")
                return
            
            match_count = 0
            
                        
            while True:
                try:
                    # 1. Wait for active match
                    print(f"\n⏳ Waiting for active match...")
                    self.match_started = False
                    self.match_ended = False
                    self.waiting_iterations = 0
                    
                    while True:
                        match_state = self.check_match_state()
                        if match_state == "active":
                            print("\n🟢 Match is ACTIVE!")
                            break
                        elif match_state == "ended":
                            print(".", end="", flush=True) # Still ended, waiting for new one
                        else:
                            print(".", end="", flush=True) # Waiting
                        
                        time.sleep(2)
                    
                    # Match started!
                    match_count += 1
                    
                    # Get the current round ID for this match
                    self.current_round_id = self.extract_round_id()
                    self.current_match_id = self.generate_match_id(self.current_round_id)
                    
                    print(f"\n{'='*60}")
                    print(f"STARTING MATCH #{match_count}")
                    print(f"Round ID: {self.current_round_id}")
                    print(f"Match ID: {self.current_match_id}")
                    print(f"{'='*60}\n")
                    
                    # Reset tracking data
                    self.previous_balls = []
                    self.previous_score = {}
                    self.previous_ball_num = None
                    self.previous_over_info = {'over': 0, 'ball': 0}
                    self.last_analyzed_over = 0
                    self.consecutive_errors = 0
                    self.current_innings = 1  # Reset to 1st innings for new match
                    # self.previous_cards = []
                    self.previous_round_id = self.current_round_id
                    
                    ball_count = 0
                    iteration = 0
                    
                    # 2. Track match until ended
                    while not self.match_ended:
                        iteration += 1
                        
                        try:
                            # Extract current data
                            match_data = self.extract_match_info()
                            markets_data = self.extract_market_data()
                            
                            current_data = {
                                'match_info': match_data,
                                'markets': markets_data
                            }
                            
                            # Detect changes
                            changes = self.detect_changes(current_data)
                            
                            # Reset ball count on innings change and trigger pattern analysis
                            if changes.get('innings_changed'):
                                ball_count = 0
                                print(f"   📊 Ball count reset for 2nd innings")
                                
                                # Trigger pattern analysis for 1st innings completion
                                if self.auto_analyze:
                                    print(f"\n🏏 1ST INNINGS COMPLETED - Analyzing patterns...")
                                    
                            
                            # Log new balls
                            if changes['new_balls']:
                                for ball in changes['new_balls']:
                                    ball_count += 1
                                    payload = {
                                        "match_id": self.current_match_id,
                                        "timestamp": datetime.now().isoformat(),
                                        "ball_number": ball_count,
                                        "runs": ball.get('runs', ''),
                                        "is_four": ball.get('is_four', False),
                                        "is_six": ball.get('is_six', False),
                                        "is_wicket": ball.get('is_wicket', False),
                                        "is_dot": ball.get('is_dot', False),
                                        "match_status": match_data.get('match_status', 'LIVE')
                                    }

                                    self.send_to_backend(payload)
                                    
                                    card_name = ball.get('card', '?')
                                    card_runs = ball.get('card_runs', ball.get('runs', ''))
                                    
                                    print(f"\n🏏 BALL #{ball_count}: Card {card_name} = {ball['runs']} runs", end="")
                                    if ball.get('is_four'):
                                        print(" - FOUR! 🎯", end="")
                                    if ball.get('is_six'):
                                        print(" - SIX! 🚀", end="")
                                    if ball.get('is_wicket'):
                                        print(" - WICKET! ❌", end="")
                                    if ball.get('is_dot'):
                                        print(" - DOT", end="")
                                    print()
                                    
                            # Log score changes
                            if changes['score_changed']:
                                print(f"\n📊 SCORE UPDATE:")
                                for team in changes.get('score_details', []):
                                    print(f"   {team.get('name', 'Unknown')}: {team.get('score', 'N/A')}")
                            
                            # Check if over is completed and trigger analysis
                            if changes.get('over_completed') and self.auto_analyze:
                                completed_over = changes.get('completed_over_number', 0)
                                print(f"\n✅ OVER {completed_over} COMPLETED!")
                                
                            
                            # Check if match ended (using updated check logic)
                            # Logic is already in extract_match_info -> check_match_state
                            # But we need to double check here or rely on self.match_ended set by extract_match_info
                            
                            # Additional check for 5 overs here just in case
                            teams = match_data.get('teams', [])
                            if len(teams) >= 2:
                                team1_over = teams[0].get('current_over', 0)
                                team2_over = teams[1].get('current_over', 0)
                                if team1_over == 5 and team2_over == 5:
                                    self.match_ended = True
                            
                            time.sleep(scrape_interval)
                            
                        except Exception as e:
                            print(f"\n⚠️  Error in iteration {iteration}: {e}")
                            self.consecutive_errors += 1
                            if self.consecutive_errors >= self.max_consecutive_errors:
                                print(f"\n⚠️  Too many consecutive errors. Match likely ended.")
                                self.match_ended = True
                            time.sleep(scrape_interval)
                    
                    # Match ended
                    print(f"\n{'='*60}")
                    print(f"MATCH #{match_count} COMPLETED")
                    print(f"{'='*60}")
                    print(f"Total balls recorded: {ball_count}")
                    
                    # Final analysis - trigger for match completion
                    if self.auto_analyze and ball_count > 0:
                        print("\n🔍 Running final match analysis...")
                        
                        # Trigger pattern analysis with 'match' event type
                        # This will analyze:
                        # - Final score pattern (both teams' final scores)
                        # - Full match card sequence (all 60 cards)
                        # - Any remaining incomplete overs
                       
                    
                    print(f"⏳ Waiting {wait_between_matches} seconds before next match...\n")
                    time.sleep(wait_between_matches)
                    
                except KeyboardInterrupt:
                    print("\n\n⏹️  Tracking stopped by user")
                    break
                except Exception as e:
                    print(f"\n⚠️  Error in match loop: {e}")
                    time.sleep(30)
        
        finally:
            self.close_driver()


def main():
    """Main function to run the scraper"""
    print("="*60)
    print("TABLES247 5FIVE CRICKET - AUTO PATTERN ANALYZER")
    print("="*60)
    
    # Login credentials
    username = "balajison"
    password = "Nayan@2021"
    
    # Initialize scraper with auto-analysis enabled
    # profile_name=None uses default Firefox profile (works on all systems)
    scraper = Tables247FiveCricketScraper(headless=False, profile_name=None, auto_analyze=True)
    
    print("\nFeatures:")
    print("  ✓ Ball-by-ball data collection")
    print("  ✓ Market data tracking")
    print("  ✓ Automatic pattern analysis after each over")
    print("  ✓ Excel reports with pattern detection")
    print("  ✓ Continuous match tracking (never stops)")
    print("  ✓ Auto-finds next match when current ends")
    print("  ✓ Waits and retries if no active matches")
    print("\nPress Ctrl+C to stop tracking\n")
    
    try:
        interval = input("Enter scraping interval in seconds (default 2): ").strip()
        interval = int(interval) if interval else 2
    except ValueError:
        interval = 2
    
    try:
        wait_time = input("Enter wait time between matches in seconds (default 120): ").strip()
        wait_time = int(wait_time) if wait_time else 120
    except ValueError:
        wait_time = 120
    
    print(f"\nStarting continuous tracker:")
    print(f"  - Scraping interval: {interval} seconds")
    print(f"  - Wait between matches: {wait_time} seconds")
    print(f"  - Script will run indefinitely until Ctrl+C\n")
    
    # Start continuous tracking
    scraper.continuous_match_tracker(username, password, interval, wait_time)


if __name__ == "__main__":
    main()
