import assert from 'node:assert/strict';
import { isLikelyBotUserAgent } from '@/lib/analytics-metadata';

// La home redirige a /en a visitantes humanos con navegador en inglés. Los rastreadores y
// los generadores de vista previa de enlaces tienen que ver siempre la URL pedida, porque
// no envían Accept-Language confiable y suelen salir desde EE. UU.
const automated = [
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 (compatible; Google-InspectionTool/1.0;)',
  'Mozilla/5.0 (compatible; GoogleOther)',
  'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'WhatsApp/2.23.20.0',
  'TelegramBot (like TwitterBot)',
  'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
  'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
  'Mozilla/5.0 (compatible; Embedly/0.2; +http://support.embed.ly/)',
  'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',
];
for (const ua of automated) assert.ok(isLikelyBotUserAgent(ua), `Debe tratarse como automático: ${ua}`);

const humans = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0',
];
for (const ua of humans) assert.ok(!isLikelyBotUserAgent(ua), `No debe tratarse como bot: ${ua}`);

console.log('crawler-locale-redirect smoke ok');
