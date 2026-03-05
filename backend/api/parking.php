<?php
// ── Parking Slots API ─────────────────────────────────────────────────
// GET    /api/parking                         → all slots
// GET    /api/parking?zone=Visitor+Parking    → filter by zone
// GET    /api/parking?status=available        → filter by status
// GET    /api/parking?id=P01                  → single slot
// PATCH  /api/parking                         → update slot (staff only)
// ─────────────────────────────────────────────────────────────────────
require_once __DIR__ . '/../config.php';

header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
header('Access-Control-Allow-Methods: GET, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$method = $_SERVER['REQUEST_METHOD'];
$input  = json_decode(file_get_contents('php://input'), true) ?? [];

function supabase_parking(string $path, string $method = 'GET', array $body = []): array {
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

// ── GET /api/parking ──────────────────────────────────────────────────
if ($method === 'GET') {
  $query = 'parking_slots?select=*&order=slot_number.asc';

  if (!empty($_GET['id'])) {
    $id    = urlencode($_GET['id']);
    $query = "parking_slots?id=eq.{$id}&select=*";
  } elseif (!empty($_GET['zone']) && !empty($_GET['status'])) {
    $zone   = urlencode($_GET['zone']);
    $status = urlencode($_GET['status']);
    $query  = "parking_slots?zone=eq.{$zone}&status=eq.{$status}&select=*&order=slot_number.asc";
  } elseif (!empty($_GET['zone'])) {
    $zone  = urlencode($_GET['zone']);
    $query = "parking_slots?zone=eq.{$zone}&select=*&order=slot_number.asc";
  } elseif (!empty($_GET['status'])) {
    $status = urlencode($_GET['status']);
    $query  = "parking_slots?status=eq.{$status}&select=*&order=slot_number.asc";
  }

  $result = supabase_parking($query);
  http_response_code($result['status']);
  echo json_encode($result['data']);
  exit;
}

// ── PATCH /api/parking  (update slot status) ─────────────────────────
if ($method === 'PATCH') {
  if (empty($input['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing slot id']);
    exit;
  }
  $id     = urlencode($input['id']);
  $update = [];
  $allowed = ['status', 'booked_by', 'booking_id'];
  foreach ($allowed as $field) {
    if (array_key_exists($field, $input)) {
      $update[$field] = $input[$field]; // allow null to clear fields
    }
  }
  if (empty($update)) {
    http_response_code(400);
    echo json_encode(['error' => 'No updatable fields provided']);
    exit;
  }
  $result = supabase_parking("parking_slots?id=eq.{$id}", 'PATCH', $update);
  http_response_code($result['status']);
  echo json_encode($result['data']);
  exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
