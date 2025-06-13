const { google } = require('googleapis');
const axios = require('axios');
const xml2js = require('xml2js');
const admin = require('firebase-admin');
const config = require('./config');

class HEIC2PNGIndexer {
  constructor() {
    this.jwtClient = new google.auth.JWT(
      config.SERVICE_ACCOUNT.client_email,
      null,
      config.SERVICE_ACCOUNT.private_key,
      config.SCOPES,
      null
    );
  }

  async authenticate() {
    try {
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
      console.log(`📄 Fetching sitemap from: ${config.SITEMAP_URL}`);
      const response = await axios.get(config.SITEMAP_URL, {
        timeout: 10000,
        headers: {
          'User-Agent': 'HEIC2PNG-Indexer/1.0'
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

  async getProcessedUrls() {
    try {
      const db = admin.firestore();
      const doc = await db.collection('indexing').doc('processed_urls').get();

      if (doc.exists) {
        const data = doc.data();
        return new Set(data.urls || []);
      }

      return new Set();
    } catch (error) {
      console.error('⚠️ Error reading processed URLs:', error.message);
      return new Set();
    }
  }

  async saveProcessedUrl(url) {
    try {
      const db = admin.firestore();
      const docRef = db.collection('indexing').doc('processed_urls');

      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        const currentUrls = doc.exists ? (doc.data().urls || []) : [];

        if (!currentUrls.includes(url)) {
          currentUrls.push(url);
          transaction.set(docRef, {
            urls: currentUrls,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }
      });
    } catch (error) {
      console.error('⚠️ Error saving processed URL:', error.message);
    }
  }

  async submitUrl(url, type = 'URL_UPDATED') {
    try {
      const accessToken = await this.jwtClient.getAccessToken();

      const response = await axios.post(
        config.API_ENDPOINT,
        {
          url: url,
          type: type
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken.token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return {
        url: url,
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      return {
        url: url,
        success: false,
        status: error.response?.status || 'ERROR',
        error: error.response?.data || error.message
      };
    }
  }

  async submitBatch(urls) {
    const results = [];
    console.log(`🚀 Submitting batch of ${urls.length} URLs...`);

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`📤 [${i + 1}/${urls.length}] Submitting: ${url}`);

      const result = await this.submitUrl(url);
      results.push(result);

      if (result.success) {
        console.log(`✅ Success: ${url}`);
        await this.saveProcessedUrl(url);
      } else {
        console.log(`❌ Failed: ${url} - Status: ${result.status}`);
      }

      // Add delay to respect rate limits
      if (i < urls.length - 1) {
        await this.delay(2000); // 2 second delay
      }
    }

    return results;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getDailyQuotaUsage() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const db = admin.firestore();
      const doc = await db.collection('indexing').doc('daily_quota').get();

      if (doc.exists) {
        const data = doc.data();
        if (data.date === today) {
          return data.used || 0;
        }
      }

      return 0;
    } catch (error) {
      console.error('⚠️ Error reading quota:', error.message);
      return 0;
    }
  }

  async updateDailyQuotaUsage(used) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentUsage = await this.getDailyQuotaUsage();

      const db = admin.firestore();
      await db.collection('indexing').doc('daily_quota').set({
        date: today,
        used: currentUsage + used,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('⚠️ Error updating quota:', error.message);
    }
  }

  async logResults(results) {
    const timestamp = new Date().toISOString();
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    const logEntry = {
      timestamp,
      domain: 'heic2png.store',
      total: results.length,
      successful,
      failed,
      successRate: `${((successful / results.length) * 100).toFixed(1)}%`,
      results: results.map(r => ({
        url: r.url,
        success: r.success,
        status: r.status
      }))
    };

    try {
      const db = admin.firestore();
      await db.collection('indexing').doc('logs').collection('daily').add(logEntry);
    } catch (error) {
      console.error('⚠️ Error writing to log:', error.message);
    }

    return logEntry;
  }

  async run() {
    console.log('🎯 HEIC2PNG.Store - Google Indexing API');
    console.log('='.repeat(50));
    console.log(`🌐 Domain: ${config.SITE_URL}`);
    console.log(`📅 Date: ${new Date().toISOString()}`);
    console.log('='.repeat(50));

    // Check authentication
    const isAuthenticated = await this.authenticate();
    if (!isAuthenticated) {
      throw new Error('Authentication failed');
    }

    // Check daily quota
    const quotaUsed = await this.getDailyQuotaUsage();
    const quotaRemaining = config.DAILY_QUOTA - quotaUsed;

    console.log(`📊 Daily Quota: ${quotaUsed}/${config.DAILY_QUOTA} used`);
    console.log(`📊 Remaining: ${quotaRemaining} submissions`);

    if (quotaRemaining <= 0) {
      console.log('⚠️ Daily quota exhausted. Try again tomorrow.');
      return { message: 'Daily quota exhausted' };
    }

    // Fetch sitemap URLs
    const allUrls = await this.fetchSitemap();
    if (allUrls.length === 0) {
      throw new Error('No URLs found in sitemap');
    }

    // Filter out already processed URLs
    const processedUrls = await this.getProcessedUrls();
    const unprocessedUrls = allUrls.filter(url => !processedUrls.has(url));

    console.log(`📋 Total URLs: ${allUrls.length}`);
    console.log(`✅ Already processed: ${processedUrls.size}`);
    console.log(`⏳ Remaining to process: ${unprocessedUrls.length}`);

    // Determine URLs to submit today
    const urlsToSubmit = unprocessedUrls.slice(0, Math.min(quotaRemaining, config.BATCH_SIZE));

    if (urlsToSubmit.length === 0) {
      console.log('✅ All URLs have been processed!');
      return { message: 'All URLs already processed' };
    }

    console.log(`🎯 Submitting ${urlsToSubmit.length} URLs today`);
    console.log('='.repeat(50));

    // Submit URLs
    const results = await this.submitBatch(urlsToSubmit);

    // Update quota usage
    await this.updateDailyQuotaUsage(results.length);

    // Log results
    const summary = await this.logResults(results);

    // Print summary
    console.log('='.repeat(50));
    console.log('📊 SUBMISSION SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successful: ${summary.successful}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`📈 Success Rate: ${summary.successRate}`);
    console.log(`📊 Quota Used Today: ${await this.getDailyQuotaUsage()}/${config.DAILY_QUOTA}`);
    console.log('='.repeat(50));

    return summary;
  }
}

module.exports = HEIC2PNGIndexer;
