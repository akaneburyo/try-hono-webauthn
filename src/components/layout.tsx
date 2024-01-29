import type { FC } from 'hono/jsx';

export const Layout: FC<{ children: any; title: string }> = ({ children, title }) => {
	return (
		<html>
			<head>
				<link href="/static/style.css" rel="stylesheet" />
				<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css" />
				<script src="https://unpkg.com/htmx.org@1.9.10"></script>
				<title>{title}</title>

				<meta name="viewport" content="width=device-width, initial-scale=1"></meta>

				{/* TODO: prodではbuildして向き先を変える */}
				<script type="module" src="./src/utils/client.ts"></script>
			</head>
			<body>{children}</body>
		</html>
	);
};
