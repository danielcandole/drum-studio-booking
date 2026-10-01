<section class="panel narrow">
    <h1>Create account</h1>
    <form method="post">
        <?php csrf_field(); ?>
        <input type="hidden" name="action" value="register">
        <label>Full name<input name="name" required></label>
        <label>Email<input name="email" type="email" required></label>
        <label>Contact number<input name="phone"></label>
        <label>Password (at least 8 characters)<input name="password" type="password" minlength="8" required></label>
        <button class="btn">Create account</button>
    </form>
    <p>Already registered? <a href="?page=login">Sign in</a></p>
</section>