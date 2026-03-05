<?php
// Lightweight endpoint used by the Security Scanner to validate a QR booking.
require_once __DIR__ . '/../config.php';

header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit; }

$input = json_decode(file_get_contents('php://input'), true) ?? [];
if (empty($input['id'])) {
  http_response_code(400);
  echo json_encode(['valid' => false, 'error' => 'Missing booking id']);
  exit;
}

$id  = urlencode($input['id']);
$url = SUPABASE_URL . '/rest/v1/bookings?id=eq.' . $id . '&status=eq.active&select=*';
$ch  = curl_init($url);
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    'apikey: '        . SUPABASE_SERVICE_KEY,
    'Authorization: Bearer ' . SUPABASE_SERVICE_KEY,
    'Content-Type: application/json',
  ],
]);
$response = curl_exec($ch);
curl_close($ch);

$rows = json_decode($response, true);
if (is_array($rows) && count($rows) > 0) {
  echo json_encode(['valid' => true, 'booking' => $rows[0]]);
} else {
  echo json_encode(['valid' => false]);
}
