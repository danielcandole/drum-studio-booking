<section class="panel narrow">
    <h1>Sign in</h1>
    <form method="post">
        <?php csrf_field(); ?>
        <input type="hidden" name="action" value="login">
        <label>Email<input name="email" type="email" required></label>
        <label>Password<input name="password" type="password" required></label>
        <button class="btn">Sign in</button>
    </form>
    <p>New here? <a href="?page=register">Create an account</a></p>
    <p class="muted">Demo admin: admin@drumstudio.local / Admin123!</p>
</section>