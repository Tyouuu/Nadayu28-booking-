<?php
// ── Analytics API (MANAGEMENT only) ──────────────────────────────────
require_once __DIR__ . '/../supabase_helper.php';

set_api_headers();
handle_preflight();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed']);
  exit;
}

$type = $_GET['type'] ?? 'overview';

switch ($type) {

  // ── Overview: counts for dashboard ───────────────────────────────
  case 'overview':
    $bookings = supabase_request('bookings?select=id,status,facility_type,created_at');
    $parking  = supabase_request('parking_slots?select=id,status,zone');
    $users    = supabase_request('profiles?select=id,role');

    $bData = $bookings['data'] ?? [];
    $pData = $parking['data']  ?? [];
    $uData = $users['data']    ?? [];

    $activeBookings    = count(array_filter($bData, fn($b) => ($b['status'] ?? '') === 'active'));
    $completedBookings = count(array_filter($bData, fn($b) => ($b['status'] ?? '') === 'completed'));
    $cancelledBookings = count(array_filter($bData, fn($b) => ($b['status'] ?? '') === 'cancelled'));

    $availableSlots = count(array_filter($pData, fn($p) => ($p['status'] ?? '') === 'available'));
    $occupiedSlots  = count(array_filter($pData, fn($p) => ($p['status'] ?? '') === 'occupied'));

    $residents   = count(array_filter($uData, fn($u) => ($u['role'] ?? '') === 'RESIDENT'));
    $security    = count(array_filter($uData, fn($u) => ($u['role'] ?? '') === 'SECURITY'));
    $management  = count(array_filter($uData, fn($u) => ($u['role'] ?? '') === 'MANAGEMENT'));

    echo json_encode([
      'bookings' => [
        'total'     => count($bData),
        'active'    => $activeBookings,
        'completed' => $completedBookings,
        'cancelled' => $cancelledBookings,
      ],
      'parking' => [
        'total'     => count($pData),
        'available' => $availableSlots,
        'occupied'  => $occupiedSlots,
      ],
      'users' => [
        'total'      => count($uData),
        'residents'  => $residents,
        'security'   => $security,
        'management' => $management,
      ],
    ]);
    break;

  // ── Facility usage: booking count per facility_type ──────────────
  case 'facility-usage':
    $result = supabase_request('bookings?select=facility_type,status');
    $data   = $result['data'] ?? [];

    $usage = [];
    foreach ($data as $booking) {
      $ft = $booking['facility_type'] ?? 'unknown';
      if (!isset($usage[$ft])) {
        $usage[$ft] = ['facility_type' => $ft, 'total' => 0, 'active' => 0, 'completed' => 0, 'cancelled' => 0];
      }
      $usage[$ft]['total']++;
      $status = $booking['status'] ?? 'active';
      if (isset($usage[$ft][$status])) $usage[$ft][$status]++;
    }

    echo json_encode(array_values($usage));
    break;

  // ── Parking usage: breakdown by zone and status ──────────────────
  case 'parking-usage':
    $result = supabase_request('parking_slots?select=id,zone,status,slot_number&order=slot_number.asc');
    $data   = $result['data'] ?? [];

    $zones = [];
    foreach ($data as $slot) {
      $zone = $slot['zone'] ?? 'unknown';
      if (!isset($zones[$zone])) {
        $zones[$zone] = ['zone' => $zone, 'total' => 0, 'available' => 0, 'occupied' => 0, 'reserved' => 0, 'maintenance' => 0];
      }
      $zones[$zone]['total']++;
      $status = $slot['status'] ?? 'available';
      if (isset($zones[$zone][$status])) $zones[$zone][$status]++;
    }

    echo json_encode([
      'slots'  => $data,
      'zones'  => array_values($zones),
      'total'  => count($data),
    ]);
    break;

  // ── Bookings per day (last 30 days) ──────────────────────────────
  case 'bookings-by-date':
    $since  = date('Y-m-d', strtotime('-30 days'));
    $result = supabase_request("bookings?select=date,status&date=gte.{$since}&order=date.asc");
    $data   = $result['data'] ?? [];

    $byDate = [];
    foreach ($data as $b) {
      $d = $b['date'] ?? '';
      if (!$d) continue;
      if (!isset($byDate[$d])) {
        $byDate[$d] = ['date' => $d, 'total' => 0, 'active' => 0, 'completed' => 0, 'cancelled' => 0];
      }
      $byDate[$d]['total']++;
      $status = $b['status'] ?? 'active';
      if (isset($byDate[$d][$status])) $byDate[$d][$status]++;
    }

    echo json_encode(array_values($byDate));
    break;

  // ── All bookings (staff/management view) ─────────────────────────
  case 'all-bookings':
    $limit  = isset($_GET['limit'])  ? max(1, min((int)$_GET['limit'], 500))  : 100;
    $offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;
    $status = $_GET['status'] ?? '';

    $query = "bookings?select=*&order=created_at.desc&limit={$limit}&offset={$offset}";
    if ($status) {
      $query = "bookings?status=eq." . urlencode($status) . "&select=*&order=created_at.desc&limit={$limit}&offset={$offset}";
    }

    $result = supabase_request($query);
    http_response_code($result['status']);
    echo json_encode($result['data']);
    break;

  // ── All user profiles (management view) ──────────────────────────
  case 'all-users':
    $role  = $_GET['role'] ?? '';
    $query = 'profiles?select=id,full_name,unit,role,phone,created_at&order=created_at.asc';
    if ($role) {
      $query = 'profiles?role=eq.' . urlencode($role) . '&select=id,full_name,unit,role,phone,created_at&order=created_at.asc';
    }

    $result = supabase_request($query);
    http_response_code($result['status']);
    echo json_encode($result['data']);
    break;

  default:
    http_response_code(400);
    echo json_encode(['error' => "Unknown analytics type: {$type}"]);
    break;
}
