import os
import requests
import hashlib
import logging
import re
from urllib.parse import urlparse, parse_qs

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class FontManager:
    def __init__(self, font_dir='static/fonts/google'):
        """Initialize the font manager with a directory to store downloaded fonts."""
        self.font_dir = font_dir
        self.ensure_font_dir_exists()
        
    def ensure_font_dir_exists(self):
        """Create the font directory if it doesn't exist."""
        os.makedirs(self.font_dir, exist_ok=True)
        
    def get_font_hash(self, url):
        """Generate a unique hash for a font URL."""
        return hashlib.md5(url.encode('utf-8')).hexdigest()
        
    def download_google_font(self, url):
        """
        Download a Google Font and save it locally.
        Returns a local URL to the font CSS file.
        """
        if not url or not url.startswith('https://fonts.googleapis.com/'):
            logger.warning(f"Invalid Google Font URL: {url}")
            return None
            
        # Generate a unique ID for this font URL
        font_hash = self.get_font_hash(url)
        css_path = os.path.join(self.font_dir, f"{font_hash}.css")
        
        # Check if we've already downloaded this font
        if os.path.exists(css_path):
            logger.info(f"Font already downloaded: {url}")
            return f"/static/fonts/google/{font_hash}.css"
            
        try:
            # Download the CSS file from Google Fonts
            logger.info(f"Downloading Google Font: {url}")
            response = requests.get(url)
            response.raise_for_status()
            css_content = response.text
            
            # Extract font file URLs from the CSS
            font_urls = re.findall(r'url\((https://fonts\.gstatic\.com/[^)]+)\)', css_content)
            
            # Download each font file
            for font_url in font_urls:
                font_filename = os.path.basename(urlparse(font_url).path)
                font_path = os.path.join(self.font_dir, font_filename)
                
                # Download the font file if it doesn't exist
                if not os.path.exists(font_path):
                    logger.info(f"Downloading font file: {font_url}")
                    font_response = requests.get(font_url)
                    font_response.raise_for_status()
                    
                    with open(font_path, 'wb') as f:
                        f.write(font_response.content)
                
                # Replace the remote URL with the local URL in the CSS
                css_content = css_content.replace(
                    font_url, 
                    f"/static/fonts/google/{font_filename}"
                )
            
            # Save the modified CSS file
            with open(css_path, 'w', encoding='utf-8') as f:
                f.write(css_content)
                
            return f"/static/fonts/google/{font_hash}.css"
            
        except Exception as e:
            logger.error(f"Error downloading font: {e}")
            return None
            
    def get_local_font_url(self, google_font_url):
        """
        Get the local URL for a Google Font.
        If the font hasn't been downloaded yet, download it first.
        """
        if not google_font_url:
            return None
            
        # Check if we already have this font
        font_hash = self.get_font_hash(google_font_url)
        css_path = os.path.join(self.font_dir, f"{font_hash}.css")
        
        if os.path.exists(css_path):
            return f"/static/fonts/google/{font_hash}.css"
        else:
            # Download the font
            return self.download_google_font(google_font_url)
