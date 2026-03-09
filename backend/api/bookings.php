<?php
require_once __DIR__ . '/../supabase_helper.php';

set_api_headers();
handle_preflight();

$method = $_SERVER['REQUEST_METHOD'];
$input  = json_decode(file_get_contents('php://input'), true) ?? [];

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
  $result = supabase_request($query);
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
  $result = supabase_request('bookings', 'POST', $booking);
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
  $result = supabase_request("bookings?id=eq.{$id}", 'PATCH', $update);
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
  $result = supabase_request("bookings?id=eq.{$id}", 'DELETE');
  http_response_code($result['status']);
  echo json_encode(['deleted' => true]);
  exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
