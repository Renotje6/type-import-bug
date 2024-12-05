import { importer } from './utils/functions/import.ts';

function handleUncaughtError(error: unknown) {
	// Check if the error is an instance of an error
	if (Deno.args.includes('--dev')) {
		console.error(error);
		return;
	}

	// Log the error
	console.error(error);
	console.log('Press any key to exit...');

	// Wait for a key press
	Deno.stdin.setRaw(true);
	Deno.stdin.readSync(new Uint8Array(1));

	// Close the program
	Deno.stdin.setRaw(false);
	Deno.exit(1);
}

try {
	await importer('./src/modules/**/*/*.ts');
} catch (error) {
	handleUncaughtError(error);
}
