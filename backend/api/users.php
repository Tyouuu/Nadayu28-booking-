<?php
// ── User Profiles API ─────────────────────────────────────────────────
require_once __DIR__ . '/../supabase_helper.php';

set_api_headers();
handle_preflight();

$method = $_SERVER['REQUEST_METHOD'];
$input  = json_decode(file_get_contents('php://input'), true) ?? [];

// ── GET /api/users?id=<uuid> ──────────────────────────────────────────
if ($method === 'GET') {
  if (empty($_GET['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing user id']);
    exit;
  }
  $id     = urlencode($_GET['id']);
  $result = supabase_request("profiles?id=eq.{$id}&select=*");
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
  $result = supabase_request("profiles?id=eq.{$id}", 'PATCH', $update);
  http_response_code($result['status']);
  echo json_encode($result['data']);
  exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
