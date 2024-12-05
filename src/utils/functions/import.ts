import { expandGlob } from '@std/fs';
import { join } from '@std/path';

/**
 * Dynamically import all files matching the glob pattern
 * @param globPath - The glob pattern to match files
 */
export async function importer(globPath: string) {
	if (Deno.args.includes('--is_compiled_binary')) {
		// Import the manifest file and import all files listed in it
		const { default: manifest } = await import(import.meta.resolve('../../../manifest.json'));

		for (const module of manifest.modules) {
			for await (const commandFiles of Deno.readDir(`${join(import.meta.dirname!, '../../../')}${module}`)) {
				await import(import.meta.resolve(`file:///${join(import.meta.dirname!, '../../../')}${module}\\${commandFiles.name}`));
			}
		}
	} else {
		for await (const file of expandGlob(globPath)) {
			if (file.isFile) {
				await import(`file://${file.path}`);
			}
		}
	}
}
