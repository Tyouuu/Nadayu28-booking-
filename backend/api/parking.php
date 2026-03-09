<?php
// ── Parking Slots API ─────────────────────────────────────────────────
require_once __DIR__ . '/../supabase_helper.php';

set_api_headers();
handle_preflight();

$method = $_SERVER['REQUEST_METHOD'];
$input  = json_decode(file_get_contents('php://input'), true) ?? [];

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

  $result = supabase_request($query);
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
      $update[$field] = $input[$field];
    }
  }
  if (empty($update)) {
    http_response_code(400);
    echo json_encode(['error' => 'No updatable fields provided']);
    exit;
  }
  $result = supabase_request("parking_slots?id=eq.{$id}", 'PATCH', $update);
  http_response_code($result['status']);
  echo json_encode($result['data']);
  exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
