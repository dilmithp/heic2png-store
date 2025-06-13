import os
from datetime import datetime

# Site configuration
SITE_CONFIG = {
    'domain': 'heic2png.store',
    'base_url': 'https://heic2png.store',
    'site_name': 'HEIC2PNG.Store',
    'description': 'Convert HEIC images to PNG format instantly. Free, secure, and fast online converter tool.',
    'keywords': 'heic to png, image converter, heic converter, png converter, online tool, free converter',
    'author': 'HEIC2PNG.Store Team',
    'version': '1.0.0'
}

# API configuration
API_CONFIG = {
    'indexing_api_quota': 200,
    'service_account_file': 'credentials/leafy-container-462712-b5-740897402e99.json',
    'scopes': ['https://www.googleapis.com/auth/indexing'],
    'api_url': 'https://indexing.googleapis.com/v3/urlNotifications:publish'
}

# Sitemap configuration
SITEMAP_CONFIG = {
    'base_url': 'https://heic2png.store',
    'pages': [
        {'url': '/', 'priority': 1.0, 'changefreq': 'daily'},
        {'url': '/about', 'priority': 0.8, 'changefreq': 'monthly'},
        {'url': '/contact', 'priority': 0.7, 'changefreq': 'monthly'},
        {'url': '/privacy', 'priority': 0.5, 'changefreq': 'yearly'},
        {'url': '/terms', 'priority': 0.5, 'changefreq': 'yearly'},
        {'url': '/blog', 'priority': 0.8, 'changefreq': 'weekly'}
    ]
}


# File paths
PATHS = {
    'public': 'public/',
    'logs': 'logs/',
    'credentials': 'credentials/',
    'scripts': 'scripts/',
    'templates': 'templates/'
}

# Logging configuration
LOGGING_CONFIG = {
    'level': 'INFO',
    'format': '%(asctime)s - %(levelname)s - %(message)s',
    'files': {
        'indexing': 'logs/indexing_log.txt',
        'analytics': 'logs/analytics_log.txt',
        'adsense': 'logs/adsense_log.txt',
        'error': 'logs/error_log.txt'
    }
}

# AdSense configuration
ADSENSE_CONFIG = {
    'publisher_id': 'ca-pub-4166952431440537',
    'ad_slot': '5612924295',
    'ad_positions': ['top-banner', 'sidebar', 'in-content', 'bottom-banner']
}

# Analytics configuration
ANALYTICS_CONFIG = {
    'google_analytics_id': 'GA_MEASUREMENT_ID',
    'track_conversions': True,
    'track_performance': True,
    'export_data': True
}

# Ensure directories exist


def ensure_directories():
    """Create necessary directories if they don't exist"""
    for path in PATHS.values():
        os.makedirs(path, exist_ok=True)

# Initialize configuration


def init_config():
    """Initialize configuration and create necessary directories"""
    ensure_directories()

    # Create initial log files
    for log_file in LOGGING_CONFIG['files'].values():
        if not os.path.exists(log_file):
            with open(log_file, 'w') as f:
                f.write(f"# Log file created: {datetime.now().isoformat()}\n")


if __name__ == "__main__":
    init_config()
    print("Configuration initialized successfully!")
