<?php
require_login();
if (is_admin()) {
    echo '<div class="panel">Administrator accounts manage bookings; use the admin dashboard.</div>';
    return;
}
?>
<section class="panel">
    <h1>Request a booking</h1>
    <p class="muted">Requests are pending until an administrator reviews them. Times use the server's local timezone.</p>
    <form method="post">
        <?php csrf_field(); ?>
        <input type="hidden" name="action" value="book">
        <label>Drum kit
            <select name="kit_id" required>
                <?php foreach ($s['kits'] as $k): ?>
                    <?php if ($k['active']): ?>
                        <option value="<?= e($k['id']) ?>">
                            <?= e($k['name']) ?> — ₱<?= number_format((float)$k['price'], 2) ?>/hour
                        </option>
                    <?php endif; ?>
                <?php endforeach; ?>
            </select>
        </label>
        <div class="formrow">
            <label>Start date and time
                <input type="datetime-local" name="start" min="<?= date('Y-m-d\TH:i', time() + 3600) ?>" required>
            </label>
            <label>Duration
                <select name="hours">
                    <?php for ($i = 1; $i <= 8; $i++): ?>
                        <option value="<?= $i ?>"><?= $i ?> hour<?= $i > 1 ? 's' : '' ?></option>
                    <?php endfor; ?>
                </select>
            </label>
        </div>
        <label>Notes (optional)
            <textarea name="notes" rows="3"></textarea>
        </label>
        <button class="btn">Submit booking request</button>
    </form>
</section>