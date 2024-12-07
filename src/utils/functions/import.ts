import { expandGlob } from '@std/fs';
import { join } from '@std/path';

/**
 * Dynamically import all files matching the glob pattern
 * @param globPath - The glob pattern to match files
 */
export async function importer(globPath: string) {
	if (Deno.args.includes('--is_compiled_binary')) {
		for await (const file of Deno.readDir(join(import.meta.dirname!, '../../../src/modules/core'))) {
			if (file.isFile) {
				await import(`file://${join(import.meta.dirname!, '../../../src/modules/core')}/${file.name}`);
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
