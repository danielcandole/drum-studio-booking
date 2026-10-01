<section class="hero">
    <p class="eyebrow">PRACTICE · RECORD · PLAY</p>
    <h1>Your next session <em>starts here.</em></h1>
    <p>Reserve a drum kit, request your preferred schedule, and track your booking from one place.</p>
    <a class="btn" href="<?= user() ? '?page=book' : '?page=register' ?>">Book a session</a>
</section>

<div class="section-header">
    <h2>Available drum kits</h2>
</div>

<div class="grid">
    <?php foreach ($s['kits'] as $k): ?>
        <?php if ($k['active']): ?>
            <article class="card">
                <div>
                    <div class="card-header">
                        <h3><?= e($k['name']) ?></h3>
                        <span class="brand-tag"><?= e($k['brand']) ?></span>
                    </div>
                    <p class="card-desc"><?= e($k['description']) ?></p>
                </div>
                <div class="card-footer">
                    <span class="price">₱<?= number_format((float)$k['price'], 2) ?> <small>/ hr</small></span>
                    <a href="?page=book" class="btn secondary sm">Select</a>
                </div>
            </article>
        <?php endif; ?>
    <?php endforeach; ?>
</div>