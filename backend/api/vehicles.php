<?php
// ── Vehicles API ──────────────────────────────────────────────────────
// GET    /api/vehicles?user_id=<uuid>  → get user's vehicles
// GET    /api/vehicles?id=<uuid>       → get single vehicle
// POST   /api/vehicles                 → add vehicle
// PATCH  /api/vehicles                 → update vehicle
// DELETE /api/vehicles?id=<uuid>       → delete vehicle
// ─────────────────────────────────────────────────────────────────────
require_once __DIR__ . '/../config.php';

header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$method = $_SERVER['REQUEST_METHOD'];
$input  = json_decode(file_get_contents('php://input'), true) ?? [];

function supabase_vehicles(string $path, string $method = 'GET', array $body = []): array {
  $url = SUPABASE_URL . '/rest/v1/' . $path;
  $ch  = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST  => $method,
    CURLOPT_HTTPHEADER     => [
      'apikey: '        . SUPABASE_SERVICE_KEY,
      'Authorization: Bearer ' . SUPABASE_SERVICE_KEY,
      'Content-Type: application/json',
      'Prefer: return=representation',
    ],
  ]);
  if (!empty($body)) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
  }
  $response = curl_exec($ch);
  $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  return ['status' => $httpCode, 'data' => json_decode($response, true)];
}

// ── GET /api/vehicles ─────────────────────────────────────────────────
if ($method === 'GET') {
  if (!empty($_GET['id'])) {
    $id     = urlencode($_GET['id']);
    $result = supabase_vehicles("vehicles?id=eq.{$id}&select=*");
  } elseif (!empty($_GET['user_id'])) {
    $uid    = urlencode($_GET['user_id']);
    $result = supabase_vehicles("vehicles?user_id=eq.{$uid}&select=*&order=created_at.asc");
  } else {
    http_response_code(400);
    echo json_encode(['error' => 'Missing user_id or id']);
    exit;
  }
  http_response_code($result['status']);
  echo json_encode($result['data']);
  exit;
}

// ── POST /api/vehicles  (add vehicle) ────────────────────────────────
if ($method === 'POST') {
  if (empty($input['user_id']) || empty($input['plate'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields: user_id, plate']);
    exit;
  }

  // If is_default=true, clear existing default first
  if (!empty($input['is_default'])) {
    $uid = urlencode($input['user_id']);
    supabase_vehicles("vehicles?user_id=eq.{$uid}", 'PATCH', ['is_default' => false]);
  }

  $vehicle = [
    'user_id'    => $input['user_id'],
    'plate'      => strtoupper(trim($input['plate'])),
    'make'       => $input['make']       ?? null,
    'model'      => $input['model']      ?? null,
    'color'      => $input['color']      ?? null,
    'is_default' => $input['is_default'] ?? false,
  ];

  $result = supabase_vehicles('vehicles', 'POST', $vehicle);
  http_response_code($result['status']);
  echo json_encode($result['data']);
  exit;
}

// ── PATCH /api/vehicles  (update vehicle) ────────────────────────────
if ($method === 'PATCH') {
  if (empty($input['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing vehicle id']);
    exit;
  }
  $id = urlencode($input['id']);

  // If setting as default, clear others for same user first
  if (!empty($input['is_default']) && !empty($input['user_id'])) {
    $uid = urlencode($input['user_id']);
    supabase_vehicles("vehicles?user_id=eq.{$uid}", 'PATCH', ['is_default' => false]);
  }

  $update  = [];
  $allowed = ['plate', 'make', 'model', 'color', 'is_default'];
  foreach ($allowed as $field) {
    if (isset($input[$field])) {
      $update[$field] = ($field === 'plate') ? strtoupper(trim($input[$field])) : $input[$field];
    }
  }
  if (empty($update)) {
    http_response_code(400);
    echo json_encode(['error' => 'No updatable fields provided']);
    exit;
  }
  $result = supabase_vehicles("vehicles?id=eq.{$id}", 'PATCH', $update);
  http_response_code($result['status']);
  echo json_encode($result['data']);
  exit;
}

// ── DELETE /api/vehicles?id=<uuid> ───────────────────────────────────
if ($method === 'DELETE') {
  if (empty($_GET['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing vehicle id']);
    exit;
  }
  $id     = urlencode($_GET['id']);
  $result = supabase_vehicles("vehicles?id=eq.{$id}", 'DELETE');
  http_response_code($result['status']);
  echo json_encode(['deleted' => true]);
  exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
