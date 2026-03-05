<?php
require_once __DIR__ . '/../config.php';

// CORS
header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$input  = json_decode(file_get_contents('php://input'), true) ?? [];

/**
 * Make a cURL request to Supabase REST API.
 */
function supabase(string $path, string $method = 'GET', array $body = []): array {
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
  $data = json_decode($response, true);
  return ['status' => $httpCode, 'data' => $data];
}

// ── GET /api/bookings?user_id=xxx  or  ?id=xxx ──────────────────────
if ($method === 'GET') {
  $query = 'bookings?select=*&order=created_at.desc';
  if (!empty($_GET['user_id'])) {
    $uid   = urlencode($_GET['user_id']);
    $query = "bookings?user_id=eq.{$uid}&select=*&order=created_at.desc";
  } elseif (!empty($_GET['id'])) {
    $id    = urlencode($_GET['id']);
    $query = "bookings?id=eq.{$id}&select=*";
  }
  $result = supabase($query);
  http_response_code($result['status']);
  echo json_encode($result['data']);
  exit;
}

// ── POST /api/bookings  (create booking) ────────────────────────────
if ($method === 'POST') {
  $required = ['id', 'facility_type', 'date', 'start_time', 'duration_hours', 'resident_unit'];
  foreach ($required as $field) {
    if (empty($input[$field])) {
      http_response_code(400);
      echo json_encode(['error' => "Missing required field: {$field}"]);
      exit;
    }
  }
  $booking = [
    'id'             => $input['id'],
    'facility_type'  => $input['facility_type'],
    'date'           => $input['date'],
    'start_time'     => $input['start_time'],
    'duration_hours' => (int)$input['duration_hours'],
    'resident_unit'  => $input['resident_unit'],
    'status'         => 'active',
    'details'        => $input['details']        ?? null,
    'qr_code'        => $input['qr_code']        ?? null,
    'is_overnight'   => $input['is_overnight']   ?? false,
    'user_id'        => $input['user_id']        ?? null,
  ];
  $result = supabase('bookings', 'POST', $booking);
  http_response_code($result['status']);
  echo json_encode($result['data']);
  exit;
}

// ── PATCH /api/bookings  (update status) ─────────────────────────────
if ($method === 'PATCH') {
  if (empty($input['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing booking id']);
    exit;
  }
  $id     = urlencode($input['id']);
  $update = [];
  if (isset($input['status']))   $update['status']   = $input['status'];
  if (isset($input['details']))  $update['details']  = $input['details'];
  $result = supabase("bookings?id=eq.{$id}", 'PATCH', $update);
  http_response_code($result['status']);
  echo json_encode($result['data']);
  exit;
}

// ── DELETE /api/bookings?id=xxx ──────────────────────────────────────
if ($method === 'DELETE') {
  if (empty($_GET['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing id']);
    exit;
  }
  $id     = urlencode($_GET['id']);
  $result = supabase("bookings?id=eq.{$id}", 'DELETE');
  http_response_code($result['status']);
  echo json_encode(['deleted' => true]);
  exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
