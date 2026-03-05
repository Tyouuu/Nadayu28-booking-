<?php
require_once __DIR__ . '/backend/config.php';

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
  <title>Nadayu28 - Connection Test</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; background: #1A1A2E; color: #F5F5F7; padding: 20px; }
    h1 { color: #E6B325; }
    .card { background: #2D2B55; border: 1px solid #4A4860; border-radius: 12px; padding: 20px; margin: 16px 0; }
    .ok   { color: #4ade80; font-weight: bold; }
    .fail { color: #f87171; font-weight: bold; }
    .warn { color: #fbbf24; font-weight: bold; }
    pre  { background: #1A1A2E; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 13px; color: #B0B0B8; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 8px 12px; border-bottom: 1px solid #4A4860; }
    td:first-child { color: #B0B0B8; width: 200px; }
    td:last-child  { color: #F5F5F7; font-family: monospace; }
  </style>
</head>
<body>
<h1>🔧 Nadayu28 Connection Test</h1>

<!-- ── 1. PHP Info ─────────────────────────────── -->
<div class="card">
  <h2>① PHP Environment</h2>
  <table>
    <tr><td>PHP Version</td><td><?= PHP_VERSION ?></td></tr>
    <tr><td>cURL Extension</td><td><?= extension_loaded('curl') ? '<span class="ok">✅ Loaded</span>' : '<span class="fail">❌ Missing</span>' ?></td></tr>
    <tr><td>JSON Extension</td><td><?= extension_loaded('json') ? '<span class="ok">✅ Loaded</span>' : '<span class="fail">❌ Missing</span>' ?></td></tr>
    <tr><td>Server Software</td><td><?= $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown' ?></td></tr>
    <tr><td>Document Root</td><td><?= $_SERVER['DOCUMENT_ROOT'] ?></td></tr>
  </table>
</div>

<!-- ── 2. Config Check ────────────────────────── -->
<div class="card">
  <h2>② backend/config.php</h2>
  <?php
  $urlSet     = defined('SUPABASE_URL')         && SUPABASE_URL         !== 'https://YOUR_PROJECT_ID.supabase.co';
  $keySet     = defined('SUPABASE_SERVICE_KEY') && SUPABASE_SERVICE_KEY !== 'YOUR_SERVICE_ROLE_KEY';
  $anonSet    = defined('SUPABASE_ANON_KEY')    && SUPABASE_ANON_KEY    !== 'YOUR_ANON_KEY';
  ?>
  <table>
    <tr>
      <td>SUPABASE_URL</td>
      <td><?= $urlSet  ? '<span class="ok">✅ Set</span> — ' . htmlspecialchars(substr(SUPABASE_URL, 0, 40)) . '...' : '<span class="warn">⚠️ Still placeholder</span>' ?></td>
    </tr>
    <tr>
      <td>SUPABASE_SERVICE_KEY</td>
      <td><?= $keySet  ? '<span class="ok">✅ Set</span> — ' . substr(SUPABASE_SERVICE_KEY, 0, 12) . '••••' : '<span class="warn">⚠️ Still placeholder</span>' ?></td>
    </tr>
    <tr>
      <td>SUPABASE_ANON_KEY</td>
      <td><?= $anonSet ? '<span class="ok">✅ Set</span> — ' . substr(SUPABASE_ANON_KEY, 0, 12) . '••••'  : '<span class="warn">⚠️ Still placeholder</span>' ?></td>
    </tr>
  </table>
</div>

<!-- ── 3. Supabase Connection ─────────────────── -->
<div class="card">
  <h2>③ Supabase API Connection</h2>
  <?php
  if (!$urlSet || !$keySet) {
      echo '<p class="warn">⚠️ Fill in your credentials in backend/config.php first, then refresh.</p>';
  } else {
      $url = SUPABASE_URL . '/rest/v1/bookings?limit=1&select=id';
      $ch  = curl_init($url);
      curl_setopt_array($ch, [
          CURLOPT_RETURNTRANSFER => true,
          CURLOPT_TIMEOUT        => 10,
          CURLOPT_HTTPHEADER     => [
              'apikey: '        . SUPABASE_SERVICE_KEY,
              'Authorization: Bearer ' . SUPABASE_SERVICE_KEY,
              'Content-Type: application/json',
          ],
      ]);
      $response = curl_exec($ch);
      $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
      $curlErr  = curl_error($ch);
      curl_close($ch);

      if ($curlErr) {
          echo '<p class="fail">❌ cURL Error: ' . htmlspecialchars($curlErr) . '</p>';
          echo '<p>Make sure XAMPP Apache is running and can reach the internet.</p>';
      } elseif ($httpCode === 200) {
          $data = json_decode($response, true);
          echo '<p class="ok">✅ Connected to Supabase! HTTP ' . $httpCode . '</p>';
          echo '<p>Bookings table response:</p>';
          echo '<pre>' . htmlspecialchars(json_encode($data, JSON_PRETTY_PRINT)) . '</pre>';
      } elseif ($httpCode === 401) {
          echo '<p class="fail">❌ HTTP 401 — Invalid API key. Check your SUPABASE_SERVICE_KEY.</p>';
      } elseif ($httpCode === 404) {
          echo '<p class="fail">❌ HTTP 404 — Table "bookings" not found. Did you run supabase_schema.sql?</p>';
      } else {
          echo '<p class="fail">❌ HTTP ' . $httpCode . '</p>';
          echo '<pre>' . htmlspecialchars($response) . '</pre>';
      }
  }
  ?>
</div>

<!-- ── 4. API Endpoints ───────────────────────── -->
<div class="card">
  <h2>④ PHP API Endpoints</h2>
  <table>
    <tr>
      <td>GET /api/bookings</td>
      <td><a href="backend/api/bookings.php" target="_blank" style="color:#E6B325">Test →</a></td>
    </tr>
    <tr>
      <td>POST /api/validate</td>
      <td><code style="color:#B0B0B8">Use SecurityScanner QR scan</code></td>
    </tr>
  </table>
</div>

<p style="color:#4A4860; font-size:12px; margin-top:32px;">
  ⚠️ Delete this file before deploying to production.
</p>
</body>
</html>
