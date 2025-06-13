const functions = require('firebase-functions');
const admin = require('firebase-admin');
const HEIC2PNGIndexer = require('./indexer');

// Initialize Firebase Admin
admin.initializeApp();

// Manual trigger function
exports.runIndexing = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '1GB'
  })
  .https.onRequest(async (req, res) => {
    try {
      console.log('🚀 Manual indexing triggered');

      const indexer = new HEIC2PNGIndexer();
      const result = await indexer.run();

      res.status(200).json({
        success: true,
        message: 'Indexing completed successfully',
        data: result
      });
    } catch (error) {
      console.error('❌ Indexing failed:', error);
      res.status(500).json({
        success: false,
        message: 'Indexing failed',
        error: error.message
      });
    }
  });

// Scheduled function (runs daily at 9 AM UTC)
exports.scheduledIndexing = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '1GB'
  })
  .pubsub.schedule('0 9 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      console.log('⏰ Scheduled indexing started');

      const indexer = new HEIC2PNGIndexer();
      const result = await indexer.run();

      console.log('✅ Scheduled indexing completed:', result);
      return null;
    } catch (error) {
      console.error('❌ Scheduled indexing failed:', error);
      throw error;
    }
  });

// Test function
exports.testIndexing = functions.https.onRequest(async (req, res) => {
  try {
    const indexer = new HEIC2PNGIndexer();

    // Test authentication
    const isAuth = await indexer.authenticate();

    // Test sitemap fetching
    const urls = await indexer.fetchSitemap();

    res.status(200).json({
      success: true,
      authentication: isAuth,
      sitemapUrls: urls.length,
      urls: urls.slice(0, 5) // Show first 5 URLs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get status function
exports.getIndexingStatus = functions.https.onRequest(async (req, res) => {
  try {
    const db = admin.firestore();

    // Get quota usage
    const quotaDoc = await db.collection('indexing').doc('daily_quota').get();
    const quotaData = quotaDoc.exists ? quotaDoc.data() : { used: 0, date: 'never' };

    // Get processed URLs count
    const processedDoc = await db.collection('indexing').doc('processed_urls').get();
    const processedCount = processedDoc.exists ? (processedDoc.data().urls || []).length : 0;

    // Get recent logs
    const logsSnapshot = await db.collection('indexing').doc('logs').collection('daily')
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();

    const recentLogs = logsSnapshot.docs.map(doc => doc.data());

    res.status(200).json({
      success: true,
      status: {
        quotaUsed: quotaData.used || 0,
        quotaDate: quotaData.date,
        processedUrls: processedCount,
        recentLogs: recentLogs
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
