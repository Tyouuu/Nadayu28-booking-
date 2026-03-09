<?php
/**
 * Shared Supabase REST API helper with proper error handling.
 * Include this in all API endpoints instead of defining per-file curl functions.
 */
require_once __DIR__ . '/config.php';

function supabase_request(string $path, string $method = 'GET', array $body = []): array {
  $url = SUPABASE_URL . '/rest/v1/' . $path;
  $ch  = curl_init($url);

  if ($ch === false) {
    return ['status' => 500, 'data' => ['error' => 'Failed to initialize HTTP request']];
  }

  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST  => $method,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_HTTPHEADER     => [
      'apikey: '              . SUPABASE_SERVICE_KEY,
      'Authorization: Bearer ' . SUPABASE_SERVICE_KEY,
      'Content-Type: application/json',
      'Prefer: return=representation',
    ],
  ]);

  if (!empty($body)) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
  }

  $response = curl_exec($ch);

  if ($response === false) {
    $error = curl_error($ch);
    curl_close($ch);
    return ['status' => 502, 'data' => ['error' => 'Supabase request failed: ' . $error]];
  }

  $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  $data = json_decode($response, true);
  if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
    return ['status' => 502, 'data' => ['error' => 'Invalid JSON response from Supabase']];
  }

  return ['status' => $httpCode, 'data' => $data];
}

/**
 * Set standard CORS and JSON headers for API responses.
 */
function set_api_headers(): void {
  header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
  header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type, Authorization');
  header('Content-Type: application/json');
}

/**
 * Handle OPTIONS preflight and exit.
 */
function handle_preflight(): void {
  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
  }
}
