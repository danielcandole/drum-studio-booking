<?php
require_admin();
?>
<h1>Drum kit inventory</h1>
<section class="panel">
    <h2>Add drum kit</h2>
    <form method="post" class="formrow">
        <?php csrf_field(); ?>
        <input type="hidden" name="action" value="save_kit">
        <label>Name<input name="name" required></label>
        <label>Brand<input name="brand"></label>
        <label>Hourly price (₱)<input name="price" type="number" min="0" step="0.01" required></label>
        <label>Description<input name="description"></label>
        <button class="btn">Add kit</button>
    </form>
</section>
<div class="stack">
    <?php foreach ($s['kits'] as $k): ?>
        <article class="panel">
            <div class="row">
                <h3><?= e($k['name']) ?> <small><?= e($k['brand']) ?></small></h3>
                <span class="badge <?= $k['active'] ? 'approved' : 'cancelled' ?>"><?= $k['active'] ? 'Active' : 'Inactive' ?></span>
            </div>
            <p><?= e($k['description']) ?> · ₱<?= number_format((float)$k['price'], 2) ?>/hour</p>
            <form method="post" class="formrow">
                <?php csrf_field(); ?>
                <input type="hidden" name="action" value="save_kit">
                <input type="hidden" name="kit_id" value="<?= e($k['id']) ?>">
                <label>Name<input name="name" value="<?= e($k['name']) ?>" required></label>
                <label>Brand<input name="brand" value="<?= e($k['brand']) ?>"></label>
                <label>Hourly price<input name="price" type="number" min="0" step="0.01" value="<?= e($k['price']) ?>" required></label>
                <label>Description<input name="description" value="<?= e($k['description']) ?>"></label>
                <button class="btn secondary">Update</button>
            </form>
            <form method="post">
                <?php csrf_field(); ?>
                <input type="hidden" name="action" value="toggle_kit">
                <input type="hidden" name="kit_id" value="<?= e($k['id']) ?>">
                <button class="btn danger"><?= $k['active'] ? 'Deactivate' : 'Activate' ?></button>
            </form>
        </article>
    <?php endforeach; ?>
</div>