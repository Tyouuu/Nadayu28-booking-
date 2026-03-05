<?php
// ── User Profiles API ─────────────────────────────────────────────────
// GET    /api/users?id=<uuid>          → get profile
// PATCH  /api/users                   → update profile
// ─────────────────────────────────────────────────────────────────────
require_once __DIR__ . '/../config.php';

header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
header('Access-Control-Allow-Methods: GET, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$method = $_SERVER['REQUEST_METHOD'];
$input  = json_decode(file_get_contents('php://input'), true) ?? [];

function supabase_users(string $path, string $method = 'GET', array $body = []): array {
  $url = SUPABASE_URL . '/rest/v1/' . $path;
  $ch  = curl_init($url);
  $headers = [
    'apikey: '        . SUPABASE_SERVICE_KEY,
    'Authorization: Bearer ' . SUPABASE_SERVICE_KEY,
    'Content-Type: application/json',
    'Prefer: return=representation',
  ];
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST  => $method,
    CURLOPT_HTTPHEADER     => $headers,
  ]);
  if (!empty($body)) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
  }
  $response = curl_exec($ch);
  $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  return ['status' => $httpCode, 'data' => json_decode($response, true)];
}

// ── GET /api/users?id=<uuid> ──────────────────────────────────────────
if ($method === 'GET') {
  if (empty($_GET['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing user id']);
    exit;
  }
  $id     = urlencode($_GET['id']);
  $result = supabase_users("profiles?id=eq.{$id}&select=*");
  http_response_code($result['status']);
  echo json_encode($result['data']);
  exit;
}

// ── PATCH /api/users  (update profile) ───────────────────────────────
if ($method === 'PATCH') {
  if (empty($input['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing user id']);
    exit;
  }
  $id     = urlencode($input['id']);
  $update = [];
  $allowed = ['full_name', 'unit', 'phone', 'avatar_url', 'role'];
  foreach ($allowed as $field) {
    if (isset($input[$field])) {
      $update[$field] = $input[$field];
    }
  }
  if (empty($update)) {
    http_response_code(400);
    echo json_encode(['error' => 'No updatable fields provided']);
    exit;
  }
  $result = supabase_users("profiles?id=eq.{$id}", 'PATCH', $update);
  http_response_code($result['status']);
  echo json_encode($result['data']);
  exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
