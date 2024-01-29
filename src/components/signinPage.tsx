export const SigninPage = () => (
	<main>
		<section class="section">
			<h1 class="title">Signin</h1>
		</section>
		<section class="section">
			<div class="box">
				<h2>TODO</h2>
				<p>パスキーでsigninする画面</p>

				<button class="button is-primary" onclick={'window.signinWithPasskey()'}>
					Init passkey
				</button>
			</div>
		</section>

		<section class="section">
			<a href="/signup" class="button is-link">
				Signup
			</a>
		</section>
	</main>
);
