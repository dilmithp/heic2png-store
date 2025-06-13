const { google } = require('googleapis');
const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

class GitHubIndexer {
  constructor() {
    this.serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    this.siteUrl = process.env.SITE_URL || 'https://heic2png.store';
    this.quotaLimit = 200;

    // Create logs directory
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs', { recursive: true });
    }
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

  getProcessedUrls() {
    const processedFile = 'logs/processed_urls.txt';
    try {
      if (fs.existsSync(processedFile)) {
        const content = fs.readFileSync(processedFile, 'utf8');
        return new Set(content.split('\n').filter(url => url.trim()));
      }
    } catch (error) {
      console.error('⚠️ Error reading processed URLs:', error.message);
    }
    return new Set();
  }

  saveProcessedUrl(url) {
    const processedFile = 'logs/processed_urls.txt';
    try {
      fs.appendFileSync(processedFile, url + '\n');
    } catch (error) {
      console.error('⚠️ Error saving processed URL:', error.message);
    }
  }

  getDailyQuotaUsage() {
    const today = new Date().toISOString().split('T')[0];
    const quotaFile = `logs/quota_${today}.json`;

    try {
      if (fs.existsSync(quotaFile)) {
        const data = JSON.parse(fs.readFileSync(quotaFile, 'utf8'));
        return data.used || 0;
      }
    } catch (error) {
      console.error('⚠️ Error reading quota file:', error.message);
    }

    return 0;
  }

  updateDailyQuotaUsage(used) {
    const today = new Date().toISOString().split('T')[0];
    const quotaFile = `logs/quota_${today}.json`;
    const currentUsage = this.getDailyQuotaUsage();

    const quotaData = {
      date: today,
      used: currentUsage + used,
      timestamp: new Date().toISOString()
    };

    try {
      fs.writeFileSync(quotaFile, JSON.stringify(quotaData, null, 2));
    } catch (error) {
      console.error('⚠️ Error updating quota file:', error.message);
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
    console.log(`🤖 Runner: GitHub Actions`);
    console.log('='.repeat(60));

    // Authenticate
    const isAuthenticated = await this.authenticate();
    if (!isAuthenticated) {
      process.exit(1);
    }

    // Check quota
    const quotaUsed = this.getDailyQuotaUsage();
    const quotaRemaining = this.quotaLimit - quotaUsed;

    console.log(`📊 Daily Quota: ${quotaUsed}/${this.quotaLimit} used`);
    console.log(`📊 Remaining: ${quotaRemaining} submissions`);

    if (quotaRemaining <= 0) {
      console.log('⚠️ Daily quota exhausted. Skipping submission.');
      return;
    }

    // Fetch sitemap
    const allUrls = await this.fetchSitemap();
    if (allUrls.length === 0) {
      console.log('❌ No URLs found in sitemap');
      process.exit(1);
    }

    // Filter processed URLs
    const processedUrls = this.getProcessedUrls();
    const unprocessedUrls = allUrls.filter(url => !processedUrls.has(url));

    console.log(`📋 Total URLs: ${allUrls.length}`);
    console.log(`✅ Already processed: ${processedUrls.size}`);
    console.log(`⏳ Remaining to process: ${unprocessedUrls.length}`);

    // Determine URLs to submit
    const urlsToSubmit = unprocessedUrls.slice(0, Math.min(quotaRemaining, 50));

    if (urlsToSubmit.length === 0) {
      console.log('✅ All URLs have been processed!');
      return;
    }

    console.log(`🎯 Submitting ${urlsToSubmit.length} URLs today`);
    console.log('='.repeat(60));

    // Submit URLs
    const results = [];
    let successful = 0;

    for (let i = 0; i < urlsToSubmit.length; i++) {
      const url = urlsToSubmit[i];
      console.log(`📤 [${i + 1}/${urlsToSubmit.length}] ${url}`);

      const result = await this.submitUrl(url);
      results.push(result);

      if (result.success) {
        console.log(`✅ Success`);
        this.saveProcessedUrl(url);
        successful++;
      } else {
        console.log(`❌ Failed: ${result.status} - ${result.error}`);
      }

      // Rate limiting
      if (i < urlsToSubmit.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Update quota
    this.updateDailyQuotaUsage(results.length);

    // Save results log
    const logEntry = {
      timestamp: new Date().toISOString(),
      domain: this.siteUrl,
      total: results.length,
      successful,
      failed: results.length - successful,
      successRate: `${((successful / results.length) * 100).toFixed(1)}%`,
      quotaUsedToday: this.getDailyQuotaUsage()
    };

    fs.writeFileSync(
      `logs/run_${new Date().toISOString().split('T')[0]}.json`,
      JSON.stringify(logEntry, null, 2)
    );

    // Summary
    console.log('='.repeat(60));
    console.log('📊 SUBMISSION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${results.length - successful}`);
    console.log(`📈 Success Rate: ${logEntry.successRate}`);
    console.log(`📊 Quota Used Today: ${logEntry.quotaUsedToday}/${this.quotaLimit}`);
    console.log('='.repeat(60));

    if (successful === 0) {
      console.log('❌ No URLs were successfully submitted');
      process.exit(1);
    }
  }
}

// Run the indexer
const indexer = new GitHubIndexer();
indexer.run().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
