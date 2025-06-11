const { google } = require('googleapis');
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const body = JSON.parse(event.body);
  const { type, businessName, productName, amount, paystackKey, isCryptoEnabled, accountNumber, bankName, userId, user, product, paymentMethod, reference } = body;

  const auth = new google.auth.JWT(
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    null,
    process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    if (type === 'product') {
      const data = [[userId || 'Unknown', businessName || 'Unknown', productName || 'Unknown', amount || '0', paystackKey || 'N/A', isCryptoEnabled || false, accountNumber || '', bankName || '', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })]];
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: 'Products!A:I',
        valueInputOption: 'RAW',
        resource: { values: data },
      });
      const telegramMessage = `🎉 New Business/Product Created!\n\n📌 Business: ${businessName || 'Unknown'}\n📦 Product: ${productName || 'Unknown'}\n💰 Amount: ₦${amount || '0'}\n🔑 Paystack Key: ${paystackKey || 'N/A'}\n💳 Crypto Enabled: ${isCryptoEnabled ? 'Yes' : 'No'}\n📱 Account Number: ${accountNumber || 'N/A'}\n🏦 Bank Name: ${bankName || 'N/A'}\n🕒 Time: ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}`;
      if (!telegramMessage.trim()) throw new Error('Telegram message content is empty');
      console.log('Telegram Message:', telegramMessage);
      const telegramResponse = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: telegramMessage }),
      });
      if (!telegramResponse.ok) throw new Error(`Telegram notification failed: ${await telegramResponse.text()}`);
    } else if (type === 'payment') {
      const data = [[user || 'Unknown', businessName || 'Unknown', product || 'Unknown', amount || '0', paymentMethod || 'N/A', reference || '', new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })]];
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: 'Payments!A:G',
        valueInputOption: 'RAW',
        resource: { values: data },
      });
      if (paymentMethod === 'Crypto') {
        const telegramMessage = `💸 Crypto Payment Notification!\n\n📌 Business: ${businessName || 'Unknown'}\n📦 Product: ${product || 'Unknown'}\n💰 Amount: ₦${amount || '0'}\n🕒 Time: ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}`;
        if (!telegramMessage.trim()) throw new Error('Telegram message content is empty');
        console.log('Telegram Message:', telegramMessage);
        const telegramResponse = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: telegramMessage }),
        });
        if (!telegramResponse.ok) throw new Error(`Telegram notification failed: ${await telegramResponse.text()}`);
      }
    }

    return { statusCode: 200, body: JSON.stringify({ message: 'Data saved successfully and notification sent' }) };
  } catch (error) {
    console.error('Error:', error.message);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};