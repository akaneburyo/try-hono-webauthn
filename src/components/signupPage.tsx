export const SignupPage = () => (
	<main>
		<section class="section">
			<h1 class="title">Signup User</h1>
		</section>
		<section class="section">
			<div class="box">
				<h2>Signup</h2>
				<form hx-post="/api/register">
					<div class="field">
						<label class="label">Name</label>
						<div class="control">
							<input name="name" type="text" class="input" />
						</div>
					</div>

					<div class="field">
						<label class="label">Email</label>
						<div class="control">
							<input name="email" type="text" class="input" />
						</div>
					</div>

					<div class="field">
						<div class="control">
							<button class="button is-primary">Submit</button>
						</div>
					</div>
				</form>
			</div>
		</section>

		<section class="section">
			<a href="/signin" class="button is-link">
				Signin
			</a>
		</section>
	</main>
);
