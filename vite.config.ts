import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'resend-dev-server-api',
        configureServer(server) {
          server.middlewares.use('/api/send-email', (req, res) => {
            if (req.method === 'OPTIONS') {
              res.writeHead(200, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
              });
              res.end();
              return;
            }

            if (req.method !== 'POST') {
              res.writeHead(405, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, message: 'Method not allowed' }));
              return;
            }

            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });

            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const { to, subject, html, text, from, apiKey } = parsed;
                const resendApiKey = apiKey || process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;

                if (!resendApiKey) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(
                    JSON.stringify({
                      success: false,
                      message: 'Resend API Key belum disetel.',
                    })
                  );
                  return;
                }

                const sender = from || 'Aset Rumah Batam <onboarding@resend.dev>';
                const resendRes = await fetch('https://api.resend.com/emails', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${resendApiKey.trim()}`,
                  },
                  body: JSON.stringify({
                    from: sender,
                    to: Array.isArray(to) ? to : [to],
                    subject,
                    html: html || undefined,
                    text: text || undefined,
                  }),
                });

                const data = await resendRes.json();
                res.writeHead(resendRes.status, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data));
              } catch (err: any) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: err.message }));
              }
            });
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
