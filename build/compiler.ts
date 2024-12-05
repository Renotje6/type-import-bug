import { walk } from "@std/fs";
import { relative } from "@std/path";

interface CompileOptions {
  modules: string[];
}

class Compiler {
  private baseDir = "./src/modules";
  private modules: string[] = [];

  constructor() {
    console.log("🔍 Initializing compiler...");
  }

  private shouldIgnore(name: string): boolean {
    return name.startsWith("_") || name === "modules";
  }

  async loadModulesFiles(allowedModules?: string[]): Promise<void> {
    console.log("📂 Scanning module directories...");
    try {
      for await (
        const entry of walk(this.baseDir, {
          maxDepth: 1,
          includeFiles: false,
          includeDirs: true,
          skip: [/\/\.[^\/]+/, /\/node_modules\//],
        })
      ) {
        const moduleName =
          entry.name.replaceAll("\\", "/").split("/").slice(-1)[0];

        if (
          this.shouldIgnore(moduleName) ||
          (allowedModules && !allowedModules.includes(moduleName))
        ) {
          continue;
        }

        this.modules.push(relative(Deno.cwd(), entry.path));
      }
    } catch (error) {
      console.error("❌ Error scanning directories:", error);
      throw error;
    }
  }

  parseFlags(): CompileOptions {
    const modules: string[] = [];
    const validModules = this.getValidModules();

    for (let i = 0; i < Deno.args.length; i++) {
      const arg = Deno.args[i];
      const nextArg = Deno.args[i + 1];

      if ((arg === "--module" || arg === "-m") && nextArg) {
        const moduleName = nextArg.trim();

        if (!validModules.includes(moduleName)) {
          console.error("❌ Module validation failed");
          throw new Error(
            `Invalid module: "${moduleName}"\n📚 Available modules: ${
              validModules.join(", ")
            }`,
          );
        }

        if (modules.includes(moduleName)) {
          console.error("❌ Duplicate module detected");
          throw new Error(
            `Duplicate module: "${moduleName}"\n⚠️  Each module can only be specified once.`,
          );
        }

        console.log(`✅ Validated module: ${moduleName}`);
        modules.push(moduleName);
        i++;
      }
    }

    return { modules };
  }

  async runCompileCommand(): Promise<void> {
    console.log("\n🔨 Preparing compilation process...");

    const compileCommand = new Deno.Command("deno", {
      args: [
        "compile",
        "--no-check",
        "-A",
        "--include",
        "manifest.json",
        ...this.modules.flatMap((module) => ["--include", module]),
        "--output",
        "bot",
        "./src/main.ts",
        "--is_compiled_binary",
      ],
      stdout: "piped",
      stderr: "piped",
    });

    console.log("🚀 Starting compilation process...");
    console.log("⏳ This may take a few moments...\n");

    const { success, stdout, stderr } = await compileCommand.output();

    const decoder = new TextDecoder();
    if (success) {
      console.log("\n✅ Compilation completed successfully!");
      const stdoutText = decoder.decode(stdout).trim();
      if (stdoutText) console.log(`📝 Compiler output:\n${stdoutText}`);
      console.log('🎉 Binary "bot" has been created successfully!');
    } else {
      console.error("\n❌ Compilation failed");
      console.error("🔍 Error details:");
      console.error(decoder.decode(stderr));
    }
  }

  async compile() {
    try {
      const options = this.parseFlags();
      const allowedModules = options.modules.length > 0
        ? options.modules
        : undefined;

      await this.loadModulesFiles(allowedModules);

      console.log("🗂️  Including modules");
      this.modules.forEach((module) =>
        console.log(
          `   └─ ${module.replaceAll("\\", "/").split("/").slice(-1)[0]}`,
        )
      );

      console.log("\n📝 Updating manifest.json...");
      Deno.writeFileSync(
        "manifest.json",
        new TextEncoder().encode(
          JSON.stringify({ modules: this.modules }, null, 2),
        ),
      );

      await this.runCompileCommand();
    } catch (error) {
      console.error("\n❌ Compilation process failed");
      console.error("🔍 Error details:", error);
      Deno.exit(1);
    }
  }

  private getValidModules(): string[] {
    const validModules: string[] = [];

    try {
      for (const entry of Deno.readDirSync(this.baseDir)) {
        if (
          entry.isDirectory && !this.shouldIgnore(entry.name) &&
          entry.name !== "core"
        ) {
          validModules.push(entry.name);
        }
      }

      return validModules;
    } catch (error) {
      console.error("❌ Error reading modules directory:", error);
      console.error(`⚠️  Make sure directory '${this.baseDir}' exists`);
      Deno.exit(1);
    }
  }
}

if (import.meta.main) {
  const compiler = new Compiler();
  await compiler.compile();
}
