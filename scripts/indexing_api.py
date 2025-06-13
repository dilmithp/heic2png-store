import json
import requests
import xml.etree.ElementTree as ET
from google.oauth2 import service_account
from google.auth.transport.requests import Request
from datetime import datetime
import os
import logging


class HEICConverterIndexing:
    def __init__(self):
        self.scopes = ["https://www.googleapis.com/auth/indexing"]
        self.api_url = "https://indexing.googleapis.com/v3/urlNotifications:publish"
        self.service_account_file = "credentials/leafy-container-462712-b5-740897402e99.json"
        self.base_url = "https://heic2png.store"
        self.credentials = self._load_credentials()
        self.setup_logging()

    def setup_logging(self):
        """Setup logging configuration"""
        os.makedirs('logs', exist_ok=True)
        logging.basicConfig(
            filename='logs/indexing_log.txt',
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )

    def _load_credentials(self):
        """Load service account credentials"""
        try:
            return service_account.Credentials.from_service_account_file(
                self.service_account_file, scopes=self.scopes
            )
        except Exception as e:
            logging.error(f"Failed to load credentials: {e}")
            raise

    def _get_access_token(self):
        """Get fresh access token"""
        try:
            self.credentials.refresh(Request())
            return self.credentials.token
        except Exception as e:
            logging.error(f"Failed to refresh token: {e}")
            raise

    def submit_url(self, url, action_type="URL_UPDATED"):
        """Submit single URL to Google Indexing API"""
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self._get_access_token()}'
        }

        data = {
            "url": url,
            "type": action_type
        }

        try:
            response = requests.post(self.api_url, headers=headers, json=data)
            result = {
                'url': url,
                'status_code': response.status_code,
                'response': response.json() if response.content else {},
                'timestamp': datetime.now().isoformat()
            }

            if response.status_code == 200:
                logging.info(f"Successfully submitted URL: {url}")
            else:
                logging.warning(
                    f"Failed to submit URL: {url}, Status: {response.status_code}")

            self._log_result(result)
            return result

        except Exception as e:
            error_result = {
                'url': url,
                'status_code': 'ERROR',
                'response': str(e),
                'timestamp': datetime.now().isoformat()
            }
            logging.error(f"Error submitting URL {url}: {e}")
            self._log_result(error_result)
            return error_result

    def get_sitemap_urls(self):
        """Extract URLs from heic2png.store sitemap"""
        try:
            response = requests.get(f"{self.base_url}/sitemap.xml")
            response.raise_for_status()

            root = ET.fromstring(response.content)
            namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}

            urls = []
            for url_elem in root.findall('ns:url', namespace):
                loc = url_elem.find('ns:loc', namespace)
                if loc is not None:
                    urls.append(loc.text)

            logging.info(f"Found {len(urls)} URLs in sitemap")
            return urls

        except Exception as e:
            logging.error(f"Error fetching sitemap: {e}")
            return []

    def daily_submission(self, max_urls=200):
        """Daily URL submission job for heic2png.store"""
        logging.info("Starting daily URL submission for heic2png.store")

        try:
            urls = self.get_sitemap_urls()

            if not urls:
                logging.warning("No URLs found in sitemap")
                return []

            # Limit to API quota
            urls_to_submit = urls[:max_urls]

            if len(urls) > max_urls:
                logging.info(
                    f"Limited submission to {max_urls} URLs due to API quota")

            results = []
            successful = 0
            failed = 0

            for i, url in enumerate(urls_to_submit, 1):
                result = self.submit_url(url)
                results.append(result)

                if result['status_code'] == 200:
                    successful += 1
                else:
                    failed += 1

                print(
                    f"Progress: {i}/{len(urls_to_submit)} - {url} - Status: {result['status_code']}")

                # Add delay to respect rate limits
                if i % 10 == 0:
                    import time
                    time.sleep(1)

            # Generate summary report
            summary_report = {
                'timestamp': datetime.now().isoformat(),
                'domain': 'heic2png.store',
                'total_urls': len(results),
                'successful_submissions': successful,
                'failed_submissions': failed,
                'success_rate': f"{(successful/len(results)*100):.1f}%" if results else "0%"
            }

            # Save summary report
            with open('logs/daily_summary.json', 'w') as f:
                json.dump(summary_report, f, indent=2)

            logging.info(f"Daily submission summary: {summary_report}")
            return results

        except Exception as e:
            logging.error(f"Daily submission failed: {e}")
            return []


def main():
    """Main function for heic2png.store indexing"""
    print("HEIC2PNG.Store - Google Indexing API Submission")
    print("=" * 50)
    print(f"Domain: heic2png.store")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("=" * 50)

    indexer = HEICConverterIndexing()

    # Check current quota usage
    quota_usage = indexer.check_quota_usage()
    remaining_quota = 200 - quota_usage['requests']

    print(f"Current quota usage: {quota_usage['requests']}/200 requests")
    print(f"Remaining quota: {remaining_quota}")

    if remaining_quota <= 0:
        print("Daily quota limit reached. Skipping submission.")
        return

    # Run daily submission
    results = indexer.daily_submission(max_urls=remaining_quota)

    # Update quota usage
    successful_requests = sum(1 for r in results if r['status_code'] == 200)
    indexer.update_quota_usage(len(results))

    print("=" * 50)
    print("SUBMISSION COMPLETE")
    print(f"URLs processed: {len(results)}")
    print(f"Successful: {successful_requests}")
    print(f"Failed: {len(results) - successful_requests}")
    print(
        f"Success rate: {(successful_requests/len(results)*100):.1f}%" if results else "0%")


if __name__ == "__main__":
    main()
