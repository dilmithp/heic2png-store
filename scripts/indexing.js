const { google } = require('googleapis');
const axios = require('axios');
const xml2js = require('xml2js');

class GitHubIndexer {
  constructor() {
    // Parse the service account from environment variable
    this.serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    this.siteUrl = process.env.SITE_URL || 'https://heic2png.store';
    this.quotaLimit = 200;
  }

  async authenticate() {
    try {
      this.jwtClient = new google.auth.JWT(
        this.serviceAccount.client_email,
        null,
        this.serviceAccount.private_key,
        ['https://www.googleapis.com/auth/indexing']
      );

      await this.jwtClient.authorize();
      console.log('✅ Successfully authenticated with Google API');
      return true;
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      return false;
    }
  }

  async fetchSitemap() {
    try {
      console.log(`📄 Fetching sitemap from: ${this.siteUrl}/sitemap.xml`);
      const response = await axios.get(`${this.siteUrl}/sitemap.xml`, {
        timeout: 30000,
        headers: {
          'User-Agent': 'HEIC2PNG-GitHub-Indexer/1.0'
        }
      });

      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(response.data);

      if (!result.urlset || !result.urlset.url) {
        throw new Error('Invalid sitemap format');
      }

      const urls = result.urlset.url.map(urlObj => urlObj.loc[0]);
      console.log(`📊 Found ${urls.length} URLs in sitemap`);

      return urls;
    } catch (error) {
      console.error('❌ Error fetching sitemap:', error.message);
      return [];
    }
  }

  async submitUrl(url, type = 'URL_UPDATED') {
    try {
      const accessToken = await this.jwtClient.getAccessToken();

      const response = await axios.post(
        'https://indexing.googleapis.com/v3/urlNotifications:publish',
        { url, type },
        {
          headers: {
            'Authorization': `Bearer ${accessToken.token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return {
        url,
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      return {
        url,
        success: false,
        status: error.response?.status || 'ERROR',
        error: error.response?.data || error.message
      };
    }
  }

  async run() {
    console.log('🎯 HEIC2PNG.Store - GitHub Actions Google Indexing');
    console.log('='.repeat(60));
    console.log(`🌐 Domain: ${this.siteUrl}`);
    console.log(`📅 Date: ${new Date().toISOString()}`);
    console.log('='.repeat(60));

    // Authenticate
    const isAuthenticated = await this.authenticate();
    if (!isAuthenticated) {
      console.error('❌ Authentication failed - exiting');
      process.exit(1);
    }

    // Fetch sitemap
    const allUrls = await this.fetchSitemap();
    if (allUrls.length === 0) {
      console.error('❌ No URLs found in sitemap - exiting');
      process.exit(1);
    }

    // Submit first 10 URLs as a test
    const urlsToSubmit = allUrls.slice(0, 10);
    console.log(`🎯 Submitting ${urlsToSubmit.length} URLs for testing`);
    console.log('='.repeat(60));

    let successful = 0;

    for (let i = 0; i < urlsToSubmit.length; i++) {
      const url = urlsToSubmit[i];
      console.log(`📤 [${i + 1}/${urlsToSubmit.length}] ${url}`);

      const result = await this.submitUrl(url);

      if (result.success) {
        console.log(`✅ Success`);
        successful++;
      } else {
        console.log(`❌ Failed: ${result.status}`);
      }

      // Rate limiting - wait 2 seconds between requests
      if (i < urlsToSubmit.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Summary
    console.log('='.repeat(60));
    console.log('📊 SUBMISSION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${urlsToSubmit.length - successful}`);
    console.log(`📈 Success Rate: ${((successful / urlsToSubmit.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    if (successful === 0) {
      console.error('❌ No URLs were successfully submitted');
      process.exit(1);
    }

    console.log('🎉 Indexing completed successfully!');
  }
}

// Run the indexer
const indexer = new GitHubIndexer();
indexer.run().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
