<?php
require_admin();
$pending = count(array_filter($s['bookings'], fn($b) => $b['status'] === 'pending'));
?>
<h1>Administrator dashboard</h1>
<div class="stats">
    <div class="stat"><b><?= count($s['bookings']) ?></b><span>Total bookings</span></div>
    <div class="stat"><b><?= $pending ?></b><span>Pending requests</span></div>
    <div class="stat"><b><?= count(array_filter($s['users'], fn($u) => $u['role'] === 'client')) ?></b><span>Clients</span></div>
    <div class="stat"><b><?= count(array_filter($s['kits'], fn($k) => $k['active'])) ?></b><span>Active kits</span></div>
</div>
<div class="panel">
    <h2>Recent bookings</h2>
    <a class="btn" href="?page=admin-bookings">Manage bookings</a>
    <a class="btn secondary" href="?page=admin-kits">Manage drum kits</a>
</div>