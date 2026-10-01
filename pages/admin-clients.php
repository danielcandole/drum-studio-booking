<?php
require_admin();
?>
<h1>Client accounts</h1>
<div class="stack">
    <?php foreach ($s['users'] as $u): ?>
        <?php if ($u['role'] === 'client'): ?>
            <article class="panel row">
                <div>
                    <h3><?= e($u['name']) ?></h3>
                    <p><?= e($u['email']) ?> · <?= e($u['phone']) ?></p>
                    <span class="badge <?= $u['active'] ? 'approved' : 'cancelled' ?>"><?= $u['active'] ? 'Active' : 'Inactive' ?></span>
                </div>
                <form method="post">
                    <?php csrf_field(); ?>
                    <input type="hidden" name="action" value="toggle_client">
                    <input type="hidden" name="user_id" value="<?= e($u['id']) ?>">
                    <button class="btn <?= $u['active'] ? 'danger' : 'secondary' ?>"><?= $u['active'] ? 'Deactivate' : 'Activate' ?></button>
                </form>
            </article>
        <?php endif; ?>
    <?php endforeach; ?>
</div>